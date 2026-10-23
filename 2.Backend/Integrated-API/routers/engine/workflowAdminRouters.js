const express = require("express");
const router = express.Router();
const ctrl = require("../../controller/hots_controller/engine/workflowAdminController");

// STATIC ROUTES FIRST
router.post("/add", ctrl.create);
router.get("/params/:workflow_id", ctrl.getParams);
router.post("/params/:workflow_id", ctrl.addParam);

// DEFINITION ROUTES (for Visual Workflow Editor)
router.get("/definition/:service_id", ctrl.getDefinition);
router.post("/definition/:service_id", ctrl.saveDefinition);
router.put("/definition/:service_id", ctrl.saveDefinition);

// DYNAMIC WITH ID
router.put("/:workflow_id", ctrl.update);
router.delete("/:workflow_id", ctrl.remove);

// THIS MUST BE LAST
router.get("/:service_id", ctrl.list);

module.exports = router;

