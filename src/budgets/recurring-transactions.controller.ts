import {
    Body,
    Controller,
    DefaultValuePipe,
    Delete,
    Get,
    Param,
    ParseBoolPipe,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { RecurringTransactionsService } from './recurring-transactions.service';
import {
    CreateRecurringTransactionDto,
    UpdateRecurringTransactionDto,
} from './dto/recurring-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('Recurring Transactions')
@ApiBearerAuth('JWT-auth')
@Controller('recurring-transactions')
@UseGuards(JwtAuthGuard)
export class RecurringTransactionsController {
    constructor(
        private readonly recurringTransactionsService: RecurringTransactionsService,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Create a recurring transaction' })
    @ApiResponse({ status: 201, description: 'Recurring transaction created' })
    create(
        @GetUser('id') userId: string,
        @Body() dto: CreateRecurringTransactionDto,
    ) {
        return this.recurringTransactionsService.create(userId, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all recurring transactions' })
    @ApiQuery({
        name: 'isActive',
        required: false,
        description: 'Filter by active status',
        type: Boolean,
    })
    @ApiQuery({
        name: 'page',
        required: false,
        description: 'Page number',
        type: Number,
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        description: 'Items per page',
        type: Number,
    })
    @ApiResponse({ status: 200, description: 'Paginated list of recurring transactions' })
    findAll(
        @GetUser('id') userId: string,
        @Query('isActive', new DefaultValuePipe(undefined)) isActive?: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    ) {
        const isActiveBoolean = isActive === undefined ? undefined : isActive === 'true';
        return this.recurringTransactionsService.findAll(userId, isActiveBoolean, page, limit);
    }

    @Get('upcoming')
    @ApiOperation({ summary: 'Get upcoming recurring transactions' })
    @ApiQuery({
        name: 'days',
        required: false,
        description: 'Number of days to look ahead',
        type: Number,
    })
    @ApiResponse({ status: 200, description: 'List of upcoming recurring transactions' })
    getUpcoming(
        @GetUser('id') userId: string,
        @Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number,
    ) {
        return this.recurringTransactionsService.getUpcoming(userId, days);
    }

    @Get('reminders')
    @ApiOperation({ summary: 'Get transactions needing reminders' })
    @ApiResponse({ status: 200, description: 'List of transactions needing reminders' })
    getReminders(@GetUser('id') userId: string) {
        return this.recurringTransactionsService.getTransactionsNeedingReminders(userId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get recurring transaction by ID' })
    @ApiResponse({ status: 200, description: 'Recurring transaction details' })
    @ApiResponse({ status: 404, description: 'Recurring transaction not found' })
    findOne(@Param('id') id: string, @GetUser('id') userId: string) {
        return this.recurringTransactionsService.findOne(id, userId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update recurring transaction' })
    @ApiResponse({ status: 200, description: 'Recurring transaction updated' })
    update(
        @Param('id') id: string,
        @GetUser('id') userId: string,
        @Body() dto: UpdateRecurringTransactionDto,
    ) {
        return this.recurringTransactionsService.update(id, userId, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete recurring transaction' })
    @ApiResponse({ status: 200, description: 'Recurring transaction deleted' })
    remove(@Param('id') id: string, @GetUser('id') userId: string) {
        return this.recurringTransactionsService.remove(id, userId);
    }

    @Post(':id/skip')
    @ApiOperation({ summary: 'Skip next occurrence' })
    @ApiResponse({ status: 200, description: 'Next occurrence skipped' })
    skip(@Param('id') id: string, @GetUser('id') userId: string) {
        return this.recurringTransactionsService.skipNextOccurrence(id, userId);
    }

    @Post(':id/pause')
    @ApiOperation({ summary: 'Pause recurring transaction' })
    @ApiResponse({ status: 200, description: 'Recurring transaction paused' })
    pause(@Param('id') id: string, @GetUser('id') userId: string) {
        return this.recurringTransactionsService.pause(id, userId);
    }

    @Post(':id/resume')
    @ApiOperation({ summary: 'Resume recurring transaction' })
    @ApiResponse({ status: 200, description: 'Recurring transaction resumed' })
    resume(@Param('id') id: string, @GetUser('id') userId: string) {
        return this.recurringTransactionsService.resume(id, userId);
    }
}
