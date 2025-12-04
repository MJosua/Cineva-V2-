const express = require("express");
const router = express.Router();
const ctrl = require("../../controller/engine/workflowAdminController");

// STATIC ROUTES FIRST
router.post("/add", ctrl.create);
router.get("/params/:workflow_id", ctrl.getParams);
router.post("/params/:workflow_id", ctrl.addParam);

// DYNAMIC WITH ID
router.put("/:workflow_id", ctrl.update);
router.delete("/:workflow_id", ctrl.remove);

// THIS MUST BE LAST
router.get("/:service_id", ctrl.list);

module.exports = router;
