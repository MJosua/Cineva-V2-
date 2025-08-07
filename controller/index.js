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

const hotsAuth = require('./hots_controller/hotsAuth')
const hotsAdmin = require('./hots_controller/hotsAdmin')
const hotsTicket = require('./hots_controller/hotsTicket')
const hotsSettingsController = require('./hots_controller/hotsSettingsController')
const hotsTps = require('./hots_controller/hotsTps')
const hotscustomfunctionController = require('./hots_controller/hotscustomfunctionController')
const hotsSRFController = require('./hots_controller/hotsSRFController');

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
const projectmngr_dashboard = require('./project_manager_controller/dashboard_controller')



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
    hotsAuth,
    hotsAdmin,
    hotsTicket,
    hotsSettingsController,
    shortenerController,
    hotsTps,
    hotscustomfunctionController,
    hotsSRFController,


    srtsController,

    // Project Manager controllers
    projectmngr_task,
    projectmngr_project,
    projectmngr_gantt,
    projectmngr_kanban,
    projectmngr_approval,
    projectmngr_department,
    projectmngr_team,
    projectmngr_dashboard
};