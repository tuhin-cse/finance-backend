import { IsString, IsOptional, IsEnum, IsNumber, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ContactType {
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR',
  EMPLOYEE = 'EMPLOYEE',
  LEAD = 'LEAD',
}

export class CreateContactDto {
  @ApiProperty({ enum: ContactType, description: 'Type of contact' })
  @IsEnum(ContactType)
  type: ContactType;

  @ApiPropertyOptional({ description: 'First name' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Company name' })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiProperty({ description: 'Display name for the contact' })
  @IsString()
  displayName: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Mobile number' })
  @IsString()
  @IsOptional()
  mobile?: string;

  @ApiPropertyOptional({ description: 'Website URL' })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ description: 'Address line 1' })
  @IsString()
  @IsOptional()
  addressLine1?: string;

  @ApiPropertyOptional({ description: 'Address line 2' })
  @IsString()
  @IsOptional()
  addressLine2?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'State/Province' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ description: 'Postal/ZIP code' })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Country' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ description: 'Tax ID number' })
  @IsString()
  @IsOptional()
  taxId?: string;

  @ApiPropertyOptional({ description: 'Payment terms' })
  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @ApiPropertyOptional({ description: 'Credit limit', minimum: 0 })
  @IsNumber()
  @IsOptional()
  creditLimit?: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Lead source' })
  @IsString()
  @IsOptional()
  leadSource?: string;

  @ApiPropertyOptional({ description: 'Customer segment' })
  @IsString()
  @IsOptional()
  customerSegment?: string;

  @ApiPropertyOptional({ description: 'Lifetime value', minimum: 0 })
  @IsNumber()
  @IsOptional()
  lifetimeValue?: number;

  @ApiPropertyOptional({ description: 'Tags', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Organization ID' })
  @IsString()
  @IsOptional()
  organizationId?: string;
}
