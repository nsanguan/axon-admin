import { Module } from '@nestjs/common';
import { AxonService } from './axon.service';
import { AxonController } from './axon.controller';

@Module({
  providers: [AxonService],
  controllers: [AxonController],
})
export class AxonModule {}
