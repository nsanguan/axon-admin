---
name: nestjs-api-module
description: Create NestJS modules, controllers, services, DTOs, and guards for the AXON Admin API. Use when adding new API endpoints, creating feature modules, implementing business logic, or writing unit tests for backend code.
---

# NestJS API Module — AXON Admin

## Module Anatomy

Every feature lives in `apps/api/src/<feature>/` with this structure:

```
<feature>/
  <feature>.module.ts
  <feature>.controller.ts
  <feature>.controller.spec.ts
  <feature>.service.ts
  <feature>.service.spec.ts
  dto/
    create-<feature>.dto.ts
    update-<feature>.dto.ts
    query-<feature>.dto.ts
  entities/
    <feature>.entity.ts   # mirrors Prisma model (optional, for swagger)
  guards/                 # feature-specific guards (optional)
  types/                  # local types (optional)
```

## Step 1: Generate with Nx

```bash
pnpm nx g @nx/nest:module <feature> --project=api --directory=src/<feature>
pnpm nx g @nx/nest:controller <feature> --project=api --directory=src/<feature> --flat
pnpm nx g @nx/nest:service <feature> --project=api --directory=src/<feature> --flat
```

## Step 2: Module Template

```typescript
// src/<feature>/<feature>.module.ts
import { Module } from '@nestjs/common';
import { FeatureController } from './<feature>.controller';
import { FeatureService } from './<feature>.service';

@Module({
  controllers: [FeatureController],
  providers: [FeatureService],
  exports: [FeatureService],
})
export class FeatureModule {}
```

Register in `app.module.ts`:
```typescript
imports: [..., FeatureModule]
```

## Step 3: Controller Template

```typescript
import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@axon/types';
import { FeatureService } from './<feature>.service';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { UpdateFeatureDto } from './dto/update-feature.dto';
import { QueryFeatureDto } from './dto/query-feature.dto';

@ApiTags('<feature>')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('<feature>')
export class FeatureController {
  constructor(private readonly featureService: FeatureService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create <feature>' })
  @ApiResponse({ status: 201, description: '<feature> created' })
  create(@Body() dto: CreateFeatureDto, @CurrentUser() user: any) {
    return this.featureService.create(dto, user.id);
  }

  @Get()
  @Roles(Role.VIEWER, Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN)
  findAll(@Query() query: QueryFeatureDto) {
    return this.featureService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.VIEWER, Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.featureService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateFeatureDto) {
    return this.featureService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.featureService.remove(id);
  }
}
```

## Step 4: Service Template

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { UpdateFeatureDto } from './dto/update-feature.dto';
import { QueryFeatureDto } from './dto/query-feature.dto';

@Injectable()
export class FeatureService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFeatureDto, userId: string) {
    return this.prisma.feature.create({
      data: { ...dto, createdBy: userId },
    });
  }

  async findAll(query: QueryFeatureDto) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.feature.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.feature.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const item = await this.prisma.feature.findFirst({ where: { id, deletedAt: null } });
    if (!item) throw new NotFoundException(`Feature ${id} not found`);
    return item;
  }

  async update(id: string, dto: UpdateFeatureDto) {
    await this.findOne(id); // throws if not found
    return this.prisma.feature.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.feature.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
```

## Step 5: DTO Templates

```typescript
// create-feature.dto.ts
import { IsString, IsOptional, IsUrl, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeatureDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

// update-feature.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateFeatureDto } from './create-feature.dto';
export class UpdateFeatureDto extends PartialType(CreateFeatureDto) {}

// query-feature.dto.ts
import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryFeatureDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
```

## Step 6: main.ts Bootstrap (reference)

```typescript
// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.use(helmet());
  app.enableCors({ origin: process.env.FRONTEND_URL, credentials: true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const config = new DocumentBuilder()
    .setTitle('AXON Admin API')
    .setDescription('MCP Management Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
```

## Role Hierarchy

```typescript
// From @axon/types
export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
}
```

## Audit Logging

Inject `AuditService` in any service that mutates data:
```typescript
await this.auditService.log({
  userId,
  action: 'CREATE',
  resourceType: 'plugin',
  resourceId: result.id,
  after: result,
});
```

## Rules

- All controllers require `@UseGuards(JwtAuthGuard, RolesGuard)` — no unguarded state-changing routes
- All DTOs use `class-validator` decorators — never trust raw input
- Services use Prisma `findFirst` with `deletedAt: null` for soft-delete queries
- Paginated responses always return `{ data, total, page, limit, totalPages }`
- Throw `NotFoundException` (not null) when a resource is missing
- Use `ParseUUIDPipe` on all `:id` route params
- Encrypted fields (tokens, keys) are decrypted in service layer only — never expose raw ciphertext in responses
