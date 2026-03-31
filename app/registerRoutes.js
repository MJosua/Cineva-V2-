const express = require('express');
const path = require('path');

const engineAuth = require('../middleware/engineAuth');
const { createRateLimiter } = require('../middleware/rateLimit');

const {
  authRouter,
  cartRouter,
  userRouter,
  productRouter,
  orderRouter,
  adminRouter,
  spectatorRouter,
  cardGenerator,
  hotsAuth,
  hotsAdmin,
  hotsTicket,
  hotsSettings,
  eventRouter,
  shortener,
  debugRouter,
  srtsRouter,
  projectmngr,
  taskmngr,
  hotscustomfunction,
  kanbanmngr,
  ganttmngr,
  approvalmngr,
  departmentmngr,
  teammngr,
  taskstepsmngr,
  pmdashboard,
  usermngr,
  rolemngr,
  timetrackingmngr,
  notificationmngr,
  projecttemplatemngr,
  projectcommentmngr,
  hotsdashboard,
  hotspublic,
  hotsReporting,
  hotsPreferences,
  hotsProfile,
  hotsNotification,
  hotsSystemMenu,
  hotsUrlShortener,
  cmsRouter,
  engineRouter,
  engineWorkDataRouter,
  engineAssignmentRouter,
  engineReportRouter,
  engineProjectDashboardRouter,
  workflowadminRouter,
  triggerRouter,
  sseRouter,
  eventEnginePublicRouter,
  eventEnginePrivateRouter
} = require('../routers');

function registerRoutes(App) {
  App.get('/', (req, res) => {
    res.status(200).send('<h1>CONNECTION BLOCKED!</h2><br><h2>YOU ARE NOT SUPPOSE TO ACCESS THIS SITE WITH PAGE! JANGAN LUPA TAMBAHKAN VERSIONING DI SETIAP ROUTER </h2>');
  });

  App.use('/cms', cmsRouter);

  App.use('/engine', engineRouter);
  App.use('/engine', engineWorkDataRouter);
  App.use('/engine', engineAssignmentRouter);
  App.use('/engine', engineReportRouter);
  App.use('/engine/project', engineProjectDashboardRouter);
  App.use('/workflow-engine', workflowadminRouter);
  App.use('/triggers', triggerRouter);

  App.use('/auth', authRouter);
  App.use('/pm/project', projectmngr);
  App.use('/pm/kanban', kanbanmngr);
  App.use('/pm/gantt', ganttmngr);
  App.use('/pm/approval', approvalmngr);
  App.use('/pm/department', departmentmngr);
  App.use('/pm/team', teammngr);
  App.use('/pm/task', taskmngr);
  App.use('/pm/task-steps', taskstepsmngr);
  App.use('/pm/dashboard', pmdashboard);
  App.use('/pm/user', usermngr);
  App.use('/pm/role', rolemngr);
  App.use('/pm/time-tracking', timetrackingmngr);
  App.use('/pm/notification', notificationmngr);
  App.use('/pm/project-templates', projecttemplatemngr);
  App.use('/pm/project-comments', projectcommentmngr);

  App.use('/cart', cartRouter);
  App.use('/user', userRouter);
  App.use('/product', productRouter);
  App.use('/order', orderRouter);

  App.use('/searates', srtsRouter);
  App.use('/event', eventRouter);

  App.use('/admin', adminRouter);
  App.use('/spectator', spectatorRouter);
  App.use('/card_generator', cardGenerator);

  App.use('/hots_auth', hotsAuth);
  App.use('/hots_admin', hotsAdmin);
  App.use('/hots_ticket', hotsTicket);
  App.use('/hots_settings', hotsSettings);

  App.use('/hots_customfunction', hotscustomfunction);
  App.use('/hotsdashboard', hotsdashboard);
  App.use('/hots/public', hotspublic);
  App.use('/hotsreporting', hotsReporting);
  App.use('/hotsprefs', hotsPreferences);
  App.use('/hots_profile', hotsProfile);
  App.use('/hots_notifications', hotsNotification);
  App.use('/hots_system_menu', hotsSystemMenu);
  App.use('/hots_url', hotsUrlShortener);

  App.use('/shortener', shortener);
  App.use('/debugRouter', debugRouter);
  App.use('/sse', sseRouter);

  const publicEventEngineLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: Number(process.env.EVENT_ENGINE_PUBLIC_RPM || 120),
    message: 'Too many requests to event engine public API. Please retry later.',
  });

  App.use('/api/event-engine/public', publicEventEngineLimiter, eventEnginePublicRouter);
  App.use('/api/event-engine/admin', engineAuth.normalizeUser, engineAuth.requireUser, eventEnginePrivateRouter);

  App.use('/public', express.static(path.join(__dirname, '..', 'public')));
  App.use('/image', express.static(path.join(__dirname, '..', 'public', 'image')));
  App.use('/files', express.static(path.join(__dirname, '..', 'public', 'files')));
  App.use('/aset', express.static(path.join(__dirname, '..', 'public', 'aset')));
  App.use('/ttd', express.static(path.join(__dirname, '..', 'public', 'ttd')));
  App.use('/hots/profile', express.static(path.join(__dirname, '..', 'public', 'hots', 'profile')));
  App.use('/public/files/hots/it_support', express.static(path.join(__dirname, '..', 'public', 'files', 'hots', 'it_support')));
  App.use('/public/hots/generateddocuments', express.static(path.join(__dirname, '..', 'public', 'hots', 'generateddocuments')));

  App.use('*', (req, res) => {
    res.status(404).send('Not Found');
  });
}

module.exports = {
  registerRoutes,
};
