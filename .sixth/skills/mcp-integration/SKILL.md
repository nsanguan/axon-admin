---
name: mcp-integration
description: Integrate with AXON MCP servers, implement MCP plugin and tool management, proxy MCP protocol requests, and manage MCP connections. Use when building the plugin registry, tool execution, MCP Testing Console, or connecting to the existing AXON MCP server network.
---

# MCP Integration — AXON Admin

## AXON MCP Server Network

The existing AXON system runs the following MCP servers:

| System | Ports | Domain |
|---|---|---|
| Odoo | 8001–8009 | Sales, Procurement, Inventory, Finance, Production, Logistics, Warehouse, Approvals, Planning |
| EraOwl-LLMWiki | 8000 | Policy, Compliance, SOPs |
| SAP | 8010 | Planning, Inventory, Procurement |
| MS Dynamics 365 | 8030 | Planning, Inventory, Procurement |
| Legacy SQL | 8040 | Generic bridge |
| Oracle EBS | 8102–8111 | 9 domain + 3 legacy adapters |
| Control Tower | 8200 | FastAPI metrics/approvals |

## packages/mcp-sdk Structure

```
packages/mcp-sdk/src/
  index.ts              # Public exports
  mcp-client.ts         # Base MCP HTTP client
  mcp-sse-client.ts     # SSE streaming client
  mcp-ws-client.ts      # WebSocket client
  types.ts              # MCP protocol types
  errors.ts             # MCP error classes
  utils.ts              # Request builders, formatters
```

## Step 1: MCP SDK Client

```typescript
// packages/mcp-sdk/src/types.ts
export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface McpServerInfo {
  name: string;
  version: string;
  tools: McpTool[];
}

export interface McpCallResult {
  content: Array<{ type: 'text' | 'image' | 'resource'; text?: string; data?: unknown }>;
  isError?: boolean;
}

export interface McpRequestOptions {
  timeout?: number;
  headers?: Record<string, string>;
  apiKey?: string;
}
```

```typescript
// packages/mcp-sdk/src/mcp-client.ts
import axios, { AxiosInstance } from 'axios';
import { McpServerInfo, McpCallResult, McpRequestOptions } from './types';
import { McpConnectionError, McpExecutionError, McpTimeoutError } from './errors';

export class McpHttpClient {
  private http: AxiosInstance;

  constructor(private readonly endpoint: string, private readonly options: McpRequestOptions = {}) {
    this.http = axios.create({
      baseURL: endpoint,
      timeout: options.timeout ?? 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(options.apiKey ? { Authorization: `Bearer ${options.apiKey}` } : {}),
        ...options.headers,
      },
    });
  }

  async listTools(): Promise<McpServerInfo> {
    try {
      const res = await this.http.post('/', {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {},
      });
      return res.data.result;
    } catch (err: any) {
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        throw new McpConnectionError(`Cannot connect to MCP server at ${this.endpoint}`);
      }
      if (err.code === 'ECONNABORTED') throw new McpTimeoutError(this.endpoint);
      throw new McpConnectionError(err.message);
    }
  }

  async callTool(toolName: string, args: Record<string, unknown>): Promise<McpCallResult> {
    try {
      const res = await this.http.post('/', {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: { name: toolName, arguments: args },
      });
      if (res.data.error) throw new McpExecutionError(res.data.error.message, toolName);
      return res.data.result;
    } catch (err: any) {
      if (err instanceof McpExecutionError) throw err;
      throw new McpExecutionError(err.message, toolName);
    }
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latencyMs: number }> {
    const start = Date.now();
    try {
      await this.listTools();
      return { status: 'healthy', latencyMs: Date.now() - start };
    } catch {
      return { status: 'unhealthy', latencyMs: Date.now() - start };
    }
  }
}
```

```typescript
// packages/mcp-sdk/src/mcp-sse-client.ts
export class McpSseClient {
  constructor(private readonly endpoint: string, private readonly options: { apiKey?: string } = {}) {}

  stream(toolName: string, args: Record<string, unknown>, onChunk: (chunk: string) => void, onDone: () => void, onError: (err: Error) => void): () => void {
    const controller = new AbortController();
    
    fetch(`${this.endpoint}/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(this.options.apiKey ? { Authorization: `Bearer ${this.options.apiKey}` } : {}),
      },
      body: JSON.stringify({ tool: toolName, arguments: args }),
      signal: controller.signal,
    }).then(async (res) => {
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) { onDone(); break; }
        onChunk(decoder.decode(value));
      }
    }).catch((err) => {
      if (err.name !== 'AbortError') onError(err);
    });

    return () => controller.abort(); // returns cancel function
  }
}
```

## Step 2: NestJS MCP Module

```typescript
// apps/api/src/mcp/mcp.module.ts
import { Module } from '@nestjs/common';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';
import { McpGateway } from './mcp.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [McpController],
  providers: [McpService, McpGateway],
  exports: [McpService],
})
export class McpModule {}
```

```typescript
// apps/api/src/mcp/mcp.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { McpHttpClient } from '@axon/mcp-sdk';
import { CryptoService } from '../security/crypto.service';

