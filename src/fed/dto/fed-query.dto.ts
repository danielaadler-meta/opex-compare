import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { BusinessUnit } from '../../common/enums';
import { PaginationDto } from '../../common/dto';

export class FedQueryDto extends PaginationDto {
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
  @IsString()
  opexBucket?: string;

  @IsOptional()
  @IsString()
  workflowName?: string;

  @IsOptional()
  @IsString()
  workCity?: string;

  @IsOptional()
  @IsString()
  productPillar?: string;
}
