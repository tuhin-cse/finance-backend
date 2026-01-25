import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { CreateContactDto, UpdateContactDto } from './dto';

@ApiTags('Contacts')
@ApiBearerAuth('JWT-auth')
@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new contact' })
  @ApiResponse({ status: 201, description: 'Contact created successfully' })
  create(@GetUser('id') userId: string, @Body() createContactDto: CreateContactDto) {
    return this.contactsService.create(userId, createContactDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all contacts' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by type (CUSTOMER, VENDOR, EMPLOYEE, LEAD)' })
  @ApiResponse({ status: 200, description: 'List of contacts' })
  findAll(@GetUser('id') userId: string, @Query('type') type?: string) {
    return this.contactsService.findAll(userId, type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contact by ID with recent invoices' })
  @ApiResponse({ status: 200, description: 'Contact details' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  findOne(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.contactsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update contact' })
  @ApiResponse({ status: 200, description: 'Contact updated successfully' })
  update(@Param('id') id: string, @GetUser('id') userId: string, @Body() updateContactDto: UpdateContactDto) {
    return this.contactsService.update(id, userId, updateContactDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete contact (soft delete)' })
  @ApiResponse({ status: 200, description: 'Contact deleted successfully' })
  remove(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.contactsService.remove(id, userId);
  }
}
