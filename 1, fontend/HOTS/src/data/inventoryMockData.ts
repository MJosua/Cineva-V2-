/**
 * Mock data and types for Inventory Management System
 * This file provides sample data for UI development before database implementation
 */

// ============================================
// TYPES
// ============================================

export interface InventoryItem {
    id: number;
    sku: string;
    name: string;
    category: string;
    quantity: number;
    minLevel: number;
    maxLevel: number;
    status: 'in_stock' | 'low' | 'critical' | 'out_of_stock';
    location: string;
    lastUpdated: string;
    unit: string;
}

export interface InventoryTransaction {
    id: number;
    transactionNo: string;
    type: 'receive' | 'issue' | 'transfer' | 'adjustment' | 'count';
    items: TransactionItem[];
    fromLocation?: string;
    toLocation?: string;
    referenceType?: string;
    referenceId?: string;
    status: 'draft' | 'pending' | 'completed' | 'cancelled';
    notes?: string;
    createdBy: string;
    createdAt: string;
}

export interface TransactionItem {
    itemId: number;
    sku: string;
    name: string;
    quantity: number;
    condition?: 'good' | 'damaged' | 'refurbished';
}

export interface Location {
    id: number;
    code: string;
    name: string;
    category: 'it' | 'posm' | 'warehouse';
}

export interface InventorySummary {
    totalItems: number;
    lowStockAlerts: number;
    pendingTransfers: number;
    totalValue?: number;
}

// ============================================
// MOCK DATA - IT EQUIPMENT
// ============================================

export const mockITItems: InventoryItem[] = [
    { id: 1, sku: 'IT-LPT-001', name: 'Dell Latitude 7420 Laptop', category: 'Laptops', quantity: 15, minLevel: 10, maxLevel: 30, status: 'in_stock', location: 'HQ - Server Room A', lastUpdated: 'Oct 26, 10:45 AM', unit: 'pcs' },
    { id: 2, sku: 'IT-MON-012', name: 'HP E24 G4 Monitor', category: 'Monitors', quantity: 42, minLevel: 25, maxLevel: 60, status: 'in_stock', location: 'HQ - Floor 3 Storage', lastUpdated: 'Oct 25, 03:30 PM', unit: 'pcs' },
    { id: 3, sku: 'IT-KBD-005', name: 'Logitech MX Keys Keyboard', category: 'Peripherals', quantity: 8, minLevel: 15, maxLevel: 40, status: 'low', location: 'HQ - IT Office', lastUpdated: 'Oct 24, 11:15 AM', unit: 'pcs' },
    { id: 4, sku: 'IT-SRV-002', name: 'Cisco Catalyst 9300 Switch', category: 'Networking', quantity: 1, minLevel: 2, maxLevel: 5, status: 'critical', location: 'HQ - Data Center', lastUpdated: 'Oct 26, 09:00 AM', unit: 'pcs' },
    { id: 5, sku: 'IT-MSE-007', name: 'Microsoft Precision Mouse', category: 'Peripherals', quantity: 30, minLevel: 20, maxLevel: 50, status: 'in_stock', location: 'Regional Office - NY', lastUpdated: 'Oct 25, 02:00 PM', unit: 'pcs' },
    { id: 6, sku: 'IT-HDS-003', name: 'Seagate 2TB External HDD', category: 'Storage', quantity: 5, minLevel: 10, maxLevel: 25, status: 'low', location: 'HQ - IT Office', lastUpdated: 'Oct 23, 04:30 PM', unit: 'pcs' },
    { id: 7, sku: 'IT-CAM-001', name: 'Logitech C920 Webcam', category: 'Peripherals', quantity: 22, minLevel: 15, maxLevel: 40, status: 'in_stock', location: 'HQ - Floor 2 Storage', lastUpdated: 'Oct 24, 09:15 AM', unit: 'pcs' },
    { id: 8, sku: 'IT-USB-008', name: 'USB-C Docking Station', category: 'Accessories', quantity: 0, minLevel: 5, maxLevel: 20, status: 'out_of_stock', location: 'HQ - IT Office', lastUpdated: 'Oct 22, 11:00 AM', unit: 'pcs' },
];

