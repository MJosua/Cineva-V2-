// src/pages/dashboard/report/Public.tsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const Public: React.FC = () => {
  return (
    <div className="space-y-4">
      <CardHeader>
        <CardTitle>🌐 Public Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">
          This dashboard is visible to all users — ideal for announcements,
          open data reports, or general statistics.
        </p>
      </CardContent>
    </div>
  );
};

export default Public;
