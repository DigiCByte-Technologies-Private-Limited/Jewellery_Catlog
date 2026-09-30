export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  STORE_MANAGER = 'STORE_MANAGER',
  CATALOG_MANAGER = 'CATALOG_MANAGER',
  PRICING_MANAGER = 'PRICING_MANAGER',
  INVENTORY_MANAGER = 'INVENTORY_MANAGER',
  SALES_STAFF = 'SALES_STAFF',
  MARKETING = 'MARKETING',
  ACCOUNTANT = 'ACCOUNTANT',
  AUDITOR = 'AUDITOR',
}

export enum MetalType {
  GOLD = 'GOLD',
  SILVER = 'SILVER',
  PLATINUM = 'PLATINUM',
}

export enum MetalPurity {
  K24 = 'K24',
  K22 = 'K22',
  K18 = 'K18',
  K14 = 'K14',
  SILVER_999 = 'SILVER_999',
  SILVER_925 = 'SILVER_925',
  PLATINUM_950 = 'PLATINUM_950',
}

export enum MetalColor {
  YELLOW = 'YELLOW',
  ROSE = 'ROSE',
  WHITE = 'WHITE',
  TWO_TONE = 'TWO_TONE',
}

export enum MetalFinish {
  POLISHED = 'POLISHED',
  MATTE = 'MATTE',
  SATIN = 'SATIN',
  ANTIQUE = 'ANTIQUE',
  BRUSHED = 'BRUSHED',
  RHODIUM = 'RHODIUM',
}

export enum ProductStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}

export enum MakingChargeType {
  FLAT = 'FLAT',
  PER_GRAM = 'PER_GRAM',
  PERCENTAGE = 'PERCENTAGE',
}

export enum PricingMode {
  DYNAMIC = 'DYNAMIC',
  FIXED = 'FIXED',
}

export enum StoneType {
  DIAMOND = 'DIAMOND',
  RUBY = 'RUBY',
  EMERALD = 'EMERALD',
  SAPPHIRE = 'SAPPHIRE',
  PEARL = 'PEARL',
  POLKI = 'POLKI',
  CZ = 'CZ',
  SEMI_PRECIOUS = 'SEMI_PRECIOUS',
  CUSTOM = 'CUSTOM',
}

export enum StoneUnit {
  CARATS = 'CARATS',
  CENTS = 'CENTS',
}

export enum DiamondCut {
  ROUND_BRILLIANT = 'ROUND_BRILLIANT',
  PRINCESS = 'PRINCESS',
  MARQUISE = 'MARQUISE',
  OVAL = 'OVAL',
  PEAR = 'PEAR',
  CUSHION = 'CUSHION',
  EMERALD_CUT = 'EMERALD_CUT',
  ASSCHER = 'ASSCHER',
  RADIANT = 'RADIANT',
  HEART = 'HEART',
  TRILLION = 'TRILLION',
}

export enum DiamondClarity {
  FL = 'FL',
  IF = 'IF',
  VVS1 = 'VVS1',
  VVS2 = 'VVS2',
  VS1 = 'VS1',
  VS2 = 'VS2',
  SI1 = 'SI1',
  SI2 = 'SI2',
  I1 = 'I1',
}

export enum DiamondColor {
  D = 'D',
  E = 'E',
  F = 'F',
  G = 'G',
  H = 'H',
  I = 'I',
  J = 'J',
  K_Z = 'K_Z',
}

export enum CertificateAuthority {
  IGI = 'IGI',
  GIA = 'GIA',
  SGL = 'SGL',
  HRD = 'HRD',
  AGS = 'AGS',
  BIS = 'BIS',
  NONE = 'NONE',
}

export enum CategoryAudience {
  WOMEN = 'WOMEN',
  MEN = 'MEN',
  KIDS = 'KIDS',
  UNISEX = 'UNISEX',
}

