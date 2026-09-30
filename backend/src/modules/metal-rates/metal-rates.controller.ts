import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, MetalType, MetalPurity } from '../../common/enums';
import { MetalRatesService } from './metal-rates.service';

@ApiTags('Metal Rates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('metal-rates')
export class MetalRatesController {
  constructor(private readonly metalRatesService: MetalRatesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all current active metal rates' })
  getAll() {
    return this.metalRatesService.getLatestRates();
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get latest rates (same as GET /) - for dashboard widget' })
  getLatest() {
    return this.metalRatesService.getLatestRates();
  }

  @Get('history')
  @ApiOperation({ summary: 'Get paginated metal rate history with optional filters' })
  getHistory(@Query() query: any) {
    return this.metalRatesService.getHistory({
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
      metalType: query.metalType as MetalType,
      purity: query.purity as MetalPurity,
    });
  }

  @Post('calculate-derived')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate 22K/18K/14K rates from a 24K base rate' })
  calculateDerived(@Body() body: { base24KRatePerGram: number }) {
    return this.metalRatesService.calculateDerivedRates(body.base24KRatePerGram);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single metal rate record by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.metalRatesService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.PRICING_MANAGER)
  @ApiOperation({ summary: 'Create / update a metal rate' })
  createRate(@Body() body: any, @Req() req: any) {
    return this.metalRatesService.createRate(body, req.user.id, req.user.role);
  }

  @Post(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.PRICING_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a pending metal rate' })
  approve(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.metalRatesService.approveRate(id, req.user.id);
  }

  @Post(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.PRICING_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a pending metal rate' })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reason: string },
    @Req() req: any,
  ) {
    return this.metalRatesService.rejectRate(id, req.user.id, body.reason);
  }
}
