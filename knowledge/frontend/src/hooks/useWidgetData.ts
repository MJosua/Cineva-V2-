import { useState, useEffect, useCallback, useMemo } from 'react';
import axios, { CancelTokenSource } from 'axios';
import { API_URL } from '@/config/sourceConfig';

export interface DataSource {
  endpoint: string;
  method?: 'GET' | 'POST';
  params?: Record<string, any>;
  transform?: (data: any) => any;
  cacheKey?: string;
  dependencies?: string[];
}

export interface UseWidgetDataOptions {
  dataSources: DataSource[];
  enabled?: boolean;
  refetchOnMount?: boolean;
  cacheTime?: number;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  expiry: number;
}

// Global cache to share data between widgets
const dataCache = new Map<string, CacheEntry>();

// Active requests to prevent duplicate calls
const activeRequests = new Map<string, Promise<any>>();

export const useWidgetData = (options: UseWidgetDataOptions) => {
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    dataSources,
    enabled = true,
    refetchOnMount = false,
    cacheTime = 300000, // 5 minutes default
  } = options;

  // Generate cache keys for each data source
  const cacheKeys = useMemo(() => {
    return dataSources.map(source => 
      source.cacheKey || `${source.endpoint}_${JSON.stringify(source.params || {})}`
    );
  }, [dataSources]);

  // Check if all data is available in cache
  const getCachedData = useCallback(() => {
    const cachedData: Record<string, any> = {};
    let allCached = true;

    dataSources.forEach((source, index) => {
      const cacheKey = cacheKeys[index];
      const cached = dataCache.get(cacheKey);
      
      if (cached && Date.now() < cached.expiry) {
        cachedData[cacheKey] = cached.data;
      } else {
        allCached = false;
      }
    });

    return allCached ? cachedData : null;
  }, [dataSources, cacheKeys]);

  // Fetch data from API
  const fetchData = useCallback(async (source: DataSource, index: number) => {
    const cacheKey = cacheKeys[index];
    
    // Check if request is already in progress
    if (activeRequests.has(cacheKey)) {
      return activeRequests.get(cacheKey);
    }

    // Check cache first
    const cached = dataCache.get(cacheKey);
    if (cached && Date.now() < cached.expiry && !refetchOnMount) {
      return cached.data;
    }

    const token = localStorage.getItem('tokek');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    let cancelTokenSource: CancelTokenSource;

    const requestPromise = (async () => {
      try {
        cancelTokenSource = axios.CancelToken.source();
        
        const response = await axios({
          method: source.method || 'GET',
          url: `${API_URL}${source.endpoint}`,
          params: source.params,
          headers,
          cancelToken: cancelTokenSource.token,
        });

        let responseData = response.data?.data || response.data;
        
        // Apply transformation if provided
        if (source.transform) {
          responseData = source.transform(responseData);
        }

        // Cache the result
        dataCache.set(cacheKey, {
          data: responseData,
          timestamp: Date.now(),
          expiry: Date.now() + cacheTime,
        });

        return responseData;
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error(`Failed to fetch data from ${source.endpoint}:`, error);
          throw error;
        }
        return null;
      } finally {
        activeRequests.delete(cacheKey);
      }
    })();

    activeRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }, [cacheKeys, cacheTime, refetchOnMount]);

  // Main fetch function
  const fetchAllData = useCallback(async () => {
    if (!enabled || dataSources.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // Check cache first
      const cachedData = getCachedData();
      if (cachedData && !refetchOnMount) {
        setData(cachedData);
        setLoading(false);
        return;
      }

      // Fetch all data sources in parallel
      const promises = dataSources.map((source, index) => 
        fetchData(source, index).then(result => ({
          key: cacheKeys[index],
          data: result,
        }))
      );

      const results = await Promise.allSettled(promises);
      const newData: Record<string, any> = {};

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          newData[result.value.key] = result.value.data;
        }
      });

      setData(newData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [enabled, dataSources, cacheKeys, fetchData, getCachedData, refetchOnMount]);

  // Refetch function for manual refresh
  const refetch = useCallback(() => {
    // Clear cache for these sources
    cacheKeys.forEach(key => dataCache.delete(key));
    return fetchAllData();
  }, [cacheKeys, fetchAllData]);

  // Effect to fetch data on mount and when dependencies change
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Cleanup function to cancel ongoing requests
  useEffect(() => {
    return () => {
      cacheKeys.forEach(key => {
        if (activeRequests.has(key)) {
          activeRequests.delete(key);
        }
      });
    };
  }, [cacheKeys]);

  return {
    data,
    loading,
    error,
    refetch,
    isFromCache: !!getCachedData(),
  };
};

// Utility function to resolve parameters dynamically
export const resolveParams = (
  params: Record<string, any>,
  context: {
    formData?: any;
    ticketData?: any;
    userData?: any;
    [key: string]: any;
  }
): Record<string, any> => {
  const resolved: Record<string, any> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
      // Extract path like {formData.date} or {ticketData.detail_rows[0].cstm_col}
      const path = value.slice(1, -1);
      const pathParts = path.split('.');
      
      let resolvedValue = context;
      for (const part of pathParts) {
        if (part.includes('[') && part.includes(']')) {
          // Handle array access like detail_rows[0]
          const [arrayName, indexStr] = part.split('[');
          const index = parseInt(indexStr.replace(']', ''));
          resolvedValue = resolvedValue?.[arrayName]?.[index];
        } else {
          resolvedValue = resolvedValue?.[part];
        }
        
        if (resolvedValue === undefined) break;
      }
      
      resolved[key] = resolvedValue;
    } else {
      resolved[key] = value;
    }
  });

  return resolved;
};

// Clear entire cache (useful for logout or data refresh)
export const clearWidgetDataCache = () => {
  dataCache.clear();
  activeRequests.clear();
};