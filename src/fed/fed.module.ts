import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FedOpexRecord } from './entities/fed-opex-record.entity';
import { FedService } from './fed.service';
import { FedController } from './fed.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FedOpexRecord])],
  controllers: [FedController],
  providers: [FedService],
  exports: [FedService],
})
export class FedModule {}
