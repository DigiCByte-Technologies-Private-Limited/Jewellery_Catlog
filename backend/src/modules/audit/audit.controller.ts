import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { AuditService } from './audit.service';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.AUDITOR)
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated audit log with filters' })
  findAll(@Query() query: any) {
    return this.auditService.findAll({
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 50,
      userId: query.userId,
      entityName: query.entityName,
      action: query.action,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });
  }
}