@Injectable()
export class McpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  async executeToolForPlugin(pluginId: string, toolName: string, args: Record<string, unknown>) {
    const plugin = await this.prisma.plugin.findFirst({
      where: { id: pluginId, deletedAt: null, status: 'active' },
    });
    if (!plugin) throw new BadRequestException('Plugin not found or inactive');

    const apiKey = plugin.apiKeyEncrypted
      ? this.crypto.decrypt(plugin.apiKeyEncrypted)
      : undefined;

    const client = new McpHttpClient(plugin.endpoint, {
      timeout: plugin.timeoutMs,
      apiKey,
      headers: plugin.headersJson as Record<string, string>,
    });

    const start = Date.now();
    try {
      const result = await client.callTool(toolName, args);
      await this.logExecution(pluginId, toolName, args, result, 'success', Date.now() - start);
      return result;
    } catch (err: any) {
      await this.logExecution(pluginId, toolName, args, null, 'error', Date.now() - start, err.message);
      throw err;
    }
  }

  async checkPluginHealth(pluginId: string) {
    const plugin = await this.prisma.plugin.findFirst({ where: { id: pluginId, deletedAt: null } });
    if (!plugin) throw new BadRequestException('Plugin not found');

    const client = new McpHttpClient(plugin.endpoint, { timeout: 5000 });
    const health = await client.healthCheck();

    await this.prisma.plugin.update({
      where: { id: pluginId },
      data: { healthStatus: health.status },
    });

    return health;
  }

  async discoverPluginTools(pluginId: string) {
    const plugin = await this.prisma.plugin.findFirst({ where: { id: pluginId, deletedAt: null } });
    if (!plugin) throw new BadRequestException('Plugin not found');
    const client = new McpHttpClient(plugin.endpoint, { timeout: 10000 });
    return client.listTools();
  }

  private async logExecution(
    pluginId: string, toolName: string, input: unknown,
    output: unknown, status: string, durationMs: number, error?: string,
  ) {
    await this.prisma.systemLog.create({
      data: {
        level: status === 'error' ? 'ERROR' : 'INFO',
        message: `MCP tool execution: ${toolName} on plugin ${pluginId}`,
        contextJson: { pluginId, toolName, input, output, status, durationMs, error },
      },
    });
  }
}
```

## Step 3: WebSocket Gateway for Testing Console

```typescript
// apps/api/src/mcp/mcp.gateway.ts
import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { McpService } from './mcp.service';
import { McpSseClient } from '@axon/mcp-sdk';

