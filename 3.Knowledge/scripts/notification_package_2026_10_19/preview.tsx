import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import NotificationBell from '../../../1.Frontend/HOTS/src/components/layout/NotificationBell';
import { subscribeNotificationEvents } from '@hots/app-core/notifications';
import { notificationEvents, notificationSignal } from '../../../1.Frontend/HOTS/src/hooks/notificationAdapter';
function Preview() {
  useEffect(() => {
    const source = new EventSource('/sse');
    const stop = subscribeNotificationEvents(source, notificationEvents, () => window.dispatchEvent(new CustomEvent(notificationSignal)));
    source.addEventListener('connected', () => document.documentElement.dataset.sse = 'connected');
    return () => { stop(); source.close(); };
  }, []);
  return <BrowserRouter><main style={{ padding: 40 }}><h1>Dummy notification fixture</h1><NotificationBell /></main></BrowserRouter>;
}
createRoot(document.getElementById('root')!).render(<Preview />);
