
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, X, MessageSquare } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppSelector';
import { fetchTaskList, fetchTicketDetail } from '@/store/slices/ticketsSlice';
import { toast } from '@/hooks/use-toast';
import { approveTicketEngine, rejectTicketEngine } from '../../store/slices/ticketsSlice';
import { WarningDialog } from '../dialog/warningdialoguser';

interface TaskApprovalActionsProps {
  ticketId: string;
  approvalOrder: number;
  canApprove: boolean;
  currentStatus: number;
  currentUserId?: number;
  assignedToId?: string | number;
  refreshticketdetail?: boolean;
  setRefreshticketdetail?: (value: boolean) => void;
  // useEngine?: boolean; // Deprecated, always true
}

const TaskApprovalActionsSimple: React.FC<TaskApprovalActionsProps> = ({
  ticketId,
  approvalOrder,
  canApprove,
  currentStatus,
  currentUserId,
  assignedToId,
  refreshticketdetail = false,
  setRefreshticketdetail = () => { },
  // useEngine = true 

}) => {
  const dispatch = useAppDispatch();
  const { isSubmitting } = useAppSelector(state => state.tickets);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [comment, setComment] = useState('');
  const [rejectionRemark, setRejectionRemark] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);

  // Check if current user can approve this ticket
  const assignedToIdNumber = typeof assignedToId === 'string' ? parseInt(assignedToId) : assignedToId;
  const userCanApprove = canApprove;

  if (!userCanApprove) {
    console.log('TaskApprovalActions: Not rendering because userCanApprove is false');
    return null;
  }

  const { user } = useAppSelector(state => state.auth);

  // Confirmation State
  const [warningOpen, setWarningOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);

  const confirmAction = (action: 'approve' | 'reject') => {
    if (action === 'reject' && !comment.trim()) {
      toast({
        title: "Error",
        description: "Rejection reason is required",
        variant: "destructive",
      });
      return;
    }
    setPendingAction(action);
    setWarningOpen(true);
  };

  const handleConfirm = async () => {
    if (pendingAction === 'approve') {
      await handleApproveEngine();
    } else if (pendingAction === 'reject') {
      await handleRejectEngine();
    }
    setWarningOpen(false);
    setPendingAction(null);
  };

  const handleApproveEngine = async () => {
    try {
      await dispatch(approveTicketEngine({
        ticketId,
        approvalOrder,
        comment: comment.trim(),
        approver_id: user.user_id
      })).unwrap();

      toast({ title: "Success", description: "Engine v4 approval done" });
      dispatch(fetchTaskList(1));
      setComment('');
      setShowCommentBox(false);
      dispatch(fetchTicketDetail(ticketId));
      setRefreshticketdetail(true);

    } catch (error) {
      toast({
        title: "Error",
        description: error as string || "Engine v4 approval failed",
        variant: "destructive",
      });
    }
  };

  const handleRejectEngine = async () => {
    try {
      await dispatch(rejectTicketEngine({
        ticketId,
        approvalOrder,
        rejectionRemark: comment.trim(), // Use comment state for rejection too logic simplified
        approver_id: user.user_id
      })).unwrap();

      toast({ title: "Success", description: "Engine v4 rejection done" });
      dispatch(fetchTicketDetail(ticketId));
      dispatch(fetchTaskList(1));
      setComment('');
      setShowRejectBox(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error as string || "Engine v4 rejection failed",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className='w-full h-full  items-center justify-center'>
      <CardContent >
        <div className="w-full  bg-primaryspace-y-1  justify-center items-center">
          <div className="space-y-2">
            <Label htmlFor="approval-comment">Approval/Rejection Comment</Label>
            <Textarea
              id="approval-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment for this approval or rejection"
              rows={3}
            />

            <div className="flex gap-3 mt-5">
              {/* ENGINE Approve */}
              <Button
                onClick={() => confirmAction('approve')}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Approve
              </Button>

              {/* ENGINE Reject */}
              <Button
                onClick={() => confirmAction('reject')}
                disabled={isSubmitting}
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      <WarningDialog
        isOpen={warningOpen}
        onCancel={() => setWarningOpen(false)}
        onConfirm={handleConfirm}
        isLoading={isSubmitting}
        title={pendingAction === 'approve' ? "Confirm Approval" : "Confirm Rejection"}
        description={pendingAction === 'approve' ? "Are you sure you want to approve this task? The following note will be included with your approval." : "Are you sure you want to reject this task?"}
        confirmLabel={pendingAction === 'approve' ? "Approve" : "Reject"}
        confirmButtonColor={pendingAction === 'approve' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
      >
        <div className="bg-muted/50 p-4 rounded-md text-sm text-foreground italic border">
          {comment || (
            <span className="text-muted-foreground not-italic">No comment provided.</span>
          )}
        </div>
      </WarningDialog>
    </Card>
  );
};

export default TaskApprovalActionsSimple
