
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

// Sample stock data
const downloadData = [
    { service_id: 11, url: `${API_URL}`, }
];


const Default_item_download: React.FC<WidgetProps> = ({
    formData,
    serviceId,
    serviceInfo,
    widgetData,
    isLoading,
    error
}) => {
    const dispatch = useDispatch();
    const analystState = useAppSelector(state => state.analyst);
    const countryState = useAppSelector(state => state.country);
    
    // Set up system variable context for template resolution
    const systemVariableContext = useSystemVariableContext();
    
    // Update context with current data
    systemVariableContext.analyst = analystState.data;
    systemVariableContext.country = countryState.data;

    // Memoize the download data lookup to prevent unnecessary re-renders
    const downloadInfo = useMemo(() => {
        const matchedFile = downloadData.find(
            (item) => item.service_id === serviceInfo?.service_id
        );
        return {
            url: matchedFile?.url || '#',
            available: !!matchedFile
        };
    }, [serviceInfo?.service_id]);

    // Only fetch analyst and country data once on mount
    useEffect(() => {
        if (!analystState.data || analystState.data.length === 0) {
            dispatch(fetchAnalyst() as any);
        }
    }, [dispatch, analystState.data]);

    // Only fetch country data if it's needed for this specific service
    useEffect(() => {
        // Only fetch if this service actually needs country data
        if (serviceInfo?.service_id === 11 && formData) {
            dispatch(fetchCountry() as any);
        }
    }, [dispatch, serviceInfo?.service_id, formData]);

    // Create resolved template URL 
    const resolvedUrl = useMemo(() => {
        if (!downloadInfo.available || !downloadInfo.url) return '#';
        
        // Resolve any system variables in the URL template
        const resolvedTemplate = resolveSystemVariable(downloadInfo.url, systemVariableContext);
        // Ensure we return a string, not an array
        return Array.isArray(resolvedTemplate) ? resolvedTemplate.join('') : resolvedTemplate;
    }, [downloadInfo.url, downloadInfo.available, systemVariableContext]);

    // Show loading state only for Redux data fetching
    if (analystState.loading || (serviceInfo?.service_id === 11 && countryState.loading)) {
        return (
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col space-y-2 flex-1">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                        <Skeleton className="h-9 w-24" />
                    </div>
                </CardHeader>
            </Card>
        );
    }

    // const getCountry = async (AnalystID) => {

    //     axios.get(`${API_URL}/hots_Tps/country/${AnalystID}`, {
    //         headers: {
    //             Authorization: `Bearer ${"tokek", userToken}`,
    //         },
    //     }).then((res) => {
    //         // console.log("selectCountry", res.data.results)
    //         setCountryList(res.data.results)
    //         getRegion(res.data.results[0].country_id)
    //         setCountry(res.data.results[0].country_id)
    //         getDistributor(res.data.results[0].country_id)

    //     })
    //         .catch((err) => {
    //             console.log("errorGetData", err)
    //             setCountryList([])
    //             setAnalyst()
    //             setCountry()
    //             setRegion()
    //             setRegionList([])
    //             setDistributor()
    //             setDistributorlist([])
    //             setPort()
    //             setPortlist([])
    //             setSku()
    //             setSkulist([])
    //         });

    // }

    // const getRegion = async (selectedCountry) => {

    //     axios.get(`${API_URL}/hots_Tps/region/${selectedCountry}`, {
    //         headers: {
    //             Authorization: `Bearer ${"tokek", userToken}`,
    //         },
    //     }).then((res) => {
    //         setRegionList(res.data.results)
    //         // console.log("results region", ` ${selectedCountry}`, res.data.results)
    //         setRegion(res.data.results[0].region_id)
    //     })
    //         .catch((err) => {
    //             console.err("errorGetData", err)
    //         });

    // }



    // const getDistributor = async (idcountry) => {

    //     axios.get(`${API_URL}/hots_Tps/distributor/${idcountry}`, {
    //         headers: {
    //             Authorization: `Bearer ${"tokek", userToken}`,
    //         },
    //     }).then((res) => {
    //         setDistributorlist(res.data.results)
    //         // console.log("results distributor", ` ${idcountry}`, res.data.results)
    //         setDistributor(res.data.results[0].company_id)
    //         getPort(res.data.results[0].company_id)
    //         getSKU(res.data.results[0].company_id)

    //     })
    //         .catch((err) => {
    //             console.err("errorGetData", err)
    //         });

    // }

    // const getPort = async (idcompany) => {

    //     axios.get(`${API_URL}/hots_Tps/port/${idcompany}`, {
    //         headers: {
    //             Authorization: `Bearer ${"tokek", userToken}`,
    //         },
    //     }).then((res) => {
    //         setPortlist(res.data.results)
    //         // console.log("results port", ` ${idcompany}`, res.data.results)
    //         setPort(res.data.results[0].harbour_id)
    //     })
    //         .catch((err) => {
    //             console.log("errorGetData", err)
    //         });

    // }


    return (
        <Card className="mb-6">
            <CardHeader className="h-auto">
                <div className="flex justify-between items-center w-full">

                    {/* Title and description on the left */}
                    <div className="flex flex-col text-left">
                        <div className="flex items-center space-x-2">
                            <Package className="w-5 h-5 text-blue-600" />
                            <CardTitle className="text-lg">
                                {serviceInfo && (
                                    <span>{serviceInfo.service_name}&nbsp;</span>
                                )}
                                File Template
                            </CardTitle>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            This file template provides a standardized {serviceInfo && (
                                <span>{serviceInfo.service_name}&nbsp;</span>
                            )}format.
                        </p>
                    </div>

                    {/* Download button on the right */}
                    <div className="flex items-center">
                        <a
                            href={resolvedUrl}
                            download
                            className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded transition ${downloadInfo.available
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                }`}
                            {...(!downloadInfo.available && { onClick: (e) => e.preventDefault() })}
                        >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                        </a>
                    </div>

                </div>
            </CardHeader>

        </Card>
    );
};

export default Default_item_download;
