import React, { useState, useEffect } from 'react';
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
import { Home, FileText, CheckSquare, List, Settings, LogOut, Monitor, Users, Search, User, Code, FileCode, HelpCircle, ChevronRight, ClipboardList, Palette, Database, Briefcase, Building } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { cn } from "@/lib/utils";
import ProfileModal from "@/components/modals/ProfileModal";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { logoutUser } from "@/store/slices/authSlice";
import { useToast } from "@/hooks/use-toast";
import { useAppSelector } from '@/hooks/useAppSelector';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { fetchTaskCount } from '@/store/slices/ticketsSlice';
import { fetchAssignmentCount } from '@/store/slices/assignmentSlice';
import { TutorialManager } from '@/components/tutorial/TutorialManager';
import { useHeader } from '@/contexts/HeaderContext';
import { Outlet } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import { fetchDashboardFunctions } from '@/store/slices/dashboardSlice';

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

const adminItems = [
  {
    title: "API Builder",
    url: "/admin/api-builder",
    icon: Database,
    description: "Create & manage SQL functions",
  },
  {
    title: "Service Catalog Admin",
    url: "/admin/service-catalog",
    icon: List,
  },
  {
    title: "User Management",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Function Logs",
    url: "/admin/function-logs",
    icon: FileCode,
  },
  {
    title: "System Settings",
    url: "/admin/settings",
    icon: Settings,
  },
];

// HR Management menu items (visible to HR dept, IT dept, or Admin role)
const hrItems = [
  {
    title: "Employees",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Teams",
    url: "/admin/teams",
    icon: Users,
  },
  {
    title: "Departments",
    url: "/admin/departments",
    icon: Building,
  },
  {
    title: "Job Titles",
    url: "/admin/job-titles",
    icon: Briefcase,
  },
];

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
  const { user } = useAppSelector(state => state.auth);
  const { data: dashboardFunctions, loading: dashboardLoading } = useAppSelector(state => state.dashboard);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const cached = localStorage.getItem('user_profile_cache');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [isHelpOpen, setIsHelpOpen] = useState(false);


  // utils/pathUtils.ts

  const menuItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      hidden: dashboardFunctions.length === 0
    },
    {
      title: "Service Catalog",
      url: "/service-catalog",
      icon: List,
    },
    {
      title: "My Tickets",
      url: "/my-tickets",
      icon: FileText,
    },
    {
      title: "My Approvals",
      url: "/task-list",
      icon: CheckSquare,
      badge: taskCount
    },
    {
      title: "My Assignments",
      url: "/my-assignments",
      icon: ClipboardList,
      badge: assignmentCount
    },
  ].filter(item => !item.hidden);

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { setOpenMobile } = useSidebar();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Auto-close sidebar on mobile after navigation
  useEffect(() => {
    setOpenMobile(false);
  }, [location.pathname, setOpenMobile]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('tokek');
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

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      dispatch(fetchTaskCount());
      dispatch(fetchAssignmentCount());
      dispatch(fetchDashboardFunctions());
    }
  }, [user, dispatch]);

  const handleLogout = () => {
    dispatch(logoutUser()).then(() => {
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
      navigate('/login');
    });
  };

  // Check if user has admin role (role === 4)
  const isAdmin = user?.role_id?.toString() === '4';

  // Check if user has HR access (department 1=HR, 10=IT, or role 4=Admin)
  const departmentId = userProfile?.department_id || user?.department_id;
  const isHR = isAdmin || departmentId === 1 || departmentId === 10;


  useEffect(() => {
    if (location.pathname.includes('/help/')) {
      setIsHelpOpen(true);
    }
  }, [location.pathname]);


  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border p-2 h-20 pt-5">
        <div className="flex  items-center space-x-3" style={{ position: 'relative' }} >
          {/* Show when collapsible != icon */}
          <div className="w-6 h-6 bg-primary ms-1 mt-3 mb-3 rounded items-center justify-center flex-shrink-0 hidden group-data-[collapsible=icon]:flex">
            <span className="text-primary-foreground  font-bold text-xs">H</span>
          </div>

          {/* Show when collapsible == icon */}
          <div className="w-10 h-10  bg-primary rounded items-center justify-center flex-shrink-0 flex group-data-[collapsible=icon]:hidden">
            <span className="text-primary-foreground font-bold text-xs">HOTS</span>
          </div>

          <div className="group-data-[collapsible=icon]:hidden">
            <h3 className="font-semibold text-sidebar-foreground">HOTS</h3>
            <p className="text-sm text-sidebar-foreground/70 mb-1">Helpdesk System</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-0 shadow-sm">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider px-3 py-2">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
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

        {/* Help & Support Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider px-3 py-2">
            Help & Support
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenu>
                  {helpItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
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
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* HR Management Section - visible to HR (dept 1), IT (dept 10), or Admin (role 4) */}
        {isHR && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider px-3 py-2">
              HR Management
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {hrItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <Link
                        to={item.url}
                        className={cn(
                          "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          location.pathname === item.url && "bg-sidebar-accent text-sidebar-accent-foreground"
                        )}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}


        {/* Only show Administration menu for users with role === 4 */}
        {
          isAdmin && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider px-3 py-2">
                Administration
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <Link
                          to={item.url}
                          className={cn(
                            "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            location.pathname === item.url && "bg-sidebar-accent text-sidebar-accent-foreground"
                          )}
                        >
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Admin Guide">
                      <Link
                        to="/admin/guide"
                        className={cn(
                          "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          location.pathname === "/admin/guide" && "bg-sidebar-accent text-sidebar-accent-foreground"
                        )}
                      >
                        <HelpCircle className="w-5 h-5 flex-shrink-0" />
                        <span>Admin Guide</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        }


        {
          isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="CMS Pages">
                <Link
                  to="/admin/cms"
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    location.pathname.startsWith("/admin/cms") &&
                    "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                >
                  <FileText className="w-5 h-5 flex-shrink-0" />
                  <span>CMS Pages</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

      </SidebarContent >




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
            {userProfile?.superior_name && (
              <p className="text-xs text-sidebar-foreground/60 truncate">
                Reports to: {userProfile.superior_name}
              </p>
            )}

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
    </Sidebar >
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
            {/* Top Bar: Always visible */}
            <div className="flex backdrop-blur-md bg-background/95 border-b border-border px-4 py-3 sm:px-6 sm:py-4 justify-between items-center w-full">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <SidebarTrigger className="bg-secondary hover:bg-secondary/50" />
                <div className="flex items-center space-x-3">
                  {/* Web/Desktop: Show full organization name */}
                  <div className="hidden sm:block">
                    <h1 className="text-lg font-bold text-primary tracking-tight">PT INDOFOOD CBP SUKSES MAKMUR</h1>
                    <p className="text-xs font-medium text-primary/80">International Operations Division</p>
                  </div>

                  {/* Mobile: Show HOTS Icon/Logo */}
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
                {/* Desktop Search */}
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

            {/* Bottom Bar: Mobile Search (Hidden on Desktop) */}
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
