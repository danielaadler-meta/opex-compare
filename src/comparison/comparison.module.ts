import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComparisonSnapshot } from './entities/comparison-snapshot.entity';
import { ComparisonService } from './comparison.service';
import { ComparisonController } from './comparison.controller';
import { FedModule } from '../fed/fed.module';
import { BmtModule } from '../bmt/bmt.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ComparisonSnapshot]),
    FedModule,
    BmtModule,
  ],
  controllers: [ComparisonController],
  providers: [ComparisonService],
  exports: [ComparisonService],
})
export class ComparisonModule {}
