const fs = require('fs');
const path = require('path');

/**
 * Card Name Renderer
 * Pure function to generate HTML for business cards
 * 
 * @param {Object} data
 */
module.exports = function renderCardHtml(data) {
    const ASSET_BASE = (process.env.BE_URL_HOTS || process.env.BE_URL) + '/public/hots/aset/cardgenerator';

    // Calculate email font size logic
    const emailLength = (data.email || '').length;
    let emailFontSize = 'fs-20px';
    if (emailLength > 35) emailFontSize = 'fs-12px';
    else if (emailLength > 30) emailFontSize = 'fs-14px';
    else if (emailLength > 25) emailFontSize = 'fs-16px';
    else if (emailLength > 22) emailFontSize = 'fs-18px';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>Business Card - ${data.name}</title>
    <style>
        body, * { font-family: Arial, sans-serif; margin: 0; padding: 0; box-sizing: border-box; }
        body { background: white; margin: 0; padding: 0; }
        .page-container { display: flex; flex-direction: column; gap: 10px; }

        .base-kartunama {
            width: 510.2362px;
            height: 311.811px;
            border-radius: 5px;
            user-select: none;
            padding: 0px;
            padding-top: 11.33px;
            background: white;
            position: relative;
            border: 1px solid #ddd;
            overflow: hidden;
        }

        .logo-kartunama { width: 187.0886px; }
        .footer-kartunama {
            border-radius: 0px 0px 5px 5px;
            height: 17.00787px;
            background-color: #083484;
        }

        .nama-kartunama { color: #083484; font-size: 17.6px; }
        .text-subsidiary { color: #083484; font-size: 13.4px; font-weight: 500; }
        .perusahaan-kartunama { color: #0ea8e6; position: relative; }

        .fs-12px { font-size: 9px; font-weight: 400; }
        .fs-14px { font-size: 10px; font-weight: 400; }
        .fs-16px { font-size: 11px; font-weight: 400; }
        .fs-18px { font-size: 11.9px; }
        .fs-20px { font-size: 11.9px; font-weight: 400; }
        .fs-22px { font-size: 13.4px; font-weight: 400; }

        .container-fluid { width: 100%; padding-left: 15px; padding-right: 15px; }
        .row { display: flex; flex-wrap: wrap; margin-left: -15px; margin-right: -15px; }
        .col-12 { flex: 0 0 100%; max-width: 100%; padding-left: 15px; padding-right: 15px; }
        .col-6 { flex: 0 0 50%; max-width: 50%; padding-left: 15px; padding-right: 15px; }
        .fw-bold { font-weight: bold; }
        .mt-4 { margin-top: 1.5rem; }
        .pb-3 { padding-bottom: 1rem; }
        .py-0 { padding-top: 0; padding-bottom: 0; }
        .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .px-0 { padding-left: 0; padding-right: 0; }
        .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
        .ps-2 { padding-left: 0.5rem; }
        .pe-0 { padding-right: 0; }
        .position-absolute { position: absolute; }
        .position-relative { position: relative; }
        .bottom-0 { bottom: 0; }
        .start-0 { left: 0; }
        .w-100 { width: 100%; }
        .d-flex { display: flex; }
        .no-gap-print { margin-bottom: -15px; }

        @media print {
            body { background: white; }
            .base-kartunama { page-break-after: always; border: none; }
        }
    </style>
</head>
<body>
    <div class="page-container">
        <!-- FRONT CARD -->
        <div class="base-kartunama px-2 py-0 position-relative">
            <div class="container-fluid py-0">
                <div class="col-12 mt-4 py-0">
                    <div class="col-12 py-0 pb-3" style="margin-left: -10px;">
                        <img src="${ASSET_BASE}/logo-indofoodcbp-cbp.png" class="logo-kartunama" alt="Indofood CBP" />
                    </div>

                    <div class="container-fluid ps-2 py-2">
                        <div class="row px-0 " style="margin-top: 25px;">
                            <div class="col-6 px-0 py-0">
                                <div class="container-fluid py-0">
                                    <div class="row py-0">
                                        <div class="col-12 fw-bold nama-kartunama" style="margin-bottom: 2px;">
                                            ${data.name}
                                        </div>
                                        <div class="col-12 fs-18px" style="margin-bottom: 2px;">
                                            ${data.position}
                                        </div>
                                        <div class="col-12 fs-20px" style="margin-bottom: 15px;">
                                            International Operations Division
                                        </div>
                                        <div class="col-12 fs-18px" style="margin-bottom: 2px;">
                                            ${data.cellPhone || ''}
                                        </div>
                                        <div class="col-12 ${emailFontSize}">
                                            ${data.email}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-6 px-0 py-0">
                                <div class="container-fluid py-0 px-0">
                                    <div class="row">
                                        <div class="col-12 perusahaan-kartunama pe-0 no-gap-print">
                                            <img src="${ASSET_BASE}/PT-Indofood-cbp-Sukses-Makmur.png" class="logo-kartunama" style="width: 93%;" />
                                        </div>
                                        <div style="margin-top: 8px;">
                                            <div class="col-12 fs-22px" style="margin-bottom: 1px; margin-top: 8px;">Sudirman Plaza</div>
                                            <div class="col-12 fs-22px" style="margin-bottom: 1px;">Indofood Tower, 23<sup>rd</sup> Floor</div>
                                            <div class="col-12 fs-22px" style="margin-bottom: 1px;">Jl. Jend. Sudirman Kav. 76 - 78</div>
                                            <div class="col-12 fs-22px" style="margin-bottom: 1px;">Jakarta 12910, Indonesia</div>
                                            <div class="col-12 fs-22px" style="margin-bottom: 1px;">T. +6221 5795 8822${data.extPhone && parseInt(data.extPhone) >= 1000 ? ' ext.' + data.extPhone : ''}</div>
                                            <div class="col-12 fs-22px" style="margin-bottom: 1px;">F. +6221 5793 7422</div>
                                            <div class="col-12 fs-22px">www.indofoodcbp.com</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-12 w-100 position-absolute bottom-0 start-0 footer-kartunama"></div>
        </div>

        <!-- BACK CARD -->
        <div class="base-kartunama position-relative">
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: calc(100% - 17.00787px); padding-top: 11.33px; box-sizing: border-box;">
                ${data.qr_code_url
            ? `<img src="${data.qr_code_url}" style="width:100px;height:100px;margin-bottom:10px;" />`
            : `<div style="width:100px;height:100px;background:#f8f8f8;border:1px solid #ddd;display:flex;align-items:center;justify-content:center;font-size:10px;color:#999;margin-bottom:10px;">QR Code</div>`
        }
                <div class="text-subsidiary" style="margin-bottom:8px;">a subsidiary of:</div>
                <img src="${ASSET_BASE}/logo-indofood.png" style="width:170px;" />
            </div>
            <div class="w-100 position-absolute bottom-0 start-0 footer-kartunama"></div>
        </div>
    </div>
</body>
</html>
    `;
};
