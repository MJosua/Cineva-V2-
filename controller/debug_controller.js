
const { dbIndomieku, dbQueryIndomieku: dbQuery, dbConf } = require("../config/db");

let gray = "\x1b[90m"

module.exports = {

    // Debug Registry
    debugFunctions: {
        "echo_test": {
            name: "Echo Test",
            description: "Simply returns the data you send to verify connectivity.",
            inputs: [
                { name: "message", type: "text", label: "Message to Echo" },
                { name: "repeat", type: "number", label: "Repeat Count" }
            ],
            handler: async (data, context) => {
                const msg = data.message || "Hello";
                const count = parseInt(data.repeat) || 1;
                return {
                    original: data,
                    result: msg.repeat(count),
                    serverTime: new Date().toISOString()
                };
            }
        },
        "database_check": {
            name: "Database Check",
            description: "Check if database connection is alive (simple query).",
            inputs: [],
            handler: async (data, { dbQuery }) => {
                try {
                    const res = await dbQuery("SELECT 1 as val");
                    return { status: "OK", result: res };
                } catch (e) {
                    return { status: "ERROR", error: e.message };
                }
            }
        },

    },

    getDebugUI: (req, res) => {
        console.log("🛠️ [DEBUG ROUTER] getDebugUI called");
        res.setHeader("Content-Security-Policy", "script-src 'self' 'unsafe-inline'");
        const uiHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Debug Router UI</title>
    <style>
        :root { --primary-color: #3b82f6; --bg-color: #0f172a; --text-color: #e2e8f0; --card-bg: #1e293b; }
        body { font-family: -apple-system, system-ui, sans-serif; background: var(--bg-color); color: var(--text-color); margin: 0; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 300px 1fr; gap: 20px; }
        h1 { grid-column: 1 / -1; margin-bottom: 20px; border-bottom: 1px solid #334155; padding-bottom: 10px; }
        .sidebar { background: var(--card-bg); padding: 15px; border-radius: 8px; height: fit-content; }
        .function-list { list-style: none; padding: 0; }
        .function-item { padding: 10px; cursor: pointer; border-radius: 4px; margin-bottom: 5px; transition: background 0.2s; }
        .function-item:hover { background: #334155; }
        .function-item.active { background: var(--primary-color); color: white; }
        .main-panel { background: var(--card-bg); padding: 20px; border-radius: 8px; min-height: 400px; }
        .input-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: 500; font-size: 0.9em; color: #94a3b8; }
        input, textarea, select { width: 100%; padding: 8px; background: #0f172a; border: 1px solid #334155; border-radius: 4px; color: white; box-sizing: border-box; }
        input:focus { outline: none; border-color: var(--primary-color); }
        button.run-btn { background: var(--primary-color); color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; width: 100%; margin-top: 10px; }
        button.run-btn:hover { opacity: 0.9; }
        pre { background: #0f172a; padding: 15px; border-radius: 4px; overflow-x: auto; color: #a5b4fc; margin-top: 20px; border: 1px solid #334155; }
        .placeholder { color: #64748b; text-align: center; margin-top: 100px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛠️ Debug Router Dashboard</h1>
        
        <div class="sidebar">
            <h3>Available Functions</h3>
            <ul class="function-list" id="funcList">
                <li style="text-align:center; color:#64748b">Loading...</li>
            </ul>
        </div>

        <div class="main-panel" id="mainPanel">
            <div class="placeholder">Select a function from the sidebar to begin testing</div>
        </div>
    </div>

    <script>
        let currentFunc = null;

        // Fetch functions on load
        fetch('/debugRouter/list')
            .then(res => {
                 if (!res.ok) throw new Error('HTTP ' + res.status);
                 return res.json();
            })
            .then(list => {
                const listEl = document.getElementById('funcList');
                listEl.innerHTML = '';
                list.forEach(func => {
                    const li = document.createElement('li');
                    li.className = 'function-item';
                    li.innerText = func.name;
                    li.onclick = () => selectFunction(func, li);
                    listEl.appendChild(li);
                });
            })
            .catch(err => {
                const listEl = document.getElementById('funcList');
                listEl.innerHTML = '<li style="color:red; text-align:center">Error loading functions:<br>' + err.message + '</li>';
                console.error("DEBUG UI ERROR:", err);
                alert("Failed to load functions: " + err.message);
            });

        function selectFunction(func, el) {
            currentFunc = func;
            
            // Highlight sidebar
            document.querySelectorAll('.function-item').forEach(i => i.classList.remove('active'));
            el.classList.add('active');

            // Render form
            const panel = document.getElementById('mainPanel');
            let formHtml = \`<h2>\${func.name}</h2>
                          <p style="color:#94a3b8; margin-bottom:20px">\${func.description}</p>
                          <form id="runForm">\`;

            func.inputs.forEach(input => {
                formHtml += \`
                    <div class="input-group">
                        <label>\${input.label || input.name} <span style="font-family:monospace; opacity:0.7">(\${input.name})</span></label>
                        \`;
                if (input.type === 'textarea' || input.type === 'json') {
                    formHtml += \`<textarea name="\${input.name}" rows="4" placeholder="\${input.type === 'json' ? '{}' : ''}"></textarea>\`;
                } else {
                    formHtml += \`<input type="\${input.type || 'text'}" name="\${input.name}">\`;
                }
                formHtml += \`</div>\`;
            });

            formHtml += \`<button type="submit" class="run-btn">Run Function 🚀</button></form>
                         <div id="outputArea"></div>\`;
            
            panel.innerHTML = formHtml;

            // Handle submission
            document.getElementById('runForm').onsubmit = runFunction;
        }

        async function runFunction(e) {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            const outputDiv = document.getElementById('outputArea');
            
            btn.disabled = true;
            btn.innerText = 'Running...';
            outputDiv.innerHTML = '<p style="color:#94a3b8; text-align:center">Processing...</p>';

            const formData = new FormData(e.target);
            const data = {};
            
            // Helper to parse potential JSON inputs
            for (let [key, val] of formData.entries()) {
                const inputDef = currentFunc.inputs.find(i => i.name === key);
                if (inputDef && inputDef.type === 'json') {
                    try {
                        data[key] = JSON.parse(val || '{}');
                    } catch (err) {
                        alert('Invalid JSON for field: ' + key);
                        btn.disabled = false;
                        btn.innerText = 'Run Function 🚀';
                        return;
                    }
                } else {
                    data[key] = val;
                }
            }

            try {
                const res = await fetch('/debugRouter/run/' + currentFunc.key, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                const result = await res.json();
                
                // Colorize output based on success (heuristic)
                const isError = result.success === false || result.status === 'ERROR';
                const borderColor = isError ? '#ef4444' : '#22c55e';
                
                outputDiv.innerHTML = \`<pre style="border-color: \${borderColor}">\${JSON.stringify(result, null, 2)}</pre>\`;

            } catch (err) {
                outputDiv.innerHTML = \`<pre style="border-color: #ef4444">Client Error: \${err.message}</pre>\`;
            } finally {
                btn.disabled = false;
                btn.innerText = 'Run Function 🚀';
            }
        }
    </script>
</body>
</html>
        `;
        res.send(uiHtml);
    },

    getFunctions: (req, res) => {
        console.log("🛠️ [DEBUG ROUTER] getFunctions called");
        const list = Object.entries(module.exports.debugFunctions).map(([key, val]) => ({
            key: key,
            name: val.name,
            description: val.description,
            inputs: val.inputs
        }));
        res.json(list);
    },

    runFunction: async (req, res) => {
        const funcKey = req.params.funcName;
        const funcDef = module.exports.debugFunctions[funcKey];

        if (!funcDef) {
            return res.status(404).json({ success: false, message: "Function not found" });
        }

        try {
            // Provide context (like DB)
            const context = {
                dbQuery: dbQuery, // from imported scope (need to ensure it's available)
                // Add more context as needed
            };

            const result = await funcDef.handler(req.body, context);
            res.json({ success: true, result });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message, stack: error.stack });
        }
    },

    // Existing addOrder...


    addOrderDebug: async (req, res, next) => {

        console.log("\n================ ADD ORDER DEBUGGER ================");

        const date = new Date();
        const timestamp = date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id');

        const { user_id, company_id, active, employee_id } = req.dataToken;
        const order = req.body.order;

        /* =====================================================
         * BASIC INPUT LOG
         * ===================================================== */
        console.log("\n[STEP 1] TOKEN DATA");
        console.table([{ user_id, company_id, employee_id, active }]);

        if (!order || order.length === 0) {
            console.log("❌ ORDER EMPTY");
            return res.status(500).json({ debug: true, message: "Order empty" });
        }

        console.log("\n[STEP 2] RAW ORDER PAYLOAD");
        console.log(order);

        if (active !== 1) {
            console.log("❌ USER INACTIVE");
            return res.status(500).json({ debug: true, message: "User inactive" });
        }

        /* =====================================================
         * ORDER ID SIMULATION (NO DB)
         * ===================================================== */
        const year = order[0].delv_year || new Date().getFullYear();
        const yearPrefix = String(year).slice(2, 4);
        const baseOrderId = Number(`${yearPrefix}00${company_id}00000`);

        console.log("\n[STEP 3] ORDER ID GENERATION");
        console.table([{ year, company_id, baseOrderId }]);

        /* =====================================================
         * FLOW WALK
         * ===================================================== */
        let orderIndex = 0;
        let simulatedOrderIds = [];

        for (const order_data of order) {

            orderIndex++;
            const order_id = baseOrderId + orderIndex;
            simulatedOrderIds.push(order_id);

            console.log("\n----------------------------------------------");
            console.log(`[ORDER ${orderIndex}] HEADER`);
            console.table([{
                order_id,
                po_buyer: order_data.po_buyer,
                delv_year: order_data.delv_year,
                stuffing_date: order_data.stuffing_date,
                port_shipment: order_data.port_shipment,
                ship_to: order_data.ship_to,
                tolling_id: order_data.tolling_id
            }]);

            /* ================= DETAILS ================= */
            console.log(`[ORDER ${orderIndex}] DETAILS`);

            if (!order_data.detail || order_data.detail.length === 0) {
                console.log("⚠️ NO DETAILS");
            } else {
                order_data.detail.forEach((detail, dIndex) => {
                    console.table([{
                        detail_index: dIndex + 1,
                        detail_id: detail.detail_id,
                        cont_size: detail.cont_size,
                        cont_qty: detail.cont_qty,
                        bulk: detail.bulk,
                        custom: detail.custom
                    }]);

                    if (detail.Flavour && detail.Flavour.length) {
                        console.log("FLAVOURS");
                        console.table(detail.Flavour.map((f, i) => ({
                            flavour_index: i + 1,
                            sku: f?.sku || 0,
                            qty: f?.qty || 0
                        })));
                    } else {
                        console.log("⚠️ NO FLAVOURS");
                    }
                });
            }

            /* ================= SUMMARY ================= */
            console.log(`[ORDER ${orderIndex}] SUMMARY`);

            if (!order_data.summary || order_data.summary.length === 0) {
                console.log("⚠️ NO SUMMARY");
            } else {
                console.table(order_data.summary.map(s => ({
                    detail_id: s.detail_id,
                    sku: s.sku,
                    qty: s.qty
                })));
            }

            /* ================= NEXT FLOW ================= */
            console.log(`[ORDER ${orderIndex}] NEXT STEPS (NOT EXECUTED)`);
            console.table([
                { step: "Generate SO", order_id },
                { step: "Send Mail", to_employee: employee_id },
                { step: "Commit Transaction", status: "SKIPPED (DEBUG)" }
            ]);
        }

        /* =====================================================
         * END
         * ===================================================== */
        console.log("\n================ DEBUG FLOW END ======================");
        console.log("SIMULATED ORDER IDS:");
        console.table(simulatedOrderIds.map(id => ({ order_id: id })));

        /* =====================================================
         * FORCE ERROR SO YOU CAN RETRY
         * ===================================================== */
        return res.status(500).json({
            debug: true,
            message: "DEBUG MODE — no data persisted",
            simulated_order_ids: simulatedOrderIds
        });
    }
};







