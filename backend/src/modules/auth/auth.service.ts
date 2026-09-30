import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '../../common/enums';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Login ────────────────────────────────────────────────────────────────
  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid email or password');
    if (!user.isActive) throw new UnauthorizedException('Account is disabled. Contact your administrator.');

    const isValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isValid) throw new UnauthorizedException('Invalid email or password');

    const tokens = await this._generateTokens(user);

    // Store hashed refresh token
    user.refreshTokenHash = await argon2.hash(tokens.refreshToken);
    user.lastLoginAt = new Date();
    user.lastLoginIp = ip || null;
    await this.userRepo.save(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this._sanitizeUser(user),
    };
  }

  // ─── Register (Super Admin creates staff accounts) ────────────────────────
  async register(dto: RegisterDto, createdById?: string) {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException(`User with email ${dto.email} already exists`);

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const user = this.userRepo.create({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName ?? null,
      phone: dto.phone ?? null,
      role: dto.role || UserRole.SALES_STAFF,
      isActive: true,
    });

    await this.userRepo.save(user);
    return { success: true, message: 'User created successfully', data: this._sanitizeUser(user) };
  }

  // ─── Refresh Token ────────────────────────────────────────────────────────
  async refreshToken(refreshToken: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user || !user.refreshTokenHash) throw new UnauthorizedException('Session expired. Please log in again.');
    if (!user.isActive) throw new UnauthorizedException('Account is disabled');

    const isMatch = await argon2.verify(user.refreshTokenHash, refreshToken);
    if (!isMatch) throw new UnauthorizedException('Refresh token mismatch. Please log in again.');

    const newAccessToken = this._generateAccessToken(user);
    return { accessToken: newAccessToken };
  }

  // ─── Logout ───────────────────────────────────────────────────────────────
  async logout(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (user) {
      user.refreshTokenHash = null;
      await this.userRepo.save(user);
    }
    return { success: true, message: 'Logged out successfully' };
  }

  // ─── Get Profile ──────────────────────────────────────────────────────────
  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return { success: true, data: this._sanitizeUser(user) };
  }

  // ─── Change Password ──────────────────────────────────────────────────────
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const isValid = await argon2.verify(user.passwordHash, currentPassword);
    if (!isValid) throw new BadRequestException('Current password is incorrect');

    if (newPassword.length < 8) throw new BadRequestException('New password must be at least 8 characters');

    user.passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });
    user.refreshTokenHash = null; // invalidate all sessions
    await this.userRepo.save(user);

    return { success: true, message: 'Password changed successfully. Please log in again.' };
  }

  // ─── Seed Super Admin (called by seed script) ─────────────────────────────
  async seedSuperAdmin(email: string, password: string, fullName: string) {
    const exists = await this.userRepo.findOne({ where: { email } });
    if (exists) return exists;

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const user = this.userRepo.create({
      email,
      passwordHash,
      fullName,
      role: 'SUPER_ADMIN' as any,
      isActive: true,
    });
    return this.userRepo.save(user);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  private async _generateTokens(user: User) {
    const [accessToken, refreshToken] = await Promise.all([
      this._generateAccessToken(user),
      this._generateRefreshToken(user),
    ]);
    return { accessToken, refreshToken };
  }

  private _generateAccessToken(user: User): string {
    return this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m') as any,
      },
    );
  }

  private _generateRefreshToken(user: User): string {
    return this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d') as any,
      },
    );
  }

  private _sanitizeUser(user: User) {
    const { passwordHash, refreshTokenHash, totpSecret, ...safe } = user as any;
    return safe;
  }
}