export const mockITSummary: InventorySummary = {
    totalItems: 1247,
    lowStockAlerts: 23,
    pendingTransfers: 8,
};

// ============================================
// MOCK DATA - POSM PRODUCTS
// ============================================

export const mockPOSMItems: InventoryItem[] = [
    { id: 101, sku: 'POSM-BNR-001', name: 'Standing Banner 160x60', category: 'Banners', quantity: 50, minLevel: 20, maxLevel: 100, status: 'in_stock', location: 'Marketing Warehouse', lastUpdated: 'Oct 26, 09:00 AM', unit: 'pcs' },
    { id: 102, sku: 'POSM-FLY-012', name: 'Product Flyer A4', category: 'Flyers', quantity: 500, minLevel: 200, maxLevel: 1000, status: 'in_stock', location: 'Marketing Warehouse', lastUpdated: 'Oct 25, 02:30 PM', unit: 'pcs' },
    { id: 103, sku: 'POSM-DSP-003', name: 'Counter Display Unit', category: 'Displays', quantity: 8, minLevel: 15, maxLevel: 50, status: 'low', location: 'Regional - Surabaya', lastUpdated: 'Oct 24, 10:00 AM', unit: 'pcs' },
    { id: 104, sku: 'POSM-PST-007', name: 'Promotional Poster A2', category: 'Posters', quantity: 120, minLevel: 50, maxLevel: 300, status: 'in_stock', location: 'Marketing Warehouse', lastUpdated: 'Oct 25, 04:00 PM', unit: 'pcs' },
    { id: 105, sku: 'POSM-WBL-002', name: 'Wobbler Shelf Talker', category: 'Shelf Materials', quantity: 3, minLevel: 30, maxLevel: 100, status: 'critical', location: 'Marketing Warehouse', lastUpdated: 'Oct 23, 11:30 AM', unit: 'pcs' },
];

export const mockPOSMSummary: InventorySummary = {
    totalItems: 892,
    lowStockAlerts: 12,
    pendingTransfers: 5,
};

// ============================================
// MOCK DATA - WAREHOUSE STOCK
// ============================================

export const mockWarehouseItems: InventoryItem[] = [
    { id: 201, sku: 'WH-PRD-001', name: 'Product SKU-A1234', category: 'Finished Goods', quantity: 1500, minLevel: 500, maxLevel: 3000, status: 'in_stock', location: 'Warehouse A - Rack 1', lastUpdated: 'Oct 26, 08:00 AM', unit: 'cartons' },
    { id: 202, sku: 'WH-PRD-002', name: 'Product SKU-B5678', category: 'Finished Goods', quantity: 320, minLevel: 400, maxLevel: 2000, status: 'low', location: 'Warehouse A - Rack 2', lastUpdated: 'Oct 25, 03:00 PM', unit: 'cartons' },
    { id: 203, sku: 'WH-RAW-010', name: 'Raw Material RM-100', category: 'Raw Materials', quantity: 2500, minLevel: 1000, maxLevel: 5000, status: 'in_stock', location: 'Warehouse B - Zone 1', lastUpdated: 'Oct 26, 07:30 AM', unit: 'kg' },
    { id: 204, sku: 'WH-PKG-005', name: 'Packaging Box 30x20', category: 'Packaging', quantity: 50, minLevel: 200, maxLevel: 1000, status: 'critical', location: 'Warehouse A - Packaging Zone', lastUpdated: 'Oct 24, 02:00 PM', unit: 'pcs' },
    { id: 205, sku: 'WH-PRD-003', name: 'Product SKU-C9012', category: 'Finished Goods', quantity: 890, minLevel: 300, maxLevel: 1500, status: 'in_stock', location: 'Warehouse A - Rack 3', lastUpdated: 'Oct 25, 05:00 PM', unit: 'cartons' },
];

