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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { CategoriesService } from './categories.service';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get full category tree (Public)' })
  getTree() {
    return this.categoriesService.getTree();
  }

  @Get('flat')
  @ApiOperation({ summary: 'Get flat paginated category list (Public)' })
  getFlat(@Query() query: any) {
    return this.categoriesService.getFlat({
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 50,
      search: query.search,
      hierarchy: query.hierarchy,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single category (Public)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.CATALOG_MANAGER)
  @ApiOperation({ summary: 'Create a new category (Admin)' })
  create(@Body() body: any, @Req() req: any) {
    return this.categoriesService.create(body, req.user.id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.CATALOG_MANAGER)
  @ApiOperation({ summary: 'Update a category (Admin)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() body: any, @Req() req: any) {
    return this.categoriesService.update(id, body, req.user.id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER)
  @ApiOperation({ summary: 'Soft-delete a category (only if no children) (Admin)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.remove(id);
  }

  @Patch(':id/reorder')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.CATALOG_MANAGER)
  @ApiOperation({ summary: 'Update category sort order (Admin)' })
  reorder(@Param('id', ParseUUIDPipe) id: string, @Body() body: { sortOrder: number }) {
    return this.categoriesService.reorder(id, body.sortOrder);
  }
}
