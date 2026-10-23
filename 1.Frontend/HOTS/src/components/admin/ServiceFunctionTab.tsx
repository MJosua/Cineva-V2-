
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Settings } from 'lucide-react';
import { useAppSelector } from '@/hooks/useAppSelector';
import ServiceFunctionAssignment from './ServiceFunctionAssignment';

export default function ServiceFunctionTab() {
  const { serviceCatalog } = useAppSelector(state => state.catalog);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);

  const filteredServices = serviceCatalog.filter(service =>
    service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.service_description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedService = serviceCatalog.find(s => s.service_id === selectedServiceId);

  if (selectedServiceId && selectedService) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => setSelectedServiceId(null)}>
            ← Back to Services
          </Button>
          <div>
            <h2 className="text-xl font-semibold">{selectedService.service_name}</h2>
            <p className="text-muted-foreground">{selectedService.service_description}</p>
          </div>
        </div>
        
        <ServiceFunctionAssignment 
          serviceId={selectedServiceId} 
          serviceName={selectedService.service_name}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Service Function Assignments</h2>
        <p className="text-muted-foreground">Assign custom functions to services and configure trigger events</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4">
        {filteredServices.map((service) => (
          <Card key={service.service_id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedServiceId(service.service_id)}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-lg">{service.service_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{service.service_description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={service.active ? "default" : "secondary"}>
                    {service.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
