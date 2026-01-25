import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDate,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
}

export class InvoiceItemDto {
  @ApiPropertyOptional({ description: 'Product ID' })
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiProperty({ description: 'Item description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Quantity', minimum: 0 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ description: 'Unit price', minimum: 0 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ description: 'Tax rate', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  taxRate?: number;

  @ApiPropertyOptional({ description: 'Discount percentage', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discountPercent?: number;
}

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Contact ID for the invoice' })
  @IsString()
  contactId: string;

  @ApiProperty({ description: 'Invoice date' })
  @Type(() => Date)
  @IsDate()
  date: Date;

  @ApiProperty({ description: 'Due date' })
  @Type(() => Date)
  @IsDate()
  dueDate: Date;

  @ApiPropertyOptional({ enum: InvoiceStatus, description: 'Invoice status', default: 'DRAFT' })
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @ApiProperty({ description: 'Invoice line items', type: [InvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @ApiPropertyOptional({ description: 'Tax amount', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  taxAmount?: number;

  @ApiPropertyOptional({ description: 'Discount amount', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discountAmount?: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Payment terms' })
  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @ApiPropertyOptional({ description: 'Payment method' })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Invoice notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Payment terms and conditions' })
  @IsString()
  @IsOptional()
  terms?: string;

  @ApiPropertyOptional({ description: 'Is this a recurring invoice' })
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @ApiPropertyOptional({ description: 'Recurring frequency (WEEKLY, MONTHLY, etc.)' })
  @IsString()
  @IsOptional()
  recurringFrequency?: string;

  @ApiPropertyOptional({ description: 'Organization ID' })
  @IsString()
  @IsOptional()
  organizationId?: string;
}
