
import React from 'react';
import { Badge } from "./badge";

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
      {isActive ? "Active" : "Deactivated"}
    </Badge>
  );
};

export default UserStatusBadge;
