import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { fetchDashboardFunctions } from "@/store/slices/dashboardSlice";
import DashboardCard from "./DashboardCard";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArrowLeft, Database, Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const DashboardPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { data, loading, error } = useSelector((state: RootState) => state.dashboard);

    useEffect(() => {
        dispatch(fetchDashboardFunctions());
    }, [dispatch]);

    // Group by category
    const grouped = data.reduce<Record<string, typeof data>>((acc, func) => {
        const category = func.category_name || "General";
        if (!acc[category]) acc[category] = [];
        acc[category].push(func);
        return acc;
    }, {});


    return (
        <AppLayout>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Dashboard Item</h1>
                        <p className="text-gray-600">Browse all reporting function available in HOTS</p>
                    </div>
                </div>

                {loading && (
                    
                <Skeleton className="h-48 w-full">

                </Skeleton>
                
                )}


                {grouped && Object.entries(grouped).map(([category, functions]) => (
                    <div key={category}>

                        <div className="flex items-center space-x-3 mb-4">
                            <div className={`p-2 rounded-lg rounded-lg bg-green-100`}>
                                <Database  className="w-6 h-6 text-green-700"/>
                            </div>
                            <h2 className="text-xl font-semibold text-green-900">{category}</h2>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {functions.map((func) => (
                                <DashboardCard key={func.id} func={func} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </AppLayout>
    );
};

export default DashboardPage;
