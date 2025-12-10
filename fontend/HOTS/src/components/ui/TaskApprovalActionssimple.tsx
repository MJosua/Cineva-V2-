
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, X, MessageSquare } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppSelector';
import { approveTicket, rejectTicket, fetchTaskList, fetchTicketDetail } from '@/store/slices/ticketsSlice';
import { toast } from '@/hooks/use-toast';
import { approveTicketEngine, rejectTicketEngine } from '../../store/slices/ticketsSlice';

interface TaskApprovalActionsProps {
  ticketId: string;
  approvalOrder: number;
  canApprove: boolean;
  currentStatus: number;
  currentUserId?: number;
  assignedToId?: string | number;
  refreshticketdetail?: boolean;
  setRefreshticketdetail?: (value: boolean) => void;
  useEngine?: boolean;
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
  useEngine = true // <-- default false (legacy mode)

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


  const handleApprove = async () => {
    try {
      await dispatch(approveTicket({
        ticketId,
        approvalOrder,
        comment: comment.trim()
      })).unwrap();

      toast({
        title: "Success",
        description: "Ticket approved successfully",
      });

      // Refresh the task list
      dispatch(fetchTaskList(1));
      dispatch(fetchTicketDetail(ticketId));

      setRefreshticketdetail(true)
      setComment('');
      setShowCommentBox(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error as string || "Failed to approve ticket",
        variant: "destructive",
      });
    }
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
    } catch (error) {
      toast({
        title: "Error",
        description: error as string || "Engine v4 approval failed",
        variant: "destructive",
      });
    }
  };

  const handleRejectEngine = async () => {
    if (!rejectionRemark.trim()) {
      toast({
        title: "Error",
        description: "Rejection reason is required",
        variant: "destructive",
      });
      return;
    }

    try {
      await dispatch(rejectTicketEngine({
        ticketId,
        approvalOrder,
        rejectionRemark: rejectionRemark.trim(),
        approver_id: user.user_id

      })).unwrap();

      toast({ title: "Success", description: "Engine v4 rejection done" });
      dispatch(fetchTicketDetail(ticketId));
      dispatch(fetchTaskList(1));
      setRejectionRemark('');
      setShowRejectBox(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error as string || "Engine v4 rejection failed",
        variant: "destructive",
      });
    }
  };





  const handleReject = async () => {
    if (!rejectionRemark.trim()) {
      toast({
        title: "Error",
        description: "Rejection reason is required",
        variant: "destructive",
      });
      return;
    }

    try {
      await dispatch(rejectTicket({
        ticketId,
        approvalOrder,
        rejectionRemark: rejectionRemark.trim()
      })).unwrap();

      toast({
        title: "Success",
        description: "Ticket rejected successfully",
      });

      // Refresh the task list
      dispatch(fetchTaskList(1));
      dispatch(fetchTicketDetail(ticketId));
      setRejectionRemark('');
      setShowRejectBox(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error as string || "Failed to reject ticket",
        variant: "destructive",
      });
    }
  };



  const handleRejectCancel = () => {
    setRejectionRemark('');
    setShowRejectBox(false);
  };



  return (
    <Card className='w-full h-full  items-center justify-center'>
      <CardContent >
        <div className="w-full  bg-primaryspace-y-1  justify-center items-center">
          <div className="flex gap-3 mt-5">
            {!useEngine && (
              <>
                {/* Legacy HOTS Approve */}
                <Button
                  onClick={() => { setShowCommentBox(!showCommentBox); setShowRejectBox(false); }}
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approve (HOTS)
                </Button>

                {/* Legacy HOTS Reject */}
                <Button
                  onClick={() => { setShowRejectBox(!showRejectBox); setShowCommentBox(false); }}
                  disabled={isSubmitting}
                  className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/50"
                  variant="outline"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject (HOTS)
                </Button>
              </>
            )}

            {useEngine && (
              <>
                {/* ENGINE Approve */}
                <Button
                  onClick={() => { setShowCommentBox(!showCommentBox); setShowRejectBox(false); }}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approve (Engine)
                </Button>

                {/* ENGINE Reject */}
                <Button
                  onClick={() => { setShowRejectBox(!showRejectBox); setShowCommentBox(false); }}
                  disabled={isSubmitting}
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject (Engine)
                </Button>
              </>
            )}
          </div>

          {showCommentBox && (
            <div className="space-y-2">
              <Label htmlFor="approval-comment">Approval Comment (Optional)</Label>
              <Textarea
                id="approval-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment for this approval..."
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  onClick={useEngine ? handleApproveEngine : handleApprove}
                  disabled={isSubmitting}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Confirm Approval
                </Button>
                <Button
                  onClick={() => setShowCommentBox(false)}
                  disabled={isSubmitting}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {showRejectBox && (
            <div className="space-y-2">
              <Label htmlFor="rejection-remark">Rejection Reason *</Label>
              <Textarea
                id="rejection-remark"
                value={rejectionRemark}
                onChange={(e) => setRejectionRemark(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                rows={3}
                required
              />
              <div className="flex gap-2">
                <Button
                  onClick={useEngine ? handleRejectEngine : handleReject}
                  disabled={isSubmitting || !rejectionRemark.trim()}
                  size="sm"
                  variant="destructive"
                >
                  Confirm Rejection
                </Button>
                <Button
                  onClick={handleRejectCancel}
                  disabled={isSubmitting}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );



};

export default TaskApprovalActionsSimple
