import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTestCollectionDto,
  CreateTestRequestDto,
  UpdateTestRequestDto,
  ExecuteTestDto,
  TestQueryDto,
} from './testing.dto';

@Injectable()
export class TestingService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllCollections() {
    return this.prisma.testCollection.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { requests: true } } },
    });
  }

  async createCollection(dto: CreateTestCollectionDto, userId?: string) {
    return this.prisma.testCollection.create({
      data: { ...dto, createdBy: userId },
    });
  }

  async deleteCollection(id: string) {
    await this.prisma.testCollection.delete({ where: { id } });
    return { success: true };
  }

  async findRequests(query: TestQueryDto) {
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '20');
    const where: Record<string, unknown> = {};
    if (query.collectionId) where['collectionId'] = query.collectionId;
    if (query.search) {
      where['OR'] = [{ name: { contains: query.search, mode: 'insensitive' } }];
    }
    const [data, total] = await Promise.all([
      this.prisma.testRequest.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { collection: { select: { name: true } } },
      }),
      this.prisma.testRequest.count({ where }),
    ]);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOneRequest(id: string) {
    const req = await this.prisma.testRequest.findUnique({
      where: { id },
      include: {
        collection: true,
        executions: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!req) throw new NotFoundException('Test request not found');
    return req;
  }

  async createRequest(dto: CreateTestRequestDto, _userId?: string) {
    return this.prisma.testRequest.create({
      data: {
        collectionId: dto.collectionId,
        name: dto.name,
        protocol: dto.protocol,
        url: dto.endpoint || '',
        headersJson: dto.headersJson,
        bodyJson: dto.bodyJson,
      },
    });
  }

  async updateRequest(id: string, dto: UpdateTestRequestDto) {
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data['name'] = dto.name;
    if (dto.protocol !== undefined) data['protocol'] = dto.protocol;
    if (dto.endpoint !== undefined) data['url'] = dto.endpoint;
    if (dto.headersJson !== undefined) data['headersJson'] = dto.headersJson;
    if (dto.bodyJson !== undefined) data['bodyJson'] = dto.bodyJson;
    return this.prisma.testRequest.update({ where: { id }, data });
  }

  async deleteRequest(id: string) {
    await this.prisma.testRequest.delete({ where: { id } });
    return { success: true };
  }

  async executeRequest(id: string, dto: ExecuteTestDto, userId?: string) {
    const req = await this.findOneRequest(id);
    const endpoint = dto.endpoint || req.url || '';
    const headers = JSON.parse(dto.headersJson || req.headersJson || '{}') as Record<string, string>;
    const body = dto.bodyJson || req.bodyJson;

    const start = Date.now();
    let responseJson: unknown = null;
    let errorMessage: string | undefined;
    let responseStatus: number | null = null;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: body || undefined,
        signal: AbortSignal.timeout(30000),
      });
      responseStatus = res.status;
      const text = await res.text();
      try {
        responseJson = JSON.parse(text);
      } catch {
        responseJson = text;
      }
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : String(err);
    }

    const durationMs = Date.now() - start;

    const execution = await this.prisma.testExecution.create({
      data: {
        requestId: id,
        userId,
        responseStatus,
        responseBody: JSON.stringify(responseJson),
        durationMs,
        errorMessage,
      },
    });

    return { ...execution, responseJson };
  }
}
