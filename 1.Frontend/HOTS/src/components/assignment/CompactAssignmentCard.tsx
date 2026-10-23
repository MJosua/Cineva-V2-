import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import AssignmentTimeline from '@/components/assignment/AssignmentTimeline';
import CompletionModal from '@/components/modals/CompletionModal';
import { API_URL } from '@/config/sourceConfig';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import axios from 'axios';

interface Assignment {
    assignment_id: number;
    ticket_id: string;
    ticket_title?: string;
    service_id: number;
    service_name: string;
    assigned_type: string;
    assigned_id: number;
    assigned_at: string;
    assignment_status: string;
    notes: string;
    is_overdue: boolean;
    overdue_task_count: number;
}

interface CompactAssignmentCardProps {
    assignment: Assignment;
    onComplete?: () => void;
    isSelected?: boolean;
    onToggleSelect?: (id: number) => void;
}

export const CompactAssignmentCard: React.FC<CompactAssignmentCardProps> = ({ assignment, onComplete, isSelected, onToggleSelect }) => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);

    const getStatusConfig = (status: string, isOverdueFromAPI: boolean) => {
        const configs: Record<string, { color: string, bgColor: string, icon: React.ReactNode, label: string }> = {
            'active': {
                color: isOverdueFromAPI ? 'text-orange-700' : 'text-blue-700',
                bgColor: isOverdueFromAPI ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200',
                icon: isOverdueFromAPI ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />,
                label: isOverdueFromAPI ? 'Overdue' : 'Active'
            },
            'completed': {
                color: 'text-green-700',
                bgColor: 'bg-green-50 border-green-200',
                icon: <CheckCircle className="w-4 h-4" />,
                label: 'Completed'
            },
            'cancelled': {
                color: 'text-gray-500',
                bgColor: 'bg-gray-50 border-gray-200',
                icon: <XCircle className="w-4 h-4" />,
                label: 'Cancelled'
            },
        };
        return configs[status] || { color: 'text-gray-700', bgColor: 'bg-gray-50 border-gray-200', icon: null, label: status };
    };

    const getTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    const s = getStatusConfig(assignment.assignment_status, assignment.is_overdue);

    const handleComplete = async (note: string, tempFileIds: number[]) => {
        setIsCompleting(true);
        try {
            const token = localStorage.getItem('hots_tokek');
            await axios.post(
                `${API_URL}/engine/assignment/${assignment.assignment_id}/complete`,
                { 
                    completion_note: note,
                    temp_file_ids: tempFileIds
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast({
                title: 'Success',
                description: 'Assignment marked as complete!'
            });
            setIsConfirmOpen(false);
            if (onComplete) onComplete();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.error || error.message || 'Failed to complete assignment',
                variant: 'destructive'
            });
        } finally {
            setIsCompleting(false);
        }
    };

    return (
        <Card className={`flex flex-col border-slate-200 hover:shadow-md transition-all shadow-sm max-h-[600px] max-w-lg w-full relative ${isSelected ? 'ring-2 ring-blue-500 border-blue-300' : ''}`}>
            {onToggleSelect && assignment.assignment_status === 'active' && (
                <div className="absolute top-3 left-3 z-10">
                    <Checkbox 
                        checked={isSelected} 
                        onCheckedChange={() => onToggleSelect(assignment.assignment_id)}
                        className="w-5 h-5 border-slate-300 bg-white shadow-sm data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                </div>
            )}
            <CardContent className={`p-4 flex flex-col h-full overflow-hidden ${onToggleSelect && assignment.assignment_status === 'active' ? 'pl-11' : ''}`}>
                {/* Header Section */}
                <div className="flex-none mb-3">
                    <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                            <span className="text-xs font-mono font-bold text-slate-500 block mb-1">#{assignment.ticket_id}</span>
                            <h3 className="font-bold text-slate-800 text-lg leading-tight line-clamp-2" title={assignment.ticket_title || "Untitled Assignment"}>
                                {assignment.ticket_title || "Untitled Assignment"}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium mt-1 truncate">{assignment.service_name}</p>
                        </div>
                        {s.icon && (
                            <Badge variant="secondary" className={`${s.bgColor} ${s.color} text-[10px] px-2 py-0.5 whitespace-nowrap`}>
                                <span className="flex items-center gap-1 font-bold">
                                    {s.icon} {s.label}
                                </span>
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {getTimeAgo(assignment.assigned_at)}</span>
                        {assignment.notes && (
                            <>
                                <span>|</span>
                                <span className="truncate flex-1 italic">{assignment.notes}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Scrollable Timeline Section */}
                <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50/50 rounded-md border border-slate-100 p-2 custom-scrollbar my-2 -mx-2 px-2">
                    {/* Wrap AssignmentTimeline here */}
                    {/* Setting a specific scale or wrapper to make it fit nicely */}
                    <div className="scale-[0.95] origin-top">
                        <AssignmentTimeline 
                            assignmentId={assignment.assignment_id} 
                            ticketId={assignment.ticket_id} 
                            readOnly={true} 
                            pageSize={5}
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex-none pt-3 mt-2 border-t border-slate-100 flex gap-2 justify-end">
                    <Button
                        variant="outline"
                        className="flex-1 bg-white"
                        onClick={() => navigate(`/assignment/${assignment.ticket_id}`)}
                    >
                        View Detail
                    </Button>
                    {assignment.assignment_status === 'active' && (
                        <Button
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2"
                            onClick={() => setIsConfirmOpen(true)}
                        >
                            <CheckCircle className="w-4 h-4" />
                            Complete
                        </Button>
                    )}
                </div>
            </CardContent>

            <CompletionModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleComplete}
                title="Complete Assignment"
                description={<>Are you sure you want to mark <b>{assignment.ticket_title || "this assignment"}</b> as complete? You can add a final closing statement below.</>}
                isLoading={isCompleting}
            />
        </Card>
    );
};
