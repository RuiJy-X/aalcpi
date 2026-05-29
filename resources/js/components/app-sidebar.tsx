import { Link } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import {
    BookOpen,
    Briefcase,
    Clipboard,
    CalendarDays,
    DollarSign,
    LandPlot,
    LayoutGrid,
    ShieldCheck,
    Truck,
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
import { index as employeeIndex } from '@/actions/App/Http/Controllers/EmployeeController';
import { index as haciendasIndex } from '@/routes/haciendas';
import { index as plantersIndex } from '@/routes/planters';
import { index as productionsIndex } from '@/routes/productions';
import { index as userIndex } from '@/routes/users';
import { index as millingPeriodsIndex } from '@/routes/MillingPeriods';
import type { NavItem, SharedData } from '@/types';
import AppLogo from './app-logo';

import { index as attendanceIndex } from '@/routes/attendance';
import { index as payrollIndex } from '@/routes/payroll';

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
            title: 'Productions',
            href: productionsIndex(),
            icon: BookOpen,
        },
        {
            title: 'Weekly Data',
            href: '/Weekly',
            icon: CalendarDays,
        },
    ];

    const adminNavItems: NavItem[] = [
        {
            title: 'Employees',
            href: employeeIndex(),
            icon: Briefcase,
        },
        {
            title: 'Attendance',
            href: attendanceIndex(),
            icon: Clipboard,
        },
        {
            title: 'Payroll',
            href: payrollIndex(),
            icon: DollarSign,
        },

        // {
        //     title: 'User Management',
        //     href: userIndex(),
        //     icon: Clipboard,
        // },
        {
            title: 'Milling Periods',
            href: millingPeriodsIndex(),
            icon: ShieldCheck,
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
