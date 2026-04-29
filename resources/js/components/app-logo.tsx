import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="stext-sidebar-primary-foreground flex h-9 w-9 items-center justify-center rounded-md">
                <AppLogoIcon className="h-full w-full fill-current" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    AALCPI MIS
                </span>
            </div>
        </>
    );
}
