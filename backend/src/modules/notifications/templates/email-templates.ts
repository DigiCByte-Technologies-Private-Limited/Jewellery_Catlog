export interface CustomDesignEmailData {
  requestId: string;
  customerName: string;
  companyName?: string | null;
  email: string;
  phone: string;
  productName: string;
  designDescription: string;
  designRequirements?: string | null;
  quantity?: string | null;
  materialRequirements?: string | null;
  dimensions?: string | null;
  additionalNotes?: string | null;
  preferredContactMethod?: string;
  submittedAt: string;
  adminPortalLink: string;
}

export function getNewCustomDesignEmailHtml(data: CustomDesignEmailData): { subject: string; html: string } {
  const subject = `New Custom Design Request — ${data.requestId}`;

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
    .brand { font-size: 14px; letter-spacing: 0.25em; text-transform: uppercase; color: #d4af37; font-weight: 600; margin-bottom: 8px; }
    .title { font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.02em; }
    .badge { display: inline-block; margin-top: 12px; padding: 4px 14px; background: rgba(212, 175, 55, 0.15); border: 1px solid #d4af37; color: #f59e0b; border-radius: 9999px; font-size: 13px; font-weight: 600; letter-spacing: 0.05em; }
    .content { padding: 32px 28px; }
    .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }
    .info-grid { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    .info-grid td { padding: 8px 0; vertical-align: top; font-size: 14px; line-height: 1.5; }
    .info-label { width: 36%; color: #64748b; font-weight: 500; }
    .info-value { width: 64%; color: #0f172a; font-weight: 600; }
    .box-highlight { background: #f8fafc; border-left: 4px solid #d4af37; padding: 14px 16px; border-radius: 0 8px 8px 0; margin: 16px 0; font-size: 14px; line-height: 1.6; color: #334155; }
    .btn-container { text-align: center; margin: 32px 0 16px; }
    .btn { display: inline-block; background: #1c1917; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: 600; letter-spacing: 0.05em; transition: all 0.2s ease; border: 1px solid #d4af37; }
    .footer { background: #f8fafc; padding: 20px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="brand">AURUM JEWELS &bull; BESPOKE ATELIER</div>
      <h1 class="title">New Custom Design Request</h1>
      <div class="badge">${data.requestId}</div>
    </div>
    <div class="content">
      <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-top: 0;">
        A new bespoke custom design request has been submitted by a customer. Please review the design specifications in the Admin Portal.
      </p>

      <div class="section-title">Customer Contact Details</div>
      <table class="info-grid">
        <tr>
          <td class="info-label">Customer Name:</td>
          <td class="info-value">${data.customerName}</td>
        </tr>
        ${data.companyName ? `
        <tr>
          <td class="info-label">Company:</td>
          <td class="info-value">${data.companyName}</td>
        </tr>` : ''}
        <tr>
          <td class="info-label">Email:</td>
          <td class="info-value"><a href="mailto:${data.email}" style="color: #2563eb; text-decoration: none;">${data.email}</a></td>
        </tr>
        <tr>
          <td class="info-label">Phone / WhatsApp:</td>
          <td class="info-value"><a href="tel:${data.phone}" style="color: #0f172a; text-decoration: none;">${data.phone}</a></td>
        </tr>
        <tr>
          <td class="info-label">Preferred Contact:</td>
          <td class="info-value">${data.preferredContactMethod || 'EMAIL'}</td>
        </tr>
      </table>

      <div class="section-title">Design &amp; Material Specifications</div>
      <table class="info-grid">
        <tr>
          <td class="info-label">Product / Category:</td>
          <td class="info-value">${data.productName}</td>
        </tr>
        <tr>
          <td class="info-label">Quantity:</td>
          <td class="info-value">${data.quantity || '1 unit'}</td>
        </tr>
        ${data.materialRequirements ? `
        <tr>
          <td class="info-label">Precious Metal / Gems:</td>
          <td class="info-value">${data.materialRequirements}</td>
        </tr>` : ''}
        ${data.dimensions ? `
        <tr>
          <td class="info-label">Dimensions / Ring Size:</td>
          <td class="info-value">${data.dimensions}</td>
        </tr>` : ''}
        <tr>
          <td class="info-label">Submitted On:</td>
          <td class="info-value">${data.submittedAt}</td>
        </tr>
      </table>

      <div class="section-title">Custom Design Description</div>
      <div class="box-highlight">
        ${data.designDescription}
      </div>

      ${data.designRequirements ? `
      <div class="section-title">Technical Requirements</div>
      <div class="box-highlight" style="border-left-color: #64748b;">
        ${data.designRequirements}
      </div>` : ''}

      ${data.additionalNotes ? `
      <div class="section-title">Additional Notes</div>
      <p style="font-size: 14px; color: #475569; margin: 8px 0;">${data.additionalNotes}</p>
      ` : ''}

      <div class="btn-container">
        <a href="${data.adminPortalLink}" class="btn" target="_blank">View Request in Admin Portal &rarr;</a>
      </div>

      <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 16px;">
        <em>Note: Design attachments and CAD blueprints are securely held inside the Admin Portal.</em>
      </p>
    </div>
    <div class="footer">
      Aurum Jewels Central Enterprise System &bull; Automated Admin Alert
    </div>
  </div>
 </body>
 </html>
   `;

   return { subject, html };
 }

 export interface WholesaleSubmissionEmailData {
   submissionId: string;
   customerName: string;
   companyName: string;
   email: string;
   phone: string;
   productName: string;
   productCategory?: string | null;
   productSku?: string | null;
   productDescription?: string | null;
   productSpecifications?: string | null;
   dimensions?: string | null;
   colorOrVariant?: string | null;
   wholesaleQuantity?: string | null;
   additionalNotes?: string | null;
   imageCount: number;
   submittedAt: string;
   adminPortalLink: string;
 }

 export function getNewWholesaleSubmissionEmailHtml(data: WholesaleSubmissionEmailData): { subject: string; html: string } {
   const subject = `New Wholesale Product Image Submission — ${data.submissionId}`;

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
     .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 28px; text-align: center; color: #ffffff; }
     .brand { font-size: 13px; letter-spacing: 0.25em; text-transform: uppercase; color: #38bdf8; font-weight: 600; margin-bottom: 8px; }
     .title { font-size: 22px; font-weight: 700; margin: 0; letter-spacing: -0.02em; }
     .badge { display: inline-block; margin-top: 12px; padding: 4px 14px; background: rgba(56, 189, 248, 0.15); border: 1px solid #38bdf8; color: #38bdf8; border-radius: 9999px; font-size: 13px; font-weight: 600; letter-spacing: 0.05em; }
     .content { padding: 32px 28px; }
     .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }
     .info-grid { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
     .info-grid td { padding: 8px 0; vertical-align: top; font-size: 14px; line-height: 1.5; }
     .info-label { width: 36%; color: #64748b; font-weight: 500; }
     .info-value { width: 64%; color: #0f172a; font-weight: 600; }
     .box-highlight { background: #f8fafc; border-left: 4px solid #38bdf8; padding: 14px 16px; border-radius: 0 8px 8px 0; margin: 16px 0; font-size: 14px; line-height: 1.6; color: #334155; }
     .btn-container { text-align: center; margin: 32px 0 16px; }
     .btn { display: inline-block; background: #0f172a; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: 600; letter-spacing: 0.05em; transition: all 0.2s ease; border: 1px solid #38bdf8; }
     .footer { background: #f8fafc; padding: 20px 28px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
     .security-notice { background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px 16px; margin: 20px 0; font-size: 13px; color: #92400e; }
   </style>
 </head>
 <body>
   <div class="card">
     <div class="header">
       <div class="brand">AURUM JEWELS &bull; WHOLESALE B2B ATELIER</div>
       <h1 class="title">Wholesale Product Image Submission</h1>
       <div class="badge">${data.submissionId}</div>
     </div>
     <div class="content">
       <div class="security-notice">
         🔒 <strong>Admin Review Protocol:</strong> This submitted image is a <strong>proposal only</strong> and has NOT been added to the public product catalog. You must review, download, and explicitly approve the file before it is published.
       </div>

       <div class="section-title">Wholesale Partner Information</div>
       <table class="info-grid">
         <tr>
           <td class="info-label">Company Name:</td>
           <td class="info-value">${data.companyName}</td>
         </tr>
         <tr>
           <td class="info-label">Contact Person:</td>
           <td class="info-value">${data.customerName}</td>
         </tr>
         <tr>
           <td class="info-label">Email:</td>
           <td class="info-value"><a href="mailto:${data.email}" style="color: #0284c7; text-decoration: none;">${data.email}</a></td>
         </tr>
         <tr>
           <td class="info-label">Phone:</td>
           <td class="info-value">${data.phone}</td>
         </tr>
         <tr>
           <td class="info-label">Submission Date:</td>
           <td class="info-value">${data.submittedAt}</td>
         </tr>
       </table>

       <div class="section-title">Proposed Product Information</div>
       <table class="info-grid">
         <tr>
           <td class="info-label">Product Name:</td>
           <td class="info-value">${data.productName}</td>
         </tr>
         ${data.productCategory ? `<tr><td class="info-label">Category:</td><td class="info-value">${data.productCategory}</td></tr>` : ''}
         ${data.productSku ? `<tr><td class="info-label">Target SKU:</td><td class="info-value">${data.productSku}</td></tr>` : ''}
         ${data.wholesaleQuantity ? `<tr><td class="info-label">Order Quantity / MOQ:</td><td class="info-value">${data.wholesaleQuantity}</td></tr>` : ''}
         ${data.dimensions ? `<tr><td class="info-label">Dimensions / Sizing:</td><td class="info-value">${data.dimensions}</td></tr>` : ''}
         ${data.colorOrVariant ? `<tr><td class="info-label">Color / Variant:</td><td class="info-value">${data.colorOrVariant}</td></tr>` : ''}
         <tr>
           <td class="info-label">Proposed Images:</td>
           <td class="info-value">${data.imageCount} high-resolution image file(s)</td>
         </tr>
       </table>

       ${data.productDescription ? `
       <div class="section-title">Product Description</div>
       <div class="box-highlight">
         ${data.productDescription}
       </div>` : ''}

       ${data.productSpecifications ? `
       <div class="section-title">Technical Specifications</div>
       <div class="box-highlight" style="border-left-color: #64748b;">
         ${data.productSpecifications}
       </div>` : ''}

       ${data.additionalNotes ? `
       <div class="section-title">Additional Wholesale Notes</div>
       <p style="font-size: 14px; color: #475569; margin: 8px 0;">${data.additionalNotes}</p>
       ` : ''}

       <div class="btn-container">
         <a href="${data.adminPortalLink}" class="btn" target="_blank">Review Submission in Admin Portal &rarr;</a>
       </div>

       <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 16px;">
         <em>Images can be inspected, downloaded in original quality, and published from the Admin Portal.</em>
       </p>
     </div>
     <div class="footer">
       Aurum Jewels Central Enterprise System &bull; Wholesale Image Review Pipeline
     </div>
   </div>
 </body>
 </html>
   `;

   return { subject, html };
 }
