import {
    IsString,
    IsEnum,
    IsOptional,
    IsNumber,
    IsBoolean,
    Min,
    Max,
    IsUUID,
    IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AllocationType {
    FIXED = 'FIXED',
    PERCENTAGE = 'PERCENTAGE',
    ENVELOPE = 'ENVELOPE',
    REMAINDER = 'REMAINDER',
}

export enum BudgetTransactionType {
    EXPENSE = 'EXPENSE',
    TRANSFER_IN = 'TRANSFER_IN',
    TRANSFER_OUT = 'TRANSFER_OUT',
    ADJUSTMENT = 'ADJUSTMENT',
    REFUND = 'REFUND',
}

export class CreateBudgetAllocationDto {
    @ApiProperty({ description: 'Name of the allocation (e.g., "Needs", "Wants", "Savings")' })
    @IsString()
    name: string;

    @ApiProperty({ enum: AllocationType, description: 'Type of allocation' })
    @IsEnum(AllocationType)
    allocationType: AllocationType;

    @ApiProperty({ description: 'Allocated amount', minimum: 0 })
    @IsNumber()
    @Min(0)
    amount: number;

    @ApiPropertyOptional({ description: 'Percentage of total budget (for PERCENTAGE type)', minimum: 0, maximum: 100 })
    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(100)
    percentage?: number;

    @ApiPropertyOptional({ description: 'Category ID to link allocation to' })
    @IsString()
    @IsOptional()
    categoryId?: string;

    @ApiPropertyOptional({ description: 'Whether this is an envelope allocation', default: false })
    @IsBoolean()
    @IsOptional()
    isEnvelope?: boolean;

    @ApiPropertyOptional({ description: 'Priority order of the allocation', default: 0 })
    @IsNumber()
    @IsOptional()
    priority?: number;
}

export class UpdateBudgetAllocationDto {
    @ApiPropertyOptional({ description: 'Name of the allocation' })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional({ description: 'Allocated amount', minimum: 0 })
    @IsNumber()
    @IsOptional()
    @Min(0)
    amount?: number;

    @ApiPropertyOptional({ description: 'Percentage of total budget', minimum: 0, maximum: 100 })
    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(100)
    percentage?: number;

    @ApiPropertyOptional({ description: 'Category ID to link allocation to' })
    @IsString()
    @IsOptional()
    categoryId?: string;

    @ApiPropertyOptional({ description: 'Priority order of the allocation' })
    @IsNumber()
    @IsOptional()
    priority?: number;

    @ApiPropertyOptional({ description: 'Whether the allocation is active' })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class CreateBudgetTransactionDto {
    @ApiPropertyOptional({ description: 'Allocation ID to record against' })
    @IsString()
    @IsOptional()
    allocationId?: string;

    @ApiPropertyOptional({ description: 'Link to main transaction ID' })
    @IsString()
    @IsOptional()
    transactionId?: string;

    @ApiProperty({ enum: BudgetTransactionType, description: 'Type of budget transaction' })
    @IsEnum(BudgetTransactionType)
    type: BudgetTransactionType;

    @ApiProperty({ description: 'Transaction amount', minimum: 0 })
    @IsNumber()
    @Min(0)
    amount: number;

    @ApiPropertyOptional({ description: 'Description of the transaction' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ description: 'Date of the transaction' })
    @Type(() => Date)
    @IsDate()
    @IsOptional()
    date?: Date;
}

export class TransferBetweenAllocationsDto {
    @ApiProperty({ description: 'Source allocation ID' })
    @IsUUID()
    fromAllocationId: string;

    @ApiProperty({ description: 'Destination allocation ID' })
    @IsUUID()
    toAllocationId: string;

    @ApiProperty({ description: 'Amount to transfer', minimum: 0.01 })
    @IsNumber()
    @Min(0.01)
    amount: number;

    @ApiPropertyOptional({ description: 'Description for the transfer' })
    @IsString()
    @IsOptional()
    description?: string;
}

export class Setup50_30_20Dto {
    @ApiProperty({ description: 'Total budget amount to split' })
    @IsNumber()
    @Min(0)
    totalAmount: number;

    @ApiPropertyOptional({ description: 'Category ID for Needs allocation' })
    @IsString()
    @IsOptional()
    needsCategoryId?: string;

    @ApiPropertyOptional({ description: 'Category ID for Wants allocation' })
    @IsString()
    @IsOptional()
    wantsCategoryId?: string;

    @ApiPropertyOptional({ description: 'Category ID for Savings allocation' })
    @IsString()
    @IsOptional()
    savingsCategoryId?: string;
}

export class SetupPayYourselfFirstDto {
    @ApiProperty({ description: 'Total income amount' })
    @IsNumber()
    @Min(0)
    totalIncome: number;

    @ApiProperty({ description: 'Savings percentage (e.g., 20 for 20%)', minimum: 1, maximum: 100 })
    @IsNumber()
    @Min(1)
    @Max(100)
    savingsPercentage: number;

    @ApiPropertyOptional({ description: 'Savings category ID' })
    @IsString()
    @IsOptional()
    savingsCategoryId?: string;

    @ApiPropertyOptional({ description: 'Expenses category ID' })
    @IsString()
    @IsOptional()
    expensesCategoryId?: string;
}
