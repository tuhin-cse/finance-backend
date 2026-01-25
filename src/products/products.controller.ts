import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProductDto, UpdateProductDto } from './dto';

@ApiTags('Products')
@ApiBearerAuth('JWT-auth')
@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiQuery({ name: 'organizationId', required: true, description: 'Organization ID' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  create(@Query('organizationId') organizationId: string, @Body() createProductDto: CreateProductDto) {
    return this.productsService.create(organizationId, createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products for organization' })
  @ApiQuery({ name: 'organizationId', required: true, description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'List of products' })
  findAll(@Query('organizationId') organizationId: string) {
    return this.productsService.findAll(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID with inventory' })
  @ApiQuery({ name: 'organizationId', required: true, description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Product details' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id') id: string, @Query('organizationId') organizationId: string) {
    return this.productsService.findOne(id, organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product' })
  @ApiQuery({ name: 'organizationId', required: true, description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  update(@Param('id') id: string, @Query('organizationId') organizationId: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, organizationId, updateProductDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product (soft delete)' })
  @ApiQuery({ name: 'organizationId', required: true, description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  remove(@Param('id') id: string, @Query('organizationId') organizationId: string) {
    return this.productsService.remove(id, organizationId);
  }
}
