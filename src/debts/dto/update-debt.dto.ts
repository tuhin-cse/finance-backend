import { PartialType } from '@nestjs/mapped-types';
import { CreateDebtDto } from './create-debt.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateDebtDto extends PartialType(CreateDebtDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
