import React, { useState, useEffect, useMemo } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import { Home, FileText, CheckSquare, List, Settings, LogOut, Monitor, Users, Search, User, Code, FileCode, HelpCircle, ChevronRight, ClipboardList, Palette, Database, Briefcase, Building, Package, Layout, LayoutDashboard, Megaphone, Workflow, MapPin, Layers3, Inbox } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { cn } from "@/lib/utils";
import ProfileModal from "@/components/modals/ProfileModal";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { logoutUser } from "@/store/slices/authSlice";
import { useToast } from "@/hooks/use-toast";
import { useAppSelector } from '@/hooks/useAppSelector';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { fetchTaskCount } from '@/store/slices/ticketsSlice';
import { fetchAssignmentCount } from '@/store/slices/assignmentSlice';
import { TutorialManager } from '@/components/tutorial/TutorialManager';
import { useHeader } from '@/contexts/HeaderContext';
import { fetchSidebarMenu } from '@/store/slices/sidebarSlice';
import NotificationBell from './NotificationBell';
import { fetchDashboardFunctions } from '@/store/slices/dashboardSlice';
import { fetchCatalogData, selectServiceCatalog } from '@/store/slices/catalogSlice';

interface UserProfile {
  user_id: number;
  firstname: string;
  lastname: string;
  email: string;
  team_name: string;
  superior_name?: string;
  role_name: string;
  department_name: string;
  department_id?: number;
}

const helpItems = [
  {
    title: "User Guide",
    url: "/help/user-guide",
    icon: FileText,
  },
  {
    title: "FAQ",
    url: "/help/faq",
    icon: HelpCircle,
  },
];

interface AppLayoutProps {
  children?: React.ReactNode;
}

