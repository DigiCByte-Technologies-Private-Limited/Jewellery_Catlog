import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, ItemTagStatus } from '../../common/enums';
import { InventoryService } from './inventory.service';

@ApiTags('Inventory & Locations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('locations')
  @ApiOperation({ summary: 'List all inventory storage locations (showrooms, vaults, warehouses)' })
  getLocations() {
    return this.inventoryService.getLocations();
  }

  @Post('locations')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.INVENTORY_MANAGER)
  @ApiOperation({ summary: 'Create new inventory storage location' })
  createLocation(@Body() body: any) {
    return this.inventoryService.createLocation(body);
  }

  @Get('tags')
  @ApiOperation({ summary: 'List physical piece item tags with HUID and weight filters' })
  getItemTags(@Query() query: any) {
    return this.inventoryService.getItemTags({
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 50,
      locationId: query.locationId,
      status: query.status as ItemTagStatus,
      search: query.search,
    });
  }

  @Post('tags')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.INVENTORY_MANAGER)
  @ApiOperation({ summary: 'Stock in physical jewellery piece with HUID' })
  createItemTag(@Body() body: any, @Req() req: any) {
    return this.inventoryService.createItemTag(body, req.user?.id);
  }

  @Post('transfer')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.INVENTORY_MANAGER, UserRole.SALES_STAFF)
  @ApiOperation({ summary: 'Transfer item piece to another location' })
  transferStock(@Body() body: { itemTagId: string; toLocationId: string; reason?: string }, @Req() req: any) {
    return this.inventoryService.transferStock(body, req.user?.id);
  }

  @Post('memo/issue')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.INVENTORY_MANAGER)
  @ApiOperation({ summary: 'Issue item piece on memo (on approval)' })
  issueMemo(@Body() body: { itemTagId: string; memoHolderName: string; notes?: string }, @Req() req: any) {
    return this.inventoryService.issueMemo(body.itemTagId, body.memoHolderName, body.notes, req.user?.id);
  }

  @Post('memo/return')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.INVENTORY_MANAGER)
  @ApiOperation({ summary: 'Return item piece from memo to active stock' })
  returnMemo(@Body() body: { itemTagId: string; returnLocationId?: string }, @Req() req: any) {
    return this.inventoryService.returnMemo(body.itemTagId, body.returnLocationId, req.user?.id);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get total inventory stock valuation & weight summary' })
  getStockSummary() {
    return this.inventoryService.getStockSummary();
  }
}
