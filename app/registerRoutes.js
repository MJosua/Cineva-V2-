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
  hotsJobMarketplace,
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
  eventEnginePrivateRouter,
  cinevaRouter,
  saasRouter,
  hotsContent
} = require('../routers');

function registerRoutes(App) {
  const minimalRoutesMode = process.env.LOCAL_MINIMAL_ROUTES === '1';
  const useIfRouter = (basePath, router) => {
    if (!router || typeof router !== 'function') {
      console.warn(`[routes] Skipping '${basePath}' because router is not available.`);
      return;
    }
    App.use(basePath, router);
  };

  App.get('/', (req, res) => {
    res.status(200).send('<h1>CONNECTION BLOCKED!</h2><br><h2>YOU ARE NOT SUPPOSE TO ACCESS THIS SITE WITH PAGE! JANGAN LUPA TAMBAHKAN VERSIONING DI SETIAP ROUTER </h2>');
  });

  if (minimalRoutesMode) {
    console.log('LOCAL_MINIMAL_ROUTES=1 detected: loading minimal route profile.');
    useIfRouter('/hots_jobmarketplace', hotsJobMarketplace);
    useIfRouter('/hots_profile', hotsProfile);
    useIfRouter('/hots_auth', hotsAuth);

    App.use('/public', express.static(path.join(__dirname, '..', 'public')));
    App.use('*', (req, res) => {
      res.status(404).send('Not Found');
    });
    return;
  }

  useIfRouter('/cms', cmsRouter);

  useIfRouter('/engine', engineRouter);
  useIfRouter('/engine', engineWorkDataRouter);
  useIfRouter('/engine', engineAssignmentRouter);
  useIfRouter('/engine', engineReportRouter);
  useIfRouter('/engine/project', engineProjectDashboardRouter);
  useIfRouter('/workflow-engine', workflowadminRouter);
  useIfRouter('/triggers', triggerRouter);

  useIfRouter('/auth', authRouter);
  useIfRouter('/pm/project', projectmngr);
  useIfRouter('/pm/kanban', kanbanmngr);
  useIfRouter('/pm/gantt', ganttmngr);
  useIfRouter('/pm/approval', approvalmngr);
  useIfRouter('/pm/department', departmentmngr);
  useIfRouter('/pm/team', teammngr);
  useIfRouter('/pm/task', taskmngr);
  useIfRouter('/pm/task-steps', taskstepsmngr);
  useIfRouter('/pm/dashboard', pmdashboard);
  useIfRouter('/pm/user', usermngr);
  useIfRouter('/pm/role', rolemngr);
  useIfRouter('/pm/time-tracking', timetrackingmngr);
  useIfRouter('/pm/notification', notificationmngr);
  useIfRouter('/pm/project-templates', projecttemplatemngr);
  useIfRouter('/pm/project-comments', projectcommentmngr);

  useIfRouter('/cart', cartRouter);
  useIfRouter('/user', userRouter);
  useIfRouter('/product', productRouter);
  useIfRouter('/order', orderRouter);

  useIfRouter('/searates', srtsRouter);
  useIfRouter('/event', eventRouter);

  useIfRouter('/admin', adminRouter);
  useIfRouter('/spectator', spectatorRouter);
  useIfRouter('/card_generator', cardGenerator);

  useIfRouter('/hots_auth', hotsAuth);
  useIfRouter('/hots_admin', hotsAdmin);
  useIfRouter('/hots_ticket', hotsTicket);
  useIfRouter('/hots_settings', hotsSettings);

  useIfRouter('/hots_customfunction', hotscustomfunction);
  useIfRouter('/hotsdashboard', hotsdashboard);
  useIfRouter('/hots/public', hotspublic);
  useIfRouter('/hotsreporting', hotsReporting);
  useIfRouter('/hotsprefs', hotsPreferences);
  useIfRouter('/hots_profile', hotsProfile);
  useIfRouter('/hots_jobmarketplace', hotsJobMarketplace);
  useIfRouter('/hots_notifications', hotsNotification);
  useIfRouter('/hots_system_menu', hotsSystemMenu);
  useIfRouter('/hots_url', hotsUrlShortener);
  useIfRouter('/cineva', cinevaRouter);
  useIfRouter('/saas', saasRouter);
  useIfRouter('/hots/content', hotsContent);

  useIfRouter('/shortener', shortener);
  useIfRouter('/debugRouter', debugRouter);
  useIfRouter('/sse', sseRouter);

  const publicEventEngineLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: Number(process.env.EVENT_ENGINE_PUBLIC_RPM || 120),
    message: 'Too many requests to event engine public API. Please retry later.',
  });

  if (eventEnginePublicRouter && typeof eventEnginePublicRouter === 'function') {
    App.use('/api/event-engine/public', publicEventEngineLimiter, eventEnginePublicRouter);
  } else {
    console.warn("[routes] Skipping '/api/event-engine/public' because router is not available.");
  }

  if (eventEnginePrivateRouter && typeof eventEnginePrivateRouter === 'function') {
    App.use('/api/event-engine/admin', engineAuth.normalizeUser, engineAuth.requireUser, eventEnginePrivateRouter);
  } else {
    console.warn("[routes] Skipping '/api/event-engine/admin' because router is not available.");
  }

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
