import AppLogoIcon from './app-logo-icon';
import { Badge } from '@/components/ui/badge';
import { usePage } from '@inertiajs/react';
import type { SharedData } from '@/types';

export default function AppLogo() {
    const { name, appVersion } = usePage<SharedData>().props;
    const appName = name || 'AALCPI MIS';
    const version = appVersion ?? '1.5.0';
    const formattedVersion = version.startsWith('v') ? version : `v${version}`;

    return (
        <>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white/90 p-0.5 shadow-xs dark:bg-zinc-800">
                <AppLogoIcon className="h-full w-full object-contain" />
            </div>
            <div className="ml-1.5 flex flex-1 items-center gap-1.5 overflow-hidden text-left text-sm">
                <span className="truncate leading-tight font-bold text-foreground">
                    {appName}
                </span>
                <Badge
                    variant="secondary"
                    className="h-4.5 shrink-0 px-1.5 py-0 text-[10px] font-semibold tracking-wider text-black uppercase"
                >
                    {formattedVersion}
                </Badge>
            </div>
        </>
    );
}
