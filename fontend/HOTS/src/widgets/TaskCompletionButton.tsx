import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API_URL } from '@/config/sourceConfig';

interface TaskCompletionButtonProps {
    ticketId: string;
    taskOrder: number;
    taskName: string;
    isCompleted: boolean;
    completedBy?: number;
    onComplete?: () => void;
    currentUserId?: number;
}

export const TaskCompletionButton: React.FC<TaskCompletionButtonProps> = ({
    ticketId,
    taskOrder,
    taskName,
    isCompleted,
    completedBy,
    onComplete,
    currentUserId
}) => {
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleComplete = async () => {
        if (isCompleted || !currentUserId) return;

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('tokek');
            const response = await fetch(`${API_URL}/engine/task/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ticket_id: ticketId,
                    task_order: taskOrder,
                    completed_by: currentUserId,
                    remark: `Task "${taskName}" completed by user ${currentUserId}`
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to complete task');
            }

            // Show success feedback
            if (onComplete) {
                onComplete();
            }

            // Optional: show toast notification
            console.log('✅ Task completed:', data);
        } catch (err: any) {
            setError(err.message || 'Failed to complete task');
            console.error('Task completion error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (isCompleted) {
        return (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">Completed</span>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <Button
                onClick={handleComplete}
                disabled={loading || !currentUserId}
                size="sm"
                className="gap-2"
                variant="default"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Completing...
                    </>
                ) : (
                    <>
                        <Check className="w-4 h-4" />
                        Mark Complete
                    </>
                )}
            </Button>

            {error && (
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            )}
        </div>
    );
};

export default TaskCompletionButton;
