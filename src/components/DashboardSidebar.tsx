import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { SidebarNavItem } from "@/types/nav"
import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useOrganization } from "@/contexts/OrganizationContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Link } from "react-router-dom"
import {
  Users,
  Folder,
  Building2,
  Settings,
  Home,
  FilePlus,
  Forms,
} from 'lucide-react';

interface DashboardSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  items?: SidebarNavItem[]
}

export function DashboardSidebar() {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const { currentOrganization, isSuperAdmin } = useOrganization()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // NOTE: You can add more logic here to determine whether the item is active.
  //       Some possibilities include matching the item.href to the current
  //       pathname or using a more complex regular expression.
  const renderNavItems = () => {
    return [
      {
        label: 'Dashboard',
        icon: <Home className="h-4 w-4" />,
        href: '/dashboard',
        active: location.pathname === '/dashboard',
      },
      {
        label: 'Patients',
        icon: <Users className="h-4 w-4" />,
        href: '/patients',
        active: location.pathname.startsWith('/patients'),
      },
      {
        label: 'Patient Records',
        icon: <Folder className="h-4 w-4" />,
        href: '/patient-records',
        active: location.pathname.startsWith('/patient-records'),
      },
      {
        label: 'New Document',
        icon: <FilePlus className="h-4 w-4" />,
        href: '/upload',
        active: location.pathname.startsWith('/upload'),
      },
      {
        label: 'Form Templates',
        icon: <Forms className="h-4 w-4" />,
        href: '/templates',
        active: location.pathname.startsWith('/templates'),
      },
      ...(isSuperAdmin
        ? [
            {
              label: 'Organizations',
              icon: <Building2 className="h-4 w-4" />,
              href: '/admin/organizations',
              active: location.pathname === '/admin/organizations',
            },
            {
              label: 'Users',
              icon: <Users className="h-4 w-4" />,
              href: '/admin/users',
              active: location.pathname === '/admin/users',
            },
            {
              label: 'Clients',
              icon: <Users className="h-4 w-4" />,
              href: '/admin/clients',
              active: location.pathname === '/admin/clients',
            },
          ]
        : []),
      {
        label: 'Settings',
        icon: <Settings className="h-4 w-4" />,
        href: '/settings',
        active: location.pathname === '/settings',
      },
    ];
  };

  if (!mounted) {
    return null
  }

  return (
    <div className="border-r flex flex-col w-64">
      <div className="flex-1">
        <Link to="/dashboard" className="grid h-16 place-items-center border-b">
          <span className="font-bold text-lg">Health Portal</span>
        </Link>
        <ScrollArea className="h-[calc(100vh-16rem)] px-3">
          <div className="flex flex-col space-y-2 py-4">
            {renderNavItems().map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center text-sm font-medium py-2 px-3 rounded-md hover:bg-secondary",
                  item.active ? "bg-secondary" : "transparent"
                )}
              >
                {item.icon}
                <span className="ml-2">{item.label}</span>
              </Link>
            ))}
          </div>
        </ScrollArea>
      </div>
      <div className="flex flex-col justify-center items-center border-t h-48">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user?.user_metadata?.avatar_url as string} />
          <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="mt-2 text-center">
          <p className="text-sm font-medium">{user?.user_metadata?.full_name as string}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
          {currentOrganization && (
            <p className="text-xs text-muted-foreground">{currentOrganization.name}</p>
          )}
        </div>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => signOut()}>
          Sign Out
        </Button>
      </div>
    </div>
  )
}
