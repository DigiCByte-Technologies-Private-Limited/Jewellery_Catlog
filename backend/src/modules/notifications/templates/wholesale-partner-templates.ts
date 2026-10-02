export interface WholesaleRegistrationAdminEmailData {
  applicationId: string;
  companyName: string;
  ownerName: string;
  email: string;
  phone: string;
  whatsappNumber?: string | null;
  city?: string | null;
  state?: string | null;
  panNumber?: string | null;
  gstNumber?: string | null;
  documentCount: number;
  submittedAt: string;
  adminPortalLink: string;
}

export function getWholesaleRegistrationAdminEmailHtml(data: WholesaleRegistrationAdminEmailData): { subject: string; html: string } {
  const subject = `New Wholesale Partner Registration — ${data.applicationId} — ${data.companyName}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #1c1917 0%, #292524 100%); padding: 32px 28px; text-align: center; color: #ffffff; }
    .brand { font-size: 13px; letter-spacing: 0.25em; text-transform: uppercase; color: #d4af37; font-weight: 600; margin-bottom: 8px; }
    .title { font-size: 22px; font-weight: 700; margin: 0; letter-spacing: -0.02em; }
    .badge { display: inline-block; margin-top: 12px; padding: 4px 14px; background: rgba(212, 175, 55, 0.15); border: 1px solid #d4af37; color: #f59e0b; border-radius: 9999px; font-size: 13px; font-weight: 600; letter-spacing: 0.05em; }
    .content { padding: 32px 28px; }
    .security-notice { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #1e40af; margin-bottom: 24px; }
    .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }
    .info-grid { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .info-grid td { padding: 8px 0; vertical-align: top; font-size: 14px; line-height: 1.5; }
    .info-label { width: 38%; color: #64748b; font-weight: 500; }
    .info-value { width: 62%; color: #0f172a; font-weight: 600; }
    .btn-container { text-align: center; margin: 32px 0 16px; }
    .btn { display: inline-block; background: #1c1917; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: 600; letter-spacing: 0.05em; border: 1px solid #d4af37; }
    .footer { background: #f8fafc; padding: 20px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="brand">AURUM JEWELS &bull; COMPLIANCE & PARTNER DESK</div>
      <h1 class="title">New Wholesale Registration</h1>
      <div class="badge">${data.applicationId}</div>
    </div>
    <div class="content">
      <div class="security-notice">
        🛡️ <strong>Pending Admin Verification:</strong> This wholesale partner account is inactive. Review submitted KYC documents in the Admin Portal to approve or reject wholesale privileges.
      </div>

      <div class="section-title">Business & Firm Details</div>
      <table class="info-grid">
        <tr>
          <td class="info-label">Firm / Business Name:</td>
          <td class="info-value">${data.companyName}</td>
        </tr>
        <tr>
          <td class="info-label">Location:</td>
          <td class="info-value">${data.city || 'N/A'}, ${data.state || 'N/A'}</td>
        </tr>
        ${data.gstNumber ? `<tr><td class="info-label">GST Number:</td><td class="info-value">${data.gstNumber}</td></tr>` : ''}
        ${data.panNumber ? `<tr><td class="info-label">PAN Number:</td><td class="info-value">${data.panNumber}</td></tr>` : ''}
      </table>

      <div class="section-title">Shop Owner Information</div>
      <table class="info-grid">
        <tr>
          <td class="info-label">Owner Name:</td>
          <td class="info-value">${data.ownerName}</td>
        </tr>
        <tr>
          <td class="info-label">Email:</td>
          <td class="info-value"><a href="mailto:${data.email}" style="color: #0284c7; text-decoration: none;">${data.email}</a></td>
        </tr>
        <tr>
          <td class="info-label">Phone:</td>
          <td class="info-value">${data.phone}</td>
        </tr>
        ${data.whatsappNumber ? `<tr><td class="info-label">WhatsApp:</td><td class="info-value">${data.whatsappNumber}</td></tr>` : ''}
        <tr>
          <td class="info-label">KYC Documents Uploaded:</td>
          <td class="info-value">${data.documentCount} document file(s)</td>
        </tr>
        <tr>
          <td class="info-label">Submitted At:</td>
          <td class="info-value">${data.submittedAt}</td>
        </tr>
      </table>

      <div class="btn-container">
        <a href="${data.adminPortalLink}" class="btn" target="_blank">Review Application in Admin Portal &rarr;</a>
      </div>
    </div>
    <div class="footer">
      Aurum Jewels Central Enterprise System &bull; Partner Verification System
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

export interface WholesaleApprovalEmailData {
  applicationId: string;
  companyName: string;
  ownerName: string;
  email: string;
  portalLoginUrl: string;
}

export function getWholesaleApprovalEmailHtml(data: WholesaleApprovalEmailData): { subject: string; html: string } {
  const subject = `Welcome to Aurum Jewels Wholesale — Your Account Has Been Approved!`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #1c1917 0%, #292524 100%); padding: 36px 28px; text-align: center; color: #ffffff; }
    .brand { font-size: 13px; letter-spacing: 0.25em; text-transform: uppercase; color: #d4af37; font-weight: 600; margin-bottom: 8px; }
    .title { font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.02em; }
    .badge { display: inline-block; margin-top: 12px; padding: 4px 14px; background: rgba(34, 197, 94, 0.15); border: 1px solid #22c55e; color: #22c55e; border-radius: 9999px; font-size: 13px; font-weight: 600; }
    .content { padding: 32px 28px; }
    .highlight-box { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; border-radius: 0 8px 8px 0; margin: 16px 0; font-size: 14px; color: #166534; line-height: 1.6; }
    .btn-container { text-align: center; margin: 32px 0 16px; }
    .btn { display: inline-block; background: #1c1917; color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 14px; font-weight: 600; letter-spacing: 0.05em; border: 1px solid #d4af37; }
    .footer { background: #f8fafc; padding: 20px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="brand">AURUM JEWELS &bull; WHOLESALE DESK</div>
      <h1 class="title">Wholesale Account Approved</h1>
      <div class="badge">ACTIVE PARTNER</div>
    </div>
    <div class="content">
      <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0;">
        Dear <strong>${data.ownerName}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        We are pleased to inform you that your wholesale registration application (<strong>${data.applicationId}</strong>) for <strong>${data.companyName}</strong> has been successfully verified and approved by the Aurum Jewels compliance team.
      </p>

      <div class="highlight-box">
        🎉 <strong>Your Wholesale Access is Now Active:</strong> You can now log in using your registered email (<strong>${data.email}</strong>) and password to access the Wholesale Catalog, propose product designs, and collaborate on wholesale orders.
      </div>

      <div class="btn-container">
        <a href="${data.portalLoginUrl}" class="btn" target="_blank">Sign in to Wholesale Portal &rarr;</a>
      </div>

      <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin-top: 24px;">
        For your security, we will never ask for your password via email or telephone. If you have any inquiries, contact our partner concierge desk.
      </p>
    </div>
    <div class="footer">
      Aurum Jewels Private Atelier &bull; Dedicated Wholesale Services
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

export interface WholesaleRejectionEmailData {
  applicationId: string;
  companyName: string;
  ownerName: string;
  rejectionReason: string;
  portalResubmitUrl: string;
}

export function getWholesaleRejectionEmailHtml(data: WholesaleRejectionEmailData): { subject: string; html: string } {
  const subject = `Update Regarding Your Wholesale Application — ${data.applicationId}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #1c1917 0%, #292524 100%); padding: 36px 28px; text-align: center; color: #ffffff; }
    .brand { font-size: 13px; letter-spacing: 0.25em; text-transform: uppercase; color: #d4af37; font-weight: 600; margin-bottom: 8px; }
    .title { font-size: 22px; font-weight: 700; margin: 0; letter-spacing: -0.02em; }
    .badge { display: inline-block; margin-top: 12px; padding: 4px 14px; background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #ef4444; border-radius: 9999px; font-size: 13px; font-weight: 600; }
    .content { padding: 32px 28px; }
    .reason-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 0 8px 8px 0; margin: 16px 0; font-size: 14px; color: #991b1b; line-height: 1.6; }
    .btn-container { text-align: center; margin: 32px 0 16px; }
    .btn { display: inline-block; background: #1c1917; color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 14px; font-weight: 600; letter-spacing: 0.05em; border: 1px solid #d4af37; }
    .footer { background: #f8fafc; padding: 20px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="brand">AURUM JEWELS &bull; WHOLESALE DESK</div>
      <h1 class="title">Wholesale Application Status</h1>
      <div class="badge">REQUIRES REVISION</div>
    </div>
    <div class="content">
      <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0;">
        Dear <strong>${data.ownerName}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        Thank you for your interest in partnering with Aurum Jewels. Following compliance review of your wholesale application (<strong>${data.applicationId}</strong>) for <strong>${data.companyName}</strong>, we require further clarification or updated documentation.
      </p>

      <div class="reason-box">
        <strong>Reviewer Feedback / Reason for Rejection:</strong><br/>
        ${data.rejectionReason}
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        You do not need to create a new account. You can log in and update your details or re-upload the requested documents to resubmit your application for verification.
      </p>

      <div class="btn-container">
        <a href="${data.portalResubmitUrl}" class="btn" target="_blank">Review & Resubmit Application &rarr;</a>
      </div>
    </div>
    <div class="footer">
      Aurum Jewels Central Enterprise System &bull; Partner Verification System
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

// ─── WhatsApp Text Templates ───────────────────────────────────────────────

export function getWholesaleRegistrationAdminWhatsAppText(data: WholesaleRegistrationAdminEmailData): string {
  const whatsappLine = data.whatsappNumber ? `📱 *WhatsApp:* ${data.whatsappNumber}\n` : '';
  const panLine = data.panNumber ? `📄 *PAN:* ${data.panNumber}\n` : '';
  const gstLine = data.gstNumber ? `🏛️ *GST:* ${data.gstNumber}\n` : '';

  return (
    `🛡️ *NEW WHOLESALE PARTNER REGISTRATION*\n` +
    `----------------------------------------\n` +
    `📋 *App ID:* ${data.applicationId}\n` +
    `🏢 *Firm:* ${data.companyName}\n` +
    `👤 *Owner:* ${data.ownerName}\n` +
    `📞 *Phone:* ${data.phone}\n` +
    whatsappLine +
    `✉️ *Email:* ${data.email}\n` +
    panLine +
    gstLine +
    `📁 *KYC Documents:* ${data.documentCount} file(s)\n` +
    `----------------------------------------\n` +
    `Account is pending review. Wholesale access is currently locked.\n\n` +
    `👉 *Review & Verify in Admin Portal:*\n${data.adminPortalLink}`
  );
}

export function getWholesaleApprovalWhatsAppText(data: WholesaleApprovalEmailData): string {
  return (
    `🎉 *AURUM JEWELS — WHOLESALE APPROVED*\n` +
    `----------------------------------------\n` +
    `Dear ${data.ownerName},\n\n` +
    `Your wholesale partner application (*${data.applicationId}*) for *${data.companyName}* has been *APPROVED*!\n\n` +
    `Your wholesale privileges are now active. You may log in with your registered email and password.\n\n` +
    `👉 *Sign in here:*\n${data.portalLoginUrl}`
  );
}

export function getWholesaleRejectionWhatsAppText(data: WholesaleRejectionEmailData): string {
  return (
    `⚠️ *AURUM JEWELS — WHOLESALE APPLICATION UPDATE*\n` +
    `----------------------------------------\n` +
    `Dear ${data.ownerName},\n\n` +
    `Your wholesale application (*${data.applicationId}*) for *${data.companyName}* requires revision.\n\n` +
    `*Feedback:* ${data.rejectionReason}\n\n` +
    `You can log in to update your information and re-upload documents:\n` +
    `👉 *Resubmit Application:*\n${data.portalResubmitUrl}`
  );
}
