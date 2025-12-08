
import React, { useEffect, useMemo } from 'react';
import { Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { CatalogFormLoader } from '@/components/forms/CatalogFormLoader';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppSelector';
import { fetchCatalogData, selectServiceCatalog, selectCatalogLoading, useFallbackData } from '@/store/slices/catalogSlice';

interface DynamicServiceRoutesProps {
  onSubmit: (data: any) => void;
}

export const useDynamicServiceRoutes = (onSubmit: (data: any) => void) => {
  const dispatch = useAppDispatch();
  const serviceCatalog = useAppSelector(selectServiceCatalog);
  const isLoading = useAppSelector(selectCatalogLoading);

  // Initialize with fallback data immediately if store is empty
  useEffect(() => {
    if (serviceCatalog.length === 0) {
      // // console.log('Service catalog is empty, initializing with fallback data');
      dispatch(useFallbackData());
      
      // Still try to fetch real data in the background
      if (!isLoading) {
        // // console.log('Attempting to fetch real catalog data in background');
        dispatch(fetchCatalogData());
      }
    }
  }, [dispatch, serviceCatalog.length, isLoading]);

  // Memoize the routes to prevent unnecessary re-renders
  const routes = useMemo(() => {
    // // console.log('useDynamicServiceRoutes - Creating routes with:', {
    //   isLoading,
    //   serviceCatalogLength: serviceCatalog.length,
    //   serviceCatalogPreview: serviceCatalog.slice(0, 3).map(s => ({ 
    //     id: s.service_id, 
    //     name: s.service_name, 
    //     nav_link: s.nav_link 
    //   }))
    // });

    // Only return empty if truly no data available
    if (serviceCatalog.length === 0) {
      // // console.log('No service catalog data available, returning empty routes array');
      return [];
    }

    // Filter active services that have valid nav_link
    const activeServices = serviceCatalog.filter(
      service => service.active === 1 && service.nav_link && service.nav_link.trim() !== ''
    );

    // // console.log('Active services for routing:', activeServices.map(s => ({ 
    //   id: s.service_id, 
    //   name: s.service_name, 
    //   nav_link: s.nav_link 
    // })));

    const generatedRoutes = activeServices.map((service) => {
      return (
        <Route
          key={service.service_id}
          path={`/service-catalog/${service.nav_link}`}
          element={
            <ProtectedRoute>
              <AppLayout>
                <CatalogFormLoader
                  servicePath={service.nav_link}
                  onSubmit={onSubmit}
                />
              </AppLayout>
            </ProtectedRoute>
          }
        />
      );
    });

    return generatedRoutes;
  }, [serviceCatalog, onSubmit]);

  return routes;
};

// Keep the original component for backward compatibility but mark it as deprecated
export const DynamicServiceRoutes: React.FC<DynamicServiceRoutesProps> = ({ onSubmit }) => {
  const routes = useDynamicServiceRoutes(onSubmit);
  return <>{routes}</>;
};
