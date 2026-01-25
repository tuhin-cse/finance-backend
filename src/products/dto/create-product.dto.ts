import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsArray,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ProductType {
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE',
}

export class CreateProductDto {
  @ApiProperty({ description: 'Product name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Product description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'SKU (Stock Keeping Unit)' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ description: 'Barcode' })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiPropertyOptional({ enum: ProductType, description: 'Product type', default: 'PRODUCT' })
  @IsEnum(ProductType)
  @IsOptional()
  type?: ProductType;

  @ApiProperty({ description: 'Unit price', minimum: 0 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ description: 'Cost price', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  costPrice?: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Track inventory for this product' })
  @IsBoolean()
  @IsOptional()
  trackInventory?: boolean;

  @ApiPropertyOptional({ description: 'Stock quantity', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stockQuantity?: number;

  @ApiPropertyOptional({ description: 'Reorder point', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  reorderPoint?: number;

  @ApiPropertyOptional({ description: 'Reorder quantity', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  reorderQuantity?: number;

  @ApiPropertyOptional({ description: 'Product category' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Product tags', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Is product taxable' })
  @IsBoolean()
  @IsOptional()
  taxable?: boolean;

  @ApiPropertyOptional({ description: 'Tax rate', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  taxRate?: number;
}
