import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';

import { WholesaleAuthService } from './wholesale-auth.service';
import { WholesaleApplicationRegisterDto } from './dto/wholesale-application-register.dto';
import { WholesaleProfileUpdateDto } from './dto/wholesale-profile-update.dto';
import { WholesaleResubmitDto } from './dto/wholesale-resubmit.dto';
import {
  UpdateApplicationStatusDto,
  UpdateDocumentStatusDto,
  AddAdminNoteDto,
  WholesaleApplicationFilterDto,
} from './dto/wholesale-admin-action.dto';
import { LoginDto } from '../auth/dto/login.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

// ── Private Document Storage Configuration ─────────────────────────────────
const PRIVATE_DOCS_DIR = path.resolve(process.cwd(), 'uploads', 'private', 'wholesale-documents');
if (!fs.existsSync(PRIVATE_DOCS_DIR)) {
  fs.mkdirSync(PRIVATE_DOCS_DIR, { recursive: true });
}

const privateDocStorage = diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, PRIVATE_DOCS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `kyc-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, unique);
  },
});

const allowedDocExtensions = new Set(['.pdf', '.jpg', '.jpeg', '.png']);
const allowedDocMimes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
]);

const privateDocFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedDocExtensions.has(ext)) {
    return cb(
      new BadRequestException(
        `Invalid file extension "${ext}". Allowed formats are: PDF, JPG, JPEG, PNG.`,
      ),
      false,
    );
  }
  if (!allowedDocMimes.has(file.mimetype)) {
    return cb(
      new BadRequestException(
        `Invalid file MIME type "${file.mimetype}". Allowed formats are: PDF, JPG, JPEG, PNG.`,
      ),
      false,
    );
  }
  cb(null, true);
};

@ApiTags('Wholesale Auth & Partner Verification')
@Controller('wholesale')
export class WholesaleAuthController {
  constructor(private readonly wholesaleAuthService: WholesaleAuthService) {}

  /**
   * 1. Register a new Wholesale Application with KYC document uploads
   */
  @Post(['auth/register', 'auth/register-application'])
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Register a new wholesale partner account with KYC proofs' })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'aadhaarProof', maxCount: 1 },
        { name: 'panProof', maxCount: 1 },
        { name: 'gstProof', maxCount: 1 },
      ],
      {
        storage: privateDocStorage,
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per document
        fileFilter: privateDocFilter,
      },
    ),
  )
  async register(
    @Body() dto: WholesaleApplicationRegisterDto,
    @UploadedFiles()
    files: {
      aadhaarProof?: Express.Multer.File[];
      panProof?: Express.Multer.File[];
      gstProof?: Express.Multer.File[];
    },
  ) {
    return this.wholesaleAuthService.registerApplication(dto, files || {});
  }

  /**
   * 2. Gated Login: Verifies credentials & checks approval status
   */
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login as a wholesale partner (Enforces approval check)' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString();
    const result = await this.wholesaleAuthService.login(dto, ip);

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      success: true,
      message: 'Login successful',
      data: {
        accessToken: result.accessToken,
        user: result.user,
        partner: result.partner,
      },
    };
  }

  /**
   * 3. Resubmit Rejected Wholesale Application
   */
  @Post('auth/resubmit')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Correct details and resubmit a rejected wholesale application' })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'aadhaarProof', maxCount: 1 },
        { name: 'panProof', maxCount: 1 },
        { name: 'gstProof', maxCount: 1 },
      ],
      {
        storage: privateDocStorage,
        limits: { fileSize: 10 * 1024 * 1024 },
        fileFilter: privateDocFilter,
      },
    ),
  )
  async resubmit(
    @Body() dto: WholesaleResubmitDto,
    @UploadedFiles()
    files: {
      aadhaarProof?: Express.Multer.File[];
      panProof?: Express.Multer.File[];
      gstProof?: Express.Multer.File[];
    },
  ) {
    return this.wholesaleAuthService.resubmitApplication(dto, files || {});
  }

  /**
   * 4. Logout
   */
  @Post('auth/logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate session' })
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    res.clearCookie('refresh_token');
    return this.wholesaleAuthService.logout(req.user.id);
  }

  /**
   * 5. Get Wholesale Partner Profile (Masked sensitive info)
   */
  @Get('auth/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.WHOLESALE_USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current wholesale partner profile' })
  async getProfile(@Req() req: any) {
    return this.wholesaleAuthService.getProfile(req.user.id);
  }

  /**
   * 6. Update Wholesale Partner Profile
   */
  @Patch('auth/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.WHOLESALE_USER)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update wholesale partner profile' })
  async updateProfile(@Req() req: any, @Body() dto: WholesaleProfileUpdateDto) {
    return this.wholesaleAuthService.updateProfile(req.user.id, dto);
  }

  /**
   * 7. Dashboard Metrics
   */
  @Get('auth/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.WHOLESALE_USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get wholesale partner dashboard statistics' })
  async getDashboard(@Req() req: any) {
    return this.wholesaleAuthService.getDashboardStats(req.user.id);
  }

  /**
   * 8. Assigned Customer Inquiries
   */
  @Get('auth/assigned-customers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.WHOLESALE_USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get customers and inquiries assigned to this wholesale partner' })
  async getAssignedCustomers(@Req() req: any) {
    return this.wholesaleAuthService.getAssignedCustomers(req.user.id);
  }

  @Patch('auth/assigned-customers/:id/follow-up')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.WHOLESALE_USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Log outreach note for assigned customer' })
  async updateFollowUp(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: { note: string; customerResponse?: string; nextFollowUpDate?: string },
  ) {
    return this.wholesaleAuthService.updateCustomerFollowUp(req.user.id, id, dto);
  }

  @Patch('auth/assigned-customers/:id/outcome')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.WHOLESALE_USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record customer purchase outcome' })
  async updateOutcome(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: { purchaseStatus: any; purchaseNotes?: string; confirmedQuantity?: number; purchaseReason?: string },
  ) {
    return this.wholesaleAuthService.updateCustomerOutcome(req.user.id, id, dto);
  }

  @Post('auth/change-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.WHOLESALE_USER)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change own password' })
  async changePassword(
    @Req() req: any,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.wholesaleAuthService.changePassword(
      req.user.id,
      body.currentPassword,
      body.newPassword,
    );
  }

  // ── SECURE PRIVATE DOCUMENT STREAMING (RBAC + Anti-IDOR) ──────────────────

  @Get('documents/:id/download')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Securely download an authorized KYC document' })
  async downloadDocument(
    @Param('id') docId: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    return this.wholesaleAuthService.streamDocument(docId, req.user, res, true);
  }

  @Get('documents/:id/preview')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Securely view/preview an authorized KYC document inline' })
  async previewDocument(
    @Param('id') docId: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    return this.wholesaleAuthService.streamDocument(docId, req.user, res, false);
  }

  // ── ADMIN WHOLESALE MANAGEMENT ENDPOINTS ──────────────────────────────────

  @Get(['admin/applications', 'auth/partners'])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.AUDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: List wholesale applications with filters & statistics' })
  async listApplications(@Query() filter: WholesaleApplicationFilterDto) {
    return this.wholesaleAuthService.listApplicationsForAdmin(filter);
  }

  @Get('admin/applications/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER, UserRole.AUDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Get full wholesale application detail, KYC docs, and history' })
  async getApplicationDetail(@Param('id') id: string) {
    return this.wholesaleAuthService.getApplicationDetailForAdmin(id);
  }

  @Patch('admin/applications/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Approve, Reject, or set Under Review for a wholesale application' })
  async updateApplicationStatus(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.wholesaleAuthService.updateApplicationStatus(id, req.user, dto);
  }

  @Patch('admin/documents/:docId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Mark individual document as Verified or Rejected' })
  async updateDocumentStatus(
    @Param('docId') docId: string,
    @Req() req: any,
    @Body() dto: UpdateDocumentStatusDto,
  ) {
    return this.wholesaleAuthService.updateDocumentStatus(docId, req.user, dto);
  }

  @Post('admin/applications/:id/notes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STORE_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Append internal compliance notes to application' })
  async addAdminNote(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: AddAdminNoteDto,
  ) {
    return this.wholesaleAuthService.addAdminNote(id, req.user, dto);
  }
}
