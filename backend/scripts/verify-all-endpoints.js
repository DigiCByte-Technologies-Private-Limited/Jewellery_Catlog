const http = require('http');

const BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:3001/api/v1';
let authToken = '';

function request(method, path, body = null, token = authToken) {
  return new Promise((resolve) => {
    const url = new URL(path.startsWith('http') ? path : `${BASE_URL}${path}`);
    const data = body ? JSON.stringify(body) : null;

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (data) {
      headers['Content-Length'] = Buffer.byteLength(data);
    }

    const start = Date.now();
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method,
        headers: headers,
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', () => {
          const duration = Date.now() - start;
          let parsed;
          try {
            parsed = JSON.parse(responseBody);
          } catch {
            parsed = responseBody;
          }
          resolve({
            status: res.statusCode,
            duration,
            body: parsed,
            raw: responseBody,
          });
        });
      }
    );

    req.on('error', (err) => {
      resolve({
        status: 0,
        duration: Date.now() - start,
        error: err.message,
      });
    });

    if (data) req.write(data);
    req.end();
  });
}

const results = [];

function record(module, action, method, path, res, expectedStatus = [200, 201]) {
  const isOk = Array.isArray(expectedStatus)
    ? expectedStatus.includes(res.status)
    : res.status === expectedStatus;
  const entry = {
    module,
    action,
    method,
    path,
    status: res.status,
    ok: isOk,
    duration: `${res.duration}ms`,
    error: isOk
      ? null
      : res.body?.message || res.body?.error || res.error || JSON.stringify(res.body).substring(0, 120),
  };
  results.push(entry);
  const icon = isOk ? '✅' : '❌';
  console.log(`${icon} [${module}] ${method} ${path} -> ${res.status} (${res.duration}ms) ${entry.error ? 'ERR: ' + entry.error : ''}`);
  return res;
}

