import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import ProgressionBar from "@/components/ui/ProgressionBar";
import TaskApprovalActions from "@/components/ui/TaskApprovalActions";
import { highlightSearchTerm, searchInObject } from "@/utils/searchUtils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Grid, List, RefreshCw, Clock, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppSelector';
import { fetchTaskList, fetchInvolvedTaskList, fetchTaskCount } from '@/store/slices/ticketsSlice';
import { convertTicketToDisplayFormat, getStatusColor, getPriorityColor } from '@/utils/ticketUtils';
import { TicketPagination } from '@/components/ui/TicketPagination';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useTheme } from '@/components/theme-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useHeader } from '@/contexts/HeaderContext';

const TaskList = () => {
  const { searchValue, setSearchPlaceholder } = useHeader();
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const { user } = useAppSelector(state => state.auth);

  const dispatch = useAppDispatch();
  const { taskList, involvedList, taskCount } = useAppSelector((state) => state.tickets);
  const navigate = useNavigate();

  const { viewMode, setViewMode } = useTheme();

  function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  useEffect(() => {
    dispatch(fetchTaskList(1));
    dispatch(fetchInvolvedTaskList(1));
    dispatch(fetchTaskCount());
    setSearchPlaceholder("Search tasks...");
  }, [dispatch, setSearchPlaceholder]);

  // 🆕 Silent Refresh for Live Updates
  const { sseSignals } = useAppSelector(state => state.tickets);
  useEffect(() => {
    if (sseSignals?.ticket) {
      console.log('⚡ Silent Refresh: Task List');
      dispatch(fetchTaskList(taskList.currentPage)); // Refresh current page
      dispatch(fetchTaskCount());
    }
  }, [sseSignals?.ticket, dispatch, taskList.currentPage]);


  const tasks = taskList?.data[0]?.service_id
    ? taskList.data.map(t => {
      const converted = convertTicketToDisplayFormat(t);
      return {
        ...converted,
        formattedDate: formatDate(converted.created) // Add for search
      }
    })
    : [];


  const filteredTasks = tasks.filter(task => {
    const statusFilter = filterStatus === 'all' || task.status === filterStatus;
    const priorityFilter = filterPriority === 'all' || task.priority === filterPriority;
    const searchFilter = searchInObject(task, searchValue);

    return statusFilter && priorityFilter && searchFilter;
  });

  const handleRowClick = (taskId: string) => {
    navigate(`/ticket/${taskId}`);
  };

  const handlePageChange = (page: number) => {
    dispatch(fetchTaskList(page));
  };

  const handleRefresh = () => {
    dispatch(fetchTaskList(taskList.currentPage));
    dispatch(fetchTaskCount());
  };

  const renderHighlightedText = (text: string) => {
    return (
      <span
        dangerouslySetInnerHTML={{
          __html: highlightSearchTerm(text, searchValue)
        }}
      />
    );
  };


  // Get the current user's pending approval order for a ticket
  const getUserApprovalOrder = (ticket: any, user_id: string | number): number | null => {
    if (!ticket.list_approval) return null;


    const userApproval = ticket.list_approval.find((approval: any) =>
      approval.approval_status === 0 && approval.approver_id === user?.user_id
    );

    return userApproval ? userApproval.approval_order : null;
  };



  const canUserApprove = (task) => {
    if (!task || !task.approvalSteps) return false;
    return task.approvalSteps.some(approver =>
      approver.approval_order === task.current_step &&
      approver.id?.toString() === user?.user_id?.toString() &&
      approver.status === 'pending'
    );
  };



  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return current.direction === 'asc'
          ? { key, direction: 'desc' }
          : { key, direction: 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Sort logic
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // 1. Header Sort (if active)
    if (sortConfig) {
      const { key, direction } = sortConfig;
      let valA = a[key] ?? "";
      let valB = b[key] ?? "";

      if (key === 'created') {
        valA = new Date(a.created).getTime();
        valB = new Date(b.created).getTime();
      }

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    }

    // 2. Default Business Logic Sort (if no header sort)
    if (a.status_id !== b.status_id) {
      return a.status_id - b.status_id;
    }

    const aCan = canUserApprove(a);
    const bCan = canUserApprove(b);
    return (aCan === bCan) ? 0 : aCan ? -1 : 1;
  });



  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key === columnKey) {
      return sortConfig.direction === 'asc'
        ? <ArrowUp className="w-4 h-4 ml-1 text-primary inline" />
        : <ArrowDown className="w-4 h-4 ml-1 text-primary inline" />;
    }
    return <ArrowUpDown className="w-4 h-4 ml-1 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity inline" />;
  };

  const TableView = ({ tasks }: { tasks: any[] }) => (
    <Card className="border-border shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 border-b border-border">
                <TableHead
                  className="text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground group select-none"
                  onClick={() => handleSort('id')}
                >
                  Ticket ID <SortIcon columnKey="id" />
                </TableHead>
                <TableHead
                  className="text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground group select-none"
                  onClick={() => handleSort('created')}
                >
                  Date <SortIcon columnKey="created" />
                </TableHead>
                <TableHead
                  className="text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground group select-none"
                  onClick={() => handleSort('type')}
                >
                  Type <SortIcon columnKey="type" />
                </TableHead>
                <TableHead
                  className="text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground group select-none"
                  onClick={() => handleSort('requester')}
                >
                  Requester <SortIcon columnKey="requester" />
                </TableHead>
                <TableHead
                  className="text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground group select-none"
                  onClick={() => handleSort('priority')}
                >
                  Priority <SortIcon columnKey="priority" />
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground uppercase">Progress</TableHead>
                <TableHead
                  className="text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground group select-none"
                  onClick={() => handleSort('status')}
                >
                  Status <SortIcon columnKey="status" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task, index) => {
                const canApprove = canUserApprove(task);

                return (
                  <TableRow
                    key={task.id}
                    className={`${canApprove ? "bg-orange-200/30 hover:bg-orange-200/50" : "hover:bg-muted/30"
                      } cursor-pointer transition-colors`}
                    onClick={() => handleRowClick(task.id)}
                  >
                    <TableCell className="font-medium text-primary">
                      {renderHighlightedText(task.id)}
                    </TableCell>
                    <TableCell className="font-medium text-primary">
                      {renderHighlightedText(formatDate(task.created))}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {renderHighlightedText(task.type)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {renderHighlightedText(task.requester)}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getPriorityColor(task.priority)} border`}>
                        {renderHighlightedText(task.priority)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ProgressionBar steps={task.approvalSteps} />
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(task.status_id)} border`}>
                        {renderHighlightedText(task.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card >
  );

  const CardView = ({ tasks }: { tasks: any[] }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {tasks.map((task, index) => {
        const originalTicket = taskList.data.find(
          t => t.ticket_id.toString() === task.id
        );

        const getCurrentApprover = () => {
          if (!task.approvalSteps) return null;
          return task.approvalSteps.find(
            approver =>
              approver.approval_order === task.current_step &&
              approver.approver === user?.user_id.toString() &&
              approver.status === 'pending'
          );
        };

        const currentApprover = getCurrentApprover();

        const canApprove = canUserApprove(task);

        return (
          <div key={task.id} className="space-y-4">
            <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle
                    className="text-lg font-medium text-primary cursor-pointer hover:underline"
                    onClick={() => handleRowClick(task.id)}
                  >
                    {renderHighlightedText(task.id)}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {canApprove && (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        <Clock className="w-3 h-3 mr-1" />
                        Action Required
                      </Badge>
                    )}
                    <Badge className={`${getPriorityColor(task.priority)} border text-xs`}>
                      {renderHighlightedText(task.priority)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {renderHighlightedText(task.type)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Requester: {renderHighlightedText(task.requester)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Department: {renderHighlightedText(task.department)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Approval Progress</p>
                  <ProgressionBar steps={task.approvalSteps} showDetails={true} />
                </div>

                <div className="flex items-center justify-between">
                  <Badge className={`${getStatusColor(task.status_id)} border text-xs`}>
                    {renderHighlightedText(task.status)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(originalTicket?.creation_date || '').toLocaleDateString()}
                  </span>
                </div>

              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );

  // Process Involved Tasks
  const involvedTasks = involvedList?.data[0]?.service_id
    ? involvedList.data.map(t => {
      const converted = convertTicketToDisplayFormat(t);
      return {
        ...converted,
        formattedDate: formatDate(converted.created)
      }
    })
    : [];

  const filteredInvolvedTasks = involvedTasks.filter(task => {
    const statusFilter = filterStatus === 'all' || task.status === filterStatus;
    const priorityFilter = filterPriority === 'all' || task.priority === filterPriority;
    const searchFilter = searchInObject(task, searchValue);

    return statusFilter && priorityFilter && searchFilter;
  });

  const sortedInvolvedTasks = [...filteredInvolvedTasks].sort((a, b) => {
    if (sortConfig) {
      const { key, direction } = sortConfig;
      let valA = a[key] ?? "";
      let valB = b[key] ?? "";

      if (key === 'created') {
        valA = new Date(a.created).getTime();
        valB = new Date(b.created).getTime();
      }

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    }
    return Number(b.id) - Number(a.id);
  });


  if (taskList.isLoading && taskList.data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">My Approvals</h1>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={taskList.isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${taskList.isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary border-primary/20">
            {taskList.totalData} Tasks
          </Badge>
          {taskCount > 0 && (
            <Badge variant="destructive" className="px-3 py-1">
              {taskCount} Pending Actions
            </Badge>
          )}
        </div>
      </div>

      {/* Error display */}
      {taskList.error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">{taskList.error}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs & Filters */}
      <Tabs defaultValue="todo" className="w-full">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <TabsList className="w-full lg:w-auto">
              <TabsTrigger value="todo" className="flex-1 lg:flex-none">Action Required ({filteredTasks.length})</TabsTrigger>
              <TabsTrigger value="involved" className="flex-1 lg:flex-none">Involved ({filteredInvolvedTasks.length})</TabsTrigger>
            </TabsList>

            {/* Filter & View Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[160px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {[...new Set([...tasks, ...involvedTasks].map(t => t.status))].filter(Boolean).map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center border rounded-md overflow-hidden h-9">
                <Button
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="flex-1 sm:flex-none rounded-none h-full px-3"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'card' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('card')}
                  className="flex-1 sm:flex-none rounded-none h-full px-3"
                >
                  <Grid className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <TabsContent value="todo" className="mt-0">
            {/* Content */}
            {viewMode === 'table' ? <TableView tasks={sortedTasks} /> : <CardView tasks={sortedTasks} />}

            {taskList.totalPage > 1 && (
              <TicketPagination
                currentPage={taskList.currentPage}
                totalPages={taskList.totalPage}
                totalItems={taskList.totalData}
                onPageChange={handlePageChange}
              />
            )}
            {filteredTasks.length === 0 && !taskList.isLoading && (
              <div className="p-8 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                No pending actions found.
              </div>
            )}
          </TabsContent>

          <TabsContent value="involved" className="mt-0">
            {viewMode === 'table' ? <TableView tasks={sortedInvolvedTasks} /> : <CardView tasks={sortedInvolvedTasks} />}

            {filteredInvolvedTasks.length === 0 && !involvedList.isLoading && (
              <div className="p-8 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                No involved tickets found.
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default TaskList;
