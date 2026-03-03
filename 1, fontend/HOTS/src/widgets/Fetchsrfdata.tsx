
import React, { useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Download } from 'lucide-react';
import { WidgetProps } from '@/types/widgetTypes';
import { API_URL } from '@/config/sourceConfig';
import { fetchAnalyst } from '@/store/slices/analystslice';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/hooks/useAppSelector';
import { fetchCountry } from '@/store/slices/countryslice';
import { Skeleton } from '@/components/ui/skeleton';
import { resolveSystemVariable } from '@/utils/systemVariableResolver';
import { useSystemVariableContext } from '@/utils/systemVariableDefinitions/systemVariableDefinitions';
// import { fetchDepartments } from '@/store/slices/userManagementSlice';
import { fetchSRF } from '@/store/slices/srf_slice';
import { fetchsku } from '@/store/slices/SKUslice';
import { fetchSrf_Puprose } from '@/store/slices/srf_purpose';
import { useNavigate } from 'react-router-dom';
import { fetchTodaysweek } from '@/store/slices/srf_todaysweekSlice';

// Sample stock data

const Fetchsrfdata: React.FC<WidgetProps> = ({
    formData,
    serviceId,
    serviceInfo,
    widgetData,
    isLoading,
    isReady,
    error,
    handleReload
}) => {
    const dispatch = useDispatch();
    const { skulist, loading } = useAppSelector(state => state.sku);
    // Set up system variable context for template resolution
    const navigate = useNavigate()

    useEffect(() => {
        // 🚦 Step 1: Trigger fetch if skulist is empty
        if (!skulist || skulist.length === 0) {
            dispatch(fetchSRF());
            dispatch(fetchsku());
            dispatch(fetchSrf_Puprose());
            dispatch(fetchTodaysweek());
          
            if (dispatch) {
                setTimeout(() => {
                    handleReload()

                }, 500);
            }
            
            return;
        } 


    }, [dispatch, skulist]);


    return (
        <>
        </>
    )
};

export default Fetchsrfdata;
