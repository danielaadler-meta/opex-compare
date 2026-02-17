import {
  IsEnum,
  IsString,
  IsOptional,
} from 'class-validator';
import { BusinessUnit } from '../../common/enums';

export class CreateWorkflowMappingDto {
  @IsEnum(BusinessUnit)
  businessUnit: BusinessUnit;

  @IsString()
  workflowName: string;

  @IsString()
  fedOpexBucket: string;

  @IsOptional()
  @IsString()
  bmtProgram?: string;

  @IsOptional()
  @IsString()
  bmtProject?: string;
}
