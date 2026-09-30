import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, ILike } from 'typeorm';
import * as argon2 from 'argon2';
import { User } from './entities/user.entity';
import { UserRole } from '../../common/enums';

export interface CreateUserDto {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  role?: UserRole;
}

export interface UpdateUserDto {
  fullName?: string;
  phone?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UserListQuery {
  page?: number;
  limit?: number;
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(query: UserListQuery) {
    const { page = 1, limit = 20, role, isActive, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) where.email = ILike(`%${search}%`);

    const [users, total] = await this.userRepo.findAndCount({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        isTotpEnabled: true,
        lastLoginAt: true,
        lastLoginIp: true,
        createdAt: true,
        updatedAt: true,
      },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      withDeleted: false,
    });

    return {
      success: true,
      data: users,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const user = await this.userRepo.findOne({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        isTotpEnabled: true,
        lastLoginAt: true,
        lastLoginIp: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return { success: true, data: user };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async create(dto: CreateUserDto, createdById?: string) {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException(`User with email ${dto.email} already exists`);

    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    const user = this.userRepo.create({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      phone: dto.phone,
      role: dto.role || UserRole.SALES_STAFF,
      isActive: true,
    });
    await this.userRepo.save(user);

    const { passwordHash: _, refreshTokenHash: __, totpSecret: ___, ...safe } = user as any;
    return { success: true, message: 'User created successfully', data: safe };
  }

  async update(id: string, dto: UpdateUserDto, updatedById?: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);

    Object.assign(user, dto);
    await this.userRepo.save(user);

    const { passwordHash: _, refreshTokenHash: __, totpSecret: ___, ...safe } = user as any;
    return { success: true, message: 'User updated successfully', data: safe };
  }

  async remove(id: string, deletedById?: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot delete Super Admin account');
    }
    await this.userRepo.softDelete(id);
    return { success: true, message: 'User deactivated successfully' };
  }

  async toggleStatus(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot deactivate Super Admin account');
    }
    user.isActive = !user.isActive;
    await this.userRepo.save(user);
    return {
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { id: user.id, isActive: user.isActive },
    };
  }
}
