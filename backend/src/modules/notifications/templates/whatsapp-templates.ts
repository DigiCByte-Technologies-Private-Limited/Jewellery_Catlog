export interface CustomDesignWhatsAppData {
  requestId: string;
  customerName: string;
  companyName?: string | null;
  phone: string;
  email: string;
  productName: string;
  quantity?: string | null;
  materialRequirements?: string | null;
  designDescription: string;
  adminPortalLink: string;
}

export function getNewCustomDesignWhatsAppText(data: CustomDesignWhatsAppData): string {
  const companyLine = data.companyName ? `🏢 *Company:* ${data.companyName}\n` : '';
  const materialLine = data.materialRequirements ? `🛠️ *Materials:* ${data.materialRequirements}\n` : '';
  const quantityLine = data.quantity ? `🔢 *Quantity:* ${data.quantity}\n` : '';

  return (
    `💎 *NEW CUSTOM DESIGN REQUEST*\n` +
    `----------------------------------------\n` +
    `📋 *Request ID:* ${data.requestId}\n` +
    `👤 *Customer:* ${data.customerName}\n` +
    companyLine +
    `📞 *Phone:* ${data.phone}\n` +
    `✉️ *Email:* ${data.email}\n` +
    `💍 *Product / Category:* ${data.productName}\n` +
    quantityLine +
    materialLine +
    `📝 *Description:* ${data.designDescription.length > 200 ? data.designDescription.substring(0, 197) + '...' : data.designDescription}\n` +
    `----------------------------------------\n` +
    `A new bespoke custom design request has been submitted.\n\n` +
    `👉 *Review in Admin Portal:*\n${data.adminPortalLink}`
  );
}

export interface WholesaleSubmissionWhatsAppData {
  submissionId: string;
  customerName: string;
  companyName: string;
  phone: string;
  email: string;
  productName: string;
  productCategory?: string | null;
  wholesaleQuantity?: string | null;
  imageCount: number;
  adminPortalLink: string;
}

export function getNewWholesaleSubmissionWhatsAppText(data: WholesaleSubmissionWhatsAppData): string {
  const categoryLine = data.productCategory ? `🏷️ *Category:* ${data.productCategory}\n` : '';
  const qtyLine = data.wholesaleQuantity ? `📦 *Quantity / MOQ:* ${data.wholesaleQuantity}\n` : '';

  return (
    `🔔 *NEW WHOLESALE PRODUCT SUBMISSION*\n` +
    `----------------------------------------\n` +
    `📋 *Submission ID:* ${data.submissionId}\n` +
    `🏢 *Company:* ${data.companyName}\n` +
    `👤 *Wholesale Partner:* ${data.customerName}\n` +
    `📞 *Phone:* ${data.phone}\n` +
    `✉️ *Email:* ${data.email}\n` +
    `💍 *Product:* ${data.productName}\n` +
    categoryLine +
    qtyLine +
    `🖼️ *Submitted Images:* ${data.imageCount} proposal file(s)\n` +
    `----------------------------------------\n` +
    `A wholesale client has submitted product details & images for Admin review.\n` +
    `*Note:* Proposed images remain unassigned until Admin approves and publishes to the official catalog.\n\n` +
    `👉 *Review & Download in Admin Portal:*\n${data.adminPortalLink}`
  );
}


export interface ProductInquiryWhatsAppData {
  requestId: string;
  customerName: string;
  phone: string;
  email?: string | null;
  city?: string | null;
  productName: string;
  preferredContactMethod?: string | null;
  message?: string | null;
  adminPortalLink: string;
}

export function getNewProductInquiryWhatsAppText(data: ProductInquiryWhatsAppData): string {
  const emailLine = data.email ? `✉️ *Email:* ${data.email}\n` : '';
  const cityLine = data.city ? `🏛️ *Showroom / City:* ${data.city}\n` : '';
  const notesLine = data.message ? `📝 *Notes:* ${data.message.length > 200 ? data.message.substring(0, 197) + '...' : data.message}\n` : '';

  return (
    `💬 *NEW WHATSAPP PRODUCT EVALUATION INQUIRY*\n` +
    `----------------------------------------\n` +
    `📋 *Inquiry ID:* ${data.requestId}\n` +
    `👤 *Patron:* ${data.customerName}\n` +
    `📞 *WhatsApp:* ${data.phone}\n` +
    emailLine +
    cityLine +
    `💍 *Creation:* ${data.productName}\n` +
    `📲 *Channel:* ${data.preferredContactMethod || 'WHATSAPP'}\n` +
    notesLine +
    `----------------------------------------\n` +
    `A patron has registered this piece for WhatsApp evaluation.\n\n` +
    `👉 *Review & Manage in Admin Portal:*\n${data.adminPortalLink}`
  );
}