@WebSocketGateway({ cors: { origin: process.env.FRONTEND_URL, credentials: true } })
export class McpGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private readonly mcpService: McpService) {}

  handleConnection(client: Socket) { console.log(`WS connected: ${client.id}`); }
  handleDisconnect(client: Socket) { console.log(`WS disconnected: ${client.id}`); }

  @SubscribeMessage('mcp:execute')
  async handleExecute(
    @MessageBody() payload: { pluginId: string; toolName: string; args: Record<string, unknown> },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const result = await this.mcpService.executeToolForPlugin(
        payload.pluginId, payload.toolName, payload.args,
      );
      client.emit('mcp:result', { success: true, data: result });
    } catch (err: any) {
      client.emit('mcp:result', { success: false, error: err.message });
    }
  }

  @SubscribeMessage('mcp:stream')
  handleStream(
    @MessageBody() payload: { endpoint: string; toolName: string; args: Record<string, unknown> },
    @ConnectedSocket() client: Socket,
  ) {
    const sseClient = new McpSseClient(payload.endpoint);
    const cancel = sseClient.stream(
      payload.toolName,
      payload.args,
      (chunk) => client.emit('mcp:chunk', { chunk }),
      () => client.emit('mcp:done'),
      (err) => client.emit('mcp:error', { error: err.message }),
    );
    client.once('mcp:cancel', cancel);
    client.once('disconnect', cancel);
  }
}
```

## Step 4: Testing Console — Frontend Hook

```typescript
// apps/web/hooks/use-mcp-test.ts
'use client';
import { useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

let socket: Socket | null = null;

export function useMcpTest() {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [streamChunks, setStreamChunks] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    if (socket?.connected) return;
    socket = io(process.env.NEXT_PUBLIC_API_URL!, {
      auth: { token: (session as any)?.accessToken },
    });
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('mcp:result', (data) => {
      setIsExecuting(false);
      if (data.success) setResult(data.data);
      else setError(data.error);
    });
    socket.on('mcp:chunk', ({ chunk }) => setStreamChunks(prev => [...prev, chunk]));
    socket.on('mcp:done', () => setIsExecuting(false));
    socket.on('mcp:error', ({ error }) => { setError(error); setIsExecuting(false); });
  }, [session]);

  const execute = useCallback((pluginId: string, toolName: string, args: Record<string, unknown>) => {
    if (!socket) connect();
    setIsExecuting(true);
    setResult(null);
    setError(null);
    socket!.emit('mcp:execute', { pluginId, toolName, args });
  }, [connect]);

  const stream = useCallback((endpoint: string, toolName: string, args: Record<string, unknown>) => {
    if (!socket) connect();
    setIsExecuting(true);
    setStreamChunks([]);
    setError(null);
    socket!.emit('mcp:stream', { endpoint, toolName, args });
  }, [connect]);

  const cancel = useCallback(() => { socket?.emit('mcp:cancel'); setIsExecuting(false); }, []);

  return { isConnected, isExecuting, result, streamChunks, error, connect, execute, stream, cancel };
}
```

## Step 5: AXON System Integration (Read-Only)

```typescript
// apps/api/src/axon/axon.service.ts
import { Injectable } from '@nestjs/common';
import { AxonPrismaService } from './axon-prisma.service'; // second PrismaClient for AXON schemas

@Injectable()
export class AxonService {
  constructor(private readonly axonPrisma: AxonPrismaService) {}

  async getAgentStatus() {
    // Read from axon_agents schema
    return this.axonPrisma.$queryRaw`
      SELECT agent_id, agent_type, last_active, status, pending_proposals
      FROM axon_agents.negotiation_rounds
      WHERE created_at > NOW() - INTERVAL '1 hour'
      ORDER BY created_at DESC
    `;
  }

  async getHitlQueue() {
    return this.axonPrisma.$queryRaw`
      SELECT id, task_type, payload, created_at, priority
      FROM axon_board.hitl_queue
      WHERE status = 'pending'
      ORDER BY priority DESC, created_at ASC
    `;
  }

  async approveHitlTask(taskId: string, decision: 'approve' | 'reject', reason: string) {
    return this.axonPrisma.$executeRaw`
      UPDATE axon_board.hitl_queue
      SET status = ${decision === 'approve' ? 'approved' : 'rejected'},
          decision_reason = ${reason},
          resolved_at = NOW()
      WHERE id = ${taskId}::uuid
    `;
  }

  async getKpis() {
    return this.axonPrisma.$queryRaw`
      SELECT metric_name, metric_value, recorded_at
      FROM axon_board.board_kpis
      WHERE recorded_at > NOW() - INTERVAL '24 hours'
      ORDER BY recorded_at DESC
    `;
  }
}
```

## MCP Protocol Reference

```typescript
// JSON-RPC 2.0 request format for MCP:
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list" | "tools/call" | "resources/list",
  "params": {
    // for tools/call:
    "name": "tool_name",
    "arguments": { /* tool-specific args */ }
  }
}

// Response:
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [{ "name": "...", "description": "...", "inputSchema": { } }]
    // or for tools/call:
    "content": [{ "type": "text", "text": "result text" }]
  }
}
```

## Rules

- Always use the `McpHttpClient` from `@axon/mcp-sdk` — never raw `axios` calls to MCP servers
- API keys for MCP servers must be decrypted in service layer and never logged
- All MCP tool executions are logged to `system_logs` with input/output for audit trail
- MCP server health checks use a 5-second timeout; execution calls use the plugin's configured timeout
- AXON system integration (axon_brain, axon_agents, axon_board) is **read-only** except for HITL queue updates
- WebSocket connections for streaming require JWT authentication via `auth.token`
- SSE streams are cancelled via `AbortController` when the client disconnects
