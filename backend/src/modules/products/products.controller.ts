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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, ProductStatus, MetalType, MetalPurity } from '../../common/enums';
import { ProductsService } from './products.service';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List products with filters, pagination, sorting' })
  findAll(@Query() query: any) {
    return this.productsService.findAll({
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
      search: query.search,
      metalType: query.metalType as MetalType,
      purity: query.purity as MetalPurity,
      status: query.status as ProductStatus,
      categoryId: query.categoryId,
      hasStones: query.hasStones !== undefined ? query.hasStones === 'true' : undefined,
      audience: query.audience,
      occasion: query.occasion,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: (query.sortOrder?.toUpperCase() ?? 'DESC') as 'ASC' | 'DESC',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single product with relations' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.STORE_MANAGER,
    UserRole.CATALOG_MANAGER,
    UserRole.INVENTORY_MANAGER,
  )
  @ApiOperation({ summary: 'Create a new product' })
  create(@Body() body: any, @Req() req: any) {
    return this.productsService.create(body, req.user.id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.STORE_MANAGER,
    UserRole.CATALOG_MANAGER,
    UserRole.INVENTORY_MANAGER,
  )
  @ApiOperation({ summary: 'Update a product' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() body: any, @Req() req: any) {
    return this.productsService.update(id, body, req.user.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER)
  @ApiOperation({ summary: 'Soft-delete a product (cannot delete PUBLISHED products)' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.productsService.remove(id, req.user.id);
  }

  @Post(':id/duplicate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.CATALOG_MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Duplicate a product as a new draft' })
  duplicate(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.productsService.duplicate(id, req.user.id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.STORE_MANAGER,
    UserRole.CATALOG_MANAGER,
    UserRole.INVENTORY_MANAGER,
  )
  @ApiOperation({ summary: 'Change product status' })
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: ProductStatus },
    @Req() req: any,
  ) {
    return this.productsService.changeStatus(id, body.status, req.user.id, req.user.role);
  }

  @Get(':id/price-breakdown')
  @ApiOperation({ summary: 'Get live price calculation breakdown for a product' })
  getPriceBreakdown(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.getPriceBreakdown(id);
  }

  @Post('bulk-status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.CATALOG_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk change status for multiple products' })
  bulkStatusChange(@Body() body: { ids: string[]; status: ProductStatus }, @Req() req: any) {
    return this.productsService.bulkStatusChange(body.ids, body.status, req.user.id);
  }
}
