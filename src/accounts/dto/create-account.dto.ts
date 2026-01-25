import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
  CREDIT_CARD = 'CREDIT_CARD',
  INVESTMENT = 'INVESTMENT',
  LOAN = 'LOAN',
  CASH = 'CASH',
  OTHER = 'OTHER',
}

export class CreateAccountDto {
  @ApiProperty({ example: 'Chase Checking', description: 'Account name' })
  @IsString()
  name: string;

  @ApiProperty({ enum: AccountType, example: AccountType.CHECKING, description: 'Account type' })
  @IsEnum(AccountType)
  type: AccountType;

  @ApiPropertyOptional({ example: 'Personal', description: 'Account subtype' })
  @IsString()
  @IsOptional()
  subType?: string;

  @ApiPropertyOptional({ example: 'Chase Bank', description: 'Financial institution name' })
  @IsString()
  @IsOptional()
  institutionName?: string;

  @ApiPropertyOptional({ example: '****1234', description: 'Last 4 digits of account number' })
  @IsString()
  @IsOptional()
  accountNumber?: string;

  @ApiPropertyOptional({ example: '123456789', description: 'Routing number' })
  @IsString()
  @IsOptional()
  routingNumber?: string;

  @ApiPropertyOptional({ example: 5000.00, description: 'Current account balance' })
  @IsNumber()
  @IsOptional()
  currentBalance?: number;

  @ApiPropertyOptional({ example: 4800.00, description: 'Available balance' })
  @IsNumber()
  @IsOptional()
  availableBalance?: number;

  @ApiPropertyOptional({ example: 'USD', description: 'Currency code' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Organization ID' })
  @IsString()
  @IsOptional()
  organizationId?: string;

  @ApiPropertyOptional({ description: 'Plaid account ID' })
  @IsString()
  @IsOptional()
  plaidAccountId?: string;

  @ApiPropertyOptional({ description: 'Plaid access token' })
  @IsString()
  @IsOptional()
  plaidAccessToken?: string;

  @ApiPropertyOptional({ example: true, description: 'Whether account is connected to bank' })
  @IsBoolean()
  @IsOptional()
  isConnected?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Mark as primary account' })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Exclude from budget calculations' })
  @IsBoolean()
  @IsOptional()
  excludeFromBudget?: boolean;
}
