import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionsDto } from './dto/filter-transactions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('Transactions')
@ApiBearerAuth('JWT-auth')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created and account balance updated' })
  create(
    @GetUser('id') userId: string,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(userId, createTransactionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all transactions with advanced filtering' })
  @ApiResponse({ status: 200, description: 'Paginated list of transactions' })
  findAll(
    @GetUser('id') userId: string,
    @Query() filters: FilterTransactionsDto,
  ) {
    return this.transactionsService.findAll(userId, filters);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get transaction statistics (income, expenses, net)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter' })
  @ApiResponse({ status: 200, description: 'Transaction statistics' })
  getStatistics(
    @GetUser('id') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.transactionsService.getStatistics(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiResponse({ status: 200, description: 'Transaction details' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  findOne(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.transactionsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update transaction' })
  @ApiResponse({ status: 200, description: 'Transaction updated successfully' })
  update(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(id, userId, updateTransactionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete transaction and revert account balance' })
  @ApiResponse({ status: 200, description: 'Transaction deleted successfully' })
  remove(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.transactionsService.remove(id, userId);
  }

  @Patch(':id/categorize')
  @ApiOperation({ summary: 'Assign category to transaction' })
  @ApiResponse({ status: 200, description: 'Transaction categorized successfully' })
  categorize(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body('categoryId') categoryId: string,
  ) {
    return this.transactionsService.categorize(id, userId, categoryId);
  }

  @Post(':id/reconcile')
  @ApiOperation({ summary: 'Mark transaction as reconciled' })
  @ApiResponse({ status: 200, description: 'Transaction reconciled successfully' })
  reconcile(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.transactionsService.reconcile(id, userId);
  }
}
