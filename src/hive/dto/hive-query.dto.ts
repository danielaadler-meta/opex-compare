import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';
import { PaginationDto } from '../../common/dto';

export class HiveQueryDto extends PaginationDto {
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
  primaryBusinessUnit?: string;

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
