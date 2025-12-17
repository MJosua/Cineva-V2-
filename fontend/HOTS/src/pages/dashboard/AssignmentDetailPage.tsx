// pages/dashboard/AssignmentDetailPage.tsx
// 3-Column Layout with CardCollapsible + Task Management

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

interface Assignment {
    assignment_id: number;
    ticket_id: string;
    ticket_title: string;
    service_id: number;
    service_name: string;
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

    useEffect(() => {
        if (ticket_id) {
            fetchAssignment();
            fetchWorkData();
        }
    }, [ticket_id]);

    const fetchAssignment = async () => {
        try {
            const token = localStorage.getItem('tokek');
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
            const token = localStorage.getItem('tokek');
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

    const handleComplete = async () => {
        if (!assignment) return;

        try {
            const token = localStorage.getItem('tokek');
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
        <div className="p-6 space-y-6">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-background/95 backdrop-blur z-10 pb-4 -mt-2 pt-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigate('/my-assignments')}
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

            {/* 3-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Column 1-2: Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Assignment Info */}
                    <CardCollapsible
                        title="Assignment Information"
                        description="Details about this assignment"
                        defaultOpen
                    >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Ticket ID</p>
                                    <p className="font-medium text-sm">{assignment.ticket_id}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Assigned Date</p>
                                    <p className="font-medium text-sm">
                                        {new Date(assignment.assigned_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="col-span-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/ticket/${assignment.ticket_id}`)}
                                >
                                    View Full Ticket Details
                                </Button>
                            </div>
                        </div>
                        {assignment.notes && (
                            <div className="mt-4 p-3 bg-muted/50 rounded-md">
                                <p className="text-sm text-muted-foreground">Notes: {assignment.notes}</p>
                            </div>
                        )}
                    </CardCollapsible>

                    {/* Work Tools Widgets */}
                    {widgets.length > 0 && (
                        <CardCollapsible
                            title="Work Tools"
                            description="Service-specific tools and forms"
                            defaultOpen
                        >
                            <div className="space-y-4">
                                {widgets.map((widgetConfig) => (
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
                        </CardCollapsible>
                    )}

                    {/* Tasks Section with Kanban/Gantt Tabs */}
                    <CardCollapsible
                        title="Tasks"
                        description="Manage your assignment tasks"
                        defaultOpen
                    >
                        <Tabs defaultValue="kanban" className="w-full">
                            <TabsList className="mb-4">
                                <TabsTrigger value="kanban" className="gap-2">
                                    <LayoutGrid className="w-4 h-4" />
                                    Board
                                </TabsTrigger>
                                <TabsTrigger value="gantt" className="gap-2">
                                    <GanttChart className="w-4 h-4" />
                                    Timeline
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="kanban">
                                <TaskKanban assignmentId={assignment.assignment_id} />
                            </TabsContent>
                            <TabsContent value="gantt">
                                <TaskGantt assignmentId={assignment.assignment_id} />
                            </TabsContent>
                        </Tabs>
                    </CardCollapsible>

                    {/* Work Data Table */}
                    {Object.keys(workData).length > 0 && (
                        <CardCollapsible
                            title="Work Data"
                            description="Application and task information"
                        >
                            {Object.entries(workData).map(([entityId, fields]) => (
                                <div key={entityId} className="mb-4 last:mb-0">
                                    <h4 className="font-medium text-sm text-muted-foreground mb-2">
                                        {entityId}
                                    </h4>
                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="w-full">
                                            <thead className="bg-muted/50">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                                                        Field
                                                    </th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                                                        Value
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {Object.entries(fields as Record<string, string>).map(
                                                    ([fieldName, fieldValue]) => (
                                                        <tr key={fieldName}>
                                                            <td className="px-3 py-2 text-sm font-medium">
                                                                {fieldName}
                                                            </td>
                                                            <td className="px-3 py-2 text-sm text-muted-foreground">
                                                                {fieldValue}
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </CardCollapsible>
                    )}
                </div>

                {/* Column 3: Sidebar */}
                <div className="space-y-6">
                    {/* Progress Timeline */}
                    <CardCollapsible
                        title="Progress Timeline"
                        description="Updates and activity log"
                        defaultOpen
                    >
                        <AssignmentTimeline assignmentId={assignment.assignment_id} />
                    </CardCollapsible>

                    {/* Actions */}
                    {assignment.assignment_status === 'active' && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Actions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    onClick={handleComplete}
                                    className="w-full gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Complete Assignment
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AssignmentDetailPage;
