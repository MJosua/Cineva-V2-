
import React, { useState } from 'react';
// import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { useAppSelector } from '@/hooks/useAppSelector';
import { Navigate } from 'react-router-dom';
import { Loader2, ShieldAlert, Palette, Save, History, Info } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../config/sourceConfig';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import SidebarMenuSettings from '@/components/admin/SidebarMenuSettings';
import { Layout } from 'lucide-react';

const SystemSettings = () => {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAppSelector(state => state.auth);

  // 1. All useState Hooks at the top
  const [generalSettings, setGeneralSettings] = useState({
    systemName: 'HOTS - Helpdesk Operation Ticket System',
    companyName: 'PT INDOFOOD CBP SUKSES MAKMUR',
    divisionName: 'International Operations Division',
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

  const [badgeSettings, setBadgeSettings] = useState({
    title: '',
    content: '',
    bg_color: 'bg-blue-50',
    text_color: 'text-blue-700',
    border_color: 'border-blue-200',
    icon: 'info',
    is_active: true
  });

  const [isBadgeLoading, setIsBadgeLoading] = useState(false);
  const [badgeHistory, setBadgeHistory] = useState<any[]>([]);

  // 2. All useEffect Hooks
  React.useEffect(() => {
    if (!user) return;
    
    const fetchBadge = async () => {
      setIsBadgeLoading(true);
      try {
        const response = await axios.get(`${API_URL}/auth/system-meta/login_badge_info`);
        if (response.data.success) {
          const data = response.data.data;
          setBadgeSettings({
            title: data.title || '',
            content: data.content || '',
            bg_color: data.bg_color || 'bg-blue-50',
            text_color: data.text_color || 'text-blue-700',
            border_color: data.border_color || 'border-blue-200',
            icon: data.icon || 'info',
            is_active: true
          });
        }
      } catch (err) {
        console.error("Failed to fetch badge settings", err);
      } finally {
        setIsBadgeLoading(false);
      }
    };

    const fetchHistory = async () => {
      try {
        const response = await axios.get(`${API_URL}/hots_settings/system-meta/login_badge_info/history`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('hots_tokek')}` }
        });
        if (response.data.success) {
          setBadgeHistory(response.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch history", err);
      }
    };

    fetchBadge();
    fetchHistory();
  }, [user]);

  // 3. Conditional Returns (Guards) MUST be after all hooks
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isAdmin = user.role_id?.toString() === '4';
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // 4. Handlers
  const handleBadgeSave = async () => {
    setIsBadgeLoading(true);
    try {
      const items = [
        { cstm_col: 'title', lbl_col: 'Badge Title', value: badgeSettings.title },
        { cstm_col: 'content', lbl_col: 'Badge Content', value: badgeSettings.content },
        { cstm_col: 'bg_color', lbl_col: 'Background Color', value: badgeSettings.bg_color },
        { cstm_col: 'text_color', lbl_col: 'Text Color', value: badgeSettings.text_color },
        { cstm_col: 'border_color', lbl_col: 'Border Color', value: badgeSettings.border_color },
        { cstm_col: 'icon', lbl_col: 'Icon Type', value: badgeSettings.icon },
      ];

      const response = await axios.post(`${API_URL}/hots_settings/system-meta/update`, {
        meta_key: 'login_badge_info',
        items
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('hots_tokek')}` }
      });

      if (response.data.success) {
        toast({
          title: "Badge Updated",
          description: `Login information badge saved as Revision #${response.data.revision}`,
        });
      }
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.response?.data?.message || err.message,
        variant: "destructive"
      });
    } finally {
      setIsBadgeLoading(false);
    }
  };

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">Configure system-wide settings and preferences</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="login-badge" className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            Login Badge
          </TabsTrigger>
          <TabsTrigger value="sidebar-menu" className="flex items-center gap-2">
            <Layout className="w-4 h-4" />
            Sidebar Menu
          </TabsTrigger>
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

        <TabsContent value="login-badge">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Badge Customization
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="badgeTitle">Badge Header Title</Label>
                    <Input
                      id="badgeTitle"
                      placeholder="e.g. Security Notice"
                      value={badgeSettings.title}
                      onChange={(e) => setBadgeSettings(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="badgeContent">Badge Message (HTML Supported)</Label>
                    <Textarea
                      id="badgeContent"
                      rows={4}
                      placeholder="Enter the information message shown to users..."
                      value={badgeSettings.content}
                      onChange={(e) => setBadgeSettings(prev => ({ ...prev, content: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Background Color Class</Label>
                      <Select 
                        value={badgeSettings.bg_color} 
                        onValueChange={(v) => setBadgeSettings(prev => ({ ...prev, bg_color: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select BG" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bg-blue-50/50">Modern Blue (Light)</SelectItem>
                          <SelectItem value="bg-amber-50/50">Alert Amber (Light)</SelectItem>
                          <SelectItem value="bg-emerald-50/50">Success Green (Light)</SelectItem>
                          <SelectItem value="bg-slate-50/50">Neutral Gray</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Text Color Class</Label>
                      <Select 
                        value={badgeSettings.text_color} 
                        onValueChange={(v) => setBadgeSettings(prev => ({ ...prev, text_color: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Text" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text-blue-900">Deep Blue</SelectItem>
                          <SelectItem value="text-amber-900">Dark Amber</SelectItem>
                          <SelectItem value="text-emerald-900">Forest Green</SelectItem>
                          <SelectItem value="text-slate-900">Off-Black</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Border Color Class</Label>
                      <Select 
                        value={badgeSettings.border_color} 
                        onValueChange={(v) => setBadgeSettings(prev => ({ ...prev, border_color: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Border" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="border-blue-200">Refined Blue</SelectItem>
                          <SelectItem value="border-amber-200">Alert Amber</SelectItem>
                          <SelectItem value="border-emerald-200">Success Green</SelectItem>
                          <SelectItem value="border-slate-200">Light Gray</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Icon Type</Label>
                      <Select 
                        value={badgeSettings.icon} 
                        onValueChange={(v) => setBadgeSettings(prev => ({ ...prev, icon: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Icon" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="info">Information (Circle)</SelectItem>
                          <SelectItem value="alert">Alert (Triangle)</SelectItem>
                          <SelectItem value="shield">Security (Shield)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="pt-4 border-t flex justify-end">
                    <Button 
                      onClick={handleBadgeSave} 
                      disabled={isBadgeLoading}
                      className="bg-blue-950 hover:bg-blue-900"
                    >
                      {isBadgeLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save & Publish Badge
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-slate-50 border-dashed">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Live Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center p-8 bg-white/50">
                  <div className={`w-full max-w-sm p-4 rounded-xl border flex items-start gap-4 shadow-sm border-dashed transition-all duration-300 ${badgeSettings.bg_color} ${badgeSettings.border_color}`}>
                    <div className="mt-1 flex-shrink-0">
                      <div className={`p-1.5 rounded-lg bg-white shadow-sm ${badgeSettings.text_color}`}>
                        {badgeSettings.icon === 'info' && <Info className="w-4 h-4" />}
                        {badgeSettings.icon === 'alert' && <ShieldAlert className="w-4 h-4" />}
                        {badgeSettings.icon === 'shield' && <ShieldAlert className="w-4 h-4" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${badgeSettings.text_color}`}>
                        {badgeSettings.title || "Preview Title"}
                      </p>
                      <div 
                        className={`text-xs font-semibold leading-relaxed ${badgeSettings.text_color} opacity-90`}
                        dangerouslySetInnerHTML={{ __html: badgeSettings.content || "Your message will appear here..." }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Revision History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {badgeHistory.length > 0 ? (
                      [...new Set(badgeHistory.map(h => h.revision))].slice(0, 5).map((rev) => {
                        const revDetail = badgeHistory.find(h => h.revision === rev && h.cstm_col === 'title');
                        return (
                          <div key={rev} className="text-xs p-2 border rounded-md bg-slate-50 flex justify-between items-center">
                            <div>
                              <span className="font-bold">Rev #{rev}</span>
                              <p className="text-muted-foreground opacity-70">{revDetail ? new Date(revDetail.created_at).toLocaleDateString() : ''}</p>
                            </div>
                            <div className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold uppercase">
                              v.{rev}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4">No history available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sidebar-menu">
           <SidebarMenuSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemSettings;
