import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, KarigarOrderStatus } from '../../common/enums';
import { KarigarService } from './karigar.service';

@ApiTags('Karigar & Job-Work')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('karigar')
export class KarigarController {
  constructor(private readonly karigarService: KarigarService) {}

  @Get('artisans')
  @ApiOperation({ summary: 'List all craftsmen / karigars with gold balances' })
  getKarigars() {
    return this.karigarService.getKarigars();
  }

  @Post('artisans')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.INVENTORY_MANAGER)
  @ApiOperation({ summary: 'Register a new karigar' })
  createKarigar(@Body() body: any) {
    return this.karigarService.createKarigar(body);
  }

  @Get('orders')
  @ApiOperation({ summary: 'List job-work manufacturing orders' })
  getOrders(@Query() query: any) {
    return this.karigarService.getOrders({
      karigarId: query.karigarId,
      status: query.status as KarigarOrderStatus,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 50,
    });
  }

  @Post('orders/issue')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.INVENTORY_MANAGER)
  @ApiOperation({ summary: 'Issue raw gold/silver to karigar for custom manufacturing' })
  issueOrder(@Body() body: any) {
    return this.karigarService.issueOrder(body);
  }

  @Post('orders/:id/receive')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.INVENTORY_MANAGER)
  @ApiOperation({ summary: 'Receive finished jewellery, scrap, and reconcile metal ledger' })
  receiveOrder(@Param('id') id: string, @Body() body: any) {
    return this.karigarService.receiveOrder(id, body);
  }
}
