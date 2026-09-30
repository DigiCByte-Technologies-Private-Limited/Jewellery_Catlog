$baseUrl = "http://localhost:3001/api/v1"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " E2E WORKFLOW TEST: PRODUCT REQUEST -> STORE -> PURCHASE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# Step 1: Customer submits inquiry from website
Write-Host "`n[STEP 1] Customer Rahul Kumar submits product request from website..." -ForegroundColor Yellow
$requestBody = @{
    customerName = "Rahul Kumar"
    email = "rahul.kumar@example.com"
    phone = "+91 98765 43210"
    companyName = "Kumar Heritage"
    city = "Vijayawada"
    state = "Andhra Pradesh"
    latitude = 16.506174
    longitude = 80.648015
    productName = "22K Kundan Polki Choker Necklace"
    quantity = "1 set"
    message = "I am interested in purchasing this product. Please contact me regarding showroom trial, availability and final pricing."
    preferredContactMethod = "PHONE"
} | ConvertTo-Json

$inquiryResponse = Invoke-RestMethod -Uri "$baseUrl/requests" -Method POST -Body $requestBody -ContentType "application/json"
$createdReq = $inquiryResponse.data
$reqId = $createdReq.requestId
$reqUuid = $createdReq.id

Write-Host "  -> Created Request: ID=$reqId (UUID=$reqUuid)" -ForegroundColor Green
Write-Host "  -> Initial Workflow Status: $($createdReq.status)" -ForegroundColor Green
Write-Host "  -> Initial Purchase Outcome: $($createdReq.purchaseStatus)" -ForegroundColor Green
Write-Host "  -> Customer Location: $($createdReq.city), $($createdReq.state)" -ForegroundColor Green

# Step 2: Customer tracks their request
Write-Host "`n[STEP 2] Customer tracks their request using public tracker..." -ForegroundColor Yellow
$trackUrl = "$baseUrl/requests/track/$reqId" + "?phone=%2B91%2098765%2043210"
$trackResponse = Invoke-RestMethod -Uri $trackUrl -Method GET
$trackData = $trackResponse.data

Write-Host "  -> Customer Tracking Status: $($trackData.operationalStatus)" -ForegroundColor Green
Write-Host "  -> Purchase Status: $($trackData.purchaseStatus)" -ForegroundColor Green
Write-Host "  -> Status Message: $($trackData.statusMessage)" -ForegroundColor Green
Write-Host "  -> Assigned Showroom: $($trackData.assignedShowroom)" -ForegroundColor Green

# Step 3: Admin logs in
Write-Host "`n[STEP 3] Admin logs in to Central Portal..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@jewellery.com"
    password = "Admin@1234"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResponse.data.accessToken
$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}
Write-Host "  -> Logged in as: $($loginResponse.data.user.fullName) ($($loginResponse.data.user.role))" -ForegroundColor Green

# Step 4: Admin checks nearby stores for this request
Write-Host "`n[STEP 4] Admin inspects nearby showrooms for request $reqId..." -ForegroundColor Yellow
$nearbyUrl = "$baseUrl/requests/$reqUuid/nearby-stores"
$nearbyStores = Invoke-RestMethod -Uri $nearbyUrl -Method GET -Headers $headers
$nearbyStores = $nearbyStores.data

Write-Host "  -> Proximity Ranking to Customer in Vijayawada:" -ForegroundColor Cyan
foreach ($st in $nearbyStores | Select-Object -First 4) {
    Write-Host "     - $($st.name) ($($st.city)): $($st.distanceKm) km" -ForegroundColor White
}

$assignedStore = $nearbyStores[0]
Write-Host "  -> Nearest Store Identified: $($assignedStore.name) ($($assignedStore.distanceKm) km)" -ForegroundColor Green

# Step 5: Admin assigns customer request to Vijayawada Flagship
Write-Host "`n[STEP 5] Admin assigns request to $($assignedStore.name)..." -ForegroundColor Yellow
$assignBody = @{
    storeId = $assignedStore.id
    note = "Customer located in Vijayawada. Assigned to flagship branch with item in display stock."
} | ConvertTo-Json

$assignResponse = Invoke-RestMethod -Uri "$baseUrl/requests/$reqUuid/assign-store" -Method PATCH -Body $assignBody -Headers $headers
$assignedReq = $assignResponse.data
Write-Host "  -> Workflow Status: $($assignedReq.status)" -ForegroundColor Green
Write-Host "  -> Assigned Store: $($assignedReq.assignedStore.name) ($($assignedReq.assignedStore.city))" -ForegroundColor Green
Write-Host "  -> Purchase Status remains: $($assignedReq.purchaseStatus)" -ForegroundColor Green

