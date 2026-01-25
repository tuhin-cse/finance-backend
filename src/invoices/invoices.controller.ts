import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto';

@ApiTags('Invoices')
@ApiBearerAuth('JWT-auth')
@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({ status: 201, description: 'Invoice created with auto-generated invoice number' })
  create(@GetUser('id') userId: string, @Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(userId, createInvoiceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all invoices' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status (DRAFT, SENT, PAID, etc.)' })
  @ApiResponse({ status: 200, description: 'List of invoices' })
  findAll(@GetUser('id') userId: string, @Query('status') status?: string) {
    return this.invoicesService.findAll(userId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID with line items and payments' })
  @ApiResponse({ status: 200, description: 'Invoice details' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  findOne(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.invoicesService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update invoice' })
  @ApiResponse({ status: 200, description: 'Invoice updated successfully' })
  update(@Param('id') id: string, @GetUser('id') userId: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    return this.invoicesService.update(id, userId, updateInvoiceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete invoice' })
  @ApiResponse({ status: 200, description: 'Invoice deleted successfully' })
  remove(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.invoicesService.remove(id, userId);
  }

  @Post(':id/mark-as-paid')
  @ApiOperation({ summary: 'Mark invoice as fully paid' })
  @ApiResponse({ status: 200, description: 'Invoice marked as paid' })
  markAsPaid(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.invoicesService.markAsPaid(id, userId);
  }
}
