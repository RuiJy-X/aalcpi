import { Link } from '@inertiajs/react';
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
import { index as landsIndex } from '@/routes/lands';
import { index as plantersIndex } from '@/routes/planters';
import { index as productionsIndex } from '@/routes/productions';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
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
        title: 'Lands',
        href: landsIndex(),
        icon: LandPlot,
    },
    {
        title: 'Productions',
        href: productionsIndex(),
        icon: BookOpen,
    },
    {
        title: 'Certifications',
        href: certificationIndex(),
        icon: ShieldCheck,
    },
    {
        title: 'Employees',
        href: employeeIndex(),
        icon: Briefcase,
    },
    // {
    //     title: 'Payroll',
    //     href: '/', // Replace with actual route
    //     icon: DollarSign,
    // },
    // {
    //     title: 'Attendance',
    //     href: '/', // Replace with actual route
    //     icon: Clipboard,
    // },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
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
