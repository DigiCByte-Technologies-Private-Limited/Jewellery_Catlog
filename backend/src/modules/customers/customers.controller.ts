import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { CustomersService } from './customers.service';

@ApiTags('Customers & CRM')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'List customer directory with search and tag filters' })
  getCustomers(@Query() query: any) {
    return this.customersService.getCustomers({
      search: query.search,
      tag: query.tag,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 50,
    });
  }

  @Get('occasions')
  @ApiOperation({ summary: 'List customers with upcoming birthdays and wedding anniversaries' })
  getUpcomingOccasions() {
    return this.customersService.getUpcomingOccasions();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer profile by ID' })
  getCustomer(@Param('id') id: string) {
    return this.customersService.getCustomer(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.SALES_STAFF)
  @ApiOperation({ summary: 'Register a new customer' })
  createCustomer(@Body() body: any) {
    return this.customersService.createCustomer(body);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.SALES_STAFF)
  @ApiOperation({ summary: 'Update customer details' })
  updateCustomer(@Param('id') id: string, @Body() body: any) {
    return this.customersService.updateCustomer(id, body);
  }
}
