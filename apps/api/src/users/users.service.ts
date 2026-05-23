import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async createUser(data: { email: string; name: string; password: string }) {
    const passwordHash = await bcrypt.hash(data.password, 12);
    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
        isVerified: true,
      },
    });
  }

  sanitize(user: { passwordHash?: string | null; mfaSecret?: string | null; [key: string]: unknown }) {
    const { passwordHash, mfaSecret, ...rest } = user;
    return rest;
  }
}
