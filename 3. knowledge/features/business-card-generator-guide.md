# Business Card Generator Guide

## Overview
The Business Card Generator allows HR/Admin to generate official Indofood business cards for employees. It supports on-the-fly PDF generation and secure digital profiles via QR codes.

## PDF Layout & Formatting
- **Format**: Vertical stack (Front side on TOP, Back side on BOTTOM).
- **Dimensions**: 
  - Width: `510.2362px`
  - Height: `633.622px` (Calculated for two cards + 10px cutting gap).
- **Gap**: A `10px` vertical gap is added between the front and back for easier cutting after printing.

## QR Code & Security Flow
To prevent unauthorized access to employee profiles, the system uses strict encryption:

1. **Encryption Algorithm**: `aes-256-cbc` using keys defined in `config/encrypts.js`.
2. **URL Structure**: `/hots/card/card?employee_id={ENCRYPTED_ID}`
3. **Scan Flow**: 
   - Backend encrypts the User ID.
   - Frontend generates a QR code from the encrypted URL.
   - Mobile scan sends the encrypted ID to `getCardProfile`.
   - Backend decrypts it and returns user data.
4. **Security Enforcement**: Numeric IDs (e.g., `?employee_id=1004`) are **BLOCKED** to prevent scraping.

## Key Files
- **Controller**: `controller/hots_controller/customfunction/controllers/customfunctionController.js`
- **Frontend**: `fontend/HOTS/src/pages/dashboard/report/CardNameGenerator.tsx`
- **Renderer**: `core/renderers/card-renderer.js` (Pure HTML/CSS template)

## Troubleshooting
### Images not showing in PDF
Ensure the renderer uses direct URLs or Base64. If using internal URLs (e.g., `backend.indofoodinternational.com`), ensure the server can resolve its own external URL.
### Download not triggering
The frontend uses `window.open(url, '_blank')` immediately after the generation API returns the download path.
