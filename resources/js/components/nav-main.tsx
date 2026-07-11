import { Link, usePage } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { toUrl } from '@/lib/utils';
import type { NavItem } from '@/types';

export type NavGroup = {
    label?: string;
    items: NavItem[];
};

function NavGroupSection({
    label,
    items,
}: {
    label?: string;
    items: NavItem[];
}) {
    const { isCurrentUrl } = useCurrentUrl();
    const page = usePage();
    const currentUrlPath = new URL(page.url, window?.location.origin).pathname;

    if (items.length === 0) {
        return null;
    }

    return (
        <SidebarGroup className="min-w-0 px-2 py-0">
            {label ? <SidebarGroupLabel>{label}</SidebarGroupLabel> : null}
            <SidebarMenu className="min-w-0">
                {items.map((item) => (
                    <SidebarMenuItem key={item.title} className="min-w-0">
                        <SidebarMenuButton
                            asChild
                            isActive={
                                currentUrlPath.includes(
                                    String(toUrl(item.href)),
                                ) || isCurrentUrl(item.href, currentUrlPath)
                            }
                            tooltip={{ children: item.title }}
                        >
                            <Link href={item.href} prefetch className="min-w-0">
                                {item.icon && <item.icon />}
                                <span className="truncate">{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}

export function NavMain({
    groups = [],
    items = [],
}: {
    groups?: NavGroup[];
    /** @deprecated Prefer `groups` for multi-section sidebars */
    items?: NavItem[];
}) {
    if (groups.length > 0) {
        const visibleGroups = groups.filter((group) => group.items.length > 0);

        return (
            <>
                {visibleGroups.map((group, index) => (
                    <div
                        key={group.label ?? `group-${index}`}
                        className="min-w-0 w-full"
                    >
                        {index > 0 && (
                            <SidebarSeparator className="my-2" />
                        )}
                        <NavGroupSection
                            label={group.label}
                            items={group.items}
                        />
                    </div>
                ))}
            </>
        );
    }

    return <NavGroupSection label="Main Menu" items={items} />;
}
