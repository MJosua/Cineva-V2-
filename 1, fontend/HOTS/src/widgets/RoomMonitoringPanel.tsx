import React, { useEffect, useState } from "react";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { fetchMeetingRooms } from "@/store/slices/meetingroom_slice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Monitor,
    Battery,
    BatteryLow,
    Zap,
    Clock,
    RefreshCcw,
    AlertTriangle,
    CheckCircle2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

const RoomMonitoringPanel: React.FC = () => {
    const dispatch = useAppDispatch();
    const { rooms, loading } = useAppSelector((state) => state.meetingroom);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    useEffect(() => {
        const fetchData = () => {
            dispatch(fetchMeetingRooms());
            setLastRefresh(new Date());
        };

        fetchData();
        // 🔄 30-second heartbeat polling
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [dispatch]);

    const getBatteryColor = (level: number) => {
        if (level <= 15) return "text-red-500";
        if (level <= 30) return "text-orange-500";
        return "text-green-500";
    };

    const getStatusBadge = (room: any) => {
        const lastUpdate = room.last_battery_update ? new Date(room.last_battery_update) : null;
        const isOffline = !lastUpdate || (Date.now() - lastUpdate.getTime() > 15 * 60 * 1000); // 15 mins thresh

        if (isOffline) {
            return <Badge variant="outline" className="bg-gray-50 text-gray-400 border-gray-200 gap-1"><Clock className="w-3 h-3" /> Offline</Badge>;
        }
        if (room.battery_level <= 15 && !room.is_charging) {
            return <Badge variant="destructive" className="gap-1 animate-pulse"><AlertTriangle className="w-3 h-3" /> Critical</Badge>;
        }
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 gap-1"><CheckCircle2 className="w-3 h-3" /> Healthy</Badge>;
    };

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0 pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-blue-500" />
                        Room Tablet Status
                    </CardTitle>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        {loading && <RefreshCcw className="w-3 h-3 animate-spin text-blue-500" />}
                        <span>Last sync: {lastRefresh.toLocaleTimeString()}</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-0">
                <div className="rounded-xl border bg-white overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Room Name</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Resource Key</th>
                                <th className="px-4 py-3 text-center font-semibold text-gray-600">Battery</th>
                                <th className="px-4 py-3 text-center font-semibold text-gray-600">Status</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-600">Last Seen</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {rooms.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">
                                        No rooms configured for monitoring
                                    </td>
                                </tr>
                            ) : (
                                rooms.map((room) => (
                                    <tr key={room.id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="px-4 py-4 font-medium text-gray-900">
                                            {room.room_name}
                                        </td>
                                        <td className="px-4 py-4 font-mono text-xs text-blue-600 bg-blue-50/50 rounded-md inline-block my-2 mx-4">
                                            {room.resource_key}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className={`flex items-center gap-1.5 font-bold ${getBatteryColor(room.battery_level || 0)}`}>
                                                    {room.is_charging ? (
                                                        <Zap className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                    ) : (room.battery_level || 0) <= 15 ? (
                                                        <BatteryLow className="w-4 h-4" />
                                                    ) : (
                                                        <Battery className="w-4 h-4" />
                                                    )}
                                                    <span>{room.battery_level || 0}%</span>
                                                </div>
                                                <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-500 ${(room.battery_level || 0) <= 20 ? "bg-red-500" :
                                                                (room.battery_level || 0) <= 40 ? "bg-orange-500" : "bg-green-500"
                                                            }`}
                                                        style={{ width: `${room.battery_level || 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {getStatusBadge(room)}
                                        </td>
                                        <td className="px-4 py-4 text-right text-xs text-gray-500">
                                            {room.last_battery_update ? (
                                                <span title={new Date(room.last_battery_update).toLocaleString()}>
                                                    {formatDistanceToNow(new Date(room.last_battery_update), { addSuffix: true })}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300">Never</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};

export default RoomMonitoringPanel;