async function runTests() {
  console.log('===============================================================');
  console.log('🧪 COMPREHENSIVE ENDPOINT & CRUD TEST SUITE (POSTGRESQL 16)');
  console.log('===============================================================\n');

  // 1. App Root / Health
  const appRes = await request('GET', '/');
  record('App', 'Get Hello/Health', 'GET', '/', appRes, [200]);

  // 2. Auth Module
  const loginRes = await request('POST', '/auth/login', {
    email: 'admin@jewellery.com',
    password: 'Admin@1234',
  });
  record('Auth', 'Login Admin', 'POST', '/auth/login', loginRes, [200]);
  authToken = loginRes.body?.data?.accessToken;

  if (!authToken) {
    console.error('❌ Failed to obtain auth token. Stopping suite.');
    return;
  }

  const profileRes = await request('GET', '/auth/profile');
  record('Auth', 'Get Profile', 'GET', '/auth/profile', profileRes, [200]);

  const testUserEmail = `test.staff.${Date.now()}@jewellery.com`;
  const registerRes = await request('POST', '/auth/register', {
    email: testUserEmail,
    password: 'Password@123',
    fullName: 'Test Staff Member',
    phone: '+91 9111122222',
    role: 'SALES_STAFF',
  });
  record('Auth', 'Register Staff User', 'POST', '/auth/register', registerRes, [200, 201]);
  const createdUserId = registerRes.body?.data?.id || registerRes.body?.id;

  // 3. Users Module (CRUD)
  const usersListRes = await request('GET', '/users?page=1&limit=10');
  record('Users', 'List Users (Read)', 'GET', '/users', usersListRes, [200]);

  if (createdUserId) {
    const userGetRes = await request('GET', `/users/${createdUserId}`);
    record('Users', 'Get Single User (Read)', 'GET', `/users/${createdUserId}`, userGetRes, [200]);

    const userPatchRes = await request('PATCH', `/users/${createdUserId}`, {
      fullName: 'Test Staff Updated',
      phone: '+91 9333344444',
    });
    record('Users', 'Update User (Update)', 'PATCH', `/users/${createdUserId}`, userPatchRes, [200]);

    const userToggleRes = await request('PATCH', `/users/${createdUserId}/toggle-status`);
    record('Users', 'Toggle User Status', 'PATCH', `/users/${createdUserId}/toggle-status`, userToggleRes, [200]);

    const userDelRes = await request('DELETE', `/users/${createdUserId}`);
    record('Users', 'Delete User (Delete)', 'DELETE', `/users/${createdUserId}`, userDelRes, [200]);
  }

  // 4. Categories Module (CRUD)
  const catTreeRes = await request('GET', '/categories');
  record('Categories', 'Get Tree (Read)', 'GET', '/categories', catTreeRes, [200]);

  const catFlatRes = await request('GET', '/categories/flat?page=1&limit=20');
  record('Categories', 'Get Flat (Read)', 'GET', '/categories/flat', catFlatRes, [200]);

  const testCategoryName = `Test Collection ${Date.now()}`;
  const catCreateRes = await request('POST', '/categories', {
    name: testCategoryName,
    description: 'Automated test luxury collection',
    isVisible: true,
    sortOrder: 99,
  });
  record('Categories', 'Create Category (Create)', 'POST', '/categories', catCreateRes, [200, 201]);
  const createdCatId = catCreateRes.body?.data?.id || catCreateRes.body?.id;

  if (createdCatId) {
    const catGetRes = await request('GET', `/categories/${createdCatId}`);
    record('Categories', 'Get Single Category (Read)', 'GET', `/categories/${createdCatId}`, catGetRes, [200]);

    const catPatchRes = await request('PATCH', `/categories/${createdCatId}`, {
      name: `${testCategoryName} Renamed`,
      description: 'Updated description',
    });
    record('Categories', 'Update Category (Update)', 'PATCH', `/categories/${createdCatId}`, catPatchRes, [200]);

    const catReorderRes = await request('PATCH', `/categories/${createdCatId}/reorder`, {
      sortOrder: 10,
    });
    record('Categories', 'Reorder Category', 'PATCH', `/categories/${createdCatId}/reorder`, catReorderRes, [200]);

    const catDelRes = await request('DELETE', `/categories/${createdCatId}`);
    record('Categories', 'Delete Category (Delete)', 'DELETE', `/categories/${createdCatId}`, catDelRes, [200]);
  }

  // 5. Products Module (CRUD)
  const prodListRes = await request('GET', '/products?page=1&limit=10');
  record('Products', 'List Products (Read)', 'GET', '/products', prodListRes, [200]);

  const testSku = `PROD-TEST-${Date.now()}`;
  const prodCreateRes = await request('POST', '/products', {
    name: 'Royale Temple Gold Choker',
    sku: testSku,
    metalType: 'GOLD',
    purity: 'K22',
    grossWeight: 45.5,
    netMetalWeight: 45.5,
    stoneWeight: 0,
    lacWeight: 0,
    wastagePercent: 3.5,
    makingChargeType: 'PERCENT', // testing automatic enum normalization to PERCENTAGE
    makingChargeValue: 12.0,
    pricingMode: 'DYNAMIC',
    status: 'DRAFT',
    description: 'Heritage hand-crafted 22K choker necklace',
  });
  record('Products', 'Create Product (Create)', 'POST', '/products', prodCreateRes, [200, 201]);
  const createdProdId = prodCreateRes.body?.data?.id || prodCreateRes.body?.id;

  if (createdProdId) {
    const prodGetRes = await request('GET', `/products/${createdProdId}`);
    record('Products', 'Get Single Product (Read)', 'GET', `/products/${createdProdId}`, prodGetRes, [200]);

    const prodPatchRes = await request('PATCH', `/products/${createdProdId}`, {
      name: 'Royale Temple Gold Choker - Royal Edition',
      grossWeight: 48.0,
    });
    record('Products', 'Update Product (Update)', 'PATCH', `/products/${createdProdId}`, prodPatchRes, [200]);

    const prodStatusRes = await request('PATCH', `/products/${createdProdId}/status`, {
      status: 'PENDING_APPROVAL',
    });
    record('Products', 'Change Product Status', 'PATCH', `/products/${createdProdId}/status`, prodStatusRes, [200]);

    const prodBreakdownRes = await request('GET', `/products/${createdProdId}/price-breakdown`);
    record('Products', 'Price Breakdown', 'GET', `/products/${createdProdId}/price-breakdown`, prodBreakdownRes, [200]);

    const prodDupRes = await request('POST', `/products/${createdProdId}/duplicate`);
    record('Products', 'Duplicate Product', 'POST', `/products/${createdProdId}/duplicate`, prodDupRes, [200, 201]);
    const dupId = prodDupRes.body?.data?.id || prodDupRes.body?.id;

    // Change status back to DRAFT so soft-delete is allowed
    await request('PATCH', `/products/${createdProdId}/status`, { status: 'DRAFT' });
    const prodDelRes = await request('DELETE', `/products/${createdProdId}`);
    record('Products', 'Delete Product (Delete)', 'DELETE', `/products/${createdProdId}`, prodDelRes, [200]);

    if (dupId) {
      await request('DELETE', `/products/${dupId}`);
    }
  }

  // 6. Pricing Calculator Engine
  const priceCalcRes = await request('POST', '/pricing/calculate', {
    metalType: 'GOLD',
    purity: 'K22',
    metalRatePerGram: 5683,
    grossWeight: 15.5,
    netMetalWeight: 15.5,
    wastagePercent: 3.5,
    makingChargeType: 'PERCENT',
    makingChargeValue: 12.0,
    majuriPerGram: 150,
    hallmarkingCharge: 45,
  });
  record('Pricing', 'Calculate 12-Step Dynamic Price', 'POST', '/pricing/calculate', priceCalcRes, [200, 201]);

  const priceBulkRes = await request('POST', '/pricing/calculate-bulk', {
    items: [
      {
        metalRatePerGram: 5683,
        grossWeight: 10.0,
        netMetalWeight: 10.0,
        wastagePercent: 2.0,
        makingChargeType: 'PER_GRAM',
        makingChargeValue: 600,
      },
    ],
  });
  record('Pricing', 'Bulk Price Calculation', 'POST', '/pricing/calculate-bulk', priceBulkRes, [200, 201]);

  // 7. Metal Rates
  const ratesAllRes = await request('GET', '/metal-rates');
  record('MetalRates', 'Get All Rates (Read)', 'GET', '/metal-rates', ratesAllRes, [200]);

  const ratesLatestRes = await request('GET', '/metal-rates/latest');
  record('MetalRates', 'Get Latest Rates (Read)', 'GET', '/metal-rates/latest', ratesLatestRes, [200]);

  const ratesHistRes = await request('GET', '/metal-rates/history?page=1&limit=5');
  record('MetalRates', 'Get Rates History (Read)', 'GET', '/metal-rates/history', ratesHistRes, [200]);

  const ratesDerivedRes = await request('POST', '/metal-rates/calculate-derived', {
    base24KRatePerGram: 6200,
  });
  record('MetalRates', 'Calculate Derived Karat Rates', 'POST', '/metal-rates/calculate-derived', ratesDerivedRes, [200]);

  const ratesCreateRes = await request('POST', '/metal-rates', {
    metalType: 'GOLD',
    purity: 'K22',
    ratePerGram: 5695.5,
  });
  record('MetalRates', 'Update/Create Metal Rate', 'POST', '/metal-rates', ratesCreateRes, [200, 201]);

  // 8. Customers CRM (CRUD) - creating customer first so Bookings can reference it
  const customersListRes = await request('GET', '/customers?page=1&limit=10');
  record('Customers', 'List Customers (Read)', 'GET', '/customers', customersListRes, [200]);

  const occasionsRes = await request('GET', '/customers/occasions');
  record('Customers', 'Upcoming Occasions (Read)', 'GET', '/customers/occasions', occasionsRes, [200]);

  const testCustomerPhone = `+91 ${Math.floor(7000000000 + Math.random() * 2999999999)}`;
  const custCreateRes = await request('POST', '/customers', {
    fullName: 'Ananya Deshmukh',
    phone: testCustomerPhone,
    email: `ananya.${Date.now()}@example.com`,
    city: 'Pune',
    tag: 'VIP',
    dateOfBirth: '1990-05-15',
    weddingAnniversary: '2016-12-10',
  });
  record('Customers', 'Create Customer (Create)', 'POST', '/customers', custCreateRes, [200, 201]);
  const createdCustId = custCreateRes.body?.data?.id || custCreateRes.body?.id;

  if (createdCustId) {
    const custGetRes = await request('GET', `/customers/${createdCustId}`);
    record('Customers', 'Get Single Customer (Read)', 'GET', `/customers/${createdCustId}`, custGetRes, [200]);

    const custPatchRes = await request('PATCH', `/customers/${createdCustId}`, {
      city: 'Mumbai',
      tag: 'REGULAR',
    });
    record('Customers', 'Update Customer (Update)', 'PATCH', `/customers/${createdCustId}`, custPatchRes, [200]);
  }

  // 9. Inventory & Locations (CRUD)
  const locListRes = await request('GET', '/inventory/locations');
  record('Inventory', 'List Locations (Read)', 'GET', '/inventory/locations', locListRes, [200]);

  const locCodeA = `VLT-${Date.now().toString().slice(-4)}`;
  const locCodeB = `SHW-${Date.now().toString().slice(-4)}`;
  const locARes = await request('POST', '/inventory/locations', {
    name: `Main Vault ${locCodeA}`,
    code: locCodeA,
    type: 'VAULT',
    city: 'Mumbai',
  });
  record('Inventory', 'Create Vault Location A', 'POST', '/inventory/locations', locARes, [200, 201]);
  const locationAId = locARes.body?.data?.id || locARes.body?.id;

  const locBRes = await request('POST', '/inventory/locations', {
    name: `Flagship Showroom ${locCodeB}`,
    code: locCodeB,
    type: 'SHOWROOM',
    city: 'Mumbai',
  });
  record('Inventory', 'Create Showroom Location B', 'POST', '/inventory/locations', locBRes, [200, 201]);
  const locationBId = locBRes.body?.data?.id || locBRes.body?.id;

  const tagsListRes = await request('GET', '/inventory/tags?page=1&limit=10');
  record('Inventory', 'List Item Tags (Read)', 'GET', '/inventory/tags', tagsListRes, [200]);

  const anyProduct = prodListRes.body?.data?.[0];
  let createdTagId = null;
  if (anyProduct && locationAId) {
    const testHuid = `HUID${Date.now().toString().slice(-6)}`;
    const tagCreateRes = await request('POST', '/inventory/tags', {
      productId: anyProduct.id,
      locationId: locationAId,
      grossWeight: 22.5,
      netWeight: 22.5,
      stoneWeight: 0,
      lacWeight: 0,
      huid: testHuid,
      trayNumber: 'T-101',
    });
    record('Inventory', 'Stock In Item Piece (Create)', 'POST', '/inventory/tags', tagCreateRes, [200, 201]);
    createdTagId = tagCreateRes.body?.data?.id || tagCreateRes.body?.id;
  }

  if (createdTagId && locationBId) {
    const transferRes = await request('POST', '/inventory/transfer', {
      itemTagId: createdTagId,
      toLocationId: locationBId, // transferring to location B
      reason: 'Automated verification transfer',
    });
    record('Inventory', 'Transfer Stock to Location B', 'POST', '/inventory/transfer', transferRes, [200, 201]);

    const memoIssueRes = await request('POST', '/inventory/memo/issue', {
      itemTagId: createdTagId,
      memoHolderName: 'VIP Client Exhibition',
      notes: 'Customer viewing for bridal set',
    });
    record('Inventory', 'Issue Memo (On Approval)', 'POST', '/inventory/memo/issue', memoIssueRes, [200, 201]);

    const memoReturnRes = await request('POST', '/inventory/memo/return', {
      itemTagId: createdTagId,
      returnLocationId: locationAId,
    });
    record('Inventory', 'Return Memo to Stock', 'POST', '/inventory/memo/return', memoReturnRes, [200, 201]);
  }

  const invSummaryRes = await request('GET', '/inventory/summary');
  record('Inventory', 'Get Stock Valuation Summary', 'GET', '/inventory/summary', invSummaryRes, [200]);

  // 10. Karigar & Artisans (CRUD)
  const karigarListRes = await request('GET', '/karigar/artisans');
  record('Karigar', 'List Artisans (Read)', 'GET', '/karigar/artisans', karigarListRes, [200]);

  const artisanCreateRes = await request('POST', '/karigar/artisans', {
    name: 'Suresh Verma Karigar',
    phone: `+91 ${Math.floor(6000000000 + Math.random() * 3999999999)}`,
    skills: 'Handmade Filigree & Kundan Setting',
    defaultMakingChargeRate: 450,
  });
  record('Karigar', 'Register Artisan (Create)', 'POST', '/karigar/artisans', artisanCreateRes, [200, 201]);
  const createdArtisanId = artisanCreateRes.body?.data?.id || artisanCreateRes.body?.id;

  const ordersListRes = await request('GET', '/karigar/orders?page=1&limit=10');
  record('Karigar', 'List Job Orders (Read)', 'GET', '/karigar/orders', ordersListRes, [200]);

  let createdOrderId = null;
  if (createdArtisanId) {
    const issueOrderRes = await request('POST', '/karigar/orders/issue', {
      karigarId: createdArtisanId,
      metalType: 'GOLD',
      purity: 'K22',
      issuedPurity: 'K22',
      issuedWeight: 50.0,
      expectedWeight: 48.5,
      allowedWastagePercent: 3.0,
      description: 'Manufacture 2x Gold Bangles Set',
      targetDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    });
    record('Karigar', 'Issue Metal to Artisan (Create)', 'POST', '/karigar/orders/issue', issueOrderRes, [200, 201]);
    createdOrderId = issueOrderRes.body?.data?.id || issueOrderRes.body?.id;
  }

  if (createdOrderId) {
    const receiveOrderRes = await request('POST', `/karigar/orders/${createdOrderId}/receive`, {
      finishedWeight: 48.2,
      scrapWeight: 0.3,
      laborCharges: 4500,
      notes: 'Received with excellent polish',
    });
    record('Karigar', 'Receive Finished Order & Reconcile', 'POST', `/karigar/orders/${createdOrderId}/receive`, receiveOrderRes, [200, 201]);
  }

  // 11. Old Gold Exchange
  const assessRes = await request('POST', '/old-gold/assess', {
    metalType: 'GOLD',
    karat: 22,
    grossWeight: 20.0,
    stoneWeight: 1.5,
    meltingLossPercent: 1.0,
  });
  record('OldGold', 'Assess Old Gold Valuation', 'POST', '/old-gold/assess', assessRes, [200, 201]);

  const testTxnRes = await request('POST', '/old-gold/transactions', {
    customerName: 'Aarav Sharma',
    customerPhone: '+91 9888877777',
    metalType: 'GOLD',
    grossWeight: 15.0,
    stoneWeight: 0.5,
    testedPurityPercent: 91.6,
    paymentMode: 'EXCHANGE_CREDIT',
  });
  record('OldGold', 'Create Exchange Transaction (Create)', 'POST', '/old-gold/transactions', testTxnRes, [200, 201]);

  const oldGoldTxnsRes = await request('GET', '/old-gold/transactions?page=1&limit=10');
  record('OldGold', 'List Exchange Transactions (Read)', 'GET', '/old-gold/transactions', oldGoldTxnsRes, [200]);

  // 12. Advance Bookings & Rate Lock
  const bookingsListRes = await request('GET', '/bookings?page=1&limit=10');
  record('Bookings', 'List Advance Bookings (Read)', 'GET', '/bookings', bookingsListRes, [200]);

  let createdBookingId = null;
  if (createdCustId) {
    const bookingCreateRes = await request('POST', '/bookings', {
      customerId: createdCustId,
      metalType: 'GOLD',
      purity: 'K22',
      estimatedGrossWeight: 50.0,
      lockedMetalRatePerGram: 5680,
      advanceAmountPaid: 100000,
      advancePaymentMode: 'UPI',
      notes: 'Wedding jewellery advance booking',
    });
    record('Bookings', 'Create Booking Rate Lock (Create)', 'POST', '/bookings', bookingCreateRes, [200, 201]);
    createdBookingId = bookingCreateRes.body?.data?.id || bookingCreateRes.body?.id;
  }

  if (createdBookingId) {
    const bookingStatusRes = await request('PATCH', `/bookings/${createdBookingId}/status`, {
      status: 'CONFIRMED',
    });
    record('Bookings', 'Update Booking Status (Update)', 'PATCH', `/bookings/${createdBookingId}/status`, bookingStatusRes, [200]);

    const bookingSettleRes = await request('POST', `/bookings/${createdBookingId}/settle`, {
      finalSettlementAmount: 186840,
      notes: 'Settled at locked rate of ₹5,680/g',
    });
    record('Bookings', 'Settle Booking (Final Delivery)', 'POST', `/bookings/${createdBookingId}/settle`, bookingSettleRes, [200, 201]);
  }

  // 13. Customer Enquiries & Pipeline
  const enquiriesListRes = await request('GET', '/enquiries?page=1&limit=10');
  record('Enquiries', 'List Enquiries (Read)', 'GET', '/enquiries', enquiriesListRes, [200]);

  const enquiryCreateRes = await request('POST', '/enquiries', {
    customerName: 'Vikram Malhotra',
    customerPhone: '+91 9777766666',
    metalType: 'GOLD',
    occasion: 'WEDDING', // testing automatic mapping from WEDDING to BRIDAL
    budgetMin: 200000,
    budgetMax: 350000,
    notes: 'Looking for 22K Kundan bridal necklace set',
  });
  record('Enquiries', 'Create Enquiry (Create)', 'POST', '/enquiries', enquiryCreateRes, [200, 201]);
  const createdEnquiryId = enquiryCreateRes.body?.data?.id || enquiryCreateRes.body?.id;

  if (createdEnquiryId) {
    const enquiryStageRes = await request('PATCH', `/enquiries/${createdEnquiryId}/stage`, {
      stage: 'CONTACTED',
    });
    record('Enquiries', 'Update Enquiry Stage (Update)', 'PATCH', `/enquiries/${createdEnquiryId}/stage`, enquiryStageRes, [200]);

    const enquiryPatchRes = await request('PATCH', `/enquiries/${createdEnquiryId}`, {
      notes: 'Customer visited showroom, selected Design #24',
    });
    record('Enquiries', 'Update Enquiry Details (Update)', 'PATCH', `/enquiries/${createdEnquiryId}`, enquiryPatchRes, [200]);
  }

  // 14. Storage Registry (CRUD)
  const storageMetricsRes = await request('GET', '/storage/metrics');
  record('Storage', 'Get Storage Metrics (Read)', 'GET', '/storage/metrics', storageMetricsRes, [200]);

  const storageFilesRes = await request('GET', '/storage/files?page=1&limit=10');
  record('Storage', 'List Storage Files (Read)', 'GET', '/storage/files', storageFilesRes, [200]);

  const fileUploadRes = await request('POST', '/storage/upload', {
    fileName: `gold_necklace_${Date.now()}.jpg`,
    originalName: 'gold_necklace_hero.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 2048576,
    driver: 'LOCAL',
    category: 'PRODUCT_IMAGE',
    storagePath: `uploads/products/gold_necklace_${Date.now()}.jpg`,
    publicUrl: 'http://localhost:3001/uploads/products/gold_necklace.jpg',
  });
  record('Storage', 'Upload/Register File (Create)', 'POST', '/storage/upload', fileUploadRes, [200, 201]);
  const createdFileId = fileUploadRes.body?.data?.id || fileUploadRes.body?.id;

  if (createdFileId) {
    const fileDelRes = await request('DELETE', `/storage/files/${createdFileId}`);
    record('Storage', 'Delete File (Delete)', 'DELETE', `/storage/files/${createdFileId}`, fileDelRes, [200]);
  }

  // 15. Subscriptions Module
  const subCurrentRes = await request('GET', '/subscriptions/current');
  record('Subscriptions', 'Get Current Subscription (Read)', 'GET', '/subscriptions/current', subCurrentRes, [200]);

  const subPlansRes = await request('GET', '/subscriptions/plans');
  record('Subscriptions', 'Get Plans (Read)', 'GET', '/subscriptions/plans', subPlansRes, [200]);

  const subUpgradeRes = await request('POST', '/subscriptions/upgrade', {
    tier: 'ENTERPRISE',
    billingCycle: 'ANNUAL',
  });
  record('Subscriptions', 'Upgrade Subscription Plan', 'POST', '/subscriptions/upgrade', subUpgradeRes, [200, 201]);

  const subFeaturesRes = await request('PATCH', '/subscriptions/features', {
    enabledFeatures: ['WHITE_LABEL', 'API_ACCESS', 'ADVANCED_REPORTS'],
    autoRenew: true,
    storageQuotaGb: 100,
  });
  record('Subscriptions', 'Update Feature Flags', 'PATCH', '/subscriptions/features', subFeaturesRes, [200]);

  // 16. Approvals Module
  const approvalsListRes = await request('GET', '/approvals?page=1&limit=10');
  record('Approvals', 'List Approvals (Read)', 'GET', '/approvals', approvalsListRes, [200]);

  const firstApproval = approvalsListRes.body?.data?.[0];
  if (firstApproval) {
    const approvalGetRes = await request('GET', `/approvals/${firstApproval.id}`);
    record('Approvals', 'Get Single Approval (Read)', 'GET', `/approvals/${firstApproval.id}`, approvalGetRes, [200]);
  }

  // 17. Audit Logs Module
  const auditLogsRes = await request('GET', '/audit-logs?page=1&limit=10');
  record('AuditLogs', 'List Audit Logs (Read)', 'GET', '/audit-logs', auditLogsRes, [200]);

  // ─── SUMMARY REPORT ───
  console.log('\n===============================================================');
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('===============================================================');
  const total = results.length;
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  console.log(`Total Endpoints Tested: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n❌ FAILED ENDPOINTS:');
    results
      .filter((r) => !r.ok)
      .forEach((r) => {
        console.log(` - [${r.module}] ${r.method} ${r.path} -> ${r.status}: ${r.error}`);
      });
  } else {
    console.log('\n🎉 ALL 17 MODULES AND CRUD OPERATIONS PASSED 100% CLEANLY!');
  }
}

runTests().catch(console.error);