export function AppSidebar() {
  const { taskCount } = useAppSelector(state => state.tickets);
  const { assignmentCount } = useAppSelector(state => state.assignment);
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  const { menuData: systemMenu } = useAppSelector((state) => state.sidebar);
  const { data: dashboardFunctions } = useAppSelector(state => state.dashboard);
  const serviceCatalog = useAppSelector(selectServiceCatalog);
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const cached = localStorage.getItem('user_profile_cache');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      Home, FileText, CheckSquare, List, Settings, Monitor, Users, Search, 
      User, Code, FileCode, HelpCircle, ChevronRight, ClipboardList, 
      Palette, Database, Briefcase, Building, Package, LayoutDashboard
    };
    return icons[iconName] || Layout;
  };

  const roleId = Number(user?.role_id || 0);
  const isTalent = roleId === 5;

  const fallbackMenuGroups = useMemo(() => {
    if (isTalent) {
      return [
        {
          label: "Talent Facing",
          items: [
            { title: "Job Marketplace", url: "/job-marketplace", icon: Briefcase },
            { title: "Talent Join Request", url: "/my-tickets", icon: Inbox },
            { title: "My Assignments", url: "/my-assignments", icon: ClipboardList, badge: assignmentCount },
          ],
        },
      ];
    }

    return [
      {
        label: "Talent Facing",
        items: [
          { title: "Job Marketplace", url: "/job-marketplace", icon: Briefcase },
          { title: "My Assignments", url: "/my-assignments", icon: ClipboardList, badge: assignmentCount },
        ],
      },
      {
        label: "Internal Ops",
        items: [
          { title: "Campaigns", url: "/job-marketplace/campaigns", icon: Megaphone },
          { title: "Batches", url: "/job-marketplace/batches", icon: Layers3 },
          { title: "Locations", url: "/job-marketplace/locations", icon: MapPin },
          { title: "Talent Flow", url: "/job-marketplace/talent-assignments", icon: Users },
          { title: "Content Flow", url: "/job-marketplace/content-workflow", icon: Workflow },
        ],
      },
      {
        label: "Admin & HOTS",
        items: [
          { title: "Dashboard", url: "/dashboard", icon: Home, hidden: !dashboardFunctions || dashboardFunctions.length === 0 },
          { title: "Service Catalog", url: "/service-catalog", icon: List },
          { title: "My Approvals", url: "/task-list", icon: CheckSquare, badge: taskCount },
        ],
      },
    ];
  }, [assignmentCount, dashboardFunctions, isTalent, taskCount]);

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { setOpenMobile } = useSidebar();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    setOpenMobile(false);
  }, [location.pathname, setOpenMobile]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('hots_tokek');
      if (!token) return;
      const response = await axios.get(`${API_URL}/hots_auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUserProfile(response.data.data);
        localStorage.setItem('user_profile_cache', JSON.stringify(response.data.data));
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const { isLoading: menuLoading, error: menuError } = useAppSelector(state => state.sidebar);
  const { loading: dashboardLoading, error: dashboardError } = useAppSelector(state => state.dashboard);

  const hasDynamicMenu = Object.keys(systemMenu).length > 0;
  const shouldShowFallbackMenu = !hasDynamicMenu && fallbackMenuGroups.length > 0;

  const getMenuBadge = (menuPath: string) => {
    if (menuPath === "/my-assignments") return assignmentCount;
    if (menuPath === "/task-list") return taskCount;
    return null;
  };

  useEffect(() => {
    if (user && isAuthenticated) {
      fetchUserProfile();
      dispatch(fetchTaskCount());
      dispatch(fetchAssignmentCount());
      
      if (Object.keys(systemMenu).length === 0 && !menuLoading && !menuError) {
        dispatch(fetchSidebarMenu());
      }
      
      if (serviceCatalog.length === 0) {
        dispatch(fetchCatalogData());
      }
      
      if (dashboardFunctions.length === 0 && !dashboardLoading && !dashboardError) {
        dispatch(fetchDashboardFunctions());
      }
    }
  }, [user, isAuthenticated, dispatch, serviceCatalog.length, dashboardFunctions.length, Object.keys(systemMenu).length, menuLoading, menuError, dashboardLoading, dashboardError]);

  const handleLogout = () => {
    dispatch(logoutUser()).then(() => {
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
      navigate('/login');
    });
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border p-2 h-20 pt-5">
        <div className="flex items-center space-x-3" style={{ position: 'relative' }} >
          <div className="w-6 h-6 bg-primary ms-1 mt-3 mb-3 rounded items-center justify-center flex-shrink-0 hidden group-data-[collapsible=icon]:flex">
            <span className="text-primary-foreground font-bold text-xs">H</span>
          </div>

          <div className="w-10 h-10 bg-primary rounded items-center justify-center flex-shrink-0 flex group-data-[collapsible=icon]:hidden">
            <span className="text-primary-foreground font-bold text-xs">HOTS</span>
          </div>

          <div className="group-data-[collapsible=icon]:hidden">
            <h3 className="font-semibold text-sidebar-foreground">HOTS</h3>
            <p className="text-sm text-sidebar-foreground/70 mb-1">Helpdesk System</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-0 shadow-sm">
        {shouldShowFallbackMenu && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider px-3 py-2">
              Main Menu
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {fallbackMenuGroups.map((group) => (
                  <SidebarGroup key={group.label}>
                    <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider px-3 py-2">
                      {group.label}
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {group.items.filter(item => !item.hidden).map((item) => (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild tooltip={item.title}>
                              <Link
                                to={item.url}
                                className={cn(
                                  "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-primary/10 hover:text-primary",
                                  location.pathname === item.url && "bg-primary/10 text-primary"
                                )}
                              >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                <span>{item.title}</span>
                                {item.badge && (
                                  <span className="ml-auto bg-destructive text-destructive-foreground text-xs rounded-full px-2 py-0.5 group-data-[collapsible=icon]:hidden">
                                    {item.badge}
                                  </span>
                                )}
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider px-3 py-2">
            Help & Support
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {helpItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link
                      to={item.url}
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        location.pathname === item.url && "bg-sidebar-accent text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {Object.entries(systemMenu).map(([groupName, items]) => (
          <SidebarGroup key={groupName}>
            <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider px-3 py-2">
              {groupName}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const Icon = getIcon(item.menu_icon);
                  return (
                    <SidebarMenuItem key={item.menu_id}>
                      <SidebarMenuButton asChild tooltip={item.menu_name}>
                        <Link
                          to={item.menu_path}
                          className={cn(
                            "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            location.pathname === item.menu_path && "bg-sidebar-accent text-sidebar-accent-foreground"
                          )}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          <span>{item.menu_name}</span>
                          {getMenuBadge(item.menu_path) && (
                            <span className="ml-auto bg-destructive text-destructive-foreground text-xs rounded-full px-2 py-0.5 group-data-[collapsible=icon]:hidden">
                              {getMenuBadge(item.menu_path)}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center space-x-3 mb-3 group-data-[collapsible=icon]:justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 bg-muted rounded-full group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8"
            onClick={() => setIsProfileModalOpen(true)}
            id="sidebar-profile-btn"
          >
            <User className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {userProfile
                ? `${userProfile.firstname} ${userProfile.lastname}`
                : (user ? `${user.firstname} ${user.lastname}` : 'User')}
            </p>
            <p className="text-xs text-sidebar-foreground/70 truncate">
              {userProfile?.department_name || (user?.department_id ? `Dept ${user.department_id}` : '')}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:px-0"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 group-data-[collapsible=icon]:mr-0 mr-2" />
          <span className="group-data-[collapsible=icon]:hidden">Log Out</span>
        </Button>

        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const { searchValue, setSearchValue, searchPlaceholder, isSearchVisible } = useHeader();
  const hiddenSearchRoutes = ['/', '/login', '/admin/settings', '/admin/service-catalog', '/admin/service-catalog/create', '/admin/custom-functions', '/admin/function-logs'];
  const shouldHideSearch = hiddenSearchRoutes.includes(location.pathname) || !isSearchVisible;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <SidebarInset className="flex-1 min-w-0 w-full relative">
          <header className="sticky top-0 z-50 w-full flex flex-col shadow-sm">
            <div className="flex backdrop-blur-md bg-background/95 border-b border-border px-4 py-3 sm:px-6 sm:py-4 justify-between items-center w-full">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <SidebarTrigger className="bg-secondary hover:bg-secondary/50" />
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:block">
                    <h1 className="text-lg font-bold text-primary tracking-tight">PT INDOFOOD CBP SUKSES MAKMUR</h1>
                    <p className="text-xs font-medium text-primary/80">International Operations Division</p>
                  </div>
                  <div className="flex sm:hidden items-center space-x-2">
                    <div className="w-8 h-8 bg-primary rounded flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-primary-foreground font-bold text-[10px]">HOTS</span>
                    </div>
                    <div>
                      <h1 className="text-sm font-bold text-primary leading-tight">HOTS</h1>
                      <p className="text-[10px] font-medium text-primary/70 leading-tight">Helpdesk System</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {!shouldHideSearch && (
                  <div className="hidden sm:block relative">
                    <Input
                      type="text"
                      placeholder={searchPlaceholder}
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      className="w-64 lg:w-80 pl-4 pr-10 py-2 bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/20 focus-visible:ring-4 focus-visible:border-primary transition-all"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Search className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                )}
                <NotificationBell />
              </div>
            </div>

            {!shouldHideSearch && (
              <div className="sm:hidden backdrop-blur-md bg-background/95 border-b border-border px-4 py-2 w-full">
                <div className="relative w-full">
                  <Input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="w-full h-10 pl-4 pr-10 py-2 bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/20 focus-visible:ring-4 focus-visible:border-primary transition-all"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            )}
          </header>
          <div className="px-4 sm:px-6 lg:px-16 py-6">
            <TutorialManager />
            {children || <Outlet />}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
