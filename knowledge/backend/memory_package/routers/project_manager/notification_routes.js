const express = require('express');
const route = express.Router();
const { decodeTokenHT } = require('../../config/encrypts');
const notification_controller = require('../../controller/project_manager_controller/notification_controller');

// Notification CRUD operations
route.get('/', decodeTokenHT, notification_controller.getUserNotifications);
route.get('/unread', decodeTokenHT, notification_controller.getUnreadNotifications);
route.get('/count', decodeTokenHT, notification_controller.getNotificationCount);
route.post('/', decodeTokenHT, notification_controller.createNotification);
route.get('/:id', decodeTokenHT, notification_controller.getNotificationById);
route.put('/:id', decodeTokenHT, notification_controller.updateNotification);
route.delete('/:id', decodeTokenHT, notification_controller.deleteNotification);

// Notification actions
route.patch('/:id/read', decodeTokenHT, notification_controller.markAsRead);
route.patch('/:id/unread', decodeTokenHT, notification_controller.markAsUnread);
route.patch('/bulk/read', decodeTokenHT, notification_controller.markAllAsRead);
route.delete('/bulk/delete', decodeTokenHT, notification_controller.deleteAllRead);

// Notification preferences
route.get('/preferences', decodeTokenHT, notification_controller.getNotificationPreferences);
route.put('/preferences', decodeTokenHT, notification_controller.updateNotificationPreferences);

// System notifications (admin only)
route.post('/system/broadcast', decodeTokenHT, notification_controller.broadcastNotification);
route.get('/system/templates', decodeTokenHT, notification_controller.getNotificationTemplates);

module.exports = route;