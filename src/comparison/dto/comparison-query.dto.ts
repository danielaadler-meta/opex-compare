import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { BusinessUnit, AggregationGranularity } from '../../common/enums';

export class ComparisonQueryDto {
  @IsEnum(BusinessUnit)
  businessUnit: BusinessUnit;

  @IsInt()
  year: number;

  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @IsOptional()
  @IsInt()
  endYear?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  endMonth?: number;

  @IsOptional()
  @IsEnum(AggregationGranularity)
  granularity?: AggregationGranularity;

  @IsOptional()
  @IsString()
  workflowName?: string;
}