export const mockWarehouseSummary: InventorySummary = {
    totalItems: 3456,
    lowStockAlerts: 45,
    pendingTransfers: 12,
    totalValue: 125000000, // In IDR
};

// ============================================
// MOCK DATA - LOCATIONS
// ============================================

export const mockLocations: Location[] = [
    { id: 1, code: 'HQ-IT', name: 'HQ - IT Office', category: 'it' },
    { id: 2, code: 'HQ-DC', name: 'HQ - Data Center', category: 'it' },
    { id: 3, code: 'HQ-F3', name: 'HQ - Floor 3 Storage', category: 'it' },
    { id: 4, code: 'REG-NY', name: 'Regional Office - NY', category: 'it' },
    { id: 5, code: 'MKT-WH', name: 'Marketing Warehouse', category: 'posm' },
    { id: 6, code: 'REG-SBY', name: 'Regional - Surabaya', category: 'posm' },
    { id: 7, code: 'WH-A', name: 'Warehouse A', category: 'warehouse' },
    { id: 8, code: 'WH-B', name: 'Warehouse B', category: 'warehouse' },
];

// ============================================
// MOCK DATA - TRANSACTIONS
// ============================================

export const mockTransactions: InventoryTransaction[] = [
    {
        id: 1,
        transactionNo: 'TRX-IT-2024-001',
        type: 'receive',
        items: [
            { itemId: 1, sku: 'IT-LPT-001', name: 'Dell Latitude 7420 Laptop', quantity: 5 },
            { itemId: 2, sku: 'IT-MON-012', name: 'HP E24 G4 Monitor', quantity: 10 },
        ],
        toLocation: 'HQ - IT Office',
        referenceType: 'PO',
        referenceId: 'PO-2024-0456',
        status: 'completed',
        createdBy: 'John Doe',
        createdAt: 'Oct 25, 2024 10:30 AM',
    },
    {
        id: 2,
        transactionNo: 'TRX-IT-2024-002',
        type: 'issue',
        items: [
            { itemId: 1, sku: 'IT-LPT-001', name: 'Dell Latitude 7420 Laptop', quantity: 1 },
        ],
        fromLocation: 'HQ - IT Office',
        referenceType: 'TICKET',
        referenceId: 'TKT-2024-1234',
        status: 'completed',
        notes: 'Issued for new employee onboarding',
        createdBy: 'Jane Smith',
        createdAt: 'Oct 26, 2024 09:15 AM',
    },
    {
        id: 3,
        transactionNo: 'TRX-IT-2024-003',
        type: 'transfer',
        items: [
            { itemId: 5, sku: 'IT-MSE-007', name: 'Microsoft Precision Mouse', quantity: 5 },
        ],
        fromLocation: 'HQ - IT Office',
        toLocation: 'Regional Office - NY',
        status: 'pending',
        createdBy: 'John Doe',
        createdAt: 'Oct 26, 2024 11:00 AM',
    },
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function getStatusColor(status: InventoryItem['status']): string {
    switch (status) {
        case 'in_stock': return 'bg-green-500/20 text-green-400 border-green-500/30';
        case 'low': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
        case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
        case 'out_of_stock': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
}

export function getStatusLabel(status: InventoryItem['status']): string {
    switch (status) {
        case 'in_stock': return 'In Stock';
        case 'low': return 'Low';
        case 'critical': return 'Critical';
        case 'out_of_stock': return 'Out of Stock';
        default: return status;
    }
}

export function getTransactionTypeColor(type: InventoryTransaction['type']): string {
    switch (type) {
        case 'receive': return 'bg-green-500/20 text-green-400';
        case 'issue': return 'bg-blue-500/20 text-blue-400';
        case 'transfer': return 'bg-purple-500/20 text-purple-400';
        case 'adjustment': return 'bg-yellow-500/20 text-yellow-400';
        case 'count': return 'bg-cyan-500/20 text-cyan-400';
        default: return 'bg-gray-500/20 text-gray-400';
    }
}