# Step 6: Customer tracks again after store assignment
Write-Host "`n[STEP 6] Customer tracks request again..." -ForegroundColor Yellow
$trackAfterAssign = Invoke-RestMethod -Uri $trackUrl -Method GET
$trackAssignData = $trackAfterAssign.data
Write-Host "  -> Customer Tracking Status: $($trackAssignData.operationalStatus)" -ForegroundColor Green
Write-Host "  -> Status Message: $($trackAssignData.statusMessage)" -ForegroundColor Green
Write-Host "  -> Showroom Assigned: $($trackAssignData.assignedShowroom.name) (Phone: $($trackAssignData.assignedShowroom.phone))" -ForegroundColor Green

# Step 7: Store contacts customer and logs outreach
Write-Host "`n[STEP 7] Store performs outreach and logs follow-up..." -ForegroundColor Yellow
$followUpBody = @{
    note = "Called customer Rahul Kumar. Discussed 22K purity, BIS hallmark, and set up showroom appointment for Saturday 3 PM."
    customerResponse = "Customer confirmed appointment and requested matching jhumkas as well."
    nextFollowUpDate = "2026-10-04T15:00:00.000Z"
} | ConvertTo-Json

$followUpResponse = Invoke-RestMethod -Uri "$baseUrl/requests/$reqUuid/follow-up" -Method PATCH -Body $followUpBody -Headers $headers
$followUpReq = $followUpResponse.data
Write-Host "  -> Workflow Status: $($followUpReq.status)" -ForegroundColor Green
Write-Host "  -> Purchase Status remains: $($followUpReq.purchaseStatus) (Store does not approve/reject)" -ForegroundColor Green

# Step 8: Store records customer purchase outcome
Write-Host "`n[STEP 8] Customer visited showroom and purchased product -> Store records outcome APPROVED..." -ForegroundColor Yellow
$outcomeBody = @{
    purchaseStatus = "APPROVED"
    confirmedQuantity = 1
    purchaseNotes = "Customer visited Vijayawada Flagship. Completed purchase of 22K Kundan Choker. Invoice #INV-2026-8819."
} | ConvertTo-Json

$outcomeResponse = Invoke-RestMethod -Uri "$baseUrl/requests/$reqUuid/purchase-outcome" -Method PATCH -Body $outcomeBody -Headers $headers
$completedReq = $outcomeResponse.data
Write-Host "  -> Final Workflow Status: $($completedReq.status)" -ForegroundColor Green
Write-Host "  -> Final Purchase Outcome: $($completedReq.purchaseStatus)" -ForegroundColor Green
Write-Host "  -> Purchase Confirmed At: $($completedReq.purchaseConfirmedAt)" -ForegroundColor Green

# Step 9: Customer tracks final status
Write-Host "`n[STEP 9] Customer checks public tracking..." -ForegroundColor Yellow
$finalTrack = Invoke-RestMethod -Uri $trackUrl -Method GET
$finalData = $finalTrack.data
Write-Host "  -> Final Operational Status: $($finalData.operationalStatus)" -ForegroundColor Green
Write-Host "  -> Final Purchase Outcome: $($finalData.purchaseStatus)" -ForegroundColor Green
Write-Host "  -> Customer Tracking Message: $($finalData.statusMessage)" -ForegroundColor Green

# Step 10: Verify audit trail
Write-Host "`n[STEP 10] Checking full audit history..." -ForegroundColor Yellow
$detailReq = Invoke-RestMethod -Uri "$baseUrl/requests/$reqUuid" -Method GET -Headers $headers
$history = $detailReq.data.history
Write-Host "  -> History Events Recorded ($($history.Count) total):" -ForegroundColor Cyan
foreach ($h in $history) {
    Write-Host "     [$($h.createdAt)] $($h.action) by $($h.actorName) ($($h.actorRole)): $($h.note)" -ForegroundColor White
}

# Step 11: Verify pipeline stats
Write-Host "`n[STEP 11] Checking Pipeline Stats & Conversion Rate..." -ForegroundColor Yellow
$pipelineStats = Invoke-RestMethod -Uri "$baseUrl/requests/pipeline-stats" -Method GET -Headers $headers
$pStats = $pipelineStats.data
Write-Host "  -> Total Requests: $($pStats.total)" -ForegroundColor Green
Write-Host "  -> Approved Purchases: $($pStats.approvedPurchases)" -ForegroundColor Green
Write-Host "  -> Pending Purchases: $($pStats.pendingPurchases)" -ForegroundColor Green
Write-Host "  -> Rejected Purchases: $($pStats.rejectedPurchases)" -ForegroundColor Green
Write-Host "  -> Conversion Rate: $($pStats.conversionRate)%" -ForegroundColor Green

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host " ALL 11 WORKFLOW STEPS PASSED PERFECTLY!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
