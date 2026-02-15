import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import type { User } from '@/types';

export function UserInfo({
    user,
    showEmail = false,
}: {
    user: User;
    showEmail?: boolean;
}) {
    const getInitials = useInitials();

    return (
        <>
            <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-foreground text-white dark:bg-neutral-700">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="group/user grid flex-1 text-left text-sm leading-tight group-data-[state=open]/user:text-white">
                <span className="truncate font-medium text-foreground group-data-[state=open]/user:text-white">
                    {user.name}
                </span>
                {showEmail && (
                    <span className="truncate text-xs text-foreground group-data-[state=open]:text-white">
                        {user.email}
                    </span>
                )}
            </div>
        </>
    );
}
