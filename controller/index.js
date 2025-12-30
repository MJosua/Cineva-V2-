const authController = require('./auth');
const authTmController = require('./authTM');
const cartController = require('./cart');
const userController = require('./user');
const orderController = require('./order');
const eventController = require('./event');
const productController = require('./product');
const adminController = require('./admin');
const spectatorController = require('./spectator');
const trademarkController = require('./trademark')
const authControllerTest = require('./auth_test')
const productControllerTest = require('./product_test')

const cardGenerator = require('./cardGenerator')

//hots 

const hotsAuth = require('./hots_controller/auth/controllers/authController'); // 🔧 Phase 5: Moved to module
const hotsAdmin = require('./hots_controller/admin/controllers/adminController'); // 🔧 Phase 5: Moved to module
const hotsTicket = require('./hots_controller/ticketing/controllers/ticketController'); // 🔧 Reorganized: moved under hots_controller
const hotsSettingsController = require('./hots_controller/settings/controllers/settingsController'); // 🔧 Phase 5: Moved to module
const hotsTps = require('./hots_controller/tps/controllers/tpsController'); // 🔧 Phase 5: Moved to module
const hotscustomfunctionController = require('./hots_controller/customfunction/controllers/customfunctionController'); // 🔧 Phase 5: Moved to module
const hotsSRFController = require('./hots_controller/srf/controllers/srfController'); // 🔧 Phase 5: Moved to module
const hotsPublicController = require('./hots_controller/public/controllers/publicController'); // 🔧 Phase 5: Moved to module


const shortenerController = require('./shortenerController')


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
    authTmController,
    cartController,
    userController,
    orderController,
    eventController,
    productController,
    adminController,
    spectatorController,
    trademarkController,
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
    hotsSettingsController,
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