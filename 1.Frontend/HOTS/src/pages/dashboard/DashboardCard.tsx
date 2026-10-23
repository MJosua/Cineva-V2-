import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import * as Icons from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DashboardFunction } from "@/types/hotsDashboard";
import { Button } from "@/components/ui/button";

interface DashboardCardProps {
    func: DashboardFunction;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ func }) => {
    const navigate = useNavigate();
    const Icon = (Icons as any)[func.icon || "AppWindow"] || Icons.AppWindow;

    return (
        <Card
            key={func.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
        >


            <CardHeader className="pb-3">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100">
                        <Icon className="w-5 h-5 text-gray-700 green" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
                            {func.title}
                        </CardTitle>
                    </div>
                </div>
            </CardHeader>



            <CardContent className="pt-0">
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {func.description}
                </p>
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate(func.path)}
                >
                    Go To Report
                </Button>
            </CardContent>

        </Card>






    );
};

export default DashboardCard;
