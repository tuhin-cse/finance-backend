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
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('Accounts')
@ApiBearerAuth('JWT-auth')
@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  create(
    @GetUser('id') userId: string,
    @Body() createAccountDto: CreateAccountDto,
  ) {
    return this.accountsService.create(userId, createAccountDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all accounts for the current user' })
  @ApiQuery({ name: 'organizationId', required: false, description: 'Filter by organization' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', type: Number })
  @ApiResponse({ status: 200, description: 'Paginated list of accounts' })
  findAll(
    @GetUser('id') userId: string,
    @Query('organizationId') organizationId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ) {
    return this.accountsService.findAll(userId, organizationId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID with recent transactions' })
  @ApiResponse({ status: 200, description: 'Account details' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  findOne(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.accountsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update account' })
  @ApiResponse({ status: 200, description: 'Account updated successfully' })
  update(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    return this.accountsService.update(id, userId, updateAccountDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete account (soft delete)' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  remove(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.accountsService.remove(id, userId);
  }

  @Get(':id/balance')
  @ApiOperation({ summary: 'Get account balance' })
  @ApiResponse({ status: 200, description: 'Current account balance' })
  getBalance(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.accountsService.getAccountBalance(id, userId);
  }

  @Post(':id/sync')
  @ApiOperation({ summary: 'Sync account with bank (Plaid)' })
  @ApiResponse({ status: 200, description: 'Account synced successfully' })
  syncAccount(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.accountsService.syncAccount(id, userId);
  }

  @Patch(':id/balance')
  @ApiOperation({ summary: 'Manually update account balance' })
  @ApiResponse({ status: 200, description: 'Balance updated successfully' })
  updateBalance(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body('balance') balance: number,
  ) {
    return this.accountsService.updateBalance(id, userId, balance);
  }
}
