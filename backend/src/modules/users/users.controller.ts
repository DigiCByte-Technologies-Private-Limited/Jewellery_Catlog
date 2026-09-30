import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.AUDITOR)
  @ApiOperation({ summary: 'List all staff users' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'isActive', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query() query: any) {
    return this.usersService.findAll({
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
      role: query.role,
      isActive: query.isActive !== undefined ? query.isActive === 'true' : undefined,
      search: query.search,
    });
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER)
  @ApiOperation({ summary: 'Get a single user by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER)
  @ApiOperation({ summary: 'Create a new staff user' })
  create(@Body() body: any, @Req() req: any) {
    return this.usersService.create(body, req.user.id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER)
  @ApiOperation({ summary: 'Update a staff user' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() body: any, @Req() req: any) {
    return this.usersService.update(id, body, req.user.id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Soft-delete a staff user' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.usersService.remove(id, req.user.id);
  }

  @Patch(':id/toggle-status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER)
  @ApiOperation({ summary: 'Activate or deactivate a user' })
  toggleStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.toggleStatus(id);
  }
}
