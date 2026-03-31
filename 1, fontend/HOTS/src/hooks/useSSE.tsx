/**
 * useSSE.ts
 * 
 * Server-Sent Events hook for real-time updates.
 * Connects to backend SSE stream and dispatches Redux actions on events.
 * 
 * Usage:
 *   // In a top-level component (e.g., inside ProtectedRoute or AppLayout)
 *   useSSE();
 */

import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from './useAppSelector';
import { fetchTaskCount, fetchMyTickets, triggerSSERefresh, fetchTaskList, setDocumentProcessing, setSidebarCounts } from '@/store/slices/ticketsSlice';
import { fetchMeetingBookings } from '@/store/slices/meetingroom_slice';
import { useToast } from './use-toast';

const API_URL = import.meta.env.VITE_API_URL || '';

export function useSSE() {
    const dispatch = useAppDispatch();
    const { toast } = useToast();
    const eventSourceRef = useRef<EventSource | null>(null);

    // Get token from Redux state for reactivity
    const { token } = useAppSelector(state => state.auth);

    useEffect(() => {
        if (!token) {
            console.log('🔌 SSE: No token, skipping connection');
            return;
        }

        // Prevent duplicate connections
        if (eventSourceRef.current) {
            return;
        }

        console.log('🔌 SSE: Connecting to stream...');

        // Use the token from Redux state
        const eventSource = new EventSource(`${API_URL}/sse/stream?token=${token}`);
        eventSourceRef.current = eventSource;

        // Connection established
        eventSource.addEventListener('connected', (e) => {
            console.log('✅ SSE: Connected!', JSON.parse(e.data));
        });

        // Badge update event (new approval/assignment in inbox)
        eventSource.addEventListener('badge_update', (e) => {
            const data = JSON.parse(e.data);
            console.log('📡 SSE: Badge update received', data);

            // Refetch task count to update badge
            console.log('📡 SSE: Dispatching fetchTaskCount()');
            dispatch(fetchTaskCount());

            // ALSO fetch task list as it might be an assignment
            dispatch(fetchTaskList(1));
            // Trigger signal for MyAssignments page
            dispatch(triggerSSERefresh('assignment'));

            // Show toast notification
            if (data.data?.type === 'approval_inbox') {
                toast({
                    title: '📋 New Approval Request',
                    description: `You have a new item in your approval inbox`,
                });
            } else if (data.data?.type === 'assignment_inbox') {
                toast({
                    title: '📌 New Assignment',
                    description: `You have been assigned a new task`,
                });
            }
        });

        // Approval needed event (replaced badge_update for approvals)
        eventSource.addEventListener('approval_needed', (e) => {
            const data = JSON.parse(e.data);
            console.log('📡 SSE: Approval needed', data);

            dispatch(fetchTaskCount());
            dispatch(fetchTaskList(1));
            dispatch(triggerSSERefresh('assignment'));

            const payload = data.data || {};
            toast({
                title: '📋 Approval Required',
                description: payload.message || `Ticket #${payload.ticketId} requires your approval`,
            });
        });

        // Ticket status update event
        eventSource.addEventListener('ticket_status_update', (e) => {
            const data = JSON.parse(e.data);
            console.log('📡 SSE: Ticket status update', data);

            // Refetch my tickets to update list
            dispatch(fetchMyTickets(1));
            // Also fetch task list in case status change affects tasks
            dispatch(fetchTaskList(1));
            // Trigger signal
            dispatch(triggerSSERefresh('ticket'));

            // 🆕 Phase 3: Show RICH toast with actor details
            const payload = data.data || {};
            const action = payload.action || 'updated';
            const actorName = payload.actor_name;
            const serviceName = payload.service_name;
            const isFinal = payload.isFinal;

            // Use rich message from backend, or fallback to constructed message
            const description = payload.message
                || (actorName ? `${actorName} ${action} your ${serviceName || 'ticket'}` : `Your ticket has been ${action}`);

            toast({
                title: isFinal ? '🎉 Request Approved!' : `🎫 Ticket ${action.charAt(0).toUpperCase() + action.slice(1)}`,
                description: description,
                variant: action === 'rejected' ? 'destructive' : 'default',
            });
        });

        // New comment event
        eventSource.addEventListener('new_comment', (e) => {
            const data = JSON.parse(e.data);
            console.log('📡 SSE: New comment', data);

            dispatch(triggerSSERefresh('comment'));

            // 🆕 Phase 3: Show RICH toast with commenter name
            const payload = data.data || {};
            const commenterName = payload.commenter_name;
            const serviceName = payload.service_name;

            const toastProps: any = {
                title: payload.title || '💬 New Comment',
                description: payload.message || (commenterName
                    ? `${commenterName} commented on your ${serviceName || 'ticket'}`
                    : `Someone commented on a ticket you're involved in`),
            };

            const ticketId = payload.ticket_id || payload.ticketId;
            if (ticketId) {
                toastProps.action = (
                    <div
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded cursor-pointer text-sm font-medium transition-colors"
                        onClick={() => { window.location.href = `/hots/ticket/${ticketId}`; }}
                    >
                        Open
                    </div>
                );
            }

            toast(toastProps);
        });

        // Assignment update event
        eventSource.addEventListener('assignment_update', (e) => {
            const data = JSON.parse(e.data);
            console.log('📡 SSE: Assignment update', data);

            // 🆕 Phase 3: Handle multiple action types with RICH messages
            const payload = data.data || {};
            const action = payload.action;

            // Trigger granular refreshes based on action
            if (['task_created', 'task_updated', 'task_deleted', 'task_status_change', 'step_created', 'step_updated'].includes(action)) {
                dispatch(triggerSSERefresh('task'));
            } else {
                dispatch(triggerSSERefresh('assignment'));
            }

            // Show toast if the backend requested notification via payload title/message
            if (payload.title || payload.message) {
                const toastProps: any = {
                    title: payload.title || 'Assignment Update',
                    description: payload.message || 'The assignment has been updated',
                };

                // Add action button if URL is provided
                if (payload.ticketId) {
                    toastProps.action = (
                        <div
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded cursor-pointer text-sm font-medium transition-colors"
                            onClick={() => { window.location.href = `/hots/assignment/${payload.ticketId}`; }
                            }
                        >
                            Open
                        </div>
                    );
                }

                toast(toastProps);
            }
        });

        // Document uploaded event
        eventSource.addEventListener('document_uploaded', (e) => {
            const data = JSON.parse(e.data);
            console.log('📡 SSE: Document uploaded', data);

            dispatch(triggerSSERefresh('document'));

            // Optional: Show toast if not the uploader? (Hard to know user ID here easily without decoding payload again, skipping for now)
        });

        // 🆕 Document generation STARTED event (from async SRF trigger)
        eventSource.addEventListener('doc_generation_started', (e) => {
            const data = JSON.parse(e.data);
            console.log('📡 SSE: Document generation started', data);

            const payload = data.data || {};
            // 🆕 Set processing state with the specific ticket_id so UI can filter
            dispatch(setDocumentProcessing(payload.ticket_id?.toString() || null));

            toast({
                title: '📄 Generating Document...',
                description: payload.message || `Document for ticket ${payload.ticket_id} is being generated`,
            });
        });

        // 🆕 Document generation complete event (from async SRF trigger)


        // 🆕 COUNTER UPDATE EVENT (Live sidebar counts)
        eventSource.addEventListener('counter_update', (e) => {
            const data = JSON.parse(e.data);
            console.log('📡 SSE: Counter update', data);

            if (data.data) {
                // Update Approvals (Task Count)
                if (data.data.approvals !== undefined) {
                    dispatch(setSidebarCounts({ approvals: data.data.approvals }));
                }

                // Update Assignments
                if (data.data.assignments !== undefined) {
                    dispatch(setSidebarCounts({ assignments: data.data.assignments }));
                }
            }
        });

        // 🆕 Document generation complete event (from async SRF trigger)
        eventSource.addEventListener('doc_generation_complete', (e) => {
            const data = JSON.parse(e.data);
            console.log('📡 SSE: Document generation complete', data);

            // 🆕 Clear processing state (set to null) and trigger document refresh
            dispatch(setDocumentProcessing(null));
            dispatch(triggerSSERefresh('document'));

            const payload = data.data || {};
            toast({
                title: payload.status === 'success' ? '✅ Document Ready' : '❌ Document Failed',
                description: payload.message || `Document for ticket ${payload.ticket_id} is ready`,
                variant: payload.status === 'success' ? 'default' : 'destructive',
            });
        });

        // 🗓️ Meeting Room Schedule update event
        eventSource.addEventListener('update_meeting_schedule', (e) => {
            const data = JSON.parse(e.data);
            console.log('📡 SSE: Meeting schedule update', data);

            // Refetch meeting bookings for the Gantt chart
            dispatch(fetchMeetingBookings());

            // Optional: Subtle toast if needed
            const payload = data.data || {};
            if (payload.type === 'new_booking') {
                toast({
                    title: '🗓️ New Meeting Booked',
                    description: `A new meeting has been scheduled in ${payload.room}`,
                });
            } else if (payload.type === 'cancel_booking') {
                toast({
                    title: '🗓️ Meeting Cancelled',
                    description: `A meeting booking has been released`,
                });
            } else if (payload.type === 'edit_booking') {
                toast({
                    title: '🗓️ Meeting Updated',
                    description: `A meeting time has been modified`,
                });
            }
        });

        // 📦 Inventory update event
        eventSource.addEventListener('inventory_update', (e) => {
            const data = JSON.parse(e.data);
            console.log('📡 SSE: Inventory update received', data);

            // Trigger signal for Inventory page to refetch
            dispatch(triggerSSERefresh('inventory'));

            // Show toast for stock movements
            const payload = data.data || {};
            if (payload.action === 'issue') {
                toast({ title: '📦 Stock Issued', description: 'Inventory levels updated' });
            } else if (payload.action === 'receive') {
                toast({ title: '📥 Stock Received', description: 'New items added to storage' });
            }
        });

        // Global Broadcast event (Migrated from App.js)
        eventSource.addEventListener('broadcast', (e) => {
            const data = JSON.parse(e.data);
            console.log('📡 SSE: Global Broadcast', data);

            toast({
                title: "Broadcast Message !",
                description: data.data || data, // Handle both object and string
                variant: "destructive", // status: "error" in chakra maps to destructive in shadcn usually
                duration: 16000,
            });
        });

        // Error handling
        eventSource.onerror = (error) => {
            console.error('❌ SSE: Connection error', error);
            // EventSource will auto-reconnect
        };

        // Cleanup on unmount or token change
        return () => {
            if (eventSourceRef.current) {
                console.log('🔌 SSE: Disconnecting...');
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
    }, [token, dispatch, toast]);
}

export default useSSE;
