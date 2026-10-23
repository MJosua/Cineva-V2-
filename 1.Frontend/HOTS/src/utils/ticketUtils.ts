
import { Ticket, Approver } from '@/types/ticketTypes';

export const convertTicketToDisplayFormat = (ticket: Ticket) => {
  // Convert approval list to steps format
  const approvalSteps = ticket.list_approval?.map((approver: Approver, index: number) => {
    // Handle both string and number approval_status from API
    const approvalStatusStr = String(approver.approval_status);

    return {
      id: approver?.approver_id ? approver.approver_id.toString() : "0",
      name: approver.approver_name,
      approver_leader: approver.approver_leader,
      approval_order: approver.approval_order,
      status: approvalStatusStr === '1' ? 'approved' as const :
        approvalStatusStr === '2' ? 'rejected' as const :
          'pending' as const,
      date: approver.approval_date,
      approver: approver.approver_name,
      approval_status: approver.approval_status
    };
  }) || [];

  // Use backend-calculated priority if available, otherwise fallback to age-based logic
  const getPriority = () => {
    // If backend provides priority, use it (low/medium/high)
    if (ticket.priority) {
      return ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1); // capitalize
    }
    // Fallback: approval_level based (legacy)
    const level = ticket.approval_level || 1;
    if (level >= 3) return 'High';
    if (level === 2) return 'Medium';
    return 'Low';
  };


  return {
    id: ticket.ticket_id.toString(),
    status_id: ticket.status_id,
    type: ticket.service_name,
    requester: ticket.creator_name || ticket.created_by || "Current User",
    department: ticket.department_name || "Unknown Department",
    priority: getPriority(),
    created: ticket.creation_date,
    amount: "-", // Not provided in API
    status: ticket.status_name,
    approvalSteps: approvalSteps,
    current_step: ticket.workflow_step || ticket.current_step, // Backend returns workflow_step
  };
};

// Fix: Handle both string and number status_id
export const getStatusColor = (status: string | number) => {
  const statusId = typeof status === 'string' ? parseInt(status, 10) : status;

  switch (statusId) {
    case 0: return "bg-cyan-100 text-cyan-800 border-cyan-200";      // Submitted
    case 1: return "bg-green-100 text-green-800 border-green-200";   // Fulfilled
    case 2: return "bg-blue-100 text-blue-800 border-blue-200";      // Waiting Approval
    case 3: return "bg-orange-100 text-orange-800 border-orange-200";// In Progress
    case 4: return "bg-red-100 text-red-800 border-red-200";         // Rejected
    case 5: return "bg-yellow-100 text-yellow-800 border-yellow-200";// Pending
    case 6: return "bg-gray-100 text-gray-800 border-gray-200";      // Closed
    case 7: return "bg-gray-100 text-gray-800 border-gray-200";      // Closed by User
    default: return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export const getPriorityColor = (priority: string) => {
  const p = priority?.toLowerCase();
  switch (p) {
    case "high": return "bg-red-100 text-red-800 border-red-200";
    case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "low": return "bg-green-100 text-green-800 border-green-200";
    default: return "bg-gray-100 text-gray-800 border-gray-200";
  }
};
