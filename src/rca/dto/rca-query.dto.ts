import { IsEnum, IsInt, IsOptional, IsString, Min, Max } from 'class-validator';
import { BusinessUnit } from '../../common/enums';

export class RcaQueryDto {
  @IsEnum(BusinessUnit)
  businessUnit: BusinessUnit;

  @IsInt()
  year: number;

  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @IsOptional()
  @IsString()
  workflowName?: string;
}
