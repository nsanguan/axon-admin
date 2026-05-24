'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Bot,
  Copy,
  ExternalLink,
  Play,
  RefreshCcw,
  ShieldAlert,
  TerminalSquare,
  Waypoints,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '../../../components/layout/AppShell';

type TransportType = 'streamable-http' | 'sse' | 'stdio';

const STORAGE_KEY = 'axon-mcp-inspector-config-v1';

interface InspectorConfig {
  inspectorUrl: string;
  proxyToken: string;
  transport: TransportType;
  serverUrl: string;
  serverCommand: string;
  serverArgs: string;
}

function getDefaultInspectorUrl() {
  if (typeof window === 'undefined') {
    return 'http://localhost:6274';
  }

  return `${window.location.protocol}//${window.location.hostname}:6274`;
}

function getDefaultConfig(): InspectorConfig {
  return {
    inspectorUrl: getDefaultInspectorUrl(),
    proxyToken: '',
    transport: 'streamable-http',
    serverUrl: '',
    serverCommand: 'npx',
    serverArgs: '@modelcontextprotocol/server-everything',
  };
}

function buildInspectorHref(config: InspectorConfig) {
  const baseUrl = config.inspectorUrl.trim().replace(/\/$/, '');
  const params = new URLSearchParams();

  if (config.proxyToken.trim()) {
    params.set('MCP_PROXY_AUTH_TOKEN', config.proxyToken.trim());
  }

  params.set('transport', config.transport);

  if (config.transport === 'stdio') {
    params.set('serverCommand', config.serverCommand.trim());
    params.set('serverArgs', config.serverArgs.trim());
  } else if (config.serverUrl.trim()) {
    params.set('serverUrl', config.serverUrl.trim());
  }

  const query = params.toString();
  return query ? `${baseUrl}/?${query}` : `${baseUrl}/`;
}

