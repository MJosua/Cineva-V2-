const eventEngineService = require('../service/eventEngineService');
const XLSX = require('xlsx');

async function debugExport() {
    const slug = 'taiwan';
    console.log(`Testing export for slug: ${slug}...`);

    try {
        const data = await eventEngineService.getSubmissionsForExport(slug);
        console.log(`Submissions found: ${data.length}`);

        if (data.length > 0) {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const csv = XLSX.utils.sheet_to_csv(worksheet);
            console.log("CSV Preview (first 2 lines):");
            console.log(csv.split('\n').slice(0, 2).join('\n'));
            console.log("✅ CSV generation logic works.");
        } else {
            console.log("❌ No submissions found in DB for this slug.");
        }
    } catch (e) {
        console.error("Export Error:", e);
    }
    process.exit(0);
}

debugExport();
