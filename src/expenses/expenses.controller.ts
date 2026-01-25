import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { CreateExpenseDto, UpdateExpenseDto } from './dto';

@ApiTags('Expenses')
@ApiBearerAuth('JWT-auth')
@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new expense' })
  @ApiResponse({ status: 201, description: 'Expense created successfully' })
  create(@GetUser('id') userId: string, @Body() createExpenseDto: CreateExpenseDto) {
    return this.expensesService.create(userId, createExpenseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all expenses' })
  @ApiResponse({ status: 200, description: 'List of expenses' })
  findAll(@GetUser('id') userId: string) {
    return this.expensesService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense by ID' })
  @ApiResponse({ status: 200, description: 'Expense details' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  findOne(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.expensesService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update expense' })
  @ApiResponse({ status: 200, description: 'Expense updated successfully' })
  update(@Param('id') id: string, @GetUser('id') userId: string, @Body() updateExpenseDto: UpdateExpenseDto) {
    return this.expensesService.update(id, userId, updateExpenseDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete expense' })
  @ApiResponse({ status: 200, description: 'Expense deleted successfully' })
  remove(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.expensesService.remove(id, userId);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve expense' })
  @ApiResponse({ status: 200, description: 'Expense approved successfully' })
  approve(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.expensesService.approve(id, userId, userId);
  }
}
