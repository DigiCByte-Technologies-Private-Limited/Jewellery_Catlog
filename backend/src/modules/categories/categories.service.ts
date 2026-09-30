import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TreeRepository, Repository } from 'typeorm';
import { Category } from './entities/category.entity';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: TreeRepository<Category>,
  ) {}

  async getTree() {
    const trees = await this.categoryRepo.findTrees({ relations: ['children'] });
    return { success: true, data: trees };
  }

  async getFlat(query: { page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 50, search } = query;
    const skip = (page - 1) * limit;

    const qb = this.categoryRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.parent', 'parent')
      .where('c.deletedAt IS NULL')
      .orderBy('c.sortOrder', 'ASC')
      .addOrderBy('c.name', 'ASC')
      .skip(skip)
      .take(limit);

    if (search) {
      qb.andWhere('LOWER(c.name) LIKE :search', { search: `%${search.toLowerCase()}%` });
    }

    const [data, total] = await qb.getManyAndCount();
    return {
      success: true,
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: { parent: true, children: true },
    });
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    return { success: true, data: category };
  }

  async create(dto: {
    name: string;
    parentId?: string;
    description?: string;
    isVisible?: boolean;
    sortOrder?: number;
    hsnCode?: string;
    defaultWastagePercent?: number;
    defaultMakingChargeType?: string;
    defaultMakingChargeValue?: number;
    metaTitle?: string;
    metaDescription?: string;
    bannerImageUrl?: string;
    iconUrl?: string;
  }, createdById?: string) {
    // Generate unique slug
    let slug = slugify(dto.name);
    const existing = await this.categoryRepo.findOne({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    let parent: Category | null = null;
    if (dto.parentId) {
      parent = await this.categoryRepo.findOne({ where: { id: dto.parentId } });
      if (!parent) throw new NotFoundException(`Parent category ${dto.parentId} not found`);
    }

    const category = this.categoryRepo.create({
      name: dto.name,
      slug,
      description: dto.description,
      isVisible: dto.isVisible ?? true,
      sortOrder: dto.sortOrder ?? 0,
      hsnCode: dto.hsnCode,
      defaultWastagePercent: dto.defaultWastagePercent,
      defaultMakingChargeType: dto.defaultMakingChargeType as any,
      defaultMakingChargeValue: dto.defaultMakingChargeValue,
      metaTitle: dto.metaTitle,
      metaDescription: dto.metaDescription,
      bannerImageUrl: dto.bannerImageUrl,
      iconUrl: dto.iconUrl,
      parent: parent || undefined,
      createdById,
    });

    await this.categoryRepo.save(category);
    return { success: true, message: 'Category created successfully', data: category };
  }

  async update(id: string, dto: any, updatedById?: string) {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException(`Category ${id} not found`);

    if (dto.name && dto.name !== category.name) {
      let slug = slugify(dto.name);
      const existing = await this.categoryRepo.findOne({ where: { slug } });
      if (existing && existing.id !== id) slug = `${slug}-${Date.now()}`;
      category.slug = slug;
    }

    if (dto.parentId !== undefined) {
      if (dto.parentId === null) {
        category.parent = null;
      } else {
        const parent = await this.categoryRepo.findOne({ where: { id: dto.parentId } });
        if (!parent) throw new NotFoundException(`Parent category ${dto.parentId} not found`);
        category.parent = parent;
      }
    }

    Object.assign(category, {
      name: dto.name ?? category.name,
      description: dto.description ?? category.description,
      isVisible: dto.isVisible ?? category.isVisible,
      sortOrder: dto.sortOrder ?? category.sortOrder,
      hsnCode: dto.hsnCode ?? category.hsnCode,
      defaultWastagePercent: dto.defaultWastagePercent ?? category.defaultWastagePercent,
      defaultMakingChargeType: dto.defaultMakingChargeType ?? category.defaultMakingChargeType,
      defaultMakingChargeValue: dto.defaultMakingChargeValue ?? category.defaultMakingChargeValue,
      metaTitle: dto.metaTitle ?? category.metaTitle,
      metaDescription: dto.metaDescription ?? category.metaDescription,
      bannerImageUrl: dto.bannerImageUrl ?? category.bannerImageUrl,
      iconUrl: dto.iconUrl ?? category.iconUrl,
      updatedById,
    });

    await this.categoryRepo.save(category);
    return { success: true, message: 'Category updated successfully', data: category };
  }

  async remove(id: string) {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: { children: true },
    });
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    if (category.children && category.children.length > 0) {
      throw new ConflictException('Cannot delete a category that has subcategories. Delete or reassign children first.');
    }
    await this.categoryRepo.softDelete(id);
    return { success: true, message: 'Category deleted successfully' };
  }

  async reorder(id: string, sortOrder: number) {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    category.sortOrder = sortOrder;
    await this.categoryRepo.save(category);
    return { success: true, message: 'Category reordered', data: { id, sortOrder } };
  }
}
