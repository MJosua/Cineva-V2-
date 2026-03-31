/**
 * Mock data and types for Inventory Management System
 */

// ============================================
// TYPES
// ============================================

export interface InventoryItem {
    id: number;
    resource_category: string;
    resource_key: string;
    resource_label: string;
    attributes: {
        total_stock: number;
        stocks: Record<string, number>; // Mapping location_id (string) to quantity
        max_stock: number;
        sub_category?: string;
        min_stock?: number;
        uom?: string;
        description?: string;
        specs?: Record<string, any>;
        location_names?: Record<string, string>;
    };
    is_active: number;
    created_at?: string;
    // UI-only properties
    name?: string; 
    sku?: string;
    quantity?: number;
    status: 'in_stock' | 'low' | 'critical' | 'out_of_stock';
}

export interface InventorySummary {
    totalItems: number;
    lowStockAlerts: number;
    pendingTransfers: number;
    totalValue?: number;
}

// ============================================
// EMPTY MOCK DATA (Switching to Backend)
// ============================================

export const mockITItems: InventoryItem[] = [];
export const mockITSummary: InventorySummary = { totalItems: 0, lowStockAlerts: 0, pendingTransfers: 0 };

export const mockPOSMItems: InventoryItem[] = [];
export const mockPOSMSummary: InventorySummary = { totalItems: 0, lowStockAlerts: 0, pendingTransfers: 0 };

export const mockWarehouseItems: InventoryItem[] = [];
export const mockWarehouseSummary: InventorySummary = { totalItems: 0, lowStockAlerts: 0, pendingTransfers: 0 };

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function getStatusColor(status: string): string {
    switch (status) {
        case 'in_stock': case 'good': return 'bg-green-500/20 text-green-400 border-green-500/30';
        case 'low': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
        case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
        case 'out_of_stock': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
}

export function getStatusLabel(status: string): string {
    switch (status) {
        case 'in_stock': case 'good': return 'In Stock';
        case 'low': return 'Low';
        case 'critical': return 'Critical';
        case 'out_of_stock': return 'Out of Stock';
        default: return status;
    }
}

export function calculateStatus(current: number, max: number): 'in_stock' | 'low' | 'critical' | 'out_of_stock' {
    if (current <= 0) return 'out_of_stock';
    const percentage = (current / max) * 100;
    if (percentage <= 10) return 'critical';
    if (percentage <= 30) return 'low';
    return 'in_stock';
}
