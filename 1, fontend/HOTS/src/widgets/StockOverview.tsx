import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Package, Search, Loader2 } from 'lucide-react';
import { WidgetProps } from '@/types/widgetTypes';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';

interface InventoryItem {
  id: number;
  resource_category: string;
  resource_key: string;
  resource_label: string;
  attributes: {
    total_stock: number;
    max_stock: number;
    uom?: string;
  };
}

const StockOverview: React.FC<WidgetProps> = ({ 
  formData, 
  serviceId 
}) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('hots_tokek');
        const response = await axios.get(`${API_URL}/hots_settings/get/inventory`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          const allData: InventoryItem[] = response.data.data;
          // Contextualize category based on the form's service ID
          const targetCategory = Number(serviceId) === 14 ? 'posm' : 'it_asset';
          const filtered = allData.filter(item => item.resource_category === targetCategory && item.attributes?.total_stock > 0);
          setItems(filtered);
        }
      } catch (err) {
        console.error("Failed to fetch inventory for widget:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [serviceId]);

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    return items.filter(item => 
      item.resource_label.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.resource_key.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  if (loading) {
    return (
      <Card className="mb-6 animate-pulse border-none shadow-sm">
        <CardContent className="h-48 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const title = Number(serviceId) === 14 ? 'Available POSM Catalog' : 'Available IT Equipment';

  return (
    <Card className="mb-6 overflow-hidden border-border/50 shadow-sm bg-card">
      <CardHeader className="pb-4 border-b border-border/50 bg-muted/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">{title}</CardTitle>
              <p className="text-xs text-muted-foreground">
                Browse items currently in stock
              </p>
            </div>
          </div>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search items..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-background focus-visible:ring-1 focus-visible:ring-primary/30"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="max-h-[320px] overflow-y-auto custom-scrollbar p-2">
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredItems.map((item) => {
                const current = Number(item.attributes?.total_stock) || 0;
                const isLow = current <= 5;
                
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background hover:border-primary/30 transition-colors">
                    <div className="min-w-0 pr-3">
                      <p className="text-sm font-semibold truncate text-foreground" title={item.resource_label}>
                        {item.resource_label}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        {item.resource_key}
                      </p>
                    </div>
                    <Badge variant="outline" className={`shrink-0 ${isLow ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-primary/5 text-primary border-primary/20'}`}>
                      {current} {item.attributes?.uom || 'pcs'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                {searchQuery ? "No matching items found" : "No stock available"}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StockOverview;
