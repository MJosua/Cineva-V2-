import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import ProgressionBar from "@/components/ui/ProgressionBar";
import { highlightSearchTerm, searchInObject } from "@/utils/searchUtils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown, Grid, List, RefreshCw } from 'lucide-react';
// import { AppLayout } from "@/components/layout/AppLayout";
import { useAppDispatch, useAppSelector } from '@/hooks/useAppSelector';
import { useHeader } from '@/contexts/HeaderContext';
import { fetchMyTickets } from '@/store/slices/ticketsSlice';
import { convertTicketToDisplayFormat, getStatusColor, getPriorityColor } from '@/utils/ticketUtils';
import { TicketPagination } from '@/components/ui/TicketPagination';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

import dateFormater from '../utils/dateformater.ts';
import { useTheme } from '@/components/theme-provider';

const MyTickets = () => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterType, setFilterType] = useState("all");

  const dispatch = useAppDispatch();
  const { myTickets } = useAppSelector((state) => state.tickets);
  const navigate = useNavigate();




  const { viewMode, setViewMode } = useTheme();
  const { searchValue, setSearchValue, setSearchPlaceholder } = useHeader();

  useEffect(() => {
    setSearchPlaceholder("Search tickets...");
    setSearchValue("");
    return () => {
      setSearchPlaceholder("Search...");
      setSearchValue("");
    };
  }, [setSearchValue, setSearchPlaceholder]);

  useEffect(() => {
    dispatch(fetchMyTickets(1));
  }, [dispatch]);

  const tickets = myTickets.data.map(t => {
    const converted = convertTicketToDisplayFormat(t);
    return {
      ...converted,
      formattedDate: dateFormater(converted.created) // Add formatted date for search
    };
  });

  const filteredTickets = tickets.filter(ticket => {
    const statusFilter =
      filterStatus === 'all' || ticket.status === filterStatus;

    const priorityFilter =
      filterPriority === 'all' || ticket.priority === filterPriority;

    const typeFilter =
      filterType === 'all' || String(ticket.type) === filterType;

    const searchFilter =
      searchInObject(ticket, searchValue);

    return statusFilter && priorityFilter && typeFilter && searchFilter;
  });

  const handleRowClick = (ticketId: string) => {
    navigate(`/ticket/${ticketId}`);
  };

  const handlePageChange = (page: number) => {
    dispatch(fetchMyTickets(page));
  };

  const handleRefresh = () => {
    dispatch(fetchMyTickets(myTickets.currentPage));
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


  const unique = [...new Map(
    myTickets.data.map(t => [t.service_id, t])
  ).values()];


  /* Sorting State */
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'created', direction: 'desc' });

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

  /* Sort Logic */
  const sortedFilteredTickets = [...filteredTickets].sort((a, b) => {
    if (!sortConfig) return 0;

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
  });


  /* Helper to render sort icon */
  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key === columnKey) {
      return sortConfig.direction === 'asc'
        ? <ArrowUp className="w-4 h-4 ml-1 text-primary inline" />
        : <ArrowDown className="w-4 h-4 ml-1 text-primary inline" />;
    }
    return <ArrowUpDown className="w-4 h-4 ml-1 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity inline" />;
  };

  const TableView = () => (
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
                  Submitted Date <SortIcon columnKey="created" />
                </TableHead>
                <TableHead
                  className="text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:text-foreground group select-none"
                  onClick={() => handleSort('type')}
                >
                  Type <SortIcon columnKey="type" />
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
              {sortedFilteredTickets.map((ticket) => {
                const sortedApprovalSteps = [...ticket.approvalSteps].sort(
                  (a, b) => a.approval_order - b.approval_order,
                );

                return (
                  <TableRow
                    key={ticket.id}
                    className={ticket.status_id === 7 ? "hover:bg-red-500/30 opacity-50 cursor-pointer bg-red-500/10 transition-colors" : "hover:bg-muted/30 cursor-pointer transition-colors"}
                    onClick={() => handleRowClick(ticket.id)}
                  >
                    <TableCell className="font-medium text-primary">
                      {renderHighlightedText(ticket.id)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {renderHighlightedText(dateFormater(ticket.created))}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {renderHighlightedText(ticket.type)}
                    </TableCell>

                    <TableCell>
                      <ProgressionBar steps={sortedApprovalSteps} />
                    </TableCell>

                    <TableCell>
                      <Badge className={`${getStatusColor(ticket.status_id)} border`}>
                        {renderHighlightedText(ticket.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}

            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  const CardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-9 gap-4 overflow-x-hidden">
      {filteredTickets.map((ticket) => (
        <Card
          key={ticket.id}
          className="col-span-3 border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => handleRowClick(ticket.id)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium text-primary">
                {renderHighlightedText(ticket.id)}
              </CardTitle>
              <Badge className={`${getPriorityColor(ticket.priority)} border text-xs`}>
                {renderHighlightedText(ticket.priority)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                {renderHighlightedText(ticket.type)}
              </p>
              <p className="text-xs text-muted-foreground">
                Created: {renderHighlightedText(ticket.created)}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Progress</p>
              <ProgressionBar steps={ticket.approvalSteps} />
            </div>

            <div className="flex items-center justify-between">
              <Badge className={`${getStatusColor(ticket.status)} border text-xs`}>
                {renderHighlightedText(ticket.status)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (myTickets.isLoading && myTickets.data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 ">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">My Tickets</h1>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={myTickets.isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${myTickets.isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary border-primary/20">
            {myTickets.totalData} Tickets
          </Badge>
        </div>
      </div>

      {/* Error display */}
      {myTickets.error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">{myTickets.error}</p>
          </CardContent>
        </Card>
      )}

      {/* Filters and View Toggle */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="status-filter" className="text-muted-foreground">Status:</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40 border-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {/* Dynamic Status Filter */}
                    {[...new Set(tickets.map(t => t.status))].filter(Boolean).map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>


              <div className="flex items-center space-x-2">
                <Label htmlFor="priority-filter" className="text-muted-foreground">Priority:</Label>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-40 border-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>


              <div className="flex items-center space-x-2">
                <Label htmlFor="priority-filter" className="text-muted-foreground">Type:</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40 border-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>

                    <SelectItem value="all">All</SelectItem>

                    {unique.map((ticket) => (
                      <SelectItem key={ticket.service_id} value={ticket.service_name}>
                        {ticket.service_name}
                      </SelectItem>
                    ))}


                  </SelectContent>
                </Select>
              </div>

            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="px-3"
              >
                <List className="w-4 h-4 mr-1" />
                Table
              </Button>
              <Button
                variant={viewMode === 'card' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('card')}
                className="px-3"
              >
                <Grid className="w-4 h-4 mr-1" />
                Cards
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {viewMode === 'table' ? <TableView /> : <CardView />}

      {/* Pagination */}
      {myTickets.totalPage > 1 && (
        <TicketPagination
          currentPage={myTickets.currentPage}
          totalPages={myTickets.totalPage}
          totalItems={myTickets.totalData}
          onPageChange={handlePageChange}
        />
      )}

      {filteredTickets.length === 0 && !myTickets.isLoading && (
        <Card className="border-border">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No tickets found matching your search criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyTickets;
