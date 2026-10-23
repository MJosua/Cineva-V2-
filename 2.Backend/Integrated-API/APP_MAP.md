# cineva-backend source map

Generated: 2026-10-22T06:59:40.227Z. Regex-based inventory; imports/route strings are source observations, not runtime validation.

| File | Lines | Imports | Route definitions |
|---|---:|---:|---|
| [app/createApp.js](app/createApp.js) | 124 | 11 | GET /api/health-check (L62); USE /api/rooms (L68); USE /api/bookings (L69); GET /auth/ping (L71) |
| [app/modules/content-studio/bootstrap.js](app/modules/content-studio/bootstrap.js) | 19 | 3 |  |
| [app/modules/content-studio/extractor.mjs](app/modules/content-studio/extractor.mjs) | 15 | 3 |  |
| [app/modules/content-studio/integrations.mjs](app/modules/content-studio/integrations.mjs) | 39 | 3 |  |
| [app/modules/content-studio/media.mjs](app/modules/content-studio/media.mjs) | 16 | 2 |  |
| [app/modules/content-studio/oauth.mjs](app/modules/content-studio/oauth.mjs) | 16 | 2 |  |
| [app/modules/content-studio/providers.mjs](app/modules/content-studio/providers.mjs) | 70 | 1 |  |
| [app/modules/content-studio/release.mjs](app/modules/content-studio/release.mjs) | 11 | 10 |  |
| [app/modules/content-studio/routes.js](app/modules/content-studio/routes.js) | 28 | 0 | GET /media/:token (L6); GET /workspace (L14); POST /commands (L15); POST /generate (L16); POST /render (L17); GET /analytics (L18); POST /insights/sync (L19); POST /insights/ai (L20); POST /accounts/begin (L21); POST /accounts/finish (L22); POST /accounts/creator-info (L23); POST /reconcile (L24) |
| [app/modules/content-studio/runner.mjs](app/modules/content-studio/runner.mjs) | 10 | 1 |  |
| [app/modules/content-studio/runtime.mjs](app/modules/content-studio/runtime.mjs) | 20 | 4 |  |
| [app/modules/content-studio/service.mjs](app/modules/content-studio/service.mjs) | 69 | 3 |  |
| [app/modules/content-studio/social.mjs](app/modules/content-studio/social.mjs) | 73 | 2 |  |
| [app/modules/content-studio/store.mjs](app/modules/content-studio/store.mjs) | 42 | 3 |  |
| [app/modules/content-studio/worker-entry.mjs](app/modules/content-studio/worker-entry.mjs) | 14 | 6 |  |
| [app/modules/tenant-platform/persistentRuntime.js](app/modules/tenant-platform/persistentRuntime.js) | 18 | 5 |  |
| [app/modules/tenant-platform/release.js](app/modules/tenant-platform/release.js) | 18 | 13 |  |
| [app/modules/tenant-platform/routes.js](app/modules/tenant-platform/routes.js) | 76 | 3 | GET /sso/start (L20); GET /sso/callback (L28); POST /logout (L37); POST /invitations (L41); POST /invitations/accept (L47); GET /bootstrap (L52); GET /tickets (L53); GET /tickets/:id (L58); POST /context (L63); GET /brand (L69) |
| [app/modules/tenant-platform/runtime.js](app/modules/tenant-platform/runtime.js) | 25 | 5 |  |
| [app/registerRoutes.js](app/registerRoutes.js) | 193 | 7 | USE /api/tenant/v1 (L69); USE /api/content/v1 (L70); GET / (L79); USE /public (L89); USE * (L90); USE /api/event-engine/public (L165); USE /api/event-engine/admin (L171); USE /public (L176); USE /image (L177); USE /files (L178); USE /aset (L179); USE /ttd (L180); USE /hots/profile (L181); USE /public/files/hots/it_support (L182); USE /public/hots/generateddocuments (L183); USE * (L185) |
| [app/security.js](app/security.js) | 50 | 2 |  |
| [bootstrap/production.js](bootstrap/production.js) | 27 | 1 |  |
| [bootstrap/ssl.js](bootstrap/ssl.js) | 40 | 4 |  |
| [config/db.js](config/db.js) | 224 | 2 |  |
| [config/encrypts.js](config/encrypts.js) | 200 | 2 |  |
| [config/env.js](config/env.js) | 7 | 0 |  |
| [config/hotsCheckApprovalLevel.js](config/hotsCheckApprovalLevel.js) | 24 | 0 |  |
| [config/pdf.js](config/pdf.js) | 850 | 4 |  |
| [config/uploader.js](config/uploader.js) | 620 | 3 |  |
| [controller/OnlineOrder/admin.js](controller/OnlineOrder/admin.js) | 1156 | 3 |  |
| [controller/OnlineOrder/auth.js](controller/OnlineOrder/auth.js) | 728 | 4 |  |
| [controller/OnlineOrder/cart.js](controller/OnlineOrder/cart.js) | 516 | 2 |  |
| [controller/OnlineOrder/event.js](controller/OnlineOrder/event.js) | 469 | 9 |  |
| [controller/OnlineOrder/order.js](controller/OnlineOrder/order.js) | 2282 | 10 |  |
| [controller/OnlineOrder/product.js](controller/OnlineOrder/product.js) | 507 | 3 |  |
| [controller/OnlineOrder/serverOrder.js](controller/OnlineOrder/serverOrder.js) | 3955 | 9 |  |
| [controller/OnlineOrder/spectator.js](controller/OnlineOrder/spectator.js) | 1195 | 2 |  |
| [controller/cms/cmsController.js](controller/cms/cmsController.js) | 176 | 1 |  |
| [controller/debug_controller.js](controller/debug_controller.js) | 384 | 1 |  |
| [controller/event/couponController.js](controller/event/couponController.js) | 327 | 1 |  |
| [controller/event/eventEngineController.js](controller/event/eventEngineController.js) | 773 | 4 |  |
| [controller/hots_controller/ShipmentAnalyticsController.js](controller/hots_controller/ShipmentAnalyticsController.js) | 159 | 2 |  |
| [controller/hots_controller/admin/controllers/adminController.js](controller/hots_controller/admin/controllers/adminController.js) | 837 | 4 |  |
| [controller/hots_controller/admin/controllers/maintenanceController.js](controller/hots_controller/admin/controllers/maintenanceController.js) | 137 | 1 |  |
| [controller/hots_controller/auth/controllers/authController.js](controller/hots_controller/auth/controllers/authController.js) | 1555 | 9 |  |
| [controller/hots_controller/cardGenerator.js](controller/hots_controller/cardGenerator.js) | 466 | 3 |  |
| [controller/hots_controller/cms/CMSController.js](controller/hots_controller/cms/CMSController.js) | 275 | 1 |  |
| [controller/hots_controller/cms/MediaLibraryController.js](controller/hots_controller/cms/MediaLibraryController.js) | 165 | 2 |  |
| [controller/hots_controller/customfunction/controllers/customfunctionController.js](controller/hots_controller/customfunction/controllers/customfunctionController.js) | 2976 | 19 |  |
| [controller/hots_controller/dashboard/controllers/dashboardController.js](controller/hots_controller/dashboard/controllers/dashboardController.js) | 779 | 2 |  |
| [controller/hots_controller/engine/engineAssignment.js](controller/hots_controller/engine/engineAssignment.js) | 2630 | 4 |  |
| [controller/hots_controller/engine/engineProjectDashboard.js](controller/hots_controller/engine/engineProjectDashboard.js) | 311 | 2 |  |
| [controller/hots_controller/engine/engineReport.js](controller/hots_controller/engine/engineReport.js) | 222 | 2 |  |
| [controller/hots_controller/engine/engineTicket.js](controller/hots_controller/engine/engineTicket.js) | 2306 | 12 |  |
| [controller/hots_controller/engine/engineTimeline.js](controller/hots_controller/engine/engineTimeline.js) | 93 | 1 |  |
| [controller/hots_controller/engine/engineWorkData.js](controller/hots_controller/engine/engineWorkData.js) | 272 | 1 |  |
| [controller/hots_controller/engine/moduleController.js](controller/hots_controller/engine/moduleController.js) | 44 | 2 |  |
| [controller/hots_controller/engine/moduleRuntimeController.js](controller/hots_controller/engine/moduleRuntimeController.js) | 105 | 5 |  |
| [controller/hots_controller/engine/triggerController.js](controller/hots_controller/engine/triggerController.js) | 187 | 1 |  |
| [controller/hots_controller/engine/uploadController.js](controller/hots_controller/engine/uploadController.js) | 77 | 4 |  |
| [controller/hots_controller/engine/workflowAdminController.js](controller/hots_controller/engine/workflowAdminController.js) | 316 | 1 |  |
| [controller/hots_controller/hotsDashboardController.js](controller/hots_controller/hotsDashboardController.js) | 1049 | 2 |  |
| [controller/hots_controller/hotsDataChangeController.js](controller/hots_controller/hotsDataChangeController.js) | 503 | 2 |  |
| [controller/hots_controller/hotsPreferencesController.js](controller/hots_controller/hotsPreferencesController.js) | 365 | 1 |  |
| [controller/hots_controller/hotsPublicController.js](controller/hots_controller/hotsPublicController.js) | 38 | 1 |  |
| [controller/hots_controller/hotsReportingController.js](controller/hots_controller/hotsReportingController.js) | 276 | 1 |  |
| [controller/hots_controller/jobmarketplace/CinevaBillingController.js](controller/hots_controller/jobmarketplace/CinevaBillingController.js) | 170 | 1 |  |
| [controller/hots_controller/jobmarketplace/CinevaSubscriptionController.js](controller/hots_controller/jobmarketplace/CinevaSubscriptionController.js) | 171 | 1 |  |
| [controller/hots_controller/jobmarketplace/JobClaimController.js](controller/hots_controller/jobmarketplace/JobClaimController.js) | 167 | 1 |  |
| [controller/hots_controller/jobmarketplace/JobManagementController.js](controller/hots_controller/jobmarketplace/JobManagementController.js) | 576 | 1 |  |
| [controller/hots_controller/jobmarketplace/JobPICController.js](controller/hots_controller/jobmarketplace/JobPICController.js) | 369 | 1 |  |
| [controller/hots_controller/jobmarketplace/TalentProfileController.js](controller/hots_controller/jobmarketplace/TalentProfileController.js) | 147 | 1 |  |
| [controller/hots_controller/jobmarketplace/jobMarketplaceController.js](controller/hots_controller/jobmarketplace/jobMarketplaceController.js) | 53 | 4 |  |
| [controller/hots_controller/notification/notificationController.js](controller/hots_controller/notification/notificationController.js) | 256 | 1 |  |
| [controller/hots_controller/profile/controllers/profileController.js](controller/hots_controller/profile/controllers/profileController.js) | 220 | 3 |  |
| [controller/hots_controller/settings/controllers/AssetInstanceController.js](controller/hots_controller/settings/controllers/AssetInstanceController.js) | 513 | 4 |  |
| [controller/hots_controller/settings/controllers/InventoryController.js](controller/hots_controller/settings/controllers/InventoryController.js) | 315 | 3 |  |
| [controller/hots_controller/settings/controllers/MetadataController.js](controller/hots_controller/settings/controllers/MetadataController.js) | 86 | 3 |  |
| [controller/hots_controller/settings/controllers/ServiceCatalogController.js](controller/hots_controller/settings/controllers/ServiceCatalogController.js) | 184 | 1 |  |
| [controller/hots_controller/settings/controllers/SystemMetaController.js](controller/hots_controller/settings/controllers/SystemMetaController.js) | 89 | 1 |  |
| [controller/hots_controller/settings/controllers/SystemUtilityController.js](controller/hots_controller/settings/controllers/SystemUtilityController.js) | 281 | 1 |  |
| [controller/hots_controller/settings/controllers/UserManagementController.js](controller/hots_controller/settings/controllers/UserManagementController.js) | 595 | 1 |  |
| [controller/hots_controller/settings/controllers/WorkflowConfigController.js](controller/hots_controller/settings/controllers/WorkflowConfigController.js) | 151 | 1 |  |
| [controller/hots_controller/settings/controllers/settingsController.js](controller/hots_controller/settings/controllers/settingsController.js) | 2942 | 0 |  |
| [controller/hots_controller/settings/controllers/triggerFunctionController.js](controller/hots_controller/settings/controllers/triggerFunctionController.js) | 580 | 4 |  |
| [controller/hots_controller/srf/controllers/srfController.js](controller/hots_controller/srf/controllers/srfController.js) | 438 | 7 |  |
| [controller/hots_controller/systemMenuController.js](controller/hots_controller/systemMenuController.js) | 205 | 1 |  |
| [controller/hots_controller/ticketing/notifications/templates.js](controller/hots_controller/ticketing/notifications/templates.js) | 158 | 0 |  |
| [controller/hots_controller/tps/controllers/tpsController.js](controller/hots_controller/tps/controllers/tpsController.js) | 661 | 3 |  |
| [controller/hots_controller/urlShortenerController.js](controller/hots_controller/urlShortenerController.js) | 130 | 1 |  |
| [controller/hots_controller/user.js](controller/hots_controller/user.js) | 916 | 4 |  |
| [controller/index.js](controller/index.js) | 111 | 40 |  |
| [controller/project_manager_controller/approval_controller.js](controller/project_manager_controller/approval_controller.js) | 273 | 1 |  |
| [controller/project_manager_controller/dashboard_controller.js](controller/project_manager_controller/dashboard_controller.js) | 138 | 1 |  |
| [controller/project_manager_controller/department_controller.js](controller/project_manager_controller/department_controller.js) | 221 | 1 |  |
| [controller/project_manager_controller/gantt_controller.js](controller/project_manager_controller/gantt_controller.js) | 106 | 1 |  |
| [controller/project_manager_controller/kanban_controller.js](controller/project_manager_controller/kanban_controller.js) | 107 | 1 |  |
| [controller/project_manager_controller/notification_controller.js](controller/project_manager_controller/notification_controller.js) | 486 | 1 |  |
| [controller/project_manager_controller/project_comment_controller.js](controller/project_manager_controller/project_comment_controller.js) | 205 | 2 |  |
| [controller/project_manager_controller/project_controller.js](controller/project_manager_controller/project_controller.js) | 693 | 1 |  |
| [controller/project_manager_controller/project_template_controller.js](controller/project_manager_controller/project_template_controller.js) | 341 | 1 |  |
| [controller/project_manager_controller/role_controller.js](controller/project_manager_controller/role_controller.js) | 352 | 1 |  |
| [controller/project_manager_controller/task_controller.js](controller/project_manager_controller/task_controller.js) | 806 | 1 |  |
| [controller/project_manager_controller/task_steps_controller.js](controller/project_manager_controller/task_steps_controller.js) | 539 | 1 |  |
| [controller/project_manager_controller/teamJoinRequestController.js](controller/project_manager_controller/teamJoinRequestController.js) | 227 | 1 |  |
| [controller/project_manager_controller/team_controller.js](controller/project_manager_controller/team_controller.js) | 265 | 1 |  |
| [controller/project_manager_controller/time_tracking_controller.js](controller/project_manager_controller/time_tracking_controller.js) | 591 | 1 |  |
| [controller/project_manager_controller/user_controller.js](controller/project_manager_controller/user_controller.js) | 348 | 1 |  |
| [controller/searates/srtsController.js](controller/searates/srtsController.js) | 2021 | 6 |  |
| [controller/searates/srts_fixed_part2.js](controller/searates/srts_fixed_part2.js) | 193 | 0 |  |
| [controller/shortener/shortenerController.js](controller/shortener/shortenerController.js) | 154 | 2 |  |
| [core/cryptoUtil.js](core/cryptoUtil.js) | 78 | 2 |  |
| [core/document-data-preparer.js](core/document-data-preparer.js) | 448 | 4 |  |
| [core/document-engine.js](core/document-engine.js) | 281 | 7 |  |
| [core/engine-loader.js](core/engine-loader.js) | 110 | 2 |  |
| [core/form-loader.js](core/form-loader.js) | 74 | 1 |  |
| [core/init-engines.js](core/init-engines.js) | 69 | 9 |  |
| [core/loader.js](core/loader.js) | 17 | 2 |  |
| [core/logger.js](core/logger.js) | 97 | 1 |  |
| [core/renderers/card-renderer.js](core/renderers/card-renderer.js) | 168 | 2 |  |
| [core/renderers/srf-renderer.js](core/renderers/srf-renderer.js) | 172 | 0 |  |
| [core/reporting-engine.js](core/reporting-engine.js) | 256 | 0 |  |
| [core/resource-engine.js](core/resource-engine.js) | 60 | 2 |  |
| [core/sql-safety-validator.js](core/sql-safety-validator.js) | 211 | 0 |  |
| [core/sse-helper.js](core/sse-helper.js) | 116 | 2 |  |
| [core/sse-manager.js](core/sse-manager.js) | 288 | 3 |  |
| [core/transaction/index.js](core/transaction/index.js) | 81 | 5 |  |
| [core/transaction/transaction-manager.js](core/transaction/transaction-manager.js) | 214 | 2 |  |
| [core/transaction/types/inventory.js](core/transaction/types/inventory.js) | 154 | 1 |  |
| [core/transaction/types/pos.js](core/transaction/types/pos.js) | 106 | 0 |  |
| [core/transaction/types/ticketing.js](core/transaction/types/ticketing.js) | 263 | 1 |  |
| [core/trigger-engine.js](core/trigger-engine.js) | 952 | 4 |  |
| [core/urlHelper.js](core/urlHelper.js) | 44 | 0 |  |
| [core/workflow-engine.js](core/workflow-engine.js) | 713 | 2 |  |
| [ecosystem.config.js](ecosystem.config.js) | 30 | 0 |  |
| [index.js](index.js) | 56 | 13 |  |
| [jobs/startup.js](jobs/startup.js) | 72 | 2 |  |
| [middleware/engineAuth.js](middleware/engineAuth.js) | 144 | 2 |  |
| [middleware/rateLimit.js](middleware/rateLimit.js) | 58 | 0 |  |
| [routers/OnlineOrder/admin.js](routers/OnlineOrder/admin.js) | 49 | 5 | GET /config (L10); GET /config-condition (L11); GET /config-company (L12); GET /config-top (L13); GET /feedback (L14); GET /req-data-change (L15); GET /banner (L16); GET /account (L17); GET /audit (L18); POST /create_account (L20); POST /banner (L21); POST /account-detail (L22); POST /config (L23); PATCH /active (L25); PATCH /status-data-change (L26); PUT /config (L28); PUT /account (L29); PUT /banner (L30); PUT /config_user (L31); PUT /config_company (L32); DELETE /banner (L34); DELETE /config/:id (L35); GET / (L36); GET / (L37); PUT /edit (L38); DELETE /delete (L39); GET /get_blocking_date_sys_text (L41); POST /edit_blocking_date_sys_text (L42); GET /next-user-id/:company_id (L43); GET /preview-email/:type/:so_id (L46) |
| [routers/OnlineOrder/cart.js](routers/OnlineOrder/cart.js) | 28 | 4 | GET /get_id (L10); GET /get_header (L11); GET /get_detail (L12); GET /get_s_week (L13); POST /add_header (L16); POST /add_detail (L17); POST /add_cart (L18); DELETE /delete/:cart_id (L21); DELETE /delete (L22); PATCH /edit_header (L23); PATCH /edit_detail (L24) |
| [routers/OnlineOrder/event/event.js](routers/OnlineOrder/event/event.js) | 22 | 4 | POST /doorprize (L9); GET /showticket (L10); GET /eventtw2024datamentah (L13); GET /eventtw2024win (L14); GET /eventForm/:country_id/:event_id (L17); POST /eventtw2024win (L19) |
| [routers/OnlineOrder/order.js](routers/OnlineOrder/order.js) | 90 | 5 | GET /get_id (L42); GET /container (L44); GET /stuffingweek (L45); GET /get_header (L46); GET /get_header_special/:order_id (L47); GET /get_header_noToken/:order_id (L48); GET /get_detail (L49); GET /get_detail_2 (L50); GET /get_po (L51); GET /pi/:id (L52); GET /tolling (L53); GET /stuffing_date (L54); GET /get_all_in (L55); GET /get_realization (L56); GET /get_order_detail/:order_id (L57); GET /get_order_real/:order_id (L58); GET /track_container (L61); GET /order_container_detail/:order_id (L64); POST /add_header (L70); POST /add_detail (L71); POST /add_detail_tolling (L72); POST /add_summary (L73); POST /upload-po (L74); POST /add_order (L75); POST /send_email_order/:order_id/:employee_id/:user_id (L76); PATCH /cancel (L79); DELETE /delete-po (L82); DELETE /delete (L83); POST /check/:blno (L87); POST /savesearate/:soid (L88) |
| [routers/OnlineOrder/product.js](routers/OnlineOrder/product.js) | 15 | 4 | GET /order (L8); GET /trucking (L9); GET /catalog (L10); GET /omcode (L11); PUT /edit (L12); DELETE /delete (L13) |
| [routers/OnlineOrder/spectator.js](routers/OnlineOrder/spectator.js) | 19 | 3 | GET /coordinate/:id (L7); GET /total_order/:uom (L8); GET /top_dist/:uom (L9); GET /total_order_week/:uom (L10); GET /line-graph/:uom (L12); GET /top-country/:uom (L13); GET /top-flavour/:uom (L14); GET /all_order (L15); GET /detail/:order_id (L16); GET /summary/:order_id (L17) |
| [routers/OnlineOrder/user.js](routers/OnlineOrder/user.js) | 42 | 4 | POST /feedback (L9); POST /contact-us (L10); POST /request-change-data (L11); POST /email (L12); GET /port (L14); GET /portfind (L17); GET /stp (L20); GET /ostp (L22); GET /ntp/:company_id (L24); GET /profile (L28); GET /feedback (L29); GET /banner (L30); GET /top (L31); GET /email (L32); GET /getUpdateList (L34); GET /getLatestUpdate (L35); GET /getUpcomingUpdate (L36); POST /setUpdateList (L38) |
| [routers/auth.js](routers/auth.js) | 25 | 3 | POST /login (L7); POST /forgot (L8); POST /change-forgot-password (L9); GET /verify-token (L10); POST /change_pass_forgot (L11); POST /crpt_pass (L12); POST /change_pass (L13); GET /keep_login (L15); GET /ping (L16); GET /system-meta/:key (L17); GET /cms/posts (L20); GET /cms/categories (L21); GET /cms/public/:slug (L22) |
| [routers/auth_test.js](routers/auth_test.js) | 14 | 3 | POST /iorudhtnhgi (L8); GET /esriounnhgf (L11) |
| [routers/cardGenerator.js](routers/cardGenerator.js) | 16 | 3 | GET /listEmployeeNameonly (L7); GET /employeeData (L8); POST /setemployeeData (L9); POST /editemployeeData (L10); POST /deletemployeeData (L11); POST /createAccount (L12); POST /login (L13); GET /autoLogin (L14) |
| [routers/cms/cmsRouter.js](routers/cms/cmsRouter.js) | 37 | 6 | GET /posts (L10); GET /categories (L11); GET /public/:slug (L12); USE /admin (L15); USE /admin (L19); GET /admin/list (L22); GET /admin/:id (L23); POST /admin/save (L24); POST /admin/category (L25); PUT /admin/:id/quick (L26); PUT /admin/:id/category (L27); DELETE /admin/:id (L28); GET /admin/media/list (L31); POST /admin/media/upload-temp (L32); POST /admin/media/finalize (L33); DELETE /admin/media/:id (L34) |
| [routers/coupon.js](routers/coupon.js) | 36 | 2 | GET /coupon/:hash (L14); POST /coupon/:hash/redeem (L17); POST /admin/event/:event_id/coupons/generate (L24); GET /admin/event/:event_id/coupons (L27); GET /admin/event/:event_id/coupons/export_batch (L30); GET /admin/event/:event_id/submissions/export (L33) |
| [routers/debug.js](routers/debug.js) | 15 | 3 | GET / (L7); GET /list (L8); POST /run/:funcName (L9); POST /add_order (L13) |
| [routers/engine/engineAssignment.js](routers/engine/engineAssignment.js) | 91 | 5 | GET /my-assignments (L11); GET /my-assignments/count (L14); GET /tickets/my-applications (L17); GET /assignment/:assignmentId (L20); GET /assignment/:assignmentId/work-data (L23); POST /assignment/:assignmentId/complete (L26); POST /assignment/bulk-complete (L27); POST /assignment/upload (L30); GET /assignment/:assignmentId/timeline (L31); POST /assignment/:assignmentId/timeline (L32); POST /tickets/:ticketId/assign (L35); POST /tickets/:ticketId/apply (L38); GET /assignment/:assignmentId/tasks (L45); POST /assignment/:assignmentId/tasks (L48); PATCH /assignment/:assignmentId/tasks/:taskId (L51); DELETE /assignment/:assignmentId/tasks/:taskId (L54); POST /assignment/:assignmentId/tasks/:taskId/steps (L57); PATCH /assignment/:assignmentId/tasks-steps/:stepId (L60); DELETE /assignment/:assignmentId/tasks-steps/:stepId (L63); POST /assignment/:assignmentId/tasks/reorder (L66); GET /assignment/:assignmentId/tasks/:taskId/reports (L69); POST /assignment/:assignmentId/tasks/:taskId/reports (L70); PATCH /assignment/:assignmentId/tasks/:taskId/reports/:reportId (L71); DELETE /assignment/:assignmentId/tasks/:taskId/reports/:reportId (L72); GET /assignment/:assignmentId/active-users (L75); GET /assignment/:assignmentId/data-rows (L82); POST /assignment/:assignmentId/data-row (L85); PUT /assignment/:assignmentId/data-row/:rowId (L88) |
| [routers/engine/engineModuleRouter.js](routers/engine/engineModuleRouter.js) | 17 | 3 | POST /admin/modules (L7); GET /admin/modules (L8); GET /admin/modules/:moduleKey (L9); PUT /admin/modules/:moduleKey (L10); GET /module/:moduleKey (L13); POST /module/:moduleKey/submit (L14); GET /module/:moduleKey/status/:ticketId (L15) |
| [routers/engine/engineProjectDashboard.js](routers/engine/engineProjectDashboard.js) | 15 | 3 | GET /list/:service_id (L8); GET /summary/:service_id (L9); GET /service-list (L10); POST /create (L11); PATCH /priority (L12) |
| [routers/engine/engineReport.js](routers/engine/engineReport.js) | 26 | 3 | GET /report/:service_id (L14); POST /report/update (L17); POST /report/suggest (L20); GET /report/card-reports/:assignmentId (L23) |
| [routers/engine/engineTicket.js](routers/engine/engineTicket.js) | 53 | 7 | POST /upload-temp (L14); POST /create (L17); POST /create/ (L18); POST /create/:moduleKey (L19); POST /ticket/approve (L20); POST /ticket/reject (L21); GET /ticket/status/:ticket_id (L22); GET /tickets (L25); GET /tickets/my-approvals (L26); GET /tickets/my-requests (L27); GET /tickets/dashboard-summary (L28); POST /ticket/cancel (L31); POST /ticket/return (L32); POST /ticket/resubmit (L33); GET /ticket/resubmit/:ticket_id (L34); POST /ticket/resubmit/:ticket_id (L36); GET /ticket/revisions/:ticket_id (L39); GET /ticket/revision/:ticket_id/:rev (L40); POST /task/complete (L43); POST /timeline/edit (L46); GET /reload (L49) |
| [routers/engine/engineWorkData.js](routers/engine/engineWorkData.js) | 23 | 3 | GET /assignment/:assignmentId/work-data (L8); POST /tickets/:ticketId/work-data (L11); PATCH /tickets/:ticketId/work-data/:entityId (L14); GET /ticket/:ticketId/work-data/:fieldName (L17); POST /ticket/:ticketId/work-data (L20) |
| [routers/engine/triggerRouters.js](routers/engine/triggerRouters.js) | 22 | 2 | GET /:service_id (L7); POST /:service_id (L10); POST /:service_id/add (L13); PUT /:service_id/:trigger_id (L16); DELETE /:service_id/:trigger_id (L19) |
| [routers/engine/workflowAdminRouters.js](routers/engine/workflowAdminRouters.js) | 24 | 2 | POST /add (L6); GET /params/:workflow_id (L7); POST /params/:workflow_id (L8); GET /definition/:service_id (L11); POST /definition/:service_id (L12); PUT /definition/:service_id (L13); PUT /:workflow_id (L16); DELETE /:workflow_id (L17); GET /:service_id (L20) |
| [routers/eventEngine.js](routers/eventEngine.js) | 11 | 0 |  |
| [routers/eventEngine/private.js](routers/eventEngine/private.js) | 186 | 3 | GET /stream (L19); GET /campaigns (L29); POST /campaigns (L35); GET /campaigns/:slug (L41); PUT /campaigns/:slug (L47); DELETE /campaigns/:slug (L53); POST /campaigns/:slug/publish (L59); GET /campaigns/:slug/logs (L65); GET /campaigns/:slug/media (L68); POST /campaigns/:slug/media/upload (L69); DELETE /campaigns/:slug/media/:mediaId (L70); GET /campaigns/:slug/submissions (L80); GET /campaigns/:slug/submissions/stats (L86); GET /campaigns/:slug/submissions/export (L87); PATCH /submissions/:id (L96); PATCH /submissions/:id (L98); GET /campaigns/:slug/submissions/daily (L104); GET /campaigns/:slug/pools (L115); GET /pools/:id/items (L121); GET /pools/:id/stats (L127); POST /campaigns/:slug/pools (L133); PUT /pools/:id (L139); DELETE /pools/:id (L145); POST /pools/:id/items (L151); POST /pools/:id/items/import (L157); POST /pools/:id/draw (L167); GET /campaigns/:slug/winners (L173); GET /campaigns/:slug/winners/export (L174); GET /users/search (L180); GET /campaigns/:slug/team (L181); POST /campaigns/:slug/team (L182); DELETE /campaigns/:slug/team/:userId (L183) |
| [routers/eventEngine/public.js](routers/eventEngine/public.js) | 49 | 2 | GET /campaigns/:slug (L24); POST /campaigns/:slug/submit (L34); GET /campaigns/:slug/check-coupon/:code (L45) |
| [routers/hots/cinevaRouter.js](routers/hots/cinevaRouter.js) | 20 | 3 | GET /billing (L14); GET /billing/report (L15); PUT /billing/:id/pay (L16); GET /billing/export (L17) |
| [routers/hots/engine.js](routers/hots/engine.js) | 25 | 2 | POST /ticket/create/:moduleKey (L8); GET /ticket/status/:ticket_id (L9); POST /ticket/approve (L10); POST /ticket/reject (L11); GET /tickets (L12); GET /tickets/my-requests (L13); GET /tickets/dashboard-summary (L14); POST /ticket/cancel (L15); POST /ticket/return (L16); POST /ticket/resubmit (L17); GET /ticket/resubmit/:ticket_id (L18); POST /ticket/resubmit/:ticket_id (L19); GET /ticket/revisions/:ticket_id (L20); GET /ticket/revision/:ticket_id/:rev (L21); GET /tickets/my-approvals (L22) |
| [routers/hots/hotsAdmin.js](routers/hots/hotsAdmin.js) | 39 | 4 | GET /account (L8); GET /account/:department_id (L9); GET /role (L10); GET /department (L11); GET /team (L12); GET /team/:department_id (L13); GET /tickets (L14); GET /allworkflow (L16); POST /account (L19); PATCH /account/:user_id (L22); PUT /active/:user_id (L25); DELETE /account/:user_id (L28); GET /system/repair-db (L37) |
| [routers/hots/hotsAuth.js](routers/hots/hotsAuth.js) | 36 | 3 | POST /login (L8); GET /keeplogin (L9); GET /profile/ (L10); POST /change_pass (L11); POST /forgot (L14); GET /verify-token (L15); POST /change-forgot-password (L16); POST /change_pass_forgot (L17); POST /register (L20); POST /approve-draft/:draft_id (L21); GET /verify/:token (L22); POST /pm/login (L24); POST /pm/logout (L25); POST /pm/register (L26); GET /pm/profile (L27); PUT /pm/profile (L28); POST /pm/forgot-password (L29); POST /pm/reset-password (L30) |
| [routers/hots/hotsContent.js](routers/hots/hotsContent.js) | 35 | 3 | GET / (L19); GET /:job_id (L27) |
| [routers/hots/hotsJobMarketplace.js](routers/hots/hotsJobMarketplace.js) | 66 | 6 | GET /jobs (L19); GET /detail/:job_id (L20); GET /campaigns (L21); POST /campaigns (L22); PUT /campaigns/:id (L23); DELETE /campaigns/:id (L24); GET /batches (L27); POST /batches (L28); GET /locations (L29); POST /locations (L30); GET /brands (L33); POST /brands (L34); GET /categories (L37); POST /categories (L38); GET /platforms (L41); POST /platforms (L42); GET /content-types (L45); POST /content-types (L46); POST /take-job (L49); GET /my-requests (L50); GET /applicants/:job_id? (L53); POST /approve-applicant (L54); GET /assignments (L55); GET /content-logs (L56); POST /content-logs (L57); GET /profile-summary (L60); POST /form-response (L61); GET /form-response (L62); POST /form-response/:id/map-to-profile (L63) |
| [routers/hots/hotsNotification.js](routers/hots/hotsNotification.js) | 39 | 3 | GET / (L18); GET /unread_count (L24); POST /read/:id (L30); POST /read_all (L36) |
| [routers/hots/hotsPreferences.js](routers/hots/hotsPreferences.js) | 35 | 3 | POST /bulk (L13); GET /all (L16); GET /dashboard/pinned (L19); POST /dashboard/pin/:id (L20); GET /dashboard/preview/:id (L21); POST /dashboard/preview/:id (L22); GET /:category (L27); GET /:category/:key (L30); POST /:category/:key (L31); DELETE /:category/:key (L32) |
| [routers/hots/hotsProfile.js](routers/hots/hotsProfile.js) | 56 | 6 | GET /me (L47); POST /update (L50); POST /upload_signature (L53) |
| [routers/hots/hotsPublic.js](routers/hots/hotsPublic.js) | 9 | 2 | GET /departments (L6) |
| [routers/hots/hotsReporting.js](routers/hots/hotsReporting.js) | 15 | 3 | GET /total_order/:uom (L9); GET /total_order_week/:uom (L10); GET /top_country/:uom (L11); GET /top_dist/:uom (L12) |
| [routers/hots/hotsSettings.js](routers/hots/hotsSettings.js) | 231 | 14 | GET /get_menu (L15); GET /get_menu_active (L16); GET /get_menu_inactive (L17); POST /toggle_menu (L18); GET /get_data_diff (L19); GET /system-meta/:key/history (L22); POST /system-meta/update (L23); POST /cms/upsert (L26); GET /cms/categories (L27); POST /cms/admin/category (L28); GET /cms/admin/list (L29); GET /cms/admin/:id (L30); POST /cms/admin/save (L31); PUT /cms/admin/:id/quick (L32); PUT /cms/admin/:id/category (L33); DELETE /cms/admin/:id (L34); GET /get/user (L37); GET /search/users (L38); POST /post/user (L39); PUT /update/user/:id (L40); DELETE /delete/user/:id (L41); POST /post/team (L44); PUT /update/team/:id (L45); DELETE /delete/team/:id (L46); GET /get/team (L49); GET /get/team_members/:team_id (L50); GET /get/team_leaders/:team_id (L51); POST /post/team_member (L54); PUT /update/team_leader/:id (L55); DELETE /delete/team_member/:team_id/:user_id (L56); POST /team_join_request (L59); GET /team_join_requests (L60); GET /my_team_join_requests (L61); PUT /team_join_request/:requestId (L62); GET /get/departments (L65); POST /post/department (L66); PUT /update/department/:id (L67); DELETE /delete/department/:id (L68); GET /get/departments/:department_id/teams (L71); GET /get/workflow_groups (L74); POST /post/workflow_group (L75); PUT /update/workflow_group/:id (L76); DELETE /delete/workflow_group/:id (L77); GET /get/workflow_steps/:workflow_group_id (L80); POST /post/workflow_step (L81); PUT /update/workflow_step/:id (L82); DELETE /delete/workflow_step/:id (L83); GET /get/workflow_instances (L85); POST /create/workflow_instance (L86); GET /get/workflow_step_executions/:workflow_id (L87); GET /get/role (L90); POST /post/role (L91); PUT /update/role/:id (L92); DELETE /delete/role/:id (L93); GET /get_superior (L95); GET /get/jobtitle (L98); POST /post/jobtitle (L99); PUT /update/jobtitle/:id (L100); DELETE /delete/jobtitle/:id (L101); GET /get/inventory (L104); GET /public/locations (L105); POST /post/inventory/upsert (L106); DELETE /delete/inventory/:id (L107); POST /post/inventory/transaction (L108); GET /get/asset-instances/:category (L111); POST /post/asset-instance/upsert (L112); POST /post/asset-instances/bulk-update (L113); DELETE /delete/asset-instance/:id (L114); GET /get/asset-timeline/:resourceId (L115); POST /post/asset-timeline/:resourceId (L116); GET /get/asset-next-serial/:skuKey/:date (L117); GET /get/asset-by-sn/:category/:sn (L118); GET /public/asset/:sn (L119); POST /public/post-timeline/:sn (L120); GET /get/services (L123); GET /get/services/active (L124); GET /get/services/inactive (L125); POST /toggle/service (L126); POST /toggle/service/:service_id/:status (L127); PUT /update/widget/:service_id (L130); GET /get_team_member/:team_id (L132); GET /get_service (L133); GET /get_service/:service_id (L134); GET /get_serviceCategory (L135); GET /get_category (L136); GET /get_completionstatus (L137); GET /get_srf_plant (L140); GET /get_srf_sampleCategory (L141); GET /get_srf_deliverTo (L142); GET /get_srf_sku (L143); GET /get_srf_purpose (L144); GET /get_srf_po/:company_id (L145); GET /document/:documentId/view (L148); GET /document/:documentId/download (L149); GET /documents/:ticketId (L150); GET /get_srf/todaysweek (L152); GET /get_data_update_service (L155); GET /get_ps_ticket_row (L158); POST /insertupdate/service_catalog (L160); DELETE /delete/service/:service_id (L161); GET /get/meetingroom (L164); GET /get/meetingroom_static (L165); GET /get/meetingroom/boundary (L166); GET /factories (L169); GET /triggers/:service_id (L172); POST /triggers/:service_id (L173); GET /schema (L174); POST /validate_triggers (L175); GET /get_so_header/:po_number (L178); GET /get_so_details/:so_id (L179); POST /store_dcr_original (L180); POST /submit_data_change (L181); GET /get_all_products (L182); GET /trigger-functions (L191); GET /trigger-functions/categories (L192); GET /trigger-functions/:key (L193); POST /trigger-functions/validate (L196); POST /trigger-functions/:key/execute (L199); POST /trigger-functions (L202); PUT /trigger-functions/:key (L203); DELETE /trigger-functions/:key (L204); GET /custom_functions/preview (L212); GET /custom_functions/preview_srf/:ticketId (L214); GET /card_generator/search_users (L219); GET /card_generator/user/:userId (L220); GET /card_generator/preview/:target_user_id (L221); POST /card_generator/generate (L222); GET /custom_functions/card_pdf/:userId (L223); GET /card/profile (L228) |
| [routers/hots/hotsTicket.js](routers/hots/hotsTicket.js) | 223 | 5 | POST /it_support_ticket (L16); POST /upload/files/ (L37); POST /download/zip/ (L38); POST /create/ticket/:service_id (L41); POST /create/ticket/:service_id (L42); GET /my_ticket (L89); GET /all_ticket (L93); GET /task_list (L94); GET /task_list_involved (L95); GET /task_count (L96); GET /detail/:ticket_id (L99); PUT /detail/:ticket_id (L100); POST /meetingroom/action (L110); POST /approve/:ticket_id (L113); POST /reject/:ticket_id (L120); PUT /close/:ticket_id (L127); PUT /closeservice/:ticket_id (L128); GET /attachment/:ticket_id (L131); POST /admin/cleanup/orphan-files (L135); POST /setTicket/:service_id (L138); POST /pc_request (L166); POST /pc_request_detail (L167); POST /upload_file (L171); GET /my_tiket (L173); GET /all_tiket (L174); GET /task_list_old (L175); GET /comment/:ticket_id (L177); GET /comment/:ticket_id (L178); POST /comment/:ticket_id (L179); GET /fullfilled_tiket_count (L182); GET /open_tiket_count (L183); GET /rejected_tiket_count (L184); GET /detail_old/:service_id/:ticket_id (L187); POST /approve/:service_id/:ticket_id (L188); POST /reject/:ticket_id (L189); POST /status_change/:ticket_id (L191); POST /assingto_change/:ticket_id (L192); POST /ticket_change/:ticket_id (L193); GET /email/:ticket_id (L196); POST /email/:ticket_id (L197); DELETE /email/:ticket_id (L198); POST /testemail (L200); GET /laptop_specs (L202) |
| [routers/hots/hotscustomfunction.js](routers/hots/hotscustomfunction.js) | 46 | 3 | GET /list (L8); GET /service/:serviceId (L9); POST /create (L10); PUT /update/:id (L11); DELETE /delete/:id (L12); POST /assign_service (L15); PUT /update_service_assignment/:id (L16); DELETE /remove_service_assignment/:id (L17); POST /execute/:functionId (L20); POST /upload_excel (L23); GET /excel_data/:ticketId (L24); GET /logs/:ticketId (L27); GET /documents/:ticketId (L28); GET /download/:documentId (L29); GET /render/:documentId (L30); POST /execute-doc-gen/:ticketId (L31); GET /srf/preview_number (L34); GET /srf/auto_category/:ticketId (L35); POST /srf/save_number (L36); POST /srf/generate (L37); GET /templates (L40); POST /templates/create (L41); PUT /templates/update/:id (L42); DELETE /templates/delete/:id (L43) |
| [routers/hots/hotsdashboard.js](routers/hots/hotsdashboard.js) | 40 | 4 | GET /summary (L11); GET /functions (L12); GET /report_srf (L13); GET /report_service (L14); POST /report_detail/upsert (L15); GET /service_summary/:service_id (L18); GET /service_analytics/:service_id (L19); GET /service_tickets/:service_id (L20); GET /panels/:dashboard_id (L23); GET /card_summary/:function_id (L24); GET /analytics/reliability (L27); GET /analytics/transit-times (L28); GET /analytics/quota (L29); GET /analytics/risks (L30); GET /analytics/data-list (L31); GET /analytics/freight-report (L32); GET /analytics/factories (L33); GET /analytics/usage-details (L34); GET /analytics/notes (L35); POST /analytics/notes (L36) |
| [routers/hots/saasRouter.js](routers/hots/saasRouter.js) | 20 | 3 | GET /billing/subscription (L14); GET /billing/invoices (L15); POST /billing/subscription/upgrade (L16); POST /billing/invoices/:id/pay (L17) |
| [routers/hots/shipmentAnalytics.js](routers/hots/shipmentAnalytics.js) | 12 | 3 | GET /reliability (L6); GET /transit-times (L7); GET /quota (L8); GET /risks (L9) |
| [routers/hots/sse.js](routers/hots/sse.js) | 160 | 3 | GET /stream (L60); GET /logs (L108); GET /stats (L141); POST /test (L151) |
| [routers/hots/systemmenu.js](routers/hots/systemmenu.js) | 23 | 3 | GET / (L8); GET /admin (L11); POST /bulk-update (L14); POST /update (L17); POST /add (L20) |
| [routers/hots/urlShortener.js](routers/hots/urlShortener.js) | 15 | 3 | GET /resolve/:code (L7); POST /create (L10); GET /list (L11); DELETE /:id (L12) |
| [routers/index.js](routers/index.js) | 230 | 66 |  |
| [routers/meetingbook/bookings.js](routers/meetingbook/bookings.js) | 182 | 2 | GET / (L7); POST / (L56); DELETE / (L137) |
| [routers/meetingbook/dayColors.js](routers/meetingbook/dayColors.js) | 39 | 2 | GET / (L6); PUT /:dayIdx (L21) |
| [routers/meetingbook/rooms.js](routers/meetingbook/rooms.js) | 277 | 3 | POST /battery-status (L13); POST /battery-alert (L75); GET /summary (L185); GET / (L233) |
| [routers/meetingbook/settings.js](routers/meetingbook/settings.js) | 84 | 4 | GET / (L8); POST / (L19); PUT /api/settings (L39); GET / (L49); POST / (L59) |
| [routers/meetingbook/timeslots.js](routers/meetingbook/timeslots.js) | 18 | 2 | GET / (L8) |
| [routers/meetingbook/users.js](routers/meetingbook/users.js) | 29 | 2 | GET /:uid (L7) |
| [routers/project_manager/approval_routes.js](routers/project_manager/approval_routes.js) | 27 | 3 | GET /workflows (L8); POST /submit (L9); GET /hierarchy/:user_id (L10); GET /pending (L11); PATCH /:approvalId/approve (L12); PATCH /:approvalId/reject (L13); GET /tasks/:taskId/approvals (L16); POST /tasks/:taskId/submit (L17); POST /task/:task_id/submit (L18); PUT /task/:approval_id/process (L19); GET /projects/:projectId/approvals (L22); POST /projects/:projectId/submit (L23); POST /project/:project_id/submit (L24) |
| [routers/project_manager/dashboard_routes.js](routers/project_manager/dashboard_routes.js) | 20 | 3 | GET / (L8); GET /stats (L9); GET /gantt (L10); GET /analytics (L11); GET /recent-activity (L12); GET /metrics/performance (L15); GET /metrics/workload (L16); GET /metrics/team (L17) |
| [routers/project_manager/department_routes.js](routers/project_manager/department_routes.js) | 17 | 3 | GET / (L8); GET /:id (L9); GET /:id/teams (L10); GET /:id/users (L11); GET /:id/projects (L12); POST / (L13); PUT /:id (L14) |
| [routers/project_manager/gantt_routes.js](routers/project_manager/gantt_routes.js) | 12 | 3 | GET /project/:project_id (L8); PUT /task/:task_id (L9) |
| [routers/project_manager/index.js](routers/project_manager/index.js) | 37 | 16 |  |
| [routers/project_manager/kanban_routes.js](routers/project_manager/kanban_routes.js) | 12 | 3 | GET /project/:project_id (L8); PUT /task/:task_id/move (L9) |
| [routers/project_manager/notification_routes.js](routers/project_manager/notification_routes.js) | 29 | 3 | GET / (L7); GET /unread (L8); GET /count (L9); POST / (L10); GET /:id (L11); PUT /:id (L12); DELETE /:id (L13); PATCH /:id/read (L16); PATCH /:id/unread (L17); PATCH /bulk/read (L18); DELETE /bulk/delete (L19); GET /preferences (L22); PUT /preferences (L23); POST /system/broadcast (L26); GET /system/templates (L27) |
| [routers/project_manager/project_comment_routes.js](routers/project_manager/project_comment_routes.js) | 12 | 3 | GET /:project_id (L7); POST /:project_id (L8); PUT /:comment_id (L9); DELETE /:comment_id (L10) |
| [routers/project_manager/project_routes.js](routers/project_manager/project_routes.js) | 30 | 3 | GET / (L8); GET /my-projects (L9); GET /user (L10); GET /available-to-join (L11); POST / (L12); GET /:id (L13); GET /detail/:id (L14); PUT /:id (L15); DELETE /:id (L16); GET /:id/members (L19); POST /:id/members (L20); DELETE /:id/members/:userId (L21); POST /:id/join-request (L24); GET /:id/join-requests (L25); PATCH /join-requests/:requestId/approve (L26); PATCH /join-requests/:requestId/reject (L27) |
| [routers/project_manager/project_template_routes.js](routers/project_manager/project_template_routes.js) | 21 | 3 | GET / (L8); GET /categories (L9); GET /category/:category (L10); POST / (L11); GET /:id (L12); PUT /:id (L13); DELETE /:id (L14); POST /:id/create-project (L17); GET /:id/preview (L18) |
| [routers/project_manager/role_routes.js](routers/project_manager/role_routes.js) | 21 | 3 | GET / (L7); POST / (L8); GET /:id (L9); PUT /:id (L10); DELETE /:id (L11); GET /:id/permissions (L14); POST /:id/permissions (L15); DELETE /:id/permissions/:permissionId (L16); GET /:id/users (L19) |
| [routers/project_manager/task_routes.js](routers/project_manager/task_routes.js) | 29 | 3 | GET /my-tasks (L8); GET /:id/dependencies (L9); GET /:id/time-entries (L10); GET /:id (L11); GET / (L12); POST / (L13); PUT /:id (L14); PATCH /:id/status (L15); PATCH /:id/move-group (L16); POST /:id/dependencies (L19); DELETE /dependencies/:dependencyId (L20); POST /:id/time-entries (L23); DELETE /:id (L26) |
| [routers/project_manager/task_steps_routes.js](routers/project_manager/task_steps_routes.js) | 27 | 3 | GET /task/:taskId/steps (L7); POST /task/:taskId/steps (L8); GET /steps/:stepId (L9); PUT /steps/:stepId (L10); DELETE /steps/:stepId (L11); PATCH /steps/:stepId/complete (L14); PATCH /steps/:stepId/uncomplete (L15); GET /steps/:stepId/journals (L18); POST /steps/:stepId/journals (L19); PUT /journals/:journalId (L20); DELETE /journals/:journalId (L21); PATCH /task/:taskId/steps/reorder (L24); POST /task/:taskId/steps/bulk (L25) |
| [routers/project_manager/team_routes.js](routers/project_manager/team_routes.js) | 32 | 4 | GET / (L9); GET /user (L10); GET /byid/:department_id (L11); POST / (L12); GET /:id (L13); PUT /:id (L14); DELETE /:id (L15); GET /:id/members (L18); POST /:id/members (L19); DELETE /:id/members/:userId (L20); POST /:id/join-request (L23); GET /:id/join-requests (L24); PATCH /join-requests/:requestId/approve (L25); PATCH /join-requests/:requestId/reject (L26); GET /join-requests (L27); GET /my-join-requests (L28); PUT /join-request/:requestId (L29) |
| [routers/project_manager/time_tracking_routes.js](routers/project_manager/time_tracking_routes.js) | 31 | 3 | GET /task/:taskId/entries (L7); POST /task/:taskId/entries (L8); GET /entries/:entryId (L9); PUT /entries/:entryId (L10); DELETE /entries/:entryId (L11); GET /user/:userId/entries (L14); GET /user/:userId/summary (L15); GET /project/:projectId/entries (L18); GET /project/:projectId/summary (L19); GET /reports/daily (L22); GET /reports/weekly (L23); GET /reports/monthly (L24); POST /timer/start (L27); POST /timer/stop (L28); GET /timer/current (L29) |
| [routers/project_manager/user_routes.js](routers/project_manager/user_routes.js) | 23 | 3 | GET / (L7); GET /department/:departmentId (L8); POST / (L9); GET /:id (L10); PUT /:id (L11); DELETE /:id (L12); GET /:id/projects (L15); GET /:id/tasks (L16); GET /:id/teams (L17); GET /:id/performance (L20); GET /:id/workload (L21) |
| [routers/searates/srtsRouter.js](routers/searates/srtsRouter.js) | 13 | 3 | GET /searatesTrack/:so_id/:number (L7); GET /searatesTrackByNumber/:number (L8); GET /searatesTrackByNumber/:number/:so_id (L9); GET /checkdata/:number (L10); GET /getSealineList (L11) |
| [routers/shortener/shortener.js](routers/shortener/shortener.js) | 101 | 2 | POST /shorten (L10); POST /shortenCustom (L40); GET /:id (L71) |
| [script/Utility/DateFormat.js](script/Utility/DateFormat.js) | 12 | 0 |  |
| [script/Utility/consoleinfo.js](script/Utility/consoleinfo.js) | 31 | 0 |  |
| [script/Utility/hotsConstants.js](script/Utility/hotsConstants.js) | 229 | 1 |  |
| [script/Utility/idGenerator.js](script/Utility/idGenerator.js) | 80 | 0 |  |
| [script/testing-utils.js](script/testing-utils.js) | 814 | 9 | GET port (L68) |
| [script/trigger-functions/approveDepartmentJoining.js](script/trigger-functions/approveDepartmentJoining.js) | 94 | 0 |  |
| [script/trigger-functions/publishJobListing.js](script/trigger-functions/publishJobListing.js) | 41 | 0 |  |
| [script/trigger-functions/srf_document_generator.js](script/trigger-functions/srf_document_generator.js) | 211 | 5 |  |
| [server/listen.js](server/listen.js) | 17 | 1 |  |
| [service/automation/cleanup.js](service/automation/cleanup.js) | 51 | 4 |  |
| [service/automation/index.js](service/automation/index.js) | 11 | 4 |  |
| [service/automation/meetingbook/automatemb.js](service/automation/meetingbook/automatemb.js) | 192 | 3 |  |
| [service/automation/notification.js](service/automation/notification.js) | 335 | 3 |  |
| [service/couponService.js](service/couponService.js) | 374 | 2 |  |
| [service/eventEngineService.js](service/eventEngineService.js) | 1677 | 6 |  |
| [service/eventEngineService.js_snippet.js](service/eventEngineService.js_snippet.js) | 36 | 0 |  |
| [service/mailer/eorder/eorder_mailer.js](service/mailer/eorder/eorder_mailer.js) | 1868 | 4 |  |
| [service/mailer/hots/hots_mailer.js](service/mailer/hots/hots_mailer.js) | 1019 | 4 |  |
| [service/mailer/meetingbook/meetingbookmailer.js](service/mailer/meetingbook/meetingbookmailer.js) | 37 | 1 |  |
| [service/ruleExecutor.js](service/ruleExecutor.js) | 103 | 1 |  |
| [service/searates/trackingEngine.js](service/searates/trackingEngine.js) | 709 | 0 |  |
| [service/searates/tracking_analytics.js](service/searates/tracking_analytics.js) | 1067 | 0 |  |
| [service/userService.js](service/userService.js) | 208 | 1 |  |
