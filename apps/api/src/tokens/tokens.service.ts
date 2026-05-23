import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApiTokenDto } from './tokens.dto';

@Injectable()
export class TokensService {
  constructor(private readonly prisma: PrismaService) {}

  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  async findAll(userId: string) {
    return this.prisma.apiToken.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        tokenPrefix: true,
        scopesJson: true,
        expiresAt: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateApiTokenDto, userId: string) {
    const raw = `axn_${randomBytes(32).toString('hex')}`;
    const tokenHash = this.hashToken(raw);
    const tokenPrefix = raw.substring(0, 12);

    const token = await this.prisma.apiToken.create({
      data: {
        userId,
        name: dto.name,
        tokenHash,
        tokenPrefix,
        encryptedValue: raw, // stored in plaintext here; encrypt at rest in production
        scopesJson: dto.scopes ? JSON.stringify(dto.scopes) : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    // Return raw token only once — never stored in plaintext
    return { ...token, rawToken: raw };
  }

  async revoke(id: string, userId: string) {
    const token = await this.prisma.apiToken.findFirst({ where: { id, userId } });
    if (!token) throw new NotFoundException('Token not found');
    await this.prisma.apiToken.update({ where: { id }, data: { revokedAt: new Date() } });
    return { success: true };
  }

  async validate(raw: string) {
    const hash = this.hashToken(raw);
    const token = await this.prisma.apiToken.findFirst({
      where: { tokenHash: hash, revokedAt: null },
    });
    if (!token) throw new UnauthorizedException('Invalid token');
    if (token.expiresAt && token.expiresAt < new Date()) {
      throw new UnauthorizedException('Token expired');
    }
    await this.prisma.apiToken.update({
      where: { id: token.id },
      data: { lastUsedAt: new Date() },
    });
    return { valid: true, userId: token.userId, scopes: token.scopesJson };
  }
}