export default function McpAgentsTestingPage() {
  const [config, setConfig] = useState<InspectorConfig>(getDefaultConfig);
  const [iframeSrc, setIframeSrc] = useState('');

  useEffect(() => {
    const fallback = getDefaultConfig();
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      setConfig(fallback);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<InspectorConfig>;
      setConfig({ ...fallback, ...parsed });
    } catch {
      setConfig(fallback);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  const inspectorHref = buildInspectorHref(config);
  const projectLaunchCommand = config.proxyToken.trim()
    ? `HOST=0.0.0.0 MCP_AUTO_OPEN_ENABLED=false MCP_PROXY_AUTH_TOKEN=${config.proxyToken.trim()} npx @modelcontextprotocol/inspector`
    : 'HOST=0.0.0.0 MCP_AUTO_OPEN_ENABLED=false npx @modelcontextprotocol/inspector';

  const localLaunchCommand = 'pnpm mcp:inspector';

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  const loadInspector = () => {
    if (config.transport !== 'stdio' && !config.serverUrl.trim()) {
      toast.error('Enter an MCP server URL first');
      return;
    }

    if (config.transport === 'stdio' && !config.serverCommand.trim()) {
      toast.error('Enter a server command first');
      return;
    }

    setIframeSrc(inspectorHref);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700 dark:border-cyan-900/50 dark:bg-cyan-950/40 dark:text-cyan-300">
              <Bot size={14} /> MCP Inspector Workspace
            </div>
            <h1 className="text-2xl font-bold">MCP Agents Testing</h1>
            <p className="mt-1 max-w-3xl text-sm text-[var(--muted-foreground)]">
              Launch, pre-configure, and embed MCP Inspector for remote MCP agents or local stdio servers without leaving AXON Admin.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => copyText(inspectorHref, 'Inspector URL')}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--muted)]"
            >
              <Copy size={14} /> Copy URL
            </button>
            <a
              href={inspectorHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-3 py-2 text-sm text-[var(--primary-foreground)] hover:opacity-90"
            >
              <ExternalLink size={14} /> Open Inspector
            </a>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6">
              <div className="mb-4 flex items-center gap-2">
                <Waypoints size={16} className="text-[var(--muted-foreground)]" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Inspector Connection</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium">Inspector UI URL</label>
                  <input
                    value={config.inspectorUrl}
                    onChange={(e) => setConfig((prev) => ({ ...prev, inspectorUrl: e.target.value }))}
                    placeholder="http://localhost:6274"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium">Proxy Session Token</label>
                  <input
                    value={config.proxyToken}
                    onChange={(e) => setConfig((prev) => ({ ...prev, proxyToken: e.target.value }))}
                    placeholder="Optional: MCP_PROXY_AUTH_TOKEN shown by the inspector"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium">Transport</label>
                  <select
                    value={config.transport}
                    onChange={(e) => setConfig((prev) => ({ ...prev, transport: e.target.value as TransportType }))}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  >
                    <option value="streamable-http">Streamable HTTP</option>
                    <option value="sse">SSE</option>
                    <option value="stdio">Stdio</option>
                  </select>
                </div>

                {config.transport === 'stdio' ? (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Server Command</label>
                      <input
                        value={config.serverCommand}
                        onChange={(e) => setConfig((prev) => ({ ...prev, serverCommand: e.target.value }))}
                        placeholder="npx"
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-medium">Server Args</label>
                      <input
                        value={config.serverArgs}
                        onChange={(e) => setConfig((prev) => ({ ...prev, serverArgs: e.target.value }))}
                        placeholder="@modelcontextprotocol/server-everything"
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                      />
                    </div>
                  </>
                ) : (
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-medium">MCP Server URL</label>
                    <input
                      value={config.serverUrl}
                      onChange={(e) => setConfig((prev) => ({ ...prev, serverUrl: e.target.value }))}
                      placeholder={config.transport === 'sse' ? 'http://localhost:8000/sse' : 'http://localhost:8000/mcp'}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                    />
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  onClick={loadInspector}
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm text-[var(--primary-foreground)] hover:opacity-90"
                >
                  <Play size={14} /> Load Embedded Inspector
                </button>
                <button
                  onClick={() => setIframeSrc(inspectorHref)}
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--muted)]"
                >
                  <RefreshCcw size={14} /> Refresh Embed
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6">
              <div className="mb-4 flex items-center gap-2">
                <TerminalSquare size={16} className="text-[var(--muted-foreground)]" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Run Inspector In This Project</h2>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl bg-[var(--muted)] p-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Safe local launch</p>
                  <pre className="overflow-auto text-xs leading-relaxed">{localLaunchCommand}</pre>
                  <button
                    onClick={() => copyText(localLaunchCommand, 'Local launch command')}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-xs hover:bg-[var(--background)]"
                  >
                    <Copy size={12} /> Copy
                  </button>
                </div>

                <div className="rounded-xl bg-[var(--muted)] p-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Remote / embedded launch</p>
                  <pre className="overflow-auto text-xs leading-relaxed">{projectLaunchCommand}</pre>
                  <button
                    onClick={() => copyText(projectLaunchCommand, 'Remote launch command')}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-xs hover:bg-[var(--background)]"
                  >
                    <Copy size={12} /> Copy
                  </button>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
                  <div className="flex items-start gap-2">
                    <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">Remote binding is powerful and risky.</p>
                      <p className="mt-1 text-xs leading-relaxed text-amber-800 dark:text-amber-200">
                        The Inspector can spawn local processes. Use `HOST=0.0.0.0` only on trusted networks or behind a protected reverse proxy, and keep authentication enabled with a session token.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Inspector URL Preview</h2>
              <pre className="mt-3 overflow-auto rounded-xl bg-[var(--muted)] p-4 text-xs leading-relaxed">{inspectorHref}</pre>
              <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                This page stores your Inspector settings in local storage and passes them as query params supported by MCP Inspector.
              </p>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">AXON Workflow</h2>
              <ol className="mt-3 space-y-3 text-sm text-[var(--muted-foreground)]">
                <li>1. Start MCP Inspector from this repo with one of the launch commands.</li>
                <li>2. Paste the proxy session token if the Inspector prints one.</li>
                <li>3. Choose `streamable-http`, `sse`, or `stdio` and fill the target server details.</li>
                <li>4. Load the embed here or open the Inspector in a new tab for full-screen debugging.</li>
              </ol>
              <div className="mt-4 text-xs">
                <Link href="https://modelcontextprotocol.io/docs/tools/inspector" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyan-600 hover:underline dark:text-cyan-400">
                  MCP Inspector docs <ExternalLink size={12} />
                </Link>
              </div>
            </section>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Embedded MCP Inspector</h2>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                If the Inspector refuses framing in your setup, use the “Open Inspector” button above instead.
              </p>
            </div>
          </div>

          {iframeSrc ? (
            <iframe
              key={iframeSrc}
              src={iframeSrc}
              title="MCP Inspector"
              className="h-[900px] w-full bg-white"
            />
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_top,_rgba(8,145,178,0.14),_transparent_55%)] px-6 py-16 text-center">
              <div className="rounded-full border border-cyan-200 bg-cyan-50 p-4 text-cyan-700 dark:border-cyan-900/50 dark:bg-cyan-950/30 dark:text-cyan-300">
                <Bot size={28} />
              </div>
              <div className="max-w-2xl">
                <h3 className="text-lg font-semibold">No Inspector session loaded yet</h3>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  Start MCP Inspector, configure the transport above, and load it here. This page is intended to be the control surface inside AXON Admin, while the actual Inspector continues to run as its own tool.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}