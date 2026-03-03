# Backend Project Analysis

## Summary of files

- .git
- .gitignore
- index.js
- package-lock.json
- package.json
- README.md
- testing-utils.js
- config/db.js
- config/encrypts.js
- config/env.js
- config/hotsCheckApprovalLevel.js
- config/layout.html
- config/pdf.js
- config/uploader.js
- config/key/star_indofoodinternational_com_2026_2.pfx
- controller/admin.js
- controller/auth.js
- controller/authTM.js
- controller/auth_test.js
- controller/cardGenerator.js
- controller/cart.js
- controller/event.js
- controller/index.js
- controller/order.js
- controller/product.js
- controller/product_test.js
- controller/reporting.js
- controller/serverOrder.js
- controller/shortenerController.js
- controller/spectator.js
- controller/trademark.js
- controller/user.js
- controller/cms/cmsController.js
- controller/engine/engineAssignment.js
- controller/engine/engineTicket.js
- controller/engine/engineWorkData.js
- controller/engine/moduleController.js
- controller/engine/moduleRuntimeController.js
- controller/engine/workflowAdminController.js
- controller/hots_controller/hotsAdmin.js
- controller/hots_controller/hotsAuth.js
- controller/hots_controller/hotscustomfunctionController.js
- controller/hots_controller/hotsDashboardController.js
- controller/hots_controller/hotsPublicController.js
- controller/hots_controller/hotsSettingsController.js
- controller/hots_controller/hotsSRFController.js
- controller/hots_controller/hotsTicket.js
- controller/hots_controller/hotsTps.js
- controller/hots_controller/Untitled-2.json
- controller/project_manager_controller/approval_controller.js
- controller/project_manager_controller/dashboard_controller.js
- controller/project_manager_controller/department_controller.js
- controller/project_manager_controller/gantt_controller.js
- controller/project_manager_controller/kanban_controller.js
- controller/project_manager_controller/notification_controller.js
- controller/project_manager_controller/project_comment_controller.js
- controller/project_manager_controller/project_controller.js
- controller/project_manager_controller/project_template_controller.js
- controller/project_manager_controller/role_controller.js
- controller/project_manager_controller/task_controller.js
- controller/project_manager_controller/task_steps_controller.js
- controller/project_manager_controller/teamJoinRequestController.js
- controller/project_manager_controller/team_controller.js
- controller/project_manager_controller/time_tracking_controller.js
- controller/project_manager_controller/user_controller.js
- controller/searates/srtsController.js
- core/document-engine.js
- core/engine-loader.js
- core/form-loader.js
- core/init-engines.js
- core/loader.js
- core/trigger-engine.js
- core/workflow-engine.js
- refrence/dump-hots-202511281443.sql
- routers/admin.js
- routers/auth.js
- routers/authTM.js
- routers/auth_test.js
- routers/cardGenerator.js
- routers/cart.js
- routers/engine.js
- routers/event.js
- routers/index.js
- routers/order.js
- routers/product.js
- routers/product_test.js
- routers/shortener.js
- routers/spectator.js
- routers/trademark.js
- routers/user.js
- routers/cms/cmsRouter.js
- routers/engine/engineAssignment.js
- routers/engine/engineModuleRouter.js
- routers/engine/engineTicket.js
- routers/engine/engineWorkData.js
- routers/engine/workflowAdminRouters.js
- routers/hots/hotsAdmin.js
- routers/hots/hotsAuth.js
- routers/hots/hotscustomfunction.js
- routers/hots/hotsdashboard.js
- routers/hots/hotsPublic.js
- routers/hots/hotsSettings.js
- routers/hots/hotsTicket.js
- routers/hots/hotsTps.js
- routers/meetingbook/bookings.js
- routers/meetingbook/dayColors.js
- routers/meetingbook/rooms.js
- routers/meetingbook/settings.js
- routers/meetingbook/timeslots.js
- routers/meetingbook/users.js
- routers/project_manager/approval_routes.js
- routers/project_manager/dashboard_routes.js
- routers/project_manager/department_routes.js
- routers/project_manager/gantt_routes.js
- routers/project_manager/index.js
- routers/project_manager/kanban_routes.js
- routers/project_manager/notification_routes.js
- routers/project_manager/project_comment_routes.js
- routers/project_manager/project_routes.js
- routers/project_manager/project_template_routes.js
- routers/project_manager/role_routes.js
- routers/project_manager/task_routes.js
- routers/project_manager/task_steps_routes.js
- routers/project_manager/team_routes.js
- routers/project_manager/time_tracking_routes.js
- routers/project_manager/user_routes.js
- routers/searates/srtsRouter.js
- script/trigger-functions/publishJobListing.js
- script/Utility/consoleinfo.js
- script/Utility/DateFormat.js
- service/automation/cleanup.js
- service/automation/index.js
- service/automation/notification.js
- service/automation/trademarkMgmt.js
- service/automation/meetingbook/automatemb.js
- service/mailer/eorder/eorder_mailer.js
- service/mailer/hots/hots_mailer.js
- service/mailer/meetingbook/meetingbookmailer.js

