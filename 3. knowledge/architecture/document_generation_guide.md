# Document Generation Standard Workflow

This guide outlines the **"One Template, One Engine"** architecture for generating documents (SRF, Cards, Invoices, etc.). Adhering to this standard ensures that HTML previews (Virtual Documents) and PDF downloads (Physical Documents) are always identical.

## Core Architecture

1.  **Renderer (`core/renderers/*.js`)**: Pure function. Takes a JSON object -> Returns HTML string.
2.  **Preparer (`core/document-data-preparer.js`)**: Fetches DB data or processes Snapshots -> Returns standard JSON object for Renderer.
3.  **Engine (`core/document-engine.js`)**: Orchestrates the flow. Calls Preparer -> Calls Renderer.
4.  **Trigger (`script/trigger-functions/*.js`)**: captures Snapshot data at specific workflow steps.
5.  **Specific Implementations**:
    - [Business Card Generator Guide](file:///d:/GIT-Based-Backend/Integrated-API.worktrees/AntiGravityWorktree/knowledge/business-card-generator-guide.md)

---

## The 5-Step Implementation Process

### 1. Create the Renderer
Create a file in `core/renderers/[name]-renderer.js`.
*   **Input**: A single `data` object.
*   **Output**: A clean HTML string.
*   **Rules**:
    *   NO database calls.
    *   NO async logic.
    *   Use exact field names (e.g., `data.requester_name`, `data.signature_url`).

```javascript
// core/renderers/card-renderer.js
module.exports = function renderCardHtml(data) {
    return `
    <html>
        <body>
            <h1>${data.employee_name}</h1>
            <img src="${data.qr_code_url}" />
        </body>
    </html>`;
};
```

### 2. Update the Data Preparer
Edit `core/document-data-preparer.js`. Add a function `prepare[Name]Data`.
*   **Purpose**: Resolve IDs to Names, fetch Base64 images, format dates.
*   **Crucial Pattern**: Handle both **Snapshot** (Virtual) and **Live** (Physical) modes.

```javascript
// core/document-data-preparer.js
async function prepareCardData(entityId, { db, eventSnapshot = null }) {
    let rawData;

    // A. SNAPSHOT SOURCE (Virtual Docs)
    if (eventSnapshot) {
         // Use frozen data from snapshot
         rawData = eventSnapshot;
    } 
    // B. DATABASE SOURCE (Physical Docs / New Generation)
    else {
         // Query DB for live data
         rawData = await db.query('SELECT ... FROM cards WHERE id = ?', [entityId]);
    }

    // C. RESOLVE & ENRICH (Common Path)
    // Always resolve IDs to names/images here, regardless of source
    return {
        employee_name: await resolveName(rawData.user_id), // Helper to fetch name from DB
        qr_code_url: await generateQRCode(rawData.qr_string),
        generated_at: new Date().toISOString()
    };
}
```

### 3. Register in Document Engine
Update `core/document-engine.js` method `renderHtml`.

```javascript
// core/document-engine.js
const { prepareCardData } = require('./document-data-preparer');
const renderCardHtml = require('./renderers/card-renderer');

async renderHtml(documentId) {
    // ... get document ...
    switch (doc.template_name) {
        case 'card':
            // ROUTE THROUGH PREPARER!
            const cardData = await prepareCardData(doc.entity_id, {
                db: dbHots,
                eventSnapshot: doc.snapshot_data // Pass snapshot for virtual docs
            });
            html = renderCardHtml(cardData);
            break;
    }
}
```

### 4. Create/Update Trigger
Create `script/trigger-functions/[name]_generator.js`.
*   **Purpose**: Save the **Snapshot** when a workflow event occurs.
*   **Action**: Call `documentEngine.createDocument`.

```javascript
// script/trigger-functions/card_generator.js
await documentEngine.createDocument({
    template_name: 'card',
    entity_id: ticketId,
    snapshot_data: { ...current_data_state } // Save RAW state
});
```

### 5. Update Controller (Physical PDF)
When generating a PDF for download (fresh), call the preparer directly.

```javascript
// controller/.../cardController.js
const { prepareCardData } = require('../core/document-data-preparer');
const renderCardHtml = require('../core/renderers/card-renderer');

// 1. Prepare Data (Force Live DB fetch by omitting eventSnapshot)
const data = await prepareCardData(cardId, { db: dbHots });

// 2. Render HTML
const html = renderCardHtml(data);

// 3. Generate PDF (Puppeteer)
// ... use helper or existing PDF logic ...
```

---

## Migration Checklist (Example: Card Generator)

1.  [ ] **Extract HTML**: Copy existing HTML generation logic from `cardGenerator.js` (or frontend) into `core/renderers/card-renderer.js`.
2.  [ ] **Centralize Data**: Move data fetching queries into `prepareCardData` in `document-data-preparer.js`.
3.  [ ] **Hook Engine**: Add `'card'` case to `document-engine.js` calling the above two.
4.  [ ] **Update Trigger**: Ensure `card_generator` saves the snapshot.
5.  [ ] **Refactor Controller**: Make the download endpoint use the new `prepareCardData` + `renderCardHtml` flow.
