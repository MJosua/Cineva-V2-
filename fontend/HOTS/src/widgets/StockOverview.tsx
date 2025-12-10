
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Package, AlertTriangle, CheckCircle } from 'lucide-react';
import { WidgetProps } from '@/types/widgetTypes';

// Sample stock data
const sampleStockData = [
  { id: 1, item: 'Laptop Dell XPS 13', current: 15, max: 25, status: 'low' },
  { id: 2, item: 'Wireless Mouse', current: 45, max: 50, status: 'good' },
  { id: 3, item: 'Monitor 24"', current: 8, max: 20, status: 'low' },
  { id: 4, item: 'Keyboard Mechanical', current: 32, max: 35, status: 'good' },
  { id: 5, item: 'USB-C Cable', current: 2, max: 30, status: 'critical' },
];

const StockOverview: React.FC<WidgetProps> = ({ 
  formData, 
  serviceId 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'low': return 'text-orange-600 bg-orange-50';
      case 'good': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'low': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'good': return <CheckCircle className="w-4 h-4 text-green-600" />;
      default: return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Package className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-lg">Current Stock Status</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Real-time inventory levels for IT equipment
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sampleStockData.map((item) => {
            const percentage = (item.current / item.max) * 100;
            
            return (
              <div key={item.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(item.status)}
                    <span className="text-sm font-medium">{item.item}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant="outline" 
                      className={getStatusColor(item.status)}
                    >
                      {item.current}/{item.max}
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={percentage} 
                  className={`h-2 ${
                    item.status === 'critical' ? '[&>div]:bg-red-500' :
                    item.status === 'low' ? '[&>div]:bg-orange-500' :
                    '[&>div]:bg-green-500'
                  }`}
                />
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="p-2 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-800">Available</p>
            <p className="text-lg font-bold text-green-600">
              {sampleStockData.filter(item => item.status === 'good').length}
            </p>
          </div>
          <div className="p-2 bg-orange-50 rounded-lg">
            <p className="text-sm font-medium text-orange-800">Low Stock</p>
            <p className="text-lg font-bold text-orange-600">
              {sampleStockData.filter(item => item.status === 'low').length}
            </p>
          </div>
          <div className="p-2 bg-red-50 rounded-lg">
            <p className="text-sm font-medium text-red-800">Critical</p>
            <p className="text-lg font-bold text-red-600">
              {sampleStockData.filter(item => item.status === 'critical').length}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockOverview;
