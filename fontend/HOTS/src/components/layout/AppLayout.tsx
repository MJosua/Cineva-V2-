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
} from "@/components/ui/sidebar";
import { Home, FileText, CheckSquare, List, Settings, LogOut, Monitor, Users, Search, User, Code, FileCode, HelpCircle, ChevronRight, ClipboardList, Palette, Database } from 'lucide-react';
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

interface UserProfile {
  user_id: number;
  firstname: string;
  lastname: string;
  email: string;
  team_name: string;
  superior_name?: string;
  role_name: string;
  department_name: string;
}

const adminItems = [
  {
    title: "Visual Studio",
    url: "/admin/studio",
    icon: Palette,
    description: "Form & Workflow Builder",
  },
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
    title: "Division Management",
    url: "/admin/divisions",
    icon: Monitor,
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
  children: React.ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}


export function AppSidebar() {
  const { taskCount } = useAppSelector(state => state.tickets);
  const { assignmentCount } = useAppSelector(state => state.assignment);
  const { user } = useAppSelector(state => state.auth);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);


  // utils/pathUtils.ts

  const menuItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
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
  ];

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('tokek');
      const response = await axios.get(`${API_URL}/hots_auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUserProfile(response.data.data);
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

      <SidebarContent className="p-0">
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
          >
            <User className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {userProfile ? `${userProfile.firstname} ${userProfile.lastname}` : 'Loading...'}
            </p>
            <p className="text-xs text-sidebar-foreground/70 truncate">
              {userProfile?.department_name || 'Loading...'}
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

export function AppLayout({ children, searchValue, onSearchChange, searchPlaceholder = "Search..." }: AppLayoutProps) {
  const location = useLocation();
  const hiddenSearchRoutes = ['/', '/login', '/admin/settings', '/admin/service-catalog', '/admin/service-catalog/create', '/admin/custom-functions', '/admin/function-logs'];
  const shouldHideSearch = hiddenSearchRoutes.includes(location.pathname);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-screen bg-background">
        <AppSidebar />
        <SidebarInset>
          <header className="sticky backdrop-blur-md top-0 z-50 bg-muted/30 border-b border-border px-6 py-4 w-full" >
            <div className="flex items-center justify-between">

              <div className="flex items-center space-x-4">
                <SidebarTrigger className="bg-secondary hover:bg-secondary/50" />
                <div className="flex items-center space-x-3">
                  <div>
                    <h1 className="text-lg font-semibold text-primary  ">PT INDOFOOD CBP SUKSES MAKMUR</h1>
                    <p className="text-sm text-primary">International Operations Division</p>
                  </div>
                </div>
              </div>

              {!shouldHideSearch && (
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder={searchPlaceholder}
                      value={searchValue || ''}
                      onChange={(e) => onSearchChange?.(e.target.value)}
                      className="w-64 pl-4 pr-10 py-2 bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-foreground focus-visible:ring-2 focus-visible:border-foreground"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Search className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </header>
          <div className="flex-1 p-6">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
