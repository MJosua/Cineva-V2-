const authController = require('./OnlineOrder/auth');
// const authTmController = require('./authTM'); // Decommissioned
const cartController = require('./OnlineOrder/cart');
const userController = require('./user');
const orderController = require('./OnlineOrder/order');
const debug_controller = require('./debug_controller');
const eventController = require('./OnlineOrder/event');
const productController = require('./OnlineOrder/product');
const adminController = require('./admin');
const spectatorController = require('./OnlineOrder/spectator');
// const trademarkController = require('./trademark'); // Decommissioned
const authControllerTest = require('./auth_test');
const productControllerTest = require('./debug_controller')

const cardGenerator = require('./cardGenerator')

//hots 

const hotsAuth = require('./hots_controller/auth/controllers/authController'); // HOTS authentication (organized in auth folder)
const hotsAdmin = require('./hots_controller/admin/controllers/adminController'); // 🔧 Phase 5: Moved to module
const hotsTicket = require('./hots_controller/_old/hotsTicket_legacy'); // 🔧 Reorganized: moved to _old
const hotsUserManagement = require('./hots_controller/settings/controllers/UserManagementController');
const hotsServiceCatalog = require('./hots_controller/settings/controllers/ServiceCatalogController');
const hotsWorkflowConfig = require('./hots_controller/settings/controllers/WorkflowConfigController');
const hotsMetadata = require('./hots_controller/settings/controllers/MetadataController');
const hotsSystemUtility = require('./hots_controller/settings/controllers/SystemUtilityController');
const hotsTps = require('./hots_controller/tps/controllers/tpsController'); // 🔧 Phase 5: Moved to module
const hotscustomfunctionController = require('./hots_controller/customfunction/controllers/customfunctionController'); // 🔧 Phase 5: Moved to module
const hotsSRFController = require('./hots_controller/srf/controllers/srfController'); // 🔧 Phase 5: Moved to module
const hotsPublicController = require('./hots_controller/public/controllers/publicController'); // 🔧 Phase 5: Moved to module


const shortenerController = require('./shortener/shortenerController')


const srtsController = require('./searates/srtsController')

// Project Manager controllers

const projectmngr_task = require('./project_manager_controller/task_controller')
const projectmngr_project = require('./project_manager_controller/project_controller')
const projectmngr_gantt = require('./project_manager_controller/gantt_controller')
const projectmngr_kanban = require('./project_manager_controller/kanban_controller')
const projectmngr_approval = require('./project_manager_controller/approval_controller')
const projectmngr_department = require('./project_manager_controller/department_controller')
const projectmngr_team = require('./project_manager_controller/team_controller')
const projectmngr_dashboard = require('./project_manager_controller/dashboard_controller');
const hotsDashboardController = require('./hots_controller/dashboard/controllers/dashboardController'); // 🔧 Phase 5: Moved to module

// Coupon System
const couponController = require('./couponController');



module.exports = {
    authController,
    // authTmController, // Decommissioned
    cartController,
    userController,
    orderController,
    eventController,
    productController,
    adminController,
    spectatorController,
    // trademarkController, // Decommissioned
    authControllerTest,
    productControllerTest,
    cardGenerator,

    shortenerController,

    // hots
    hotsTps,
    hotscustomfunctionController,
    hotsSRFController,
    hotsAuth,
    hotsAdmin,
    hotsTicket,
    hotsUserManagement,
    hotsServiceCatalog,
    hotsWorkflowConfig,
    hotsMetadata,
    hotsSystemUtility,
    hotsDashboardController,
    hotsPublicController,


    // searates
    srtsController,

    // Project Manager controllers
    projectmngr_task,
    projectmngr_project,
    projectmngr_gantt,
    projectmngr_kanban,
    projectmngr_approval,
    projectmngr_department,
    projectmngr_team,
    projectmngr_dashboard,

    // Coupon System
    couponController
};