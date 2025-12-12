// pages/dashboard/AssignmentDetailPage.tsx
// 3-Column Layout with CardCollapsible + Task Management

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Paperclip, Send, ArrowLeft, CheckCircle, User, Calendar, Briefcase, LayoutGrid, GanttChart, X, Loader2, FileText } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { useToast } from '@/hooks/use-toast';
import WidgetRenderer from '@/widgets/WidgetRenderer';
import { getWidgetsByContext } from '@/registry/widgetRegistry';
import AssignmentTimeline from '@/components/assignment/AssignmentTimeline';
import TaskKanban from '@/components/assignment/TaskKanban';
import TaskGantt from '@/components/assignment/TaskGantt';
import { CardCollapsible } from '@/components/ui/CardCollapsible';
import { socket } from '@/lib/socket';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppSelector';
import { fetchTicketDetail } from '@/store/slices/ticketsSlice';
import { fetchGeneratedDocuments } from '@/store/slices/customFunctionSlice';
import { FilePreview } from "@/components/ui/FilePreview";



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
    const dispatch = useAppDispatch();
    const { user } = useAppSelector(state => state.auth);
    const { generatedDocuments, functionLogs, isLoading: isLoadingCustomFunction } = useAppSelector(state => state.customFunction);

    const { ticket_id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const commentContainerRef = useRef(null);
    const [comment, setComment] = useState("");
    const [data_comment, setData_comment] = useState([]);
    const [data_comment_count, setData_comment_count] = useState([]);

    useEffect(() => {
        dispatch(fetchTicketDetail(ticket_id));
        if (ticket_id) {
            dispatch(fetchGeneratedDocuments(parseInt(ticket_id)));
        }
    }, [ticket_id])
    const { ticketDetail, isLoadingDetail, detailError, isSubmitting } = useAppSelector(state => state.tickets);


    const groupedMessages = data_comment?.reduce((groups, msg) => {
        const date = msg.date_created;
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(msg);
        return groups;
    }, {} as Record<string, typeof data_comment>);

    const scrollToBottom = () => {
        if (commentContainerRef.current) {
            commentContainerRef.current.scrollTop = commentContainerRef.current.scrollHeight;
        }
    };

    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);



    // Function to fetch comments from the server
    const getData_comment = () => {
        axios.get(`${API_URL}/hots_ticket/comment/${ticket_id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("tokek")}`,
            },
        })
            .then((res) => {


                setData_comment(res.data.comment_list);
                setData_comment_count(res.data.comment_count);
                scrollToBottom();
            })
            .catch((err) => {
                console.error("Error fetching comments:", err);
            });
    };

    useEffect(() => {
        getData_comment();
    }, [setData_comment_count]);


    useEffect(() => {
        const onMessage = () => {
            getData_comment();
            scrollToBottom();
        };

        socket.on('message', onMessage);

        return () => {
            socket.off('message', onMessage);
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [data_comment]);

    const textareaRef = useRef(null);


    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto'; // Reset the height
            textarea.style.height = `${textarea.scrollHeight}px`; // Set to the scroll height
        }
    };

    useEffect(() => {
        adjustHeight(); // Adjust height on mount and when comment changes
    }, [comment]);

    const [fulfilment_comment, setfullfillment] = useState(null)

    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const [url, setURL] = useState("");

    const handlePaste = (event) => {
        const items = event.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                const blob = items[i].getAsFile();
                setImage(blob);  // Store the actual file
                const imgURL = URL.createObjectURL(blob);
                setImagePreview(imgURL); // Display image thumb
            }
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && event.shiftKey) {
            event.preventDefault(); // Prevent default action (form submission)
            setComment((prev) => prev + '\n'); // Add a new line
        } else if (event.key === 'Enter') {
            event.preventDefault(); // Prevent default action to avoid new line
            handleComment(); // Submit the form
        }
    };


    const handleImage = (e) => {
        setImage(e.target.files[0]);  // Store the actual file, not URL.createObjectURL
        setImagePreview(URL.createObjectURL(e.target.files[0]));
        // onCloseModalUploadImage(); // Function not defined
    };
    // Handle form submit to send comment and image

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

    // Download a generated document
    const handleGeneratedDocumentDownload = (documentPath: string, fileName: string) => {
        const url = `${API_URL}/${documentPath}`;
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Manually trigger document generation

    const handleGenerateDocument = async () => {
        if (!assignment) return;

        console.log('📝 [GenerateDoc] Starting generation...');
        console.log('📝 [GenerateDoc] ticket_id:', assignment.ticket_id);
        console.log('📝 [GenerateDoc] service_id:', assignment.service_id);

        setIsGenerating(true);

        try {
            const token = localStorage.getItem('tokek');
            toast({ title: 'Generating...', description: 'Creating document, please wait...' });

            const url = `${API_URL}/hots_customfunction/execute-doc-gen/${assignment.ticket_id}`;
            console.log('📝 [GenerateDoc] URL:', url);

            const response = await axios.post(
                url,
                { service_id: assignment.service_id },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log('📝 [GenerateDoc] Response:', response.data);

            toast({ title: 'Success', description: 'Document generated successfully!' });

            // Refetch documents list instead of page reload
            dispatch(fetchGeneratedDocuments(parseInt(assignment.ticket_id)));
        } catch (error: any) {
            console.error('📝 [GenerateDoc] Error:', error);
            console.error('📝 [GenerateDoc] Response:', error.response?.data);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to generate document',
                variant: 'destructive'
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleComment = () => {
        if ((!comment || comment.trim() === '') && !image) return;

        setIsLoading(true);

        const formData = new FormData();
        formData.append('comment', comment.trim());
        if (image) formData.append('file', image);

        axios.post(
            `${API_URL}/hots_ticket/comment/${ticket_id}`,
            formData,
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("tokek")}`,
                    'Content-Type': 'multipart/form-data',
                },
            }
        ).then(() => {
            setIsLoading(false);
            setComment('');
            setImage(null);
            setImagePreview(null);
            getData_comment();
            socket.emit('message', comment.trim());
        }).catch(() => {
            setIsLoading(false);
            toast({
                title: 'Error',
                description: 'Error when uploading comment.',
                variant: 'destructive',
                duration: 3000,
                // isClosable: true, // Not supported in shadcn toast
            });
        });
    };

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
                    {console.log("generatedDocuments", generatedDocuments)}
                    <CardCollapsible
                        title="Ticket Item"
                        description="Generated or Uploaded Items Organized Here"
                        defaultOpen
                    >
                        <CardContent className="p-6 space-y-4">
                            {isLoadingCustomFunction ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="flex flex-col items-center space-y-2">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                        <p className="text-sm text-muted-foreground">Loading generated documents...</p>
                                    </div>
                                </div>
                            ) : generatedDocuments && generatedDocuments.length > 0 ? (
                                <div className="space-y-3">
                                    {generatedDocuments.map((document) => (
                                        <FilePreview
                                            generated={true}
                                            key={document.id}
                                            fileName={document.file_name}
                                            filePath={document.file_path}
                                            uploadDate={document.generated_date}
                                            onDownload={() => handleGeneratedDocumentDownload(document.file_path, document.file_name)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-center py-4">No generated documents found</p>
                            )}

                            {/* Manual Generate Button */}
                            <div className="border-t pt-4 mt-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium">Generate Document</p>
                                        <p className="text-xs text-muted-foreground">Create SRF or other documents manually</p>
                                    </div>
                                    <Button
                                        onClick={handleGenerateDocument}
                                        variant="outline"
                                        className="gap-2"
                                        disabled={isGenerating}
                                    >
                                        {isGenerating ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <FileText className="w-4 h-4" />
                                        )}
                                        {isGenerating ? 'Generating...' : 'Generate'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </CardCollapsible>

                </div>




                {/* Column 3: Sidebar */}
                <div className="space-y-6">
                    {/* Progress Timeline */}

                    <CardCollapsible
                        title="Discussion"
                        color="bg-white"
                        description="Discuss about current ticket"
                        defaultOpen
                    >
                        <CardContent className="p-0">
                            <div
                                className="h-64 overflow-y-auto p-4 space-y-3"
                                ref={commentContainerRef}
                            >

                                <div>
                                    {groupedMessages && Object.entries(groupedMessages).length > 0 ? (
                                        Object.entries(groupedMessages).map(([date, messages]) => (
                                            <div key={date} className="mb-6">
                                                <div className="text-center text-xs text-muted-foreground mb-2">
                                                    {date}
                                                </div>

                                                {(messages as any[]).map((msg) => (
                                                    <div
                                                        key={msg.id}
                                                        className={`flex mb-1 ${msg.sender_id === user.user_id ? 'justify-end' : 'justify-start'}`}
                                                    >
                                                        <div
                                                            className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${msg.sender_id === user.user_id
                                                                ? 'bg-primary text-primary-foreground'
                                                                : 'bg-muted text-foreground'
                                                                }`}
                                                        >
                                                            <p className="text-xs font-medium mb-1">{msg.sender}</p>
                                                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                                            <p className="text-xs opacity-75 mt-1 text-end">{msg.time_created}</p>
                                                        </div>

                                                        {msg.attachment_url && (
                                                            <div className="px-4 pt-3">
                                                                <div className="relative inline-block max-w-fit">
                                                                    <img
                                                                        onClick={() => {
                                                                            setURL(`${API_URL}${msg.attachment_url}`);
                                                                            // onOpenModalViewImage();
                                                                        }}
                                                                        className="rounded shadow h-[90px] w-[90px] cursor-pointer object-cover"
                                                                        src={`${API_URL}${msg.attachment_url}`}
                                                                        alt="Uploaded"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-muted-foreground text-center">No messages yet</p>
                                    )}

                                </div>
                            </div>
                            <div className="border-t p-4">
                                <div className="w-full mb-3">
                                    {/* Image preview ABOVE form - chat bubble style */}
                                    {image && (
                                        <div className="w-full border rounded-lg mb-2 p-2 bg-gray-50">
                                            <div className="flex items-start gap-2">
                                                <div className="relative">
                                                    <img
                                                        src={imagePreview}
                                                        alt="Preview"
                                                        className="rounded shadow h-[80px] w-[80px] object-cover"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setImage(null);
                                                            setImagePreview(null);
                                                        }}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                                <span className="text-xs text-gray-500 mt-1">Image ready to send</span>
                                            </div>
                                        </div>
                                    )}

                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            handleComment();
                                        }}
                                        className="relative flex items-center w-full"
                                    >
                                        <div className="flex-1">
                                            <textarea
                                                ref={textareaRef}
                                                placeholder="Enter Comment"
                                                onKeyDown={handleKeyDown}
                                                rows={1}
                                                maxLength={500}
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                onPaste={handlePaste}
                                                disabled={isLoading || Number(ticketDetail?.status) >= 2}
                                                className="w-full px-4 py-2 min-h-[30px] max-h-[120px] resize-none border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                                            />
                                        </div>

                                        <div className="absolute right-2 flex space-x-2">
                                            <button
                                                type="button"
                                                // onClick={onOpenModalUploadImage}
                                                disabled={isLoading || Number(ticketDetail?.status) >= 2}
                                                className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
                                            >
                                                <Paperclip className="w-5 h-5" />
                                            </button>


                                            <button
                                                type="submit"
                                                disabled={isLoading || Number(ticketDetail?.status) >= 2}
                                                className="text-gray-600 hover:text-blue-600 disabled:opacity-50"
                                            >
                                                <Send className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </form>
                                </div>

                            </div>
                        </CardContent>
                    </CardCollapsible>
                    {/* Actions */}
                    {assignment.assignment_status === 'active' ? (
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
                    )
                        :
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Actions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    className="w-full gap-2 bg-green-600"
                                    disabled
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Completed
                                </Button>
                            </CardContent>
                        </Card>

                    }


                    <CardCollapsible
                        title="Progress Timeline"
                        description="Updates and activity log"
                        defaultOpen
                    >
                        <AssignmentTimeline assignmentId={assignment.assignment_id} />
                    </CardCollapsible>




                </div>
            </div>
        </div>
    );
};

export default AssignmentDetailPage;