## package.json

{
  "name": "iod_e-order_expressjs",
  "version": "1.0.0",
  "dependencies": {
    "archiver": "^7.0.1",
    "axios": "^1.7.2",
    "bcrypt": "^6.0.0",
    "body-parser": "^1.20.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.1",
    "ejs": "^3.1.9",
    "express": "^4.18.1",
    "express-bearer-token": "^3.0.0",
    "express-session": "^1.17.3",
    "helmet": "^7.0.0",
    "html-pdf-node": "^1.0.8",
    "jsonwebtoken": "^9.0.1",
    "multer": "^1.4.5-lts.1",
    "mustache": "^4.2.0",
    "mysql": "^2.18.1",
    "mysql2": "^3.2.4",
    "nanoid": "^5.0.7",
    "node-cron": "^3.0.3",
    "node-fetch": "^3.3.2",
    "nodemailer": "^6.10.1",
    "passport": "^0.6.0",
    "passport-google-oauth": "^2.0.0",
    "puppeteer": "^24.10.2",
    "readline": "^1.3.0",
    "socket.io": "^4.8.0",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.1",
    "xlsx": "^0.18.5"
  },
  "scripts": {
    "start": "node index.js",
    "nodemon": "nodemon --exec \"node --max-old-space-size=6144\" index.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}

## Detected SQL CREATE TABLE snippets

- File: refrence/dump-hots-202511281443.sql, Table: exchange_rates
  - `id` int NOT NULL AUTO_INCREMENT,
  - `currency` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  - `unit` int NOT NULL,
  - `sell_rate` decimal(15,2) NOT NULL,
  - `buy_rate` decimal(15,2) NOT NULL,
  - `chart` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  - `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  - ) ENGINE=InnoDB AUTO_INCREMENT=209 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  - /*!40101 SET character_set_client = @saved_cs_client */;
  - --

## Detected Express routes (simple scan)

- GET /listEmployeeNameonly (in routers/cardGenerator.js)
- GET /employeeData (in routers/cardGenerator.js)
- POST /setemployeeData (in routers/cardGenerator.js)
- POST /editemployeeData (in routers/cardGenerator.js)
- POST /deletemployeeData (in routers/cardGenerator.js)
- POST /createAccount (in routers/cardGenerator.js)
- POST /login (in routers/cardGenerator.js)
- GET /autoLogin (in routers/cardGenerator.js)
- POST /ticket/create/:moduleKey (in routers/engine.js)
- GET /ticket/status/:ticket_id (in routers/engine.js)
- POST /ticket/approve (in routers/engine.js)
- POST /ticket/reject (in routers/engine.js)
- GET /tickets (in routers/engine.js)
- GET /tickets/my-requests (in routers/engine.js)
- GET /tickets/dashboard-summary (in routers/engine.js)
- POST /ticket/cancel (in routers/engine.js)
- POST /ticket/return (in routers/engine.js)
- POST /ticket/resubmit (in routers/engine.js)
- GET /ticket/resubmit/:ticket_id (in routers/engine.js)
- POST /ticket/resubmit/:ticket_id (in routers/engine.js)
- GET /ticket/revisions/:ticket_id (in routers/engine.js)
- GET /ticket/revision/:ticket_id/:rev (in routers/engine.js)
- GET /tickets/my-approvals (in routers/engine.js)
- GET /public/:slug (in routers/cms/cmsRouter.js)
- GET /admin/list (in routers/cms/cmsRouter.js)
- GET /admin/:id (in routers/cms/cmsRouter.js)
- POST /admin/save (in routers/cms/cmsRouter.js)
- DELETE /admin/:id (in routers/cms/cmsRouter.js)
- GET /my-assignments (in routers/engine/engineAssignment.js)
- GET /my-assignments/count (in routers/engine/engineAssignment.js)
- GET /assignment/:assignmentId (in routers/engine/engineAssignment.js)
- POST /assignment/:assignmentId/complete (in routers/engine/engineAssignment.js)
- POST /admin/modules (in routers/engine/engineModuleRouter.js)
- GET /admin/modules (in routers/engine/engineModuleRouter.js)
- GET /admin/modules/:moduleKey (in routers/engine/engineModuleRouter.js)
- PUT /admin/modules/:moduleKey (in routers/engine/engineModuleRouter.js)
- GET /module/:moduleKey (in routers/engine/engineModuleRouter.js)
- POST /module/:moduleKey/submit (in routers/engine/engineModuleRouter.js)
- GET /module/:moduleKey/status/:ticketId (in routers/engine/engineModuleRouter.js)
- POST /create (in routers/engine/engineTicket.js)
- POST /create/ (in routers/engine/engineTicket.js)
- POST /create/:moduleKey (in routers/engine/engineTicket.js)
- POST /ticket/approve (in routers/engine/engineTicket.js)
- POST /ticket/reject (in routers/engine/engineTicket.js)
- GET /ticket/status/:ticket_id (in routers/engine/engineTicket.js)
- GET /tickets (in routers/engine/engineTicket.js)
- GET /tickets/my-approvals (in routers/engine/engineTicket.js)
- GET /tickets/my-requests (in routers/engine/engineTicket.js)
- GET /tickets/dashboard-summary (in routers/engine/engineTicket.js)
- POST /ticket/cancel (in routers/engine/engineTicket.js)
- POST /ticket/return (in routers/engine/engineTicket.js)
- POST /ticket/resubmit (in routers/engine/engineTicket.js)
- GET /ticket/resubmit/:ticket_id (in routers/engine/engineTicket.js)
- POST /ticket/resubmit/:ticket_id (in routers/engine/engineTicket.js)
- GET /ticket/revisions/:ticket_id (in routers/engine/engineTicket.js)
- GET /ticket/revision/:ticket_id/:rev (in routers/engine/engineTicket.js)
- POST /task/complete (in routers/engine/engineTicket.js)
- GET /my-assignments (in routers/engine/engineTicket.js)
- POST /assignment/complete (in routers/engine/engineTicket.js)
- POST /tickets/:ticketId/apply (in routers/engine/engineTicket.js)
- GET /reload (in routers/engine/engineTicket.js)
- GET /assignment/:assignmentId/work-data (in routers/engine/engineWorkData.js)
- POST /tickets/:ticketId/work-data (in routers/engine/engineWorkData.js)
- PATCH /tickets/:ticketId/work-data/:entityId (in routers/engine/engineWorkData.js)
- POST /add (in routers/engine/workflowAdminRouters.js)
- GET /params/:workflow_id (in routers/engine/workflowAdminRouters.js)
- POST /params/:workflow_id (in routers/engine/workflowAdminRouters.js)
- PUT /:workflow_id (in routers/engine/workflowAdminRouters.js)
- DELETE /:workflow_id (in routers/engine/workflowAdminRouters.js)
- GET /:service_id (in routers/engine/workflowAdminRouters.js)
- POST /login (in routers/hots/hotsAuth.js)
- GET /keeplogin (in routers/hots/hotsAuth.js)
- GET /profile/ (in routers/hots/hotsAuth.js)
- POST /forgot (in routers/hots/hotsAuth.js)
- GET /verify-token (in routers/hots/hotsAuth.js)
- POST /change-forgot-password (in routers/hots/hotsAuth.js)
- POST /change_pass_forgot (in routers/hots/hotsAuth.js)
- POST /register (in routers/hots/hotsAuth.js)
- POST /approve-draft/:draft_id (in routers/hots/hotsAuth.js)
- GET /verify/:token (in routers/hots/hotsAuth.js)
- POST /pm/login (in routers/hots/hotsAuth.js)
- POST /pm/logout (in routers/hots/hotsAuth.js)
- POST /pm/register (in routers/hots/hotsAuth.js)
- GET /pm/profile (in routers/hots/hotsAuth.js)
- PUT /pm/profile (in routers/hots/hotsAuth.js)
- POST /pm/forgot-password (in routers/hots/hotsAuth.js)
- POST /pm/reset-password (in routers/hots/hotsAuth.js)
- GET /departments (in routers/hots/hotsPublic.js)
- GET / (in routers/meetingbook/bookings.js)
- POST / (in routers/meetingbook/bookings.js)
- POST / (in routers/meetingbook/bookings.js)
- DELETE / (in routers/meetingbook/bookings.js)
- PUT / (in routers/meetingbook/bookings.js)
- GET / (in routers/meetingbook/dayColors.js)
- PUT /:dayIdx (in routers/meetingbook/dayColors.js)
- GET / (in routers/meetingbook/rooms.js)
- GET / (in routers/meetingbook/settings.js)
- POST / (in routers/meetingbook/settings.js)
- PUT /api/settings (in routers/meetingbook/settings.js)
- GET / (in routers/meetingbook/settings.js)
- POST / (in routers/meetingbook/settings.js)
- GET / (in routers/meetingbook/timeslots.js)
- GET /:uid (in routers/meetingbook/users.js)

## Files that likely use DB clients or ORM

- config/db.js: uses SQL client or ORM
- controller/order.js: uses SQL client or ORM
- controller/hots_controller/hotsDashboardController.js: uses SQL client or ORM

## Model-like files

- config/db.js
- config/encrypts.js
- config/env.js
- config/hotsCheckApprovalLevel.js
- config/uploader.js
- controller/admin.js
- controller/auth.js
- controller/authTM.js
- controller/auth_test.js
- controller/cardGenerator.js
- controller/cart.js
- controller/event.js
- controller/index.js
- controller/order.js
- controller/product.js
- controller/product_test.js
- controller/serverOrder.js
- controller/shortenerController.js
- controller/spectator.js
- controller/trademark.js
- controller/user.js
- controller/cms/cmsController.js
- controller/engine/engineAssignment.js
- controller/engine/engineTicket.js
- controller/engine/engineWorkData.js
- controller/engine/moduleController.js
- controller/engine/moduleRuntimeController.js
- controller/engine/workflowAdminController.js
- controller/hots_controller/hotsAdmin.js
- controller/hots_controller/hotsAuth.js
- controller/hots_controller/hotscustomfunctionController.js
- controller/hots_controller/hotsDashboardController.js
- controller/hots_controller/hotsPublicController.js
- controller/hots_controller/hotsSettingsController.js
- controller/hots_controller/hotsSRFController.js
- controller/hots_controller/hotsTicket.js
- controller/hots_controller/hotsTps.js
- controller/project_manager_controller/approval_controller.js
- controller/project_manager_controller/dashboard_controller.js
- controller/project_manager_controller/department_controller.js
- controller/project_manager_controller/gantt_controller.js
- controller/project_manager_controller/kanban_controller.js
- controller/project_manager_controller/notification_controller.js
- controller/project_manager_controller/project_comment_controller.js
- controller/project_manager_controller/project_controller.js
- controller/project_manager_controller/project_template_controller.js
- controller/project_manager_controller/role_controller.js
- controller/project_manager_controller/task_controller.js
- controller/project_manager_controller/task_steps_controller.js
- controller/project_manager_controller/teamJoinRequestController.js
- controller/project_manager_controller/team_controller.js
- controller/project_manager_controller/time_tracking_controller.js
- controller/project_manager_controller/user_controller.js
- controller/searates/srtsController.js
- core/document-engine.js
- core/engine-loader.js
- core/form-loader.js
- core/init-engines.js
- core/loader.js
- core/trigger-engine.js
- core/workflow-engine.js
- routers/admin.js
- routers/auth.js
- routers/authTM.js
- routers/auth_test.js
- routers/cardGenerator.js
- routers/cart.js
- routers/engine.js
- routers/event.js
- routers/index.js
- routers/order.js
- routers/product.js
- routers/product_test.js
- routers/shortener.js
- routers/spectator.js
- routers/trademark.js
- routers/user.js
- routers/cms/cmsRouter.js
- routers/engine/engineAssignment.js
- routers/engine/engineModuleRouter.js
- routers/engine/engineTicket.js
- routers/engine/engineWorkData.js
- routers/engine/workflowAdminRouters.js
- routers/hots/hotsAdmin.js
- routers/hots/hotsAuth.js
- routers/hots/hotscustomfunction.js
- routers/hots/hotsdashboard.js
- routers/hots/hotsPublic.js
- routers/hots/hotsSettings.js
- routers/hots/hotsTicket.js
- routers/hots/hotsTps.js
- routers/meetingbook/bookings.js
- routers/meetingbook/dayColors.js
- routers/meetingbook/rooms.js
- routers/meetingbook/settings.js
- routers/meetingbook/timeslots.js
- routers/meetingbook/users.js
- routers/project_manager/approval_routes.js
- routers/project_manager/dashboard_routes.js
- routers/project_manager/department_routes.js
- routers/project_manager/gantt_routes.js
- routers/project_manager/index.js
- routers/project_manager/kanban_routes.js
- routers/project_manager/notification_routes.js
- routers/project_manager/project_comment_routes.js
- routers/project_manager/project_routes.js
- routers/project_manager/project_template_routes.js
- routers/project_manager/role_routes.js
- routers/project_manager/task_routes.js
- routers/project_manager/task_steps_routes.js
- routers/project_manager/team_routes.js
- routers/project_manager/time_tracking_routes.js
- routers/project_manager/user_routes.js
- routers/searates/srtsRouter.js
- script/trigger-functions/publishJobListing.js
- script/Utility/consoleinfo.js
- script/Utility/DateFormat.js
- service/automation/cleanup.js
- service/automation/index.js
- service/automation/notification.js
- service/automation/trademarkMgmt.js
- service/mailer/eorder/eorder_mailer.js
- service/mailer/hots/hots_mailer.js
- service/mailer/meetingbook/meetingbookmailer.js

## Notes
