import {
  IsString,
  IsArray,
  ValidateNested,
  IsEnum,
  IsNumber,
  IsInt,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BusinessUnit } from '../../common/enums';

export class FedRecordDto {
  @IsEnum(BusinessUnit)
  primaryBusinessUnit: BusinessUnit;

  @IsString()
  opexBucket: string;

  @IsOptional()
  @IsNumber()
  actualCostPerJob?: number;

  @IsOptional()
  @IsNumber()
  cappedEstimatedCostPerJob?: number;

  @IsInt()
  jobCount: number;

  @IsInt()
  invoiceYear: number;

  @IsInt()
  @Min(1)
  @Max(12)
  invoiceMonth: number;

  @IsOptional()
  @IsString()
  jobId?: string;

  @IsOptional()
  @IsString()
  workflowName?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  exchangeRateToUsd?: number;
}

export class FedIngestDto {
  @IsString()
  sourceSnapshotId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FedRecordDto)
  records: FedRecordDto[];
}
