
import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface ServiceCatalogSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const ServiceCatalogSearch: React.FC<ServiceCatalogSearchProps> = ({
  searchTerm,
  onSearchChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Search</CardTitle>
        <Input
          placeholder="Search forms by title or category..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </CardHeader>
    </Card>
  );
};
