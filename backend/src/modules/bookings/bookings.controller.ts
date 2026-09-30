import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, BookingStatus } from '../../common/enums';
import { BookingsService } from './bookings.service';

@ApiTags('Advance Bookings & Rate Lock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @ApiOperation({ summary: 'List customer advance bookings' })
  getBookings(@Query() query: any) {
    return this.bookingsService.getBookings({
      status: query.status as BookingStatus,
      customerId: query.customerId,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 50,
    });
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.SALES_STAFF)
  @ApiOperation({ summary: 'Create advance booking with gold rate-lock contract' })
  createBooking(@Body() body: any, @Req() req: any) {
    return this.bookingsService.createBooking(body, req.user?.id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.SALES_STAFF)
  @ApiOperation({ summary: 'Update booking progress status' })
  updateStatus(@Param('id') id: string, @Body('status') status: BookingStatus) {
    return this.bookingsService.updateStatus(id, status);
  }

  @Post(':id/settle')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.SALES_STAFF, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Final delivery settlement calculating balance against locked rate' })
  settleBooking(@Param('id') id: string, @Body() body: any) {
    return this.bookingsService.settleBooking(id, body);
  }
}
