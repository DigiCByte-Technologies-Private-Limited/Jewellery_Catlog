import {
  Controller,
  Get,
  Post,
  Put,
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
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, MetalType, MetalPurity } from '../../common/enums';
import { MetalRatesService } from './metal-rates.service';

@ApiTags('Metal Rates')
@Controller('metal-rates')
export class MetalRatesController {
  constructor(private readonly metalRatesService: MetalRatesService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get all current active metal rates (public/client accessible)' })
  getAll() {
    return this.metalRatesService.getLatestRates();
  }

  @Get('latest')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get latest rates (same as GET /) - for dashboard & ticker widget' })
  getLatest() {
    return this.metalRatesService.getLatestRates();
  }

  @Get('impact-preview')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.PRICING_MANAGER)
  @ApiOperation({ summary: 'Preview product price impact before applying a metal rate change' })
  getImpactPreview(
    @Query('metalType') metalType: MetalType,
    @Query('purity') purity: MetalPurity,
    @Query('newRatePerGram') newRatePerGram: string,
  ) {
    return this.metalRatesService.getImpactPreview(
      metalType,
      purity,
      parseFloat(newRatePerGram),
    );
  }

  @Get('history')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate 22K/18K/14K rates from a 24K base rate' })
  calculateDerived(@Body() body: { base24KRatePerGram: number }) {
    return this.metalRatesService.calculateDerivedRates(body.base24KRatePerGram);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a single metal rate record by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.metalRatesService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.PRICING_MANAGER)
  @ApiOperation({ summary: 'Create / set a metal rate' })
  createRate(@Body() body: any, @Req() req: any) {
    return this.metalRatesService.createRate(body, req.user.id, req.user.role);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.PRICING_MANAGER)
  @ApiOperation({ summary: 'Update an existing metal rate by ID' })
  updateRate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.metalRatesService.updateRate(id, body, req.user.id, req.user.role);
  }

  @Post(':id/approve')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.PRICING_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a pending metal rate' })
  approve(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.metalRatesService.approveRate(id, req.user.id);
  }

  @Post(':id/reject')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
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
