// src/hooks/usePreferences.ts
// React hook for managing user preferences with backend sync
// Uses a shared state approach for consistency across components

import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';

interface Preferences {
    dashboard?: {
        pinned_ids?: number[];
        [key: string]: any;
    };
    theme?: {
        dark_mode?: boolean;
        sidebar_collapsed?: boolean;
        [key: string]: any;
    };
    table?: {
        [key: string]: any;
    };
    report?: {
        default_date_range?: string;
        [key: string]: any;
    };
    [category: string]: any;
}

// Module-level shared state (all hooks share this)
let sharedPreferences: Preferences = {};
let sharedLoading = true;
let lastFetchTime = 0;
const listeners: Set<() => void> = new Set();

const notifyListeners = () => {
    listeners.forEach(fn => fn());
};

export const usePreferences = () => {
    const [, forceUpdate] = useState(0);
    const token = localStorage.getItem('hots_tokek');
    const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

    // Subscribe to shared state changes
    useEffect(() => {
        const listener = () => forceUpdate(n => n + 1);
        listeners.add(listener);
        return () => { listeners.delete(listener); };
    }, []);

    // Fetch all preferences
    const fetchPreferences = useCallback(async (force = false) => {
        // Skip if recently fetched (within 2 seconds) unless forced
        if (!force && Date.now() - lastFetchTime < 2000 && Object.keys(sharedPreferences).length > 0) {
            return sharedPreferences;
        }

        try {
            sharedLoading = true;
            notifyListeners();

            const res = await axios.get(`${API_URL}/hotsprefs/all`, { headers });
            if (res.data.success) {
                sharedPreferences = res.data.preferences || {};
                lastFetchTime = Date.now();
            }
        } catch (err) {
            console.error('Error fetching preferences:', err);
        } finally {
            sharedLoading = false;
            notifyListeners();
        }
        return sharedPreferences;
    }, [headers]);

    // Initial fetch on mount
    useEffect(() => {
        if (Object.keys(sharedPreferences).length === 0 || Date.now() - lastFetchTime > 60000) {
            fetchPreferences();
        }
    }, [fetchPreferences]);

    // Helper to safely get array
    const safeGetArray = (value: any): number[] => {
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [];
            } catch { return []; }
        }
        if (value && typeof value === 'object') return Object.values(value);
        return [];
    };

    // Get pinned dashboard IDs
    const getPinnedDashboards = useCallback((): number[] => {
        return safeGetArray(sharedPreferences.dashboard?.pinned_ids);
    }, []);

    // Check if a dashboard is pinned
    const isPinned = useCallback((dashboardId: number): boolean => {
        const ids = safeGetArray(sharedPreferences.dashboard?.pinned_ids);
        return ids.includes(dashboardId);
    }, []);

    // Toggle pin for a dashboard
    const togglePin = useCallback(async (dashboardId: number): Promise<boolean> => {
        try {
            const res = await axios.post(`${API_URL}/hotsprefs/dashboard/pin/${dashboardId}`, {}, { headers });
            if (res.data.success) {
                // Update shared state immediately
                sharedPreferences = {
                    ...sharedPreferences,
                    dashboard: {
                        ...sharedPreferences.dashboard,
                        pinned_ids: res.data.pinned
                    }
                };
                lastFetchTime = Date.now();
                notifyListeners();
                return res.data.isPinned;
            }
            return false;
        } catch (err) {
            console.error('Error toggling pin:', err);
            return false;
        }
    }, [headers]);

    // Set a preference
    const setPreference = useCallback(async (category: string, key: string, value: any) => {
        try {
            await axios.post(`${API_URL}/hotsprefs/${category}/${key}`, { value }, { headers });
            sharedPreferences = {
                ...sharedPreferences,
                [category]: {
                    ...sharedPreferences[category],
                    [key]: value
                }
            };
            notifyListeners();
            return true;
        } catch (err) {
            console.error('Error saving preference:', err);
            return false;
        }
    }, [headers]);

    // Get a specific preference
    const getPreference = useCallback((category: string, key: string, defaultValue: any = null) => {
        return sharedPreferences[category]?.[key] ?? defaultValue;
    }, []);

    // Save card preview settings
    const saveCardPreview = useCallback(async (dashboardId: number, settings: any) => {
        try {
            await axios.post(`${API_URL}/hotsprefs/dashboard/preview/${dashboardId}`, { settings }, { headers });
            sharedPreferences = {
                ...sharedPreferences,
                dashboard: {
                    ...sharedPreferences.dashboard,
                    [`card_preview_${dashboardId}`]: settings
                }
            };
            notifyListeners();
            return true;
        } catch (err) {
            console.error('Error saving card preview:', err);
            return false;
        }
    }, [headers]);

    // Get card preview settings
    const getCardPreview = useCallback((dashboardId: number) => {
        return sharedPreferences.dashboard?.[`card_preview_${dashboardId}`] || null;
    }, []);

    // Theme helpers
    const isDarkMode = useCallback(() => {
        return sharedPreferences.theme?.dark_mode ?? false;
    }, []);

    const toggleDarkMode = useCallback(async () => {
        const newValue = !sharedPreferences.theme?.dark_mode;
        await setPreference('theme', 'dark_mode', newValue);
        return newValue;
    }, [setPreference]);

    return {
        preferences: sharedPreferences,
        loading: sharedLoading,
        fetchPreferences,
        getPreference,
        setPreference,

        // Dashboard helpers
        togglePin,
        isPinned,
        getPinnedDashboards,
        saveCardPreview,
        getCardPreview,

        // Theme helpers
        isDarkMode,
        toggleDarkMode,

        // Invalidate
        invalidateCache: () => {
            sharedPreferences = {};
            lastFetchTime = 0;
            notifyListeners();
        }
    };
};

export default usePreferences;
