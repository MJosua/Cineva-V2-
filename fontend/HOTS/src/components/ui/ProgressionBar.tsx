
import React from 'react';
import { Check, X, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useAppSelector } from '@/hooks/useAppSelector';

interface ApprovalStep {
  id: string;
  name: string;
  status: 'approved' | 'rejected' | 'pending' | 'waiting';
  date?: string;
  approver?: string;
  approval_order?: number;
  approval_status?: string | number; // Can be string "1" or number 1
  approver_leader?: string | number; // Can be string "1" or number 1
}

interface ProgressionBarProps {
  steps: ApprovalStep[];
  className?: string;
  showDetails?: boolean;
}


const ProgressionBar = ({ steps, className, showDetails = false }: ProgressionBarProps) => {
  const approvedCount = steps.filter(step => step.status === 'approved').length;
  const totalSteps = steps.length;
  const { user } = useAppSelector((state) => state.auth);



  if (!showDetails) {
    // Simple progress bar view

    const filteredSteps = steps
      .filter((step) => {
        if (!user?.user_id) {
          return Number(step.approver_leader) === 1;
        }

        const userIsApprover = steps.some((x) =>
          x.id.startsWith(`${user.user_id}-`)
        );

        return userIsApprover || Number(step.approver_leader) === 1;
      })
      .sort((a, b) => (a.approval_order ?? 0) - (b.approval_order ?? 0));


    // 🧩 AUTO-STATUS / NO APPROVAL CASE
    if (totalSteps === 0) {
      return (
        <div className={cn("flex items-center space-x-2", className)}>
          <div className="flex items-center px-2 py-0.5 rounded-full bg-green-100 border border-green-200">
            <Check className="w-3 h-3 text-green-600 mr-1.5" />
            <span className="text-[10px] uppercase font-bold text-green-700 tracking-tight">
              Automatic
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className={cn("flex items-center space-x-1", className)}>
        <span className="text-sm font-medium text-muted-foreground mr-2">
          {filteredSteps.filter(s => String(s.approval_status) === '1').length}/{filteredSteps.length}
        </span>
        {steps

          .filter((a) => {
            return Number(a.approver_leader) === 1;
          })

          .sort((a, b) => (a.approval_order ?? 0) - (b.approval_order ?? 0)).map((step, index) => (
            <div
              key={`${step.id}-${index}`}
              className={cn(
                "h-2 w-8 rounded-full",
                {
                  "bg-primary": String(step.approval_status) === '1',
                  "bg-destructive": String(step.approval_status) === '2',
                  "bg-yellow-500": String(step.approval_status) === '0',
                  "bg-muted": String(step.approval_status) === '3'
                }
              )}
            />
          ))}
      </div>
    );
  }



  // Detailed view (for ticket detail page)
  return (
    <div className={cn("flex items-center space-x-2 overflow-x-auto whitespace-nowrap flex-nowrap max-w-full", className)}>
      {steps
        .filter((a) => {
          if (!user?.user_id) {
            // user not loaded yet: fallback to only show leaders
            return Number(a.approver_leader) === 1;
          }

          const userIsApprover = steps.some((x) =>
            x.id.startsWith(`${user.user_id}-`)
          );

          return userIsApprover || Number(a.approver_leader) === 1;
        })
        .sort((a, b) => (a.approval_order ?? 0) - (b.approval_order ?? 0)).map((step, index) => (
          <div key={`${step.id}-${step.name}-${index}`} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                  {
                    "bg-primary text-primary-foreground": step.status === 'approved',
                    "bg-destructive text-destructive-foreground": step.status === 'rejected',
                    "bg-yellow-500 text-white": step.status === 'pending',
                    "bg-muted text-muted-foreground": step.status === 'waiting'
                  }
                )}
              >
                {String(step.approval_status) === '1' && <Check className="w-4 h-4" />}
                {step.status === 'rejected' && <X className="w-4 h-4" />}
                {step.status === 'pending' && <Clock className="w-4 h-4" />}
                {step.status === 'waiting' && (index + 1)}
              </div>
              <span className="text-xs text-muted-foreground mt-1 text-center max-w-16 truncate">
                {step.name}
              </span>
              {showDetails && step.approver && (
                <span className="text-xs text-muted-foreground text-center max-w-20 truncate">
                  {step.approver}
                </span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-8 flex-shrink-0",
                  {
                    "bg-primary": step.status === 'approved',
                    "bg-destructive": step.status === 'rejected',
                    "bg-muted": step.status === 'waiting' || step.status === 'pending'
                  }
                )}
              />
            )}
          </div>
        ))}
    </div>
  );
};

export default ProgressionBar;
