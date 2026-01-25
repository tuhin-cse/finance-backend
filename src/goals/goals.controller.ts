import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GoalsService } from './goals.service';
import { CreateGoalDto, UpdateGoalDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('Goals')
@ApiBearerAuth('JWT-auth')
@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new financial goal' })
  @ApiResponse({ status: 201, description: 'Goal created successfully' })
  create(
    @GetUser('id') userId: string,
    @Body() createGoalDto: CreateGoalDto,
  ) {
    return this.goalsService.create(userId, createGoalDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all financial goals' })
  @ApiResponse({ status: 200, description: 'List of goals' })
  findAll(@GetUser('id') userId: string) {
    return this.goalsService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get goal by ID' })
  @ApiResponse({ status: 200, description: 'Goal details' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  findOne(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.goalsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update goal' })
  @ApiResponse({ status: 200, description: 'Goal updated successfully' })
  update(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() updateGoalDto: UpdateGoalDto,
  ) {
    return this.goalsService.update(id, userId, updateGoalDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete goal (soft delete)' })
  @ApiResponse({ status: 200, description: 'Goal deleted successfully' })
  remove(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.goalsService.remove(id, userId);
  }

  @Post(':id/progress')
  @ApiOperation({ summary: 'Add contribution to goal' })
  @ApiResponse({ status: 200, description: 'Goal progress updated' })
  updateProgress(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body('amount') amount: number,
  ) {
    return this.goalsService.updateProgress(id, userId, amount);
  }
}
