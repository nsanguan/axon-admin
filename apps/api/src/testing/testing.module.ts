import { Module } from '@nestjs/common';
import { TestingService } from './testing.service';
import { TestingController } from './testing.controller';

@Module({
  providers: [TestingService],
  controllers: [TestingController],
})
export class TestingModule {}
