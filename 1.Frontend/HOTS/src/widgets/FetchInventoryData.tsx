import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppSelector';
import { fetchInventory } from '@/store/slices/inventorySlice';
import { WidgetProps } from '@/types/widgetTypes';

const FetchInventoryData: React.FC<WidgetProps> = () => {
    const dispatch = useAppDispatch();
    const inventoryData = useAppSelector((state: any) => state.inventory);

    useEffect(() => {
        // Only fetch if we don't already have items or aren't loading
        if (!inventoryData?.loading && (!inventoryData?.items || inventoryData.items.length === 0)) {
            dispatch(fetchInventory());
        }
    }, [dispatch, inventoryData?.loading, inventoryData?.items?.length]);

    // Headless widget: returns null as it only handles data fetching
    return null;
};

export default FetchInventoryData;
