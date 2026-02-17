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

export class BmtRecordDto {
  @IsEnum(BusinessUnit)
  primaryBusinessUnit: BusinessUnit;

  @IsString()
  billableRole: string;

  @IsNumber()
  opexUsd: number;

  @IsNumber()
  opexUsdFinanceActualsAllocated: number;

  @IsOptional()
  @IsNumber()
  financeAdjustment?: number;

  @IsOptional()
  @IsNumber()
  productionHours?: number;

  @IsOptional()
  @IsNumber()
  billableHours?: number;

  @IsOptional()
  @IsNumber()
  fte?: number;

  @IsInt()
  forecastYear: number;

  @IsInt()
  @Min(1)
  @Max(12)
  forecastMonth: number;

  @IsOptional()
  @IsString()
  program?: string;

  @IsOptional()
  @IsString()
  project?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  employeeType?: string;

  @IsOptional()
  @IsString()
  forecastUniqueIdGroup?: string;

  @IsOptional()
  @IsString()
  forecastUniqueId?: string;

  @IsOptional()
  @IsString()
  vendor?: string;
}

export class BmtIngestDto {
  @IsString()
  sourceSnapshotId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BmtRecordDto)
  records: BmtRecordDto[];
}
