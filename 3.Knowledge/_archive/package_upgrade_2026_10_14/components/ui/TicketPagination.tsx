
import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface TicketPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
}

export const TicketPagination: React.FC<TicketPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems
}) => {
  const renderPageNumbers = () => {
    const pages = [];
    const showEllipsis = totalPages > 7;
    
    if (!showEllipsis) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => onPageChange(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // Show ellipsis for more than 7 pages
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, currentPage + 2);

      if (startPage > 1) {
        pages.push(
          <PaginationItem key={1}>
            <PaginationLink onClick={() => onPageChange(1)} className="cursor-pointer">
              1
            </PaginationLink>
          </PaginationItem>
        );
        if (startPage > 2) {
          pages.push(<PaginationEllipsis key="start-ellipsis" />);
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => onPageChange(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push(<PaginationEllipsis key="end-ellipsis" />);
        }
        pages.push(
          <PaginationItem key={totalPages}>
            <PaginationLink onClick={() => onPageChange(totalPages)} className="cursor-pointer">
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Showing page {currentPage} of {totalPages} ({totalItems} total items)
      </p>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
          {renderPageNumbers()}
          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};
