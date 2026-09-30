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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { CreateStoreDto, UpdateStoreDto } from './dto/store.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('Stores & Showroom Network')
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  @ApiOperation({ summary: 'List all active store network locations' })
  async findAll(@Query('all') all?: string) {
    const data = await this.storesService.findAll(all !== 'true');
    return { success: true, data };
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Rank stores by proximity to latitude/longitude or city/state' })
  async findNearby(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('city') city?: string,
    @Query('state') state?: string,
  ) {
    const parsedLat = lat ? parseFloat(lat) : undefined;
    const parsedLng = lng ? parseFloat(lng) : undefined;
    const data = await this.storesService.findNearby(parsedLat, parsedLng, city, state);
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single store details' })
  async findOne(@Param('id') id: string) {
    const data = await this.storesService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER)
  @ApiOperation({ summary: 'Create new store location (Admin)' })
  create(@Body() dto: CreateStoreDto) {
    return this.storesService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER)
  @ApiOperation({ summary: 'Update store details (Admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateStoreDto) {
    return this.storesService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Deactivate store location (Super Admin)' })
  remove(@Param('id') id: string) {
    return this.storesService.remove(id);
  }
}
