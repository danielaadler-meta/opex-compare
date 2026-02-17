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

export class BmtQueryDto extends PaginationDto {
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
  billableRole?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  program?: string;

  @IsOptional()
  @IsString()
  employeeType?: string;

  @IsOptional()
  @IsString()
  vendor?: string;

  @IsOptional()
  @IsString()
  expenseType?: string;

  @IsOptional()
  @IsString()
  workCity?: string;

  @IsOptional()
  @IsString()
  productPillar?: string;
}
