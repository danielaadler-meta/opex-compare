import { IsInt, IsOptional, Min, Max } from 'class-validator';

export class DateRangeFilterDto {
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
}
