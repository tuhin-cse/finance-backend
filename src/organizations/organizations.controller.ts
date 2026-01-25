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
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('Organizations')
@ApiBearerAuth('JWT-auth')
@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiResponse({ status: 201, description: 'Organization created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @GetUser('id') userId: string,
    @Body() createOrganizationDto: CreateOrganizationDto,
  ) {
    return this.organizationsService.create(userId, createOrganizationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all organizations for the current user' })
  @ApiResponse({ status: 200, description: 'List of organizations' })
  findAll(@GetUser('id') userId: string) {
    return this.organizationsService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID' })
  @ApiResponse({ status: 200, description: 'Organization details' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  findOne(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.organizationsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organization' })
  @ApiResponse({ status: 200, description: 'Organization updated successfully' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  update(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, userId, updateOrganizationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete organization (soft delete)' })
  @ApiResponse({ status: 200, description: 'Organization deleted successfully' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  remove(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.organizationsService.remove(id, userId);
  }

  @Post(':id/users/:userId')
  @ApiOperation({ summary: 'Add user to organization' })
  @ApiResponse({ status: 200, description: 'User added successfully' })
  addUser(@Param('id') id: string, @Param('userId') userId: string) {
    return this.organizationsService.addUser(id, userId);
  }

  @Delete(':id/users/:userId')
  @ApiOperation({ summary: 'Remove user from organization' })
  @ApiResponse({ status: 200, description: 'User removed successfully' })
  removeUser(@Param('id') id: string, @Param('userId') userId: string) {
    return this.organizationsService.removeUser(id, userId);
  }
}
