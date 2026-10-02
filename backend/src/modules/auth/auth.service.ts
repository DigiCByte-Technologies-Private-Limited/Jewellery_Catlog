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
import { CustomerRegisterDto } from './dto/customer-register.dto';
import { CustomerProfileUpdateDto } from './dto/customer-profile-update.dto';
import { Customer } from '../customers/entities/customer.entity';
import { UserRole } from '../../common/enums';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
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

  // ─── Customer Self-Registration ──────────────────────────────────────────
  async customerRegister(dto: CustomerRegisterDto, ip?: string, userAgent?: string) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match.');
    }

    if (!dto.password || dto.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long.');
    }

    const normalizedEmail = dto.email.toLowerCase().trim();

    // Check duplicate email in users table
    const existingUser = await this.userRepo.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      throw new ConflictException('An account already exists with this email address. Please sign in instead.');
    }

    // Check duplicate phone in customers table
    const cleanPhone = dto.phone.trim();
    const existingPhone = await this.customerRepo.findOne({ where: { phone: cleanPhone } });
    if (existingPhone && existingPhone.userId) {
      throw new ConflictException('An account with this mobile number already exists. Please sign in instead.');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const user = this.userRepo.create({
      email: normalizedEmail,
      passwordHash,
      fullName: dto.fullName.trim(),
      phone: cleanPhone,
      role: UserRole.CUSTOMER,
      isActive: true,
    });
    await this.userRepo.save(user);

    let customer = existingPhone;
    if (customer) {
      customer.userId = user.id;
      customer.fullName = dto.fullName.trim();
      customer.email = normalizedEmail;
      customer.address = dto.address.trim();
      customer.pincode = dto.pincode.trim();
      if (dto.city) customer.city = dto.city.trim();
      if (dto.state) customer.state = dto.state.trim();
      if (dto.altPhone) customer.altPhone = dto.altPhone.trim();
      if (dto.whatsappNumber) customer.whatsappNumber = dto.whatsappNumber.trim();
    } else {
      customer = this.customerRepo.create({
        userId: user.id,
        fullName: dto.fullName.trim(),
        email: normalizedEmail,
        phone: cleanPhone,
        address: dto.address.trim(),
        pincode: dto.pincode.trim(),
        city: dto.city?.trim() || null,
        state: dto.state?.trim() || null,
        altPhone: dto.altPhone?.trim() || null,
        whatsappNumber: dto.whatsappNumber?.trim() || null,
        tags: ['REGISTERED_ONLINE'],
        totalSpend: 0,
      });
    }
    await this.customerRepo.save(customer);

    const tokens = await this._generateTokens(user);
    user.refreshTokenHash = await argon2.hash(tokens.refreshToken);
    user.lastLoginAt = new Date();
    user.lastLoginIp = ip || null;
    await this.userRepo.save(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this._sanitizeUser(user),
      customer,
    };
  }

  // ─── Customer Login ───────────────────────────────────────────────────────
  async customerLogin(dto: LoginDto, ip?: string, userAgent?: string) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const user = await this.userRepo.findOne({ where: { email: normalizedEmail } });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.role !== UserRole.CUSTOMER) {
      throw new UnauthorizedException('This account is registered for staff/wholesale access. Please use the appropriate portal.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated. Please contact concierge support.');
    }

    const isValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const tokens = await this._generateTokens(user);
    user.refreshTokenHash = await argon2.hash(tokens.refreshToken);
    user.lastLoginAt = new Date();
    user.lastLoginIp = ip || null;
    await this.userRepo.save(user);

    const customer = await this.customerRepo.findOne({ where: { userId: user.id } });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this._sanitizeUser(user),
      customer,
    };
  }

  // ─── Get Customer Profile ────────────────────────────────────────────────
  async getCustomerProfile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Customer account not found.');

    const customer = await this.customerRepo.findOne({ where: { userId } });
    return {
      user: this._sanitizeUser(user),
      customer,
    };
  }

  // ─── Update Customer Profile ─────────────────────────────────────────────
  async updateCustomerProfile(userId: string, dto: CustomerProfileUpdateDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Customer account not found.');

    let customer = await this.customerRepo.findOne({ where: { userId } });
    if (!customer) {
      customer = this.customerRepo.create({
        userId: user.id,
        fullName: user.fullName || '',
        email: user.email,
        phone: user.phone || '',
      });
    }

    if (dto.fullName) {
      user.fullName = dto.fullName.trim();
      customer.fullName = dto.fullName.trim();
    }

    if (dto.phone) {
      user.phone = dto.phone.trim();
      customer.phone = dto.phone.trim();
    }

    if (dto.address !== undefined) customer.address = dto.address;
    if (dto.city !== undefined) customer.city = dto.city;
    if (dto.state !== undefined) customer.state = dto.state;
    if (dto.pincode !== undefined) customer.pincode = dto.pincode;
    if (dto.altPhone !== undefined) customer.altPhone = dto.altPhone;
    if (dto.whatsappNumber !== undefined) customer.whatsappNumber = dto.whatsappNumber;
    if (dto.dateOfBirth) customer.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.anniversaryDate) customer.anniversaryDate = new Date(dto.anniversaryDate);

    await Promise.all([this.userRepo.save(user), this.customerRepo.save(customer)]);

    return {
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: this._sanitizeUser(user),
        customer,
      },
    };
  }

  // ─── Customer Forgot Password ─────────────────────────────────────────────
  async customerForgotPassword(email: string) {
    // Avoid account enumeration: always return safe confirmation message
    return {
      success: true,
      message: 'If an account exists with this email, instructions to reset your password have been sent.',
    };
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
