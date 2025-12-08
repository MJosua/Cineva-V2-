// routers/engine/triggerRouters.js
const express = require("express");
const router = express.Router();
const ctrl = require("../../controller/engine/triggerController");

// List all triggers for a service
router.get("/:service_id", ctrl.list);

// Save all triggers for a service (replace all)
router.post("/:service_id", ctrl.saveAll);

// Add a single trigger
router.post("/:service_id/add", ctrl.add);

// Update a single trigger
router.put("/:service_id/:trigger_id", ctrl.update);

// Delete a single trigger
router.delete("/:service_id/:trigger_id", ctrl.remove);

module.exports = router;
