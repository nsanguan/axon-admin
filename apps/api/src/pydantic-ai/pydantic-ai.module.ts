import { Module } from '@nestjs/common';
import { PydanticAiController } from './pydantic-ai.controller';
import { PydanticAiService } from './pydantic-ai.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PydanticAiController],
  providers: [PydanticAiService],
  exports: [PydanticAiService],
})
export class PydanticAiModule {}
