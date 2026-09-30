import {
  Controller,
  Get,
  Post,
  Param,
  Body,
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
import { UserRole, ApprovalType, ApprovalStatus } from '../../common/enums';
import { ApprovalsService } from './approvals.service';

@ApiTags('Approvals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get()
  @ApiOperation({ summary: 'List approvals with filters' })
  findAll(@Query() query: any) {
    return this.approvalsService.findAll({
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
      type: query.type as ApprovalType,
      status: query.status as ApprovalStatus,
      requestedById: query.requestedById,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single approval' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.approvalsService.findOne(id);
  }

  @Post(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.PRICING_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a pending request' })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { comments?: string },
    @Req() req: any,
  ) {
    return this.approvalsService.approve(id, req.user.id, body.comments);
  }

  @Post(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.PRICING_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a pending request (requires comments/reason)' })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { comments: string },
    @Req() req: any,
  ) {
    return this.approvalsService.reject(id, req.user.id, body.comments);
  }
}
