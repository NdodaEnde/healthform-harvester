import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Building, 
  Settings,
  ChevronLeft,
  ChevronRight,
  UserRound,
  ScrollText,
  BarChart3 as BarChart,
  PieChart,
  LineChart,
  Stethoscope,
  ActivitySquare,
  HardHat,
  Crown,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useSubscription } from "@/hooks/useSubscription";
import OrganizationSwitcher from "@/components/OrganizationSwitcher";
import PackageBadge from "@/components/PackageBadge";
import FeatureDiscoveryTooltip from "@/components/FeatureDiscoveryTooltip";
import FeatureSkeleton from "@/components/FeatureSkeleton";

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { currentOrganization, isServiceProvider } = useOrganization();
  const { currentTier, hasFeature } = useSubscription();
  
  // Simulate loading state
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Define nav items with package requirements
  const navItems = [
    { 
      name: "Dashboard", 
      href: "/dashboard", 
      icon: LayoutDashboard,
      tier: "basic"
    },
    { 
      name: "Documents", 
      href: "/documents", 
      icon: FileText,
      tier: "basic"
    },
    {
      name: "Patients",
      href: "/patients",
      icon: UserRound,
      tier: "basic"
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: BarChart,
      tier: "basic"
    },
    {
      name: "Clinical Analytics",
      href: "/clinical-analytics",
      icon: ActivitySquare,
      tier: "premium",
      feature: "advanced_reporting"
    },
    {
      name: "Occupational Health",
      href: "/integrated-occupational-health",
      icon: HardHat,
      tier: "basic"
    },
    {
      name: "Reports",
      href: "/reports",
      icon: PieChart,
      tier: "basic"
    },
    {
      name: "Certificate Templates",
      href: "/certificates/templates",
      icon: ScrollText,
      tier: "premium",
      feature: "custom_branding"
    },
    ...(isServiceProvider ? [
      { 
        name: "Organizations", 
        href: "/admin/organizations", 
        icon: Building,
        tier: "basic"
      },
      { 
        name: "Clients", 
        href: `/admin/organizations/${currentOrganization?.id}/clients`, 
        icon: Building,
        tier: "basic"
      },
      { 
        name: "Users", 
        href: "/admin/users",
        icon: Users,
        tier: "basic"
      }
    ] : []),
    { 
      name: "Settings", 
      href: "/settings/organization", 
      icon: Settings,
      tier: "basic"
    }
  ];

  // Filter nav items based on package tier
  const availableNavItems = navItems.filter(item => {
    if (item.tier === "basic") return true;
    if (item.tier === "premium" && (currentTier === "premium" || currentTier === "enterprise")) {
      return item.feature ? hasFeature(item.feature as any) : true;
    }
    if (item.tier === "enterprise" && currentTier === "enterprise") {
      return item.feature ? hasFeature(item.feature as any) : true;
    }
    return false;
  });

  // Premium/Enterprise nav items to show as locked with tooltips
  const lockedNavItems = navItems.filter(item => {
    if (item.tier === "basic") return false;
    if (item.tier === "premium" && currentTier === "basic") return true;
    if (item.tier === "enterprise" && (currentTier === "basic" || currentTier === "premium")) return true;
    return false;
  });

  const renderLockedNavItem = (item: any) => {
    const benefits = item.tier === "premium" ? [
      "Advanced reporting capabilities",
      "Custom branding options",
      "AI-powered insights"
    ] : [
      "Strategic analytics",
      "Competitive benchmarking", 
      "API access"
    ];

    return (
      <FeatureDiscoveryTooltip
        key={item.name}
        requiredTier={item.tier as any}
        title={`${item.name} - ${item.tier.toUpperCase()} Feature`}
        description={`Unlock ${item.name} with ${item.tier} subscription.`}
        benefits={benefits}
      >
        <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/60 cursor-pointer hover:bg-accent/50 transition-all duration-300 hover:scale-105 group">
          <item.icon size={20} className="group-hover:text-muted-foreground transition-colors duration-300" />
          {!collapsed && (
            <>
              <span className="group-hover:text-muted-foreground transition-colors duration-300">{item.name}</span>
              {item.tier === "premium" ? (
                <Zap className="h-3 w-3 ml-auto text-yellow-600 animate-pulse" />
              ) : (
                <Crown className="h-3 w-3 ml-auto text-purple-600 animate-pulse" />
              )}
            </>
          )}
        </div>
      </FeatureDiscoveryTooltip>
    );
  };

  if (isLoading) {
    return (
      <div 
        className={cn(
          "fixed top-16 left-0 bg-background border-r transition-all duration-300 z-40",
          "flex flex-col",
          collapsed ? "w-16" : "w-64"
        )}
        style={{
          height: 'calc(100vh - 4rem)',
          minHeight: 'calc(100vh - 4rem)'
        }}
      >
        <div className="h-full grid grid-rows-[auto_1fr_auto] overflow-hidden">
          <div className="px-3 py-4 border-b">
            <div className="flex items-center justify-between">
              {!collapsed && <FeatureSkeleton className="h-6 w-20" />}
              <FeatureSkeleton className={cn("h-8 w-8", collapsed && "mx-auto")} />
            </div>
          </div>
          
          <div className="px-2 overflow-y-auto">
            <nav className="space-y-1 py-4">
              {[...Array(6)].map((_, i) => (
                <FeatureSkeleton key={i} className="h-10 w-full" />
              ))}
            </nav>
          </div>
          
          <div className="p-4 border-t">
            <FeatureSkeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "fixed top-16 left-0 bg-background border-r transition-all duration-300 z-40",
        "flex flex-col shadow-lg",
        collapsed ? "w-16" : "w-64"
      )}
      style={{
        height: 'calc(100vh - 4rem)',
        minHeight: 'calc(100vh - 4rem)'
      }}
    >
      <div className="h-full grid grid-rows-[auto_1fr_auto] overflow-hidden">
        
        {/* Header with Package Badge and Collapse Toggle */}
        <div className="px-3 py-4 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="animate-fade-in">
                <PackageBadge tier={currentTier} />
              </div>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                "transition-all duration-300 hover:scale-110", 
                collapsed && "mx-auto"
              )}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </Button>
          </div>
        </div>
        
        {/* Navigation - Available Items */}
        <div className="px-2 overflow-y-auto">
          <nav className="space-y-1 py-4">
            {/* Available Navigation Items */}
            {availableNavItems.map((item, index) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-300",
                    "hover:scale-105 animate-fade-in",
                    isActive 
                      ? "bg-primary/10 text-primary shadow-sm" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    collapsed && "justify-center px-0",
                    item.name === "Patients" && isActive && "bg-purple-100 text-purple-800",
                    item.name === "Occupational Health" && isActive && "bg-blue-100 text-blue-800"
                  )
                }
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <item.icon size={20} />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            ))}

            {/* Locked Items with Interactive Tooltips */}
            {!collapsed && lockedNavItems.length > 0 && (
              <>
                <div className="my-4 border-t"></div>
                <div className="px-3 text-xs font-semibold text-muted-foreground mb-2 animate-fade-in">
                  DISCOVER PREMIUM FEATURES ✨
                </div>
                {lockedNavItems.map((item, index) => (
                  <div 
                    key={item.name}
                    className="animate-fade-in"
                    style={{ animationDelay: `${(availableNavItems.length + index) * 0.1}s` }}
                  >
                    {renderLockedNavItem(item)}
                  </div>
                ))}
              </>
            )}
          </nav>
        </div>
        
        {/* Organization Switcher - Fixed at bottom */}
        <div 
          className={cn(
            "p-4 border-t bg-muted/10 transition-all duration-300",
            collapsed && "px-2"
          )}
          style={{
            minHeight: "140px"
          }}
        >
          {!collapsed && (
            <div className="animate-fade-in">
              <div className="mb-2 text-xs font-semibold text-muted-foreground">
                ORGANIZATION
              </div>
              <Suspense fallback={<FeatureSkeleton className="h-16 w-full" />}>
                <OrganizationSwitcher />
              </Suspense>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}

export default DashboardSidebar;
