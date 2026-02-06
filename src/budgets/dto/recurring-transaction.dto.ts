import {
    IsString,
    IsEnum,
    IsOptional,
    IsNumber,
    IsBoolean,
    IsDate,
    Min,
    Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum RecurrenceFrequency {
    DAILY = 'DAILY',
    WEEKLY = 'WEEKLY',
    BI_WEEKLY = 'BI_WEEKLY',
    MONTHLY = 'MONTHLY',
    QUARTERLY = 'QUARTERLY',
    ANNUALLY = 'ANNUALLY',
}

export enum TransactionType {
    INCOME = 'INCOME',
    EXPENSE = 'EXPENSE',
}

export class CreateRecurringTransactionDto {
    @ApiProperty({ description: 'Name of the recurring transaction' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ description: 'Description of the transaction' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ description: 'Transaction amount', minimum: 0 })
    @IsNumber()
    @Min(0)
    amount: number;

    @ApiProperty({ enum: TransactionType, description: 'Transaction type' })
    @IsEnum(TransactionType)
    type: TransactionType;

    @ApiProperty({ enum: RecurrenceFrequency, description: 'Recurrence frequency' })
    @IsEnum(RecurrenceFrequency)
    frequency: RecurrenceFrequency;

    @ApiPropertyOptional({ description: 'Interval between occurrences (e.g., every 2 weeks)', default: 1, minimum: 1 })
    @IsNumber()
    @IsOptional()
    @Min(1)
    interval?: number;

    @ApiPropertyOptional({ description: 'Day of week (0-6, 0=Sunday) for weekly recurrence' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(6)
    dayOfWeek?: number;

    @ApiPropertyOptional({ description: 'Day of month (1-31) for monthly recurrence' })
    @IsNumber()
    @IsOptional()
    @Min(1)
    @Max(31)
    dayOfMonth?: number;

    @ApiPropertyOptional({ description: 'Month of year (1-12) for annual recurrence' })
    @IsNumber()
    @IsOptional()
    @Min(1)
    @Max(12)
    monthOfYear?: number;

    @ApiProperty({ description: 'Start date' })
    @Type(() => Date)
    @IsDate()
    startDate: Date;

    @ApiPropertyOptional({ description: 'End date (optional, null for ongoing)' })
    @Type(() => Date)
    @IsDate()
    @IsOptional()
    endDate?: Date;

    @ApiPropertyOptional({ description: 'Account ID to use for transactions' })
    @IsString()
    @IsOptional()
    accountId?: string;

    @ApiPropertyOptional({ description: 'Category ID for the transactions' })
    @IsString()
    @IsOptional()
    categoryId?: string;

    @ApiPropertyOptional({ description: 'Budget ID to link transactions to' })
    @IsString()
    @IsOptional()
    budgetId?: string;

    @ApiPropertyOptional({ description: 'Automatically create transactions when due', default: false })
    @IsBoolean()
    @IsOptional()
    autoProcess?: boolean;

    @ApiPropertyOptional({ description: 'Days before due date to send reminder', default: 3, minimum: 0, maximum: 30 })
    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(30)
    reminderDays?: number;

    @ApiPropertyOptional({ description: 'Skip transactions that fall on weekends', default: false })
    @IsBoolean()
    @IsOptional()
    skipWeekends?: boolean;
}

export class UpdateRecurringTransactionDto {
    @ApiPropertyOptional({ description: 'Name of the recurring transaction' })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional({ description: 'Description of the transaction' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ description: 'Transaction amount', minimum: 0 })
    @IsNumber()
    @IsOptional()
    @Min(0)
    amount?: number;

    @ApiPropertyOptional({ enum: RecurrenceFrequency, description: 'Recurrence frequency' })
    @IsEnum(RecurrenceFrequency)
    @IsOptional()
    frequency?: RecurrenceFrequency;

    @ApiPropertyOptional({ description: 'Interval between occurrences', minimum: 1 })
    @IsNumber()
    @IsOptional()
    @Min(1)
    interval?: number;

    @ApiPropertyOptional({ description: 'Day of week (0-6)' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(6)
    dayOfWeek?: number;

    @ApiPropertyOptional({ description: 'Day of month (1-31)' })
    @IsNumber()
    @IsOptional()
    @Min(1)
    @Max(31)
    dayOfMonth?: number;

    @ApiPropertyOptional({ description: 'End date' })
    @Type(() => Date)
    @IsDate()
    @IsOptional()
    endDate?: Date;

    @ApiPropertyOptional({ description: 'Account ID' })
    @IsString()
    @IsOptional()
    accountId?: string;

    @ApiPropertyOptional({ description: 'Category ID' })
    @IsString()
    @IsOptional()
    categoryId?: string;

    @ApiPropertyOptional({ description: 'Budget ID' })
    @IsString()
    @IsOptional()
    budgetId?: string;

    @ApiPropertyOptional({ description: 'Automatically create transactions when due' })
    @IsBoolean()
    @IsOptional()
    autoProcess?: boolean;

    @ApiPropertyOptional({ description: 'Days before due date to send reminder' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(30)
    reminderDays?: number;

    @ApiPropertyOptional({ description: 'Skip transactions on weekends' })
    @IsBoolean()
    @IsOptional()
    skipWeekends?: boolean;

    @ApiPropertyOptional({ description: 'Whether the recurring transaction is active' })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
