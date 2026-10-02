import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Response, Request } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WholesaleSubmissionsService } from './wholesale-submissions.service';
import {
  CreateWholesaleSubmissionDto,
  UpdateWholesaleSubmissionStatusDto,
  QueryWholesaleSubmissionDto,
  PublishToCatalogDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

const WHOLESALE_UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'wholesale-submissions');
const CATALOG_UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'products');

if (!fs.existsSync(WHOLESALE_UPLOAD_DIR)) {
  fs.mkdirSync(WHOLESALE_UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(CATALOG_UPLOAD_DIR)) {
  fs.mkdirSync(CATALOG_UPLOAD_DIR, { recursive: true });
}

// Multer storage for wholesale proposal uploads
const wholesaleStorage = diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, WHOLESALE_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `wps-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, uniqueName);
  },
});

const allowedImageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const wholesaleFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedImageExtensions.has(ext)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestException(
        `Unsupported image format "${ext}". Supported formats are: JPG, JPEG, PNG, WEBP.`,
      ),
      false,
    );
  }
};

@ApiTags('Wholesale Product Image Submissions')
@Controller(['wholesale', 'wholesale-submissions'])
export class WholesaleSubmissionsController {
  constructor(private readonly wholesaleService: WholesaleSubmissionsService) {}

  /**
   * 1. Public / Wholesale Endpoint: Upload Proposed Product Images
   * Accepts up to 5 images, each up to 25MB
   */
  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: wholesaleStorage,
      limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit per file
      fileFilter: wholesaleFileFilter,
    }),
  )
  @ApiOperation({ summary: 'Upload proposed product images for wholesale review' })
  uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No image files were uploaded.');
    }

    const uploaded = files.map((f) => ({
      id: crypto.randomUUID(),
      originalName: f.originalname,
      filename: f.filename,
      mimeType: f.mimetype,
      sizeBytes: f.size,
      url: `/api/v1/wholesale/attachments/${f.filename}`,
    }));

    return {
      success: true,
      message: `${files.length} proposal image(s) uploaded successfully`,
      data: uploaded,
    };
  }

  /**
   * 2. Secure File Serving: Wholesale Proposed Attachments Preview
   */
  @Get('attachments/:filename')
  @ApiOperation({ summary: 'Serve wholesale proposal image attachment preview' })
  serveAttachment(@Param('filename') filename: string, @Res() res: Response) {
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(WHOLESALE_UPLOAD_DIR, sanitizedFilename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Attachment image not found.');
    }

    return res.sendFile(filePath);
  }

  /**
   * 3. Secure File Serving: Published Official Catalog Media
   */
  @Get('catalog-media/:filename')
  @ApiOperation({ summary: 'Serve published official product catalog image' })
  serveCatalogMedia(@Param('filename') filename: string, @Res() res: Response) {
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(CATALOG_UPLOAD_DIR, sanitizedFilename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Catalog image not found.');
    }

    return res.sendFile(filePath);
  }

  /**
   * 4. Wholesale User: Submit Product Information + Image Proposal
   */
  @Post(['submissions', ''])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a new wholesale product image proposal for Admin review' })
  async createSubmission(@Body() dto: CreateWholesaleSubmissionDto, @Req() req: Request) {
    const user = (req as any).user;
    return this.wholesaleService.create(dto, user);
  }

  /**
   * 5. Wholesale User: List Own Submissions
   */
  @Get(['submissions/my', 'my'])
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get current wholesale user submitted proposals' })
  async getMySubmissions(@Query() query: QueryWholesaleSubmissionDto, @Req() req: Request) {
    const user = (req as any).user;
    return this.wholesaleService.getMySubmissions(user, query);
  }

  /**
   * 6. Wholesale User: Get Single Submission Details
   */
  @Get(['submissions/my/:id', 'my/:id'])
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get single wholesale submission details and status' })
  async getMySubmissionById(
    @Param('id') id: string,
    @Query('phoneOrEmail') phoneOrEmail: string,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return this.wholesaleService.getMySubmissionById(id, user, phoneOrEmail);
  }

  /**
   * 7. Admin: Pipeline Summary & Analytics Stats
   */
  @Get(['admin/submissions/stats', 'stats'])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.STORE_MANAGER,
    UserRole.CATALOG_MANAGER,
    UserRole.INVENTORY_MANAGER,
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get wholesale proposals pipeline stats for Admin' })
  async getStats() {
    return this.wholesaleService.getStats();
  }

  /**
   * 8. Admin: List All Submissions with Filters & Search
   */
  @Get(['admin/submissions', ''])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.STORE_MANAGER,
    UserRole.CATALOG_MANAGER,
    UserRole.INVENTORY_MANAGER,
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all wholesale product submissions for Admin review' })
  async findAllAdmin(@Query() query: QueryWholesaleSubmissionDto) {
    return this.wholesaleService.findAllAdmin(query);
  }

  /**
   * 9. Admin: Conflict Check (Inspect existing product images before publishing)
   */
  @Get(['admin/submissions/conflict-check/:productId', ':id/media-conflict', 'conflict-check/:productId'])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.STORE_MANAGER,
    UserRole.CATALOG_MANAGER,
    UserRole.INVENTORY_MANAGER,
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if product already has official images in catalog' })
  async checkConflict(
    @Param('productId') productId?: string,
    @Param('id') id?: string,
  ) {
    const target = productId || id || '';
    return this.wholesaleService.checkProductMediaConflict(target);
  }

  /**
   * 10. Admin: Download Original Submitted Image (Preserves uncompressed quality)
   */
  @Get(['admin/submissions/:id/download/:fileId', ':id/download-image'])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.STORE_MANAGER,
    UserRole.CATALOG_MANAGER,
    UserRole.INVENTORY_MANAGER,
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download original quality submitted image' })
  async downloadImage(
    @Param('id') id: string,
    @Param('fileId') fileId: string | undefined,
    @Query('fileIndex') fileIndex: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = (req as any).user;
    const targetFile = fileId || fileIndex;
    const { filePath, downloadFileName } = await this.wholesaleService.getImageForDownload(
      id,
      targetFile,
      user,
    );

    return res.download(filePath, downloadFileName);
  }

  /**
   * 11. Admin: Update Submission Status (Accept Image, Reject Image, Keep Pending)
   */
  @Patch(['admin/submissions/:id/status', ':id/status'])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.STORE_MANAGER,
    UserRole.CATALOG_MANAGER,
    UserRole.INVENTORY_MANAGER,
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update wholesale proposal status (Accept/Reject with reason)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateWholesaleSubmissionStatusDto,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return this.wholesaleService.updateStatus(id, dto, user);
  }

  /**
   * 12. Admin: Explicitly Publish Accepted Image to Official Product Catalog
   */
  @Post(['admin/submissions/:id/publish-to-catalog', ':id/publish'])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.STORE_MANAGER,
    UserRole.CATALOG_MANAGER,
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish accepted image to official product catalog' })
  async publishToCatalog(
    @Param('id') id: string,
    @Body() dto: PublishToCatalogDto,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return this.wholesaleService.publishToCatalog(id, dto, user);
  }

  /**
   * 13. Admin: Get Single Submission with Full Audit History
   * (Keep this route at the bottom so it doesn't mask /stats or /conflict-check)
   */
  @Get(['admin/submissions/:id', ':id'])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.STORE_MANAGER,
    UserRole.CATALOG_MANAGER,
    UserRole.INVENTORY_MANAGER,
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get wholesale submission details and complete audit trail' })
  async findOneAdmin(@Param('id') id: string) {
    return this.wholesaleService.findOneAdmin(id);
  }
}
