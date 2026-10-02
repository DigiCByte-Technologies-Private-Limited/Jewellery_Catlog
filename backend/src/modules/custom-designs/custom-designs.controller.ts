import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Response, Request } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomDesignsService } from './custom-designs.service';
import {
  CreateCustomDesignDto,
  UpdateCustomDesignStatusDto,
  QueryCustomDesignDto,
} from './dto/custom-design.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

// Ensure upload directory exists
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'custom-designs');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage engine
const customDesignStorage = diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `cdr-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, uniqueName);
  },
});

// File validation filter
const allowedExtensions = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.pdf',
  '.obj',
  '.stl',
  '.step',
  '.stp',
  '.cad',
  '.dwg',
  '.dxf',
  '.zip',
]);

const customDesignFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.has(ext)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestException(
        `Unsupported file type "${ext}". Supported types: JPG, PNG, WEBP, PDF, OBJ, STL, CAD, DWG, DXF, STEP, ZIP`,
      ),
      false,
    );
  }
};

@ApiTags('Custom Design Requests')
@Controller('custom-designs')
export class CustomDesignsController {
  constructor(private readonly customDesignsService: CustomDesignsService) {}

  /**
   * 1. Public Endpoint: Multi-file Upload for Custom Design Attachments
   * Accepts up to 5 files, each up to 25MB
   */
  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: customDesignStorage,
      limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit per file
      fileFilter: customDesignFileFilter,
    }),
  )
  @ApiOperation({ summary: 'Upload reference images or CAD files for custom designs' })
  uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files were uploaded.');
    }

    const uploaded = files.map((f) => ({
      id: crypto.randomUUID(),
      originalName: f.originalname,
      filename: f.filename,
      mimeType: f.mimetype,
      sizeBytes: f.size,
      url: `/api/v1/custom-designs/attachments/${f.filename}`,
    }));

    return {
      success: true,
      message: `${files.length} file(s) uploaded successfully`,
      data: uploaded,
    };
  }

  /**
   * 2. Secure File Download / View
   */
  @Get('attachments/:filename')
  @ApiOperation({ summary: 'Serve custom design attachment securely' })
  serveAttachment(@Param('filename') filename: string, @Res() res: Response) {
    // Prevent directory traversal attacks
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(UPLOAD_DIR, sanitizedFilename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Attachment file not found');
    }

    return res.sendFile(filePath);
  }

  /**
   * 3. Public Endpoint: Customer Submits Custom Design Request
   */
  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a new customer bespoke design request (Public or Authenticated)' })
  async create(@Body() dto: CreateCustomDesignDto, @Req() req: Request) {
    const user = (req as any).user;
    return this.customDesignsService.create(dto, user?.id);
  }

  /**
   * 3.1 Customer Endpoint: List my own submitted custom designs
   */
  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Customer retrieves their own submitted custom designs' })
  async findMyDesigns(@Req() req: any) {
    return this.customDesignsService.findMyDesigns(req.user.id);
  }

  /**
   * 4. Public Endpoint: Customer Tracks Request by Request ID
   */
  @Get('track/:requestId')
  @ApiOperation({ summary: 'Customer tracks custom design request status' })
  async track(
    @Param('requestId') requestId: string,
    @Query('phoneOrEmail') phoneOrEmail?: string,
  ) {
    return this.customDesignsService.track(requestId, phoneOrEmail);
  }

  /**
   * 5. Admin: Dashboard Stats & Pipeline Breakdown
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get custom design requests pipeline analytics' })
  async getStats() {
    return this.customDesignsService.getStats();
  }

  /**
   * 6. Admin: List All Requests with Filtering & Search
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List custom design requests with filters and pagination' })
  async findAll(@Query() query: QueryCustomDesignDto) {
    return this.customDesignsService.findAll(query);
  }

  /**
   * 7. Admin / Customer: Get Single Request with Audit History
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get custom design request details and history' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.customDesignsService.findOne(id, req.user);
  }

  /**
   * 8. Admin: Update Request Status & Admin Notes
   */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update custom design request status and admin notes' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCustomDesignStatusDto,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return this.customDesignsService.updateStatus(id, dto, user);
  }

  /**
   * 9. Admin: Manual Retry of Email/WhatsApp Alerts
   */
  @Post(':id/retry-notification')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retry email and WhatsApp notifications for this request' })
  async retryNotification(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.customDesignsService.retryNotification(id, user);
  }
}
