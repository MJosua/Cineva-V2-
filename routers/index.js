
/**
 * @swagger
 * tags:
 *   - name: E-Order
 *     description: E-Order APIs
 *   - name: Hots
 *     description: Hots APIs
 *   - name: CardManagement
 *     description: CardManagement APIs
 *   - name: TM-Management
 *     description: TradeMark APIs
 *   - name: Shortener
 *     description: Shortener for Click APIs
 */

const authRouter = require('./auth')
const authTmRouter = require('./authTM')
const cartRouter = require('./cart')
const userRouter = require('./user')
const orderRouter = require('./order')
const eventRouter = require('./event')
const productRouter = require('./product')
const adminRouter = require('./admin')
const spectatorRouter = require('./spectator')
const trademarkRouter = require('./trademark')
const authRouterTest = require('./auth_test')
const productRouterTest = require('./product_test')
const cardGenerator = require('./cardGenerator')

const shortener = require('./shortener')
const srtsRouter = require('./searates/srtsRouter')

// HOTS
const hotsTps = require('./hots/hotsTps')
const hotsAuth = require('./hots/hotsAuth')
const hotsAdmin = require('./hots/hotsAdmin')
const hotsTicket = require('./hots/hotsTicket')
const hotsSettings = require('./hots/hotsSettings')
const hotscustomfunction = require('./hots/hotscustomfunction')
const hotsdashboard = require('./hots/hotsdashboard')
const hotspublic = require('./hots/hotsPublic')

// Project Manager routes
const projectmngr = require('./project_manager/project_routes')
const taskmngr = require('./project_manager/task_routes')
const ganttmngr = require('./project_manager/gantt_routes')
const kanbanmngr = require('./project_manager/kanban_routes')
const approvalmngr = require('./project_manager/approval_routes')
const departmentmngr = require('./project_manager/department_routes')
const teammngr = require('./project_manager/team_routes')
const taskstepsmngr = require('./project_manager/task_steps_routes')
const pmdashboard = require('./project_manager/dashboard_routes')
const projectcommentmngr = require('./project_manager/project_comment_routes')
const projecttemplatemngr = require('./project_manager/project_template_routes')
const notificationmngr = require('./project_manager/notification_routes')
const timetrackingmngr = require('./project_manager/time_tracking_routes')
const usermngr = require('./project_manager/user_routes')
const rolemngr = require('./project_manager/role_routes')


//booking manager
const mbbookings = require('./meetingbook/bookings')
const mbdayColors = require('./meetingbook/dayColors')
const mbrooms = require('./meetingbook/rooms')
const mbsettings = require('./meetingbook/settings')
const mbtimeslots = require('./meetingbook/timeslots')
const mbusers = require('./meetingbook/users')

const engineRouter = require('./engine/engineTicket')
const engineModuleRouter = require('./engine/engineModuleRouter')
const workflowadminRouter = require('./engine/workflowAdminRouters')
const engineWorkDataRouter = require('./engine/engineWorkData')
const engineAssignmentRouter = require('./engine/engineAssignment')
const cmsRouter = require('./cms/cmsRouter');

module.exports = {
    authRouter,
    authTmRouter,
    cartRouter,
    userRouter,
    orderRouter,
    productRouter,
    adminRouter,
    spectatorRouter,
    trademarkRouter,
    authRouterTest,
    productRouterTest,
    cardGenerator,
    eventRouter,
    shortener,

    srtsRouter,

    // hots
    hotsTps,
    hotscustomfunction,
    hotsAuth,
    hotsAdmin,
    hotsTicket,
    hotsSettings,
    hotsdashboard,
    hotspublic,


    // Project Manager modules
    projectmngr,
    taskmngr,
    ganttmngr,
    kanbanmngr,
    approvalmngr,
    departmentmngr,
    teammngr,
    taskstepsmngr,
    pmdashboard,
    projectcommentmngr,
    projecttemplatemngr,
    notificationmngr,
    timetrackingmngr,
    usermngr,
    rolemngr,


    //meetingbook
    mbbookings,
    mbdayColors,
    mbrooms,
    mbsettings,
    mbtimeslots,
    mbusers,


    engineRouter,
    engineModuleRouter,
    workflowadminRouter,
    engineWorkDataRouter,
    engineAssignmentRouter,
    cmsRouter,

}
