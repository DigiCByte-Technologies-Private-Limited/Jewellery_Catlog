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
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get full category tree' })
  getTree() {
    return this.categoriesService.getTree();
  }

  @Get('flat')
  @ApiOperation({ summary: 'Get flat paginated category list' })
  getFlat(@Query() query: any) {
    return this.categoriesService.getFlat({
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 50,
      search: query.search,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single category' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.CATALOG_MANAGER)
  @ApiOperation({ summary: 'Create a new category' })
  create(@Body() body: any, @Req() req: any) {
    return this.categoriesService.create(body, req.user.id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.CATALOG_MANAGER)
  @ApiOperation({ summary: 'Update a category' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() body: any, @Req() req: any) {
    return this.categoriesService.update(id, body, req.user.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER)
  @ApiOperation({ summary: 'Soft-delete a category (only if no children)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.remove(id);
  }

  @Patch(':id/reorder')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.CATALOG_MANAGER)
  @ApiOperation({ summary: 'Update category sort order' })
  reorder(@Param('id', ParseUUIDPipe) id: string, @Body() body: { sortOrder: number }) {
    return this.categoriesService.reorder(id, body.sortOrder);
  }
}
