// pages/dashboard/AssignmentDetailPage.tsx
// 3-Column Layout with CardCollapsible + Task Management

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, CheckCircle, User, Calendar, Briefcase, LayoutGrid, GanttChart } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { useToast } from '@/hooks/use-toast';
import WidgetRenderer from '@/widgets/WidgetRenderer';
import { getWidgetsByContext } from '@/registry/widgetRegistry';
import AssignmentTimeline from '@/components/assignment/AssignmentTimeline';
import TaskKanban from '@/components/assignment/TaskKanban';
import TaskGantt from '@/components/assignment/TaskGantt';
import { CardCollapsible } from '@/components/ui/CardCollapsible';
import TicketDiscussion from '@/components/assignment/TicketDiscussion';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Assignment {
    assignment_id: number;
    ticket_id: string;
    ticket_title: string;
    service_id: number;
    service_name: string;
    assigned_type: string;
    assigned_id: number;
    assigned_at: string;
    assignment_status: string;
    notes?: string;
}

const AssignmentDetailPage: React.FC = () => {
    const { ticket_id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [workData, setWorkData] = useState<any>({});
    const [widgets, setWidgets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('work');
    const [taskCounts, setTaskCounts] = useState({ todo: 0, in_progress: 0, done: 0, total: 0, progress: 0 });

    useEffect(() => {
        if (ticket_id) {
            fetchAssignment();
            fetchWorkData();
        }
    }, [ticket_id]);

    const fetchAssignment = async () => {
        try {
            const token = localStorage.getItem('hots_tokek');
            const response = await axios.get(
                `${API_URL}/engine/my-assignments`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const matchingAssignment = response.data.assignments.find(
                (a: any) => a.ticket_id === ticket_id
            );

            if (!matchingAssignment) {
                toast({
                    title: 'Error',
                    description: 'Assignment not found',
                    variant: 'destructive'
                });
                navigate('/my-assignments');
                return;
            }

            setAssignment(matchingAssignment);

            // Get widgets for this service
            const serviceWidgets = getWidgetsByContext('assignment_detail', matchingAssignment.service_id);
            setWidgets(serviceWidgets);

            if (serviceWidgets.length === 0) {
                setActiveTab('tasks');
            }

        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to load assignment',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchWorkData = async () => {
        try {
            const token = localStorage.getItem('hots_tokek');
            const assignmentsResponse = await axios.get(
                `${API_URL}/engine/my-assignments`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const matchingAssignment = assignmentsResponse.data.assignments.find(
                (a: any) => a.ticket_id === ticket_id
            );

            if (matchingAssignment) {
                const response = await axios.get(
                    `${API_URL}/engine/assignment/${matchingAssignment.assignment_id}/work-data`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.data.ok) {
                    setWorkData(response.data.work_data || {});
                }
            }
        } catch (error) {
            console.error('Failed to fetch work data:', error);
        }
    };

    useEffect(() => {
        if (assignment?.assignment_id) {
            const fetchTaskSummary = async () => {
                try {
                    const token = localStorage.getItem('hots_tokek');
                    const response = await axios.get(
                        `${API_URL}/engine/assignment/${assignment.assignment_id}/tasks`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    if (response.data.ok) {
                        const tasks = response.data.tasks || [];

                        const getAllTasks = (taskList: any[]): any[] => {
                            let flat: any[] = [];
                            taskList.forEach(t => {
                                flat.push(t);
                                if (t.subtasks && t.subtasks.length > 0) {
                                    flat = flat.concat(getAllTasks(t.subtasks));
                                }
                            });
                            return flat;
                        };
                        const allTasks = getAllTasks(tasks);

                        // Calculate weighted units
                        let totalUnits = 0;
                        let doneUnits = 0;

                        allTasks.forEach((t: any) => {
                            if (t.steps && t.steps.length > 0) {
                                totalUnits += t.steps.length;
                                doneUnits += t.steps.filter((s: any) => s.checked === 'true').length;
                            } else {
                                totalUnits += 1;
                                if (t.status === 'done') doneUnits += 1;
                            }
                        });

                        const progress = totalUnits > 0 ? Math.round((doneUnits / totalUnits) * 100) : 0;

                        setTaskCounts({
                            todo: allTasks.filter((t: any) => t.status === 'todo').length,
                            in_progress: allTasks.filter((t: any) => t.status === 'in_progress').length,
                            done: allTasks.filter((t: any) => t.status === 'done').length,
                            total: allTasks.length,
                            progress: progress // Add progress to state if needed, or calculate in render
                        });
                    }
                } catch (error) {
                    console.error('Failed to fetch task summary:', error);
                }
            };
            fetchTaskSummary();

            // Refresh summary every 5s if active
            const interval = setInterval(fetchTaskSummary, 5000);
            return () => clearInterval(interval);
        }
    }, [assignment?.assignment_id]);

    const handleComplete = async () => {
        if (!assignment) return;

        try {
            const token = localStorage.getItem('hots_tokek');
            await axios.post(
                `${API_URL}/engine/assignment/${assignment.assignment_id}/complete`,
                {
                    completion_note: 'Assignment completed'
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            toast({
                title: 'Success',
                description: 'Assignment marked as complete!'
            });

            navigate('/my-assignments');
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to complete assignment',
                variant: 'destructive'
            });
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-48 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!assignment) {
        return (
            <div className="p-6">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-gray-500">Assignment not found</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 pb-[100px]">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-background/95 backdrop-blur z-10 pb-4 -mt-2 pt-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">{assignment.ticket_title}</h1>
                            <p className="text-muted-foreground">{assignment.service_name}</p>
                        </div>
                    </div>
                    <Badge variant={assignment.assignment_status === 'active' ? 'default' : 'secondary'}>
                        {assignment.assignment_status}
                    </Badge>
                </div>
            </div>



            {/* 3-Column SaaS Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Center Column: Main Content (Work, Tasks, Activity) */}
                <div className="lg:col-span-2 space-y-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="mb-4 w-full justify-start h-auto flex-wrap">
                            {widgets.length > 0 && <TabsTrigger value="work" className="flex-1 min-w-[100px]">Work</TabsTrigger>}
                            <TabsTrigger value="tasks" className="flex-1 min-w-[100px]">Tasks</TabsTrigger>
                            <TabsTrigger value="activity" className="flex-1 min-w-[100px]">Activity</TabsTrigger>
                        </TabsList>

                        {/* WORK TAB - forceMount preserves widget state (collapse/inputs) when switching tabs */}
                        <TabsContent value="work" forceMount className="data-[state=inactive]:hidden space-y-6">

                            {/* Work Tools Widgets (All widgets except Invoice) */}
                            {widgets.length > 0 && widgets.some(w => w.componentPath !== "SRFInvoiceInput") && (
                                <div className="space-y-4">
                                    {widgets
                                        .filter(w => w.componentPath !== "SRFInvoiceInput")
                                        .map((widgetConfig) => (
                                            <WidgetRenderer
                                                key={widgetConfig.id}
                                                config={widgetConfig}
                                                data={{
                                                    widgetData: {
                                                        assignmentData: assignment,
                                                        workData: workData
                                                    },
                                                    ticketData: {
                                                        ticket_id: assignment.ticket_id,
                                                        service_id: assignment.service_id
                                                    }
                                                }}
                                                context={{
                                                    ticketData: {
                                                        ticket_id: assignment.ticket_id,
                                                        service_id: assignment.service_id
                                                    }
                                                }}
                                                serviceId={assignment.service_id}
                                            />
                                        ))}
                                </div>
                            )}

                            {/* Invoice Output (If any) */}
                            {widgets.length > 0 && widgets.some(w => w.componentPath === "SRFInvoiceInput") && (
                                <div className="space-y-4 mt-6">
                                    {widgets
                                        .filter(w => w.componentPath === "SRFInvoiceInput")
                                        .map((widgetConfig) => (
                                            <WidgetRenderer
                                                key={widgetConfig.id}
                                                config={widgetConfig}
                                                data={{
                                                    widgetData: {
                                                        assignmentData: assignment,
                                                        workData: workData
                                                    },
                                                    ticketData: {
                                                        ticket_id: assignment.ticket_id,
                                                        service_id: assignment.service_id
                                                    }
                                                }}
                                                context={{
                                                    ticketData: {
                                                        ticket_id: assignment.ticket_id,
                                                        service_id: assignment.service_id
                                                    }
                                                }}
                                                serviceId={assignment.service_id}
                                            />
                                        ))}
                                </div>
                            )}

                            {/* Work Data Key-Value Table */}
                            {Object.keys(workData).length > 0 && (
                                <CardCollapsible title="Work Data" description="Application and task information" defaultOpen>
                                    {Object.entries(workData).map(([entityId, fields]) => (
                                        <div key={entityId} className="mb-4 last:mb-0">
                                            <h4 className="font-medium text-sm text-muted-foreground mb-2">{entityId}</h4>
                                            <div className="border rounded-lg overflow-hidden">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-muted/50">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left font-medium text-muted-foreground uppercase text-xs">Field</th>
                                                            <th className="px-3 py-2 text-left font-medium text-muted-foreground uppercase text-xs">Value</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y">
                                                        {Object.entries(fields as Record<string, string>).map(([fieldName, fieldValue]) => (
                                                            <tr key={fieldName}>
                                                                <td className="px-3 py-2 font-medium">{fieldName}</td>
                                                                <td className="px-3 py-2 text-muted-foreground">{fieldValue}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </CardCollapsible>
                            )}
                        </TabsContent>

                        {/* TASKS TAB */}
                        <TabsContent value="tasks" forceMount className="data-[state=inactive]:hidden">
                            <Tabs defaultValue="kanban" className="w-full">
                                <TabsList className="mb-4">
                                    <TabsTrigger value="kanban" className="gap-2"><LayoutGrid className="w-4 h-4" /> Board</TabsTrigger>
                                    <TabsTrigger value="gantt" className="gap-2"><GanttChart className="w-4 h-4" /> Timeline</TabsTrigger>
                                </TabsList>
                                <TabsContent value="kanban" forceMount className="data-[state=inactive]:hidden">
                                    <TaskKanban
                                        assignmentId={assignment.assignment_id}
                                        assignedType={assignment.assigned_type}
                                        assignedId={assignment.assigned_id}
                                    />
                                </TabsContent>
                                <TabsContent value="gantt" forceMount className="data-[state=inactive]:hidden">
                                    <TaskGantt
                                        assignmentId={assignment.assignment_id}
                                        assignedType={assignment.assigned_type}
                                        assignedId={assignment.assigned_id}
                                    />
                                </TabsContent>
                            </Tabs>
                        </TabsContent>

                        {/* ACTIVITY TAB */}
                        <TabsContent value="activity" forceMount className="data-[state=inactive]:hidden">
                            <CardCollapsible title="Progress Timeline" description="Updates and activity log" defaultOpen>
                                <AssignmentTimeline assignmentId={assignment.assignment_id} ticketId={assignment.ticket_id} />
                            </CardCollapsible>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right Sidebar: Administrative Panels */}
                <div className="space-y-6 flex flex-col">
                    {/* Info Panel */}
                    <CardCollapsible title="Assignment Information" defaultOpen>
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-3 gap-2 border-b pb-3">
                                <span className="text-muted-foreground col-span-1">Ticket ID:</span>
                                <span className="font-medium col-span-2">#{assignment.ticket_id}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 border-b pb-3">
                                <span className="text-muted-foreground col-span-1">Assigned Date:</span>
                                <span className="font-medium col-span-2">{new Date(assignment.assigned_at).toLocaleDateString()}</span>
                            </div>
                            {assignment.notes && (
                                <div className="pt-1">
                                    <span className="text-muted-foreground block mb-1">Notes:</span>
                                    <p className="text-foreground">{assignment.notes}</p>
                                </div>
                            )}
                            <div className="pt-2">
                                <Button variant="outline" size="sm" className="w-full" onClick={() => navigate(`/ticket/${assignment.ticket_id}`)}>
                                    View Full Ticket Details
                                </Button>
                            </div>
                        </div>
                    </CardCollapsible>

                    {/* Task Summary Panel */}
                    <CardCollapsible title="Task Summary" defaultOpen>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-sm font-medium">Overall Progress</span>
                                    <span className="text-sm font-medium text-muted-foreground">{taskCounts.progress}%</span>
                                </div>
                                <Progress value={taskCounts.progress} className="h-2" />
                            </div>
                            <div className="space-y-2 pt-2 border-t">
                                <div className="flex justify-between items-center text-sm p-2 bg-muted/30 rounded">
                                    <span>To Do</span>
                                    <Badge variant="secondary">{taskCounts.todo} tasks</Badge>
                                </div>
                                <div className="flex justify-between items-center text-sm p-2 bg-muted/30 rounded">
                                    <span>In Progress</span>
                                    <Badge variant="secondary">{taskCounts.in_progress} tasks</Badge>
                                </div>
                                <div className="flex justify-between items-center text-sm p-2 bg-muted/30 rounded">
                                    <span>Done</span>
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">{taskCounts.done} tasks</Badge>
                                </div>
                            </div>
                        </div>
                    </CardCollapsible>

                    {/* Discussion Panel */}
                    <CardCollapsible title="Discussion" description="Discuss about current ticket" defaultOpen className="mb-4">
                        <div className="h-[400px]">
                            <TicketDiscussion ticketId={assignment.ticket_id} assignmentId={assignment.assignment_id} />
                        </div>
                    </CardCollapsible>

                    {/* Complete Button (Bottom aligned in sidebar) */}
                    {assignment.assignment_status === 'active' && (
                        <div className="pt-4 sticky bottom-0 bg-background/95 backdrop-blur z-10 pb-4">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button className="w-full gap-2 py-6 text-base font-semibold shadow-md">
                                        <CheckCircle className="w-5 h-5" />
                                        Complete Assignment
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Complete Assignment?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to mark this whole assignment as complete? This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleComplete}>Confirm Complete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AssignmentDetailPage;
