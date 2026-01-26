import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('Budgets')
@ApiBearerAuth('JWT-auth')
@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new budget' })
  @ApiResponse({ status: 201, description: 'Budget created successfully' })
  create(
    @GetUser('id') userId: string,
    @Body() createBudgetDto: CreateBudgetDto,
  ) {
    return this.budgetsService.create(userId, createBudgetDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all budgets' })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Filter by period (e.g., 2026-01)',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', type: Number })
  @ApiResponse({ status: 200, description: 'Paginated list of budgets' })
  findAll(
    @GetUser('id') userId: string,
    @Query('period') period?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ) {
    return this.budgetsService.findAll(userId, period, page, limit);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current period budgets with updated progress' })
  @ApiResponse({
    status: 200,
    description: 'Current period budgets with spending data',
  })
  getCurrentPeriodBudgets(@GetUser('id') userId: string) {
    return this.budgetsService.getCurrentPeriodBudgets(userId);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get budget alerts for overspending' })
  @ApiResponse({ status: 200, description: 'List of budget alerts' })
  getBudgetAlerts(@GetUser('id') userId: string) {
    return this.budgetsService.getBudgetAlerts(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get budget by ID' })
  @ApiResponse({ status: 200, description: 'Budget details' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  findOne(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.budgetsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update budget' })
  @ApiResponse({ status: 200, description: 'Budget updated successfully' })
  update(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
  ) {
    return this.budgetsService.update(id, userId, updateBudgetDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete budget (soft delete)' })
  @ApiResponse({ status: 200, description: 'Budget deleted successfully' })
  remove(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.budgetsService.remove(id, userId);
  }

  @Post(':id/update-progress')
  @ApiOperation({ summary: 'Manually refresh budget progress' })
  @ApiResponse({ status: 200, description: 'Budget progress updated' })
  updateProgress(@Param('id') id: string) {
    return this.budgetsService.updateProgress(id);
  }
}
