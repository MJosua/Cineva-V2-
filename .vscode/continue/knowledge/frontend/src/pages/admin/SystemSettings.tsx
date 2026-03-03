
import React, { useState } from 'react';
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { useAppSelector } from '@/hooks/useAppSelector';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const SystemSettings = () => {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  
  // Show loading spinner while auth state is being determined
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Show loading while user data is being fetched
  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }
  
  // Check if user has admin role (role_id === '4' or role_id === 4)
  const isAdmin = user.role_id?.toString() === '4';
  
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    systemName: 'HOTS - Helpdesk Operation Ticket System',
    companyName: 'PT INDOFOOD CBP SUKSES MAKMUR',
    divisionName: 'Divisi Noodle',
    supportEmail: 'support@company.com',
    maxFileSize: '10',
    allowedFileTypes: '.pdf,.doc,.docx,.jpg,.png,.xlsx',
    sessionTimeout: '30'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    ticketCreated: true,
    ticketApproved: true,
    ticketRejected: true,
    ticketAssigned: true,
    reminderNotifications: true,
    reminderInterval: '24'
  });

  const handleGeneralSave = () => {
    toast({
      title: "Success",
      description: "General settings saved successfully",
    });
  };

  const handleNotificationSave = () => {
    toast({
      title: "Success",
      description: "Notification settings saved successfully",
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">Configure system-wide settings and preferences</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="systemName">System Name</Label>
                    <Input
                      id="systemName"
                      value={generalSettings.systemName}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, systemName: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={generalSettings.companyName}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, companyName: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="divisionName">Division Name</Label>
                    <Input
                      id="divisionName"
                      value={generalSettings.divisionName}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, divisionName: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={generalSettings.supportEmail}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                    <Input
                      id="maxFileSize"
                      type="number"
                      value={generalSettings.maxFileSize}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, maxFileSize: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={generalSettings.sessionTimeout}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, sessionTimeout: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
                  <Input
                    id="allowedFileTypes"
                    value={generalSettings.allowedFileTypes}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, allowedFileTypes: e.target.value }))}
                    placeholder=".pdf,.doc,.docx,.jpg,.png"
                  />
                  <p className="text-sm text-muted-foreground">
                    Comma-separated list of allowed file extensions
                  </p>
                </div>

                <Button onClick={handleGeneralSave}>
                  Save General Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable email notifications for system events
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))}
                    />
                  </div>

                  <div className="space-y-4 ml-4">
                    <div className="flex items-center justify-between">
                      <Label>Ticket Created</Label>
                      <Switch
                        checked={notificationSettings.ticketCreated}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({ ...prev, ticketCreated: checked }))}
                        disabled={!notificationSettings.emailNotifications}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Ticket Approved</Label>
                      <Switch
                        checked={notificationSettings.ticketApproved}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({ ...prev, ticketApproved: checked }))}
                        disabled={!notificationSettings.emailNotifications}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Ticket Rejected</Label>
                      <Switch
                        checked={notificationSettings.ticketRejected}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({ ...prev, ticketRejected: checked }))}
                        disabled={!notificationSettings.emailNotifications}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Ticket Assigned</Label>
                      <Switch
                        checked={notificationSettings.ticketAssigned}
                        onCheckedChange={(checked) => 
                          setNotificationSettings(prev => ({ ...prev, ticketAssigned: checked }))}
                        disabled={!notificationSettings.emailNotifications}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Reminder Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send reminders for pending approvals
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.reminderNotifications}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, reminderNotifications: checked }))}
                    />
                  </div>

                  {notificationSettings.reminderNotifications && (
                    <div className="ml-4 space-y-2">
                      <Label htmlFor="reminderInterval">Reminder Interval (hours)</Label>
                      <Input
                        id="reminderInterval"
                        type="number"
                        value={notificationSettings.reminderInterval}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, reminderInterval: e.target.value }))}
                        className="w-32"
                      />
                    </div>
                  )}
                </div>

                <Button onClick={handleNotificationSave}>
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default SystemSettings;
