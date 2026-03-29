import { Link } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import {
    BookOpen,
    Briefcase,
    Clipboard,
    DollarSign,
    LandPlot,
    LayoutGrid,
    ShieldCheck,
    User,
} from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as certificationIndex } from '@/routes/certifications';
import { index as employeeIndex } from '@/routes/employees';
import { index as haciendasIndex } from '@/routes/haciendas';
import { index as plantersIndex } from '@/routes/planters';
import { index as productionsIndex } from '@/routes/productions';
import { index as userIndex } from '@/routes/users';
import { index as millingPeriodsIndex } from '@/routes/MillingPeriods';
import type { NavItem, SharedData } from '@/types';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;

    const isAdmin =
        auth?.user?.role === 'admin' || auth?.user?.role === 'manager';

    const defaultNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
        {
            title: 'Planters',
            href: plantersIndex(),
            icon: User,
        },
        {
            title: 'Haciendas',
            href: haciendasIndex(),
            icon: LandPlot,
        },
        {
            title: 'Productions Final',
            href: productionsIndex(),
            icon: BookOpen,
        },
        {
            title: 'Certifications',
            href: certificationIndex(),
            icon: ShieldCheck,
        },
        {
            title: 'HR',
            href: employeeIndex(),
            icon: Briefcase,
        },
    ];

    const adminNavItems: NavItem[] = [
        {
            title: 'User Management',
            href: userIndex(),
            icon: Clipboard,
        },
        {
            title: 'Milling Periods',
            href: millingPeriodsIndex(),
            icon: DollarSign,
        },
    ];

    const mainNavItems: NavItem[] = [
        ...defaultNavItems,
        ...(isAdmin ? adminNavItems : []),
    ];

    const footerNavItems: NavItem[] = [];
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
