import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Request } from 'express';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    super({
      // Extract from Authorization header OR cookie
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => req?.cookies?.['access_token'] ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') || 'jewellery_access_secret_2024_very_long_random_key_change_in_prod',
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or account disabled');
    }
    return { id: user.id, email: user.email, role: user.role, fullName: user.fullName };
  }
}
