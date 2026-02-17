import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BmtForecastRecord } from './entities/bmt-forecast-record.entity';
import { BmtMiscMaster } from './entities/bmt-misc-master.entity';
import { BmtService } from './bmt.service';
import { BmtController } from './bmt.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BmtForecastRecord, BmtMiscMaster])],
  controllers: [BmtController],
  providers: [BmtService],
  exports: [BmtService],
})
export class BmtModule {}
