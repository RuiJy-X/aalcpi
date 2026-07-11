import { Link } from '@inertiajs/react';
import {
    BookOpen,
    Briefcase,
    Clipboard,
    CalendarDays,
    DollarSign,
    LandPlot,
    LayoutGrid,
    Shield,
    ShieldCheck,
    Truck,
    User,
    Users,
} from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain, type NavGroup } from '@/components/nav-main';
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
import { index as employeeIndex } from '@/routes/employees';
import { index as attendanceIndex } from '@/routes/attendance';
import { index as payrollIndex } from '@/routes/payroll';
import { index as haciendasIndex } from '@/routes/haciendas';
import { index as plantersIndex } from '@/routes/planters';
import { index as productionsIndex } from '@/routes/productions';
import { index as userIndex } from '@/routes/users';
import { index as millingPeriodsIndex } from '@/routes/milling-periods';
import { index as bankReconciliationIndex } from '@/routes/bank_reconciliation';
import { index as rolesIndex } from '@/routes/roles';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';
import { useCan } from '@/hooks/use-can';

function optionalItem(
    allowed: boolean,
    item: NavItem,
): NavItem[] {
    return allowed ? [item] : [];
}

export function AppSidebar() {
    const { can } = useCan();

    const dashboardItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
    ];

    const operationsItems: NavItem[] = [
        ...optionalItem(can('planters.view'), {
            title: 'Planters',
            href: plantersIndex(),
            icon: User,
        }),
        ...optionalItem(can('haciendas.view'), {
            title: 'Haciendas',
            href: haciendasIndex(),
            icon: LandPlot,
        }),
        ...optionalItem(can('productions.view'), {
            title: 'Productions',
            href: productionsIndex(),
            icon: BookOpen,
        }),
        ...optionalItem(can('weekly.view'), {
            title: 'Weekly Data',
            href: '/Weekly',
            icon: CalendarDays,
        }),
        ...optionalItem(can('milling_periods.view'), {
            title: 'Milling Periods',
            href: millingPeriodsIndex(),
            icon: ShieldCheck,
        }),
        ...optionalItem(can('bank_reconciliation.view'), {
            title: 'Bank Reconciliation',
            href: bankReconciliationIndex(),
            icon: Truck,
        }),
    ];

    const adminItems: NavItem[] = [
        ...optionalItem(can('employees.view'), {
            title: 'Employees',
            href: employeeIndex(),
            icon: Briefcase,
        }),
        ...optionalItem(can('attendance.view'), {
            title: 'Attendance',
            href: attendanceIndex(),
            icon: Clipboard,
        }),
        ...optionalItem(can('payroll.view'), {
            title: 'Payroll',
            href: payrollIndex(),
            icon: DollarSign,
        }),
        ...optionalItem(can('users.view'), {
            title: 'User Management',
            href: userIndex(),
            icon: Users,
        }),
        ...optionalItem(can('roles.view'), {
            title: 'Role Management',
            href: rolesIndex(),
            icon: Shield,
        }),
    ];

    const groups: NavGroup[] = [
        {
            label: 'Overview',
            items: dashboardItems,
        },
        {
            label: 'Operations',
            items: operationsItems,
        },
        {
            label: 'Administration',
            items: adminItems,
        },
    ].filter((group) => group.items.length > 0);

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
                <NavMain groups={groups} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
