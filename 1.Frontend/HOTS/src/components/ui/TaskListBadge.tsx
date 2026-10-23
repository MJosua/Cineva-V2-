
import React, { useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { useAppSelector, useAppDispatch } from '@/hooks/useAppSelector';
import { fetchTaskCount } from '@/store/slices/ticketsSlice';

const TaskListBadge = () => {
  const dispatch = useAppDispatch();
  const { taskCount } = useAppSelector(state => state.tickets);
  
  useEffect(() => {
    dispatch(fetchTaskCount());
  }, [dispatch]);

  if (taskCount === 0) return null;

  return (
    <Badge variant="destructive" className="ml-2">
      {taskCount}
    </Badge>
  );
};

export default TaskListBadge;
