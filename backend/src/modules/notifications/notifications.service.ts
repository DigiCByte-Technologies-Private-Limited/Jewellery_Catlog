import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import {
  getNewCustomDesignEmailHtml,
  CustomDesignEmailData,
  getNewWholesaleSubmissionEmailHtml,
  WholesaleSubmissionEmailData,
} from './templates/email-templates';
import {
  getNewCustomDesignWhatsAppText,
  CustomDesignWhatsAppData,
  getNewWholesaleSubmissionWhatsAppText,
  WholesaleSubmissionWhatsAppData,
} from './templates/whatsapp-templates';
import {
  WholesaleRegistrationAdminEmailData,
  getWholesaleRegistrationAdminEmailHtml,
  WholesaleApprovalEmailData,
  getWholesaleApprovalEmailHtml,
  WholesaleRejectionEmailData,
  getWholesaleRejectionEmailHtml,
  getWholesaleRegistrationAdminWhatsAppText,
  getWholesaleApprovalWhatsAppText,
  getWholesaleRejectionWhatsAppText,
} from './templates/wholesale-partner-templates';

export interface NotificationResult {
  emailSent: boolean;
  emailError?: string;
  whatsappSent: boolean;
  whatsappError?: string;
  notificationStatus: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private mailTransporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initMailTransporter();
  }

  private initMailTransporter() {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    if (smtpHost && smtpUser) {
      try {
        this.mailTransporter = nodemailer.createTransport({
          host: smtpHost,
          port: Number(this.configService.get<number>('SMTP_PORT')) || 587,
          secure: this.configService.get<string>('SMTP_SECURE') === 'true',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });
        this.logger.log(`Configured SMTP Mailer with host ${smtpHost}`);
      } catch (err: any) {
        this.logger.warn(`Failed to initialize SMTP transporter: ${err.message}. Mock fallback active.`);
      }
    }
  }

  public getAdminEmail(): string {
    return (
      this.configService.get<string>('ADMIN_NOTIFICATION_EMAIL') ||
      'admin@jewellery.com'
    );
  }

  public getAdminWhatsApp(): string {
    return (
      this.configService.get<string>('ADMIN_WHATSAPP_NUMBER') ||
      '+91 98765 43210'
    );
  }

  public getAdminWebUrl(): string {
    return (
      this.configService.get<string>('ADMIN_WEB_URL') ||
      'http://localhost:5173'
    );
  }

  /**
   * Primary orchestrator for Custom Design Notifications:
   * Dispatches Email and WhatsApp alerts asynchronously and guarantees no unhandled rejection.
   */
  async sendNewCustomDesignNotification(
    data: Omit<CustomDesignEmailData & CustomDesignWhatsAppData, 'adminPortalLink' | 'submittedAt'>,
  ): Promise<NotificationResult> {
    const adminLink = `${this.getAdminWebUrl()}/custom-designs?id=${encodeURIComponent(data.requestId)}`;
    const submittedAt = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const fullEmailData: CustomDesignEmailData = {
      ...data,
      adminPortalLink: adminLink,
      submittedAt,
    };

    const fullWhatsAppData: CustomDesignWhatsAppData = {
      ...data,
      adminPortalLink: adminLink,
    };

    // Parallel asynchronous execution
    const [emailRes, whatsappRes] = await Promise.allSettled([
      this.sendEmailAlert(fullEmailData),
      this.sendWhatsAppAlert(fullWhatsAppData),
    ]);

    const emailSent = emailRes.status === 'fulfilled' && emailRes.value.success;
    const emailError =
      emailRes.status === 'rejected'
        ? (emailRes.reason?.message || 'Email error')
        : emailRes.value?.error;

    const whatsappSent =
      whatsappRes.status === 'fulfilled' && whatsappRes.value.success;
    const whatsappError =
      whatsappRes.status === 'rejected'
        ? (whatsappRes.reason?.message || 'WhatsApp error')
        : whatsappRes.value?.error;

    // Compose human-readable notificationStatus
    const parts: string[] = [];
    parts.push(emailSent ? 'EMAIL_SENT' : 'EMAIL_FAILED');
    parts.push(whatsappSent ? 'WHATSAPP_SENT' : 'WHATSAPP_FAILED');
    const notificationStatus = parts.join(', ');

    return {
      emailSent,
      emailError,
      whatsappSent,
      whatsappError,
      notificationStatus,
    };
  }

  /**
   * Sends email alert via SMTP or logs mock email
   */
  async sendEmailAlert(data: CustomDesignEmailData): Promise<{ success: boolean; error?: string }> {
    const adminEmail = this.getAdminEmail();
    const { subject, html } = getNewCustomDesignEmailHtml(data);
    const provider = this.configService.get<string>('EMAIL_PROVIDER') || 'mock';

    if (this.mailTransporter && provider.toLowerCase() === 'smtp') {
      try {
        const fromAddress =
          this.configService.get<string>('SMTP_FROM') ||
          '"Aurum Jewels Atelier" <notifications@jewellery.com>';

        await this.mailTransporter.sendMail({
          from: fromAddress,
          to: adminEmail,
          subject,
          html,
        });

        this.logger.log(`[EMAIL ALERT] Sent real SMTP alert for ${data.requestId} to ${adminEmail}`);
        return { success: true };
      } catch (err: any) {
        this.logger.error(`[EMAIL ALERT ERROR] Failed sending to ${adminEmail}: ${err.message}`);
        return { success: false, error: err.message };
      }
    }

    // Mock Provider Logging
    this.logger.log(
      `\n======================================================\n` +
      `[MOCK EMAIL NOTIFICATION TO ADMIN]\n` +
      `To: ${adminEmail}\n` +
      `Subject: ${subject}\n` +
      `Request ID: ${data.requestId}\n` +
      `Customer: ${data.customerName} (${data.email}, ${data.phone})\n` +
      `Product/Category: ${data.productName}\n` +
      `Portal Link: ${data.adminPortalLink}\n` +
      `======================================================\n`
    );
    return { success: true };
  }

  /**
   * Sends WhatsApp alert via Meta Cloud API / Webhook or logs mock WhatsApp message
   */
  async sendWhatsAppAlert(data: CustomDesignWhatsAppData): Promise<{ success: boolean; error?: string }> {
    const adminPhone = this.getAdminWhatsApp();
    const message = getNewCustomDesignWhatsAppText(data);
    const provider = this.configService.get<string>('WHATSAPP_PROVIDER') || 'mock';
    const apiUrl = this.configService.get<string>('WHATSAPP_API_URL');
    const apiToken = this.configService.get<string>('WHATSAPP_TOKEN');

    if ((provider.toLowerCase() === 'meta' || provider.toLowerCase() === 'official') && apiUrl && apiToken) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiToken}`,
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: adminPhone.replace(/[^0-9]/g, ''),
            type: 'text',
            text: { body: message },
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`WhatsApp API responded with status ${response.status}: ${errText}`);
        }

        this.logger.log(`[WHATSAPP ALERT] Dispatched API message for ${data.requestId} to ${adminPhone}`);
        return { success: true };
      } catch (err: any) {
        this.logger.error(`[WHATSAPP ALERT ERROR] Failed sending to ${adminPhone}: ${err.message}`);
        return { success: false, error: err.message };
      }
    }

    // Mock Provider Logging
    this.logger.log(
      `\n======================================================\n` +
      `[MOCK WHATSAPP NOTIFICATION TO ADMIN]\n` +
      `To: ${adminPhone}\n` +
      message +
      `\n======================================================\n`
    );
    return { success: true };
  }

  /**
   * Primary orchestrator for Wholesale Product Image Submission Notifications:
   * Dispatches Email and WhatsApp alerts asynchronously.
   */
  async sendNewWholesaleSubmissionNotification(
    data: Omit<WholesaleSubmissionEmailData & WholesaleSubmissionWhatsAppData, 'adminPortalLink' | 'submittedAt'>,
  ): Promise<NotificationResult> {
    const adminLink = `${this.getAdminWebUrl()}/wholesale-submissions?id=${encodeURIComponent(data.submissionId)}`;
    const submittedAt = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const fullEmailData: WholesaleSubmissionEmailData = {
      ...data,
      adminPortalLink: adminLink,
      submittedAt,
    };

    const fullWhatsAppData: WholesaleSubmissionWhatsAppData = {
      ...data,
      adminPortalLink: adminLink,
    };

    const [emailRes, whatsappRes] = await Promise.allSettled([
      this.sendWholesaleEmailAlert(fullEmailData),
      this.sendWholesaleWhatsAppAlert(fullWhatsAppData),
    ]);

    const emailSent = emailRes.status === 'fulfilled' && emailRes.value.success;
    const emailError =
      emailRes.status === 'rejected'
        ? (emailRes.reason?.message || 'Email error')
        : emailRes.value?.error;

    const whatsappSent =
      whatsappRes.status === 'fulfilled' && whatsappRes.value.success;
    const whatsappError =
      whatsappRes.status === 'rejected'
        ? (whatsappRes.reason?.message || 'WhatsApp error')
        : whatsappRes.value?.error;

    const parts: string[] = [];
    parts.push(emailSent ? 'EMAIL_SENT' : 'EMAIL_FAILED');
    parts.push(whatsappSent ? 'WHATSAPP_SENT' : 'WHATSAPP_FAILED');
    const notificationStatus = parts.join(', ');

    return {
      emailSent,
      emailError,
      whatsappSent,
      whatsappError,
      notificationStatus,
    };
  }

  async sendWholesaleEmailAlert(data: WholesaleSubmissionEmailData): Promise<{ success: boolean; error?: string }> {
    const adminEmail = this.getAdminEmail();
    const { subject, html } = getNewWholesaleSubmissionEmailHtml(data);
    const provider = this.configService.get<string>('EMAIL_PROVIDER') || 'mock';

    if (this.mailTransporter && provider.toLowerCase() === 'smtp') {
      try {
        const fromAddress =
          this.configService.get<string>('SMTP_FROM') ||
          '"Aurum Jewels Atelier" <notifications@jewellery.com>';

        await this.mailTransporter.sendMail({
          from: fromAddress,
          to: adminEmail,
          subject,
          html,
        });

        this.logger.log(`SMTP Alert sent to ${adminEmail} for wholesale submission ${data.submissionId}`);
        return { success: true };
      } catch (err: any) {
        this.logger.error(`Failed to send wholesale SMTP alert: ${err.message}`);
        return { success: false, error: err.message };
      }
    }

    this.logger.log(`[MOCK EMAIL ALERT to ${adminEmail}] Subject: "${subject}" for ${data.submissionId}`);
    return { success: true };
  }

  async sendWholesaleWhatsAppAlert(data: WholesaleSubmissionWhatsAppData): Promise<{ success: boolean; error?: string }> {
    const adminPhone = this.getAdminWhatsApp();
    const message = getNewWholesaleSubmissionWhatsAppText(data);
    const provider = this.configService.get<string>('WHATSAPP_PROVIDER') || 'mock';

    if (provider.toLowerCase() === 'webhook') {
      const webhookUrl = this.configService.get<string>('WHATSAPP_WEBHOOK_URL');
      if (webhookUrl) {
        try {
          const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: adminPhone, text: message }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return { success: true };
        } catch (err: any) {
          this.logger.error(`Failed wholesale WhatsApp webhook: ${err.message}`);
          return { success: false, error: err.message };
        }
      }
    }

    this.logger.log(
      `\n======================================================\n` +
      `[MOCK WHATSAPP NOTIFICATION TO ADMIN - WHOLESALE SUBMISSION]\n` +
      `To: ${adminPhone}\n` +
      message +
      `\n======================================================\n`
    );
    return { success: true };
  }

  public getWholesaleWebUrl(): string {
    return (
      this.configService.get<string>('WHOLESALE_WEB_URL') ||
      'http://localhost:5175'
    );
  }

  /**
   * Dispatches Admin notification when a new Wholesale Registration application is submitted
   */
  async sendWholesaleRegistrationAlert(
    data: Omit<WholesaleRegistrationAdminEmailData, 'adminPortalLink' | 'submittedAt'>,
  ): Promise<NotificationResult> {
    const adminPortalLink = `${this.getAdminWebUrl()}/wholesale-partners?id=${encodeURIComponent(data.applicationId)}`;
    const submittedAt = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const fullData: WholesaleRegistrationAdminEmailData = {
      ...data,
      adminPortalLink,
      submittedAt,
    };

    const adminEmail = this.getAdminEmail();
    const adminPhone = this.getAdminWhatsApp();
    const { subject, html } = getWholesaleRegistrationAdminEmailHtml(fullData);
    const whatsappMsg = getWholesaleRegistrationAdminWhatsAppText(fullData);

    let emailSent = false;
    let emailError: string | undefined;
    let whatsappSent = false;
    let whatsappError: string | undefined;

    // Send Email
    try {
      if (this.mailTransporter && (this.configService.get<string>('EMAIL_PROVIDER') || '').toLowerCase() === 'smtp') {
        await this.mailTransporter.sendMail({
          from: this.configService.get<string>('SMTP_FROM') || '"Aurum Jewels" <notifications@jewellery.com>',
          to: adminEmail,
          subject,
          html,
        });
      } else {
        this.logger.log(`[MOCK EMAIL to Admin ${adminEmail}] Subject: "${subject}" for ${data.applicationId}`);
      }
      emailSent = true;
    } catch (err: any) {
      emailError = err.message;
      this.logger.error(`Failed to send wholesale reg email: ${err.message}`);
    }

    // Send WhatsApp
    try {
      this.logger.log(`[MOCK WHATSAPP to Admin ${adminPhone}]\n${whatsappMsg}`);
      whatsappSent = true;
    } catch (err: any) {
      whatsappError = err.message;
    }

    return {
      emailSent,
      emailError,
      whatsappSent,
      whatsappError,
      notificationStatus: `${emailSent ? 'EMAIL_SENT' : 'EMAIL_FAILED'}, ${whatsappSent ? 'WHATSAPP_SENT' : 'WHATSAPP_FAILED'}`,
    };
  }

  /**
   * Dispatches notification to Wholesale Partner when application is APPROVED
   */
  async sendWholesaleApprovalNotification(
    data: Omit<WholesaleApprovalEmailData, 'portalLoginUrl'>,
  ): Promise<NotificationResult> {
    const portalLoginUrl = `${this.getWholesaleWebUrl()}/login`;
    const fullData: WholesaleApprovalEmailData = { ...data, portalLoginUrl };

    const { subject, html } = getWholesaleApprovalEmailHtml(fullData);
    const whatsappMsg = getWholesaleApprovalWhatsAppText(fullData);

    let emailSent = false;
    let emailError: string | undefined;
    let whatsappSent = false;
    let whatsappError: string | undefined;

    try {
      if (this.mailTransporter && (this.configService.get<string>('EMAIL_PROVIDER') || '').toLowerCase() === 'smtp') {
        await this.mailTransporter.sendMail({
          from: this.configService.get<string>('SMTP_FROM') || '"Aurum Jewels" <notifications@jewellery.com>',
          to: data.email,
          subject,
          html,
        });
      } else {
        this.logger.log(`[MOCK EMAIL to Partner ${data.email}] Subject: "${subject}" for ${data.applicationId}`);
      }
      emailSent = true;
    } catch (err: any) {
      emailError = err.message;
      this.logger.error(`Failed sending approval email: ${err.message}`);
    }

    try {
      this.logger.log(`[MOCK WHATSAPP to Partner]\n${whatsappMsg}`);
      whatsappSent = true;
    } catch (err: any) {
      whatsappError = err.message;
    }

    return {
      emailSent,
      emailError,
      whatsappSent,
      whatsappError,
      notificationStatus: `${emailSent ? 'EMAIL_SENT' : 'EMAIL_FAILED'}, ${whatsappSent ? 'WHATSAPP_SENT' : 'WHATSAPP_FAILED'}`,
    };
  }

  /**
   * Dispatches notification to Wholesale Partner when application is REJECTED
   */
  async sendWholesaleRejectionNotification(
    data: Omit<WholesaleRejectionEmailData, 'portalResubmitUrl'>,
    targetEmail: string,
  ): Promise<NotificationResult> {
    const portalResubmitUrl = `${this.getWholesaleWebUrl()}/login?resubmit=${encodeURIComponent(data.applicationId)}`;
    const fullData: WholesaleRejectionEmailData = { ...data, portalResubmitUrl };

    const { subject, html } = getWholesaleRejectionEmailHtml(fullData);
    const whatsappMsg = getWholesaleRejectionWhatsAppText(fullData);

    let emailSent = false;
    let emailError: string | undefined;
    let whatsappSent = false;
    let whatsappError: string | undefined;

    try {
      if (this.mailTransporter && (this.configService.get<string>('EMAIL_PROVIDER') || '').toLowerCase() === 'smtp') {
        await this.mailTransporter.sendMail({
          from: this.configService.get<string>('SMTP_FROM') || '"Aurum Jewels" <notifications@jewellery.com>',
          to: targetEmail,
          subject,
          html,
        });
      } else {
        this.logger.log(`[MOCK EMAIL to Partner ${targetEmail}] Subject: "${subject}" for ${data.applicationId}`);
      }
      emailSent = true;
    } catch (err: any) {
      emailError = err.message;
      this.logger.error(`Failed sending rejection email: ${err.message}`);
    }

    try {
      this.logger.log(`[MOCK WHATSAPP to Partner]\n${whatsappMsg}`);
      whatsappSent = true;
    } catch (err: any) {
      whatsappError = err.message;
    }

    return {
      emailSent,
      emailError,
      whatsappSent,
      whatsappError,
      notificationStatus: `${emailSent ? 'EMAIL_SENT' : 'EMAIL_FAILED'}, ${whatsappSent ? 'WHATSAPP_SENT' : 'WHATSAPP_FAILED'}`,
    };
  }
}
