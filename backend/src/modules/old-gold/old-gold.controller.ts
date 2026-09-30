import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, OldGoldStatus } from '../../common/enums';
import { OldGoldService } from './old-gold.service';

@ApiTags('Old Gold Exchange')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('old-gold')
export class OldGoldController {
  constructor(private readonly oldGoldService: OldGoldService) {}

  @Post('assess')
  @ApiOperation({ summary: 'Calculate old gold valuation based on purity, deductions, and today buy-rate' })
  assessOldGold(@Body() body: any) {
    return this.oldGoldService.assessOldGold(body);
  }

  @Post('transactions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.SALES_STAFF, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Accept old jewellery exchange and generate credit voucher' })
  createTransaction(@Body() body: any, @Req() req: any) {
    return this.oldGoldService.createTransaction(body, req.user?.id);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'List all old gold exchange transactions' })
  getTransactions(@Query() query: any) {
    return this.oldGoldService.getTransactions({
      status: query.status as OldGoldStatus,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 50,
    });
  }
}
