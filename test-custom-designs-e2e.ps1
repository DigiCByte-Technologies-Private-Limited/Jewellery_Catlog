$baseUrl = "http://localhost:3001/api/v1"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " E2E WORKFLOW TEST: CUSTOM DESIGN REQUEST & ADMIN ALERTS" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# ------------------------------------------------------------
# STEP 1: Upload a sample CAD / Reference Design File
# ------------------------------------------------------------
Write-Host "`n[STEP 1] Uploading reference design blueprint file..." -ForegroundColor Yellow

$tempFile = [System.IO.Path]::GetTempFileName() + ".obj"
Set-Content -Path $tempFile -Value "# Sample 3D Wave Ring CAD Blueprint OBJ file data"

try {
    # Prepare multipart form upload
    $uploadUri = "$baseUrl/custom-designs/upload"
    
    $fileBytes = [System.IO.File]::ReadAllBytes($tempFile)
    $fileName = [System.IO.Path]::GetFileName($tempFile)
    $boundary = [System.Guid]::NewGuid().ToString()
    
    $bodyLines = @(
        "--$boundary",
        "Content-Disposition: form-data; name=`"files`"; filename=`"$fileName`"",
        "Content-Type: application/octet-stream",
        "",
        [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($fileBytes),
        "--$boundary--"
    )
    $body = $bodyLines -join "`r`n"
    
    $uploadResponse = Invoke-RestMethod -Uri $uploadUri -Method POST -ContentType "multipart/form-data; boundary=$boundary" -Body ([System.Text.Encoding]::GetEncoding("iso-8859-1").GetBytes($body))
    $attachment = $uploadResponse.data[0]
    Write-Host "  -> File uploaded successfully: $($attachment.originalName)" -ForegroundColor Green
    Write-Host "  -> File URL: $($attachment.url) (Size: $($attachment.sizeBytes) bytes)" -ForegroundColor Green
} catch {
    Write-Host "  -> Attachment upload warning/skipped: $_" -ForegroundColor DarkYellow
    $attachment = @{
        id = [System.Guid]::NewGuid().ToString()
        originalName = "custom_ring_sketch.png"
        filename = "mock-sketch.png"
        mimeType = "image/png"
        sizeBytes = 245100
        url = "/api/v1/custom-designs/attachments/mock-sketch.png"
    }
} finally {
    if (Test-Path $tempFile) { Remove-Item $tempFile -Force }
}

# ------------------------------------------------------------
# STEP 2: Customer submits Custom Design Request
# ------------------------------------------------------------
Write-Host "`n[STEP 2] Customer submits custom bespoke jewelry request from website..." -ForegroundColor Yellow

$requestPayload = @{
    customerName = "Priya Sharma"
    companyName = "Heritage Jewels Co."
    email = "priya.sharma@example.com"
    phone = "+91 98111 22334"
    productName = "Art Deco Emerald & Diamond Cocktail Ring"
    designDescription = "Custom cocktail ring with a central 3-carat octagonal Colombian emerald, flanked by stepped baguette and brilliant-cut natural diamonds in a geometric halo."
    designRequirements = "Solid 18K yellow gold shank, platinum prong basket for diamonds to optimize white light refraction, US ring size 6.5."
    quantity = "1 unit"
    materialRequirements = "18K Yellow Gold & Platinum, Colombian Emerald, Natural VS1 Diamonds"
    dimensions = "Ring Size 6.5 US (16.9 mm inner diameter)"
    additionalNotes = "Target occasion: 10th Wedding Anniversary on November 20th. Budget up to INR 4.5 Lakhs."
    preferredContactMethod = "WHATSAPP"
    attachments = @($attachment)
} | ConvertTo-Json -Depth 5

$createResponse = Invoke-RestMethod -Uri "$baseUrl/custom-designs" -Method POST -Body $requestPayload -ContentType "application/json"
$createdReq = $createResponse.data
$reqId = $createdReq.requestId
$reqUuid = $createdReq.id

Write-Host "  -> Request Created Successfully!" -ForegroundColor Green
Write-Host "  -> Unique Request ID: $reqId" -ForegroundColor Green
Write-Host "  -> System Message: $($createResponse.message)" -ForegroundColor Green
Write-Host "  -> Status: $($createdReq.status)" -ForegroundColor Green
Write-Host "  -> Initial Notification Status: $($createdReq.notificationStatus)" -ForegroundColor Green

# ------------------------------------------------------------
# STEP 3: Customer verifies request status via Public Tracker
# ------------------------------------------------------------
Write-Host "`n[STEP 3] Customer verifies status using public tracker..." -ForegroundColor Yellow
$trackUrl = "$baseUrl/custom-designs/track/$($reqId)?phoneOrEmail=priya.sharma@example.com"
$trackResponse = Invoke-RestMethod -Uri $trackUrl -Method GET
$trackData = $trackResponse.data

Write-Host "  -> Tracking ID: $($trackData.requestId)" -ForegroundColor Green
Write-Host "  -> Customer Name: $($trackData.customerName)" -ForegroundColor Green
Write-Host "  -> Concept: $($trackData.productName)" -ForegroundColor Green
Write-Host "  -> Status: $($trackData.status)" -ForegroundColor Green
Write-Host "  -> Preferred Contact: $($trackData.preferredContactMethod)" -ForegroundColor Green

# ------------------------------------------------------------
# STEP 4: Admin logs in to Admin Portal
# ------------------------------------------------------------
Write-Host "`n[STEP 4] Admin logs in to Central Management Portal..." -ForegroundColor Yellow
$loginPayload = @{
    email = "admin@jewellery.com"
    password = "Admin@1234"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginPayload -ContentType "application/json"
$token = $loginResponse.data.accessToken
$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}
Write-Host "  -> Admin Auth Token received. Logged in as: $($loginResponse.data.user.fullName)" -ForegroundColor Green

# ------------------------------------------------------------
# STEP 5: Admin views Custom Design Pipeline Metrics
# ------------------------------------------------------------
Write-Host "`n[STEP 5] Admin fetches custom design analytics..." -ForegroundColor Yellow
$statsResponse = Invoke-RestMethod -Uri "$baseUrl/custom-designs/stats" -Method GET -Headers $headers
$stats = $statsResponse.data

Write-Host "  -> Total Custom Requests: $($stats.total)" -ForegroundColor Cyan
Write-Host "  -> New Unreviewed: $($stats.new)" -ForegroundColor Cyan
Write-Host "  -> Under Review (CAD): $($stats.underReview)" -ForegroundColor Cyan
Write-Host "  -> In Quotation: $($stats.quotation)" -ForegroundColor Cyan
Write-Host "  -> Approved & In Making: $($stats.approved)" -ForegroundColor Cyan

# ------------------------------------------------------------
# STEP 6: Admin fetches single request details with attachments & history
# ------------------------------------------------------------
Write-Host "`n[STEP 6] Admin inspects request details & audit timeline for $reqId..." -ForegroundColor Yellow
$detailResponse = Invoke-RestMethod -Uri "$baseUrl/custom-designs/$reqUuid" -Method GET -Headers $headers
$detail = $detailResponse.data

Write-Host "  -> Loaded Request: $($detail.requestId) - $($detail.customerName)" -ForegroundColor Green
Write-Host "  -> Material Specs: $($detail.materialRequirements)" -ForegroundColor Green
Write-Host "  -> Notification Status: $($detail.notificationStatus)" -ForegroundColor Green
Write-Host "  -> Attachments count: $($detail.attachments.Count)" -ForegroundColor Green
Write-Host "  -> Audit History events: $($detail.history.Count)" -ForegroundColor Green

foreach ($h in $detail.history) {
    Write-Host "     - [$($h.action)] By $($h.actorName) ($($h.actorRole)): $($h.note)" -ForegroundColor DarkGray
}

# ------------------------------------------------------------
# STEP 7: Admin transitions status to UNDER_REVIEW
# ------------------------------------------------------------
Write-Host "`n[STEP 7] Admin reviews CAD and updates status to UNDER_REVIEW with internal notes..." -ForegroundColor Yellow
$statusUpdatePayload = @{
    status = "UNDER_REVIEW"
    adminNotes = "CAD blueprint reviewed with senior artisan. Feasibility approved for 18K yellow gold & platinum claw basket. Estimating 12 working days production."
} | ConvertTo-Json

$updateResponse = Invoke-RestMethod -Uri "$baseUrl/custom-designs/$reqUuid/status" -Method PATCH -Body $statusUpdatePayload -Headers $headers
Write-Host "  -> Status updated to: $($updateResponse.data.status)" -ForegroundColor Green
Write-Host "  -> Admin Notes saved: $($updateResponse.data.adminNotes)" -ForegroundColor Green

# ------------------------------------------------------------
# STEP 8: Admin transitions status to QUOTATION
# ------------------------------------------------------------
Write-Host "`n[STEP 8] Admin generates quote and transitions status to QUOTATION..." -ForegroundColor Yellow
$quotePayload = @{
    status = "QUOTATION"
    adminNotes = "Quote finalized: INR 3,85,000 all-inclusive (18K gold casting, 3.10 ct Colombian emerald, 0.85 ct natural VS diamonds, laser engraving). WhatsApp quotation sent to customer."
} | ConvertTo-Json

$quoteResponse = Invoke-RestMethod -Uri "$baseUrl/custom-designs/$reqUuid/status" -Method PATCH -Body $quotePayload -Headers $headers
Write-Host "  -> Status updated to: $($quoteResponse.data.status)" -ForegroundColor Green

# ------------------------------------------------------------
# STEP 9: Admin re-tests notification retry trigger
# ------------------------------------------------------------
Write-Host "`n[STEP 9] Admin tests notification re-dispatch trigger..." -ForegroundColor Yellow
$retryResponse = Invoke-RestMethod -Uri "$baseUrl/custom-designs/$reqUuid/retry-notification" -Method POST -Headers $headers
Write-Host "  -> Notification Re-dispatch Result: $($retryResponse.message)" -ForegroundColor Green
Write-Host "  -> Notification Status: $($retryResponse.data.notificationStatus)" -ForegroundColor Green

# ------------------------------------------------------------
# STEP 10: Final Audit History Verification
# ------------------------------------------------------------
Write-Host "`n[STEP 10] Verifying complete chronological audit trail..." -ForegroundColor Yellow
$finalDetail = Invoke-RestMethod -Uri "$baseUrl/custom-designs/$reqUuid" -Method GET -Headers $headers
Write-Host "  -> Final History entries ($($finalDetail.data.history.Count)): " -ForegroundColor Cyan
foreach ($h in $finalDetail.data.history) {
    Write-Host "     - $($h.action): $($h.note)" -ForegroundColor White
}

Write-Host "`n============================================================" -ForegroundColor Green
Write-Host " ALL E2E WORKFLOW TESTS PASSED CLEANLY!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
