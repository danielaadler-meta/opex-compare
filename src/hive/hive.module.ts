import { Module } from '@nestjs/common';
import { HiveService } from './hive.service';
import { HiveFedService } from './hive-fed.service';
import { HiveBmtService } from './hive-bmt.service';
import { HiveComparisonService } from './hive-comparison.service';
import { HiveController } from './hive.controller';

@Module({
  providers: [
    HiveService,
    HiveFedService,
    HiveBmtService,
    HiveComparisonService,
  ],
  controllers: [HiveController],
  exports: [HiveService, HiveFedService, HiveBmtService, HiveComparisonService],
})
export class HiveModule {}
