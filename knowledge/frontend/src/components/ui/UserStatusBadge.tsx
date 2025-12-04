
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface UserStatusBadgeProps {
  isActive: boolean;
  className?: string;
}

const UserStatusBadge = ({ isActive, className }: UserStatusBadgeProps) => {
  return (
    <Badge 
      variant={isActive ? "default" : "destructive"} 
      className={className}
    >
      {isActive ? "Active" : "Deleted"}
    </Badge>
  );
};

export default UserStatusBadge;
