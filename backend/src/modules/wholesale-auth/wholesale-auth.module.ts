import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { WholesaleAuthService } from './wholesale-auth.service';
import { WholesaleAuthController } from './wholesale-auth.controller';
import { WholesalePartner } from './entities/wholesale-partner.entity';
import { WholesaleDocument } from './entities/wholesale-document.entity';
import { WholesalePartnerHistory } from './entities/wholesale-partner-history.entity';
import { User } from '../users/entities/user.entity';
import { WholesaleProductSubmission } from '../wholesale-submissions/entities/wholesale-product-submission.entity';
import { ProductRequest } from '../requests/entities/request.entity';
import { RequestHistory } from '../requests/entities/request-history.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      User,
      WholesalePartner,
      WholesaleDocument,
      WholesalePartnerHistory,
      WholesaleProductSubmission,
      ProductRequest,
      RequestHistory,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: (config.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m') as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [WholesaleAuthController],
  providers: [WholesaleAuthService],
  exports: [WholesaleAuthService],
})
export class WholesaleAuthModule {}