export enum Occasion {
  DAILY_WEAR = 'DAILY_WEAR',
  BRIDAL = 'BRIDAL',
  FESTIVE = 'FESTIVE',
  OFFICE = 'OFFICE',
  TEMPLE = 'TEMPLE',
  ANTIQUE = 'ANTIQUE',
  GIFT = 'GIFT',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum ApprovalType {
  METAL_RATE_CHANGE = 'METAL_RATE_CHANGE',
  PRODUCT_PUBLISH = 'PRODUCT_PUBLISH',
  PRICE_OVERRIDE = 'PRICE_OVERRIDE',
  STOCK_ADJUSTMENT = 'STOCK_ADJUSTMENT',
}

export enum InventoryMovementType {
  STOCK_IN = 'STOCK_IN',
  STOCK_OUT = 'STOCK_OUT',
  TRANSFER = 'TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT',
  MEMO_ISSUE = 'MEMO_ISSUE',
  MEMO_RETURN = 'MEMO_RETURN',
  BOOKING_RESERVE = 'BOOKING_RESERVE',
  BOOKING_RELEASE = 'BOOKING_RELEASE',
  SALE = 'SALE',
  RETURN = 'RETURN',
}

export enum ItemTagStatus {
  IN_STOCK = 'IN_STOCK',
  ON_MEMO = 'ON_MEMO',
  BOOKED = 'BOOKED',
  SOLD = 'SOLD',
  LOST = 'LOST',
  RETURNED = 'RETURNED',
  WITH_KARIGAR = 'WITH_KARIGAR',
}

export enum LocationType {
  SHOWROOM = 'SHOWROOM',
  VAULT = 'VAULT',
  WAREHOUSE = 'WAREHOUSE',
  KARIGAR = 'KARIGAR',
}

export enum BookingStatus {
  CONFIRMED = 'CONFIRMED',
  IN_MAKING = 'IN_MAKING',
  READY = 'READY',
  SETTLED = 'SETTLED',
  CANCELLED = 'CANCELLED',
}

export enum KarigarOrderStatus {
  ISSUED = 'ISSUED',
  IN_PROGRESS = 'IN_PROGRESS',
  RECEIVED = 'RECEIVED',
  RECONCILED = 'RECONCILED',
  CANCELLED = 'CANCELLED',
}

export enum OldGoldStatus {
  ASSESSED = 'ASSESSED',
  ACCEPTED = 'ACCEPTED',
  MELTED = 'MELTED',
  REJECTED = 'REJECTED',
}

export enum OldGoldPaymentMode {
  EXCHANGE_CREDIT = 'EXCHANGE_CREDIT',
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum EnquiryStage {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  VISITED = 'VISITED',
  QUOTED = 'QUOTED',
  CONVERTED = 'CONVERTED',
  LOST = 'LOST',
}

export enum CustomerTag {
  VIP = 'VIP',
  BRIDAL = 'BRIDAL',
  HNW = 'HNW',
  REGULAR = 'REGULAR',
}

export enum StorageDriver {
  LOCAL = 'LOCAL',
  S3 = 'S3',
  CLOUDFLARE_R2 = 'CLOUDFLARE_R2',
}

export enum MediaCategory {
  PRODUCT_IMAGE = 'PRODUCT_IMAGE',
  CERTIFICATE_PDF = 'CERTIFICATE_PDF',
  SHOWROOM_BANNER = 'SHOWROOM_BANNER',
  SYSTEM_BACKUP = 'SYSTEM_BACKUP',
}

export enum SubscriptionTier {
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  TRIAL = 'TRIAL',
  GRACE_PERIOD = 'GRACE_PERIOD',
  EXPIRED = 'EXPIRED',
}

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  ANNUAL = 'ANNUAL',
}

export enum RequestStatus {
  NEW = 'NEW',
  ASSIGNED = 'ASSIGNED',
  FOLLOW_UP = 'FOLLOW_UP',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  // Backwards-compatible aliases
  IN_REVIEW = 'IN_REVIEW',
  CONTACTED = 'CONTACTED',
  QUOTED = 'QUOTED',
  CLOSED = 'CLOSED',
}

export enum PurchaseStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum PurchaseRejectionReason {
  CUSTOMER_DECLINED = 'Customer declined',
  PRODUCT_PRICE = 'Product price / budget',
  PRODUCT_UNAVAILABLE = 'Product unavailable / out of stock',
  PURCHASED_ELSEWHERE = 'Customer purchased elsewhere',
  NO_LONGER_REQUIRED = 'Customer no longer requires product',
  OTHER = 'Other',
}

export enum RequestHistoryAction {
  REQUEST_CREATED = 'REQUEST_CREATED',
  STORE_ASSIGNED = 'STORE_ASSIGNED',
  STORE_REASSIGNED = 'STORE_REASSIGNED',
  CUSTOMER_CONTACTED = 'CUSTOMER_CONTACTED',
  FOLLOW_UP_ADDED = 'FOLLOW_UP_ADDED',
  PURCHASE_PENDING = 'PURCHASE_PENDING',
  PURCHASE_APPROVED = 'PURCHASE_APPROVED',
  PURCHASE_REJECTED = 'PURCHASE_REJECTED',
}

export enum ActorRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  STORE = 'STORE',
}

export enum RequestPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum PreferredContactMethod {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  WHATSAPP = 'WHATSAPP',
}


