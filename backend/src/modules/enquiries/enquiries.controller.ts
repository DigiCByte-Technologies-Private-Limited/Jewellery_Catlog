import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EnquiryStage, MetalType, Occasion } from '../../common/enums';
import { EnquiriesService } from './enquiries.service';

@ApiTags('Enquiries & Pipeline')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('enquiries')
export class EnquiriesController {
  constructor(private readonly enquiriesService: EnquiriesService) {}

  @Get()
  @ApiOperation({ summary: 'List enquiries with pipeline stage, metal, and occasion filters' })
  getEnquiries(@Query() query: any) {
    return this.enquiriesService.getEnquiries({
      stage: query.stage as EnquiryStage,
      metalType: query.metalType as MetalType,
      occasion: query.occasion as Occasion,
      search: query.search,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 50,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Log a new customer enquiry / visitor interest' })
  createEnquiry(@Body() body: any) {
    return this.enquiriesService.createEnquiry(body);
  }

  @Patch(':id/stage')
  @ApiOperation({ summary: 'Transition enquiry to next pipeline stage' })
  updateStage(@Param('id') id: string, @Body('stage') stage: EnquiryStage) {
    return this.enquiriesService.updateStage(id, stage);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update enquiry details or follow-up schedule' })
  updateEnquiry(@Param('id') id: string, @Body() body: any) {
    return this.enquiriesService.updateEnquiry(id, body);
  }
}
