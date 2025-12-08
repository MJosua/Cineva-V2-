
import React, { useEffect, useState } from 'react';
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, CheckSquare, Users, FileText, Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppSelector';
import { fetchTaskCount, fetchMyTickets, fetchAllTickets } from '@/store/slices/ticketsSlice';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';

interface DashboardStats {
  totalTickets: number;
  pendingTickets: number;
  completedTickets: number;
  activeUsers: number;
}

const Index = () => {
  const dispatch = useAppDispatch();
  const { taskCount, myTickets, allTickets } = useAppSelector(state => state.tickets);
  const [stats, setStats] = useState<DashboardStats>({
    totalTickets: 0,
    pendingTickets: 0,
    completedTickets: 0,
    activeUsers: 0
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('tokek');
      const headers = { Authorization: `Bearer ${token}` };

      // Get dashboard statistics
      const statsResponse = await axios.get(`${API_URL}/hots_ticket/dashboard_stats`, { headers });
      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

      // Get monthly ticket data
      const monthlyResponse = await axios.get(`${API_URL}/hots_ticket/monthly_stats`, { headers });
      if (monthlyResponse.data.success) {
        setMonthlyData(monthlyResponse.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // Use fallback data from existing tickets
      const totalTickets = allTickets.totalData || 0;
      const pendingTickets = taskCount || 0;
      const completedTickets = Math.max(0, totalTickets - pendingTickets);
      
      setStats({
        totalTickets,
        pendingTickets,
        completedTickets,
        activeUsers: 24 // fallback value
      });
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      
      await Promise.all([
        dispatch(fetchTaskCount()),
        dispatch(fetchMyTickets(1)),
        dispatch(fetchAllTickets(1)),
        fetchDashboardStats()
        
      ]);
      setIsLoading(false);
    };

    loadDashboardData();
  }, [dispatch]);

  const dashboardData = monthlyData.length > 0 ? monthlyData : [
    { name: 'Jan', tickets: 0 },
    { name: 'Feb', tickets: 0 },
    { name: 'Mar', tickets: 0 },
    { name: 'Apr', tickets: 0 },
    { name: 'May', tickets: 0 },
    { name: 'Jun', tickets: 0 },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to HOTS - Helpdesk Operation Ticket System</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Tickets</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalTickets}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.pendingTickets}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckSquare className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.completedTickets}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Active Users</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card> */}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Tickets Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="tickets" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Index;
