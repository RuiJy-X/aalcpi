import { useState, type PropsWithChildren } from 'react';
import { Button } from './ui/button';
import { Maximize2, Minimize2 } from 'lucide-react';

type StatsContainerProps = PropsWithChildren<{
    className?: string;
    label?: string;
}>;

const StatsContainer = ({
    children,
    className,
    label = 'Stats',
}: StatsContainerProps) => {
    const [isMinimized, setIsMinimized] = useState(false);
    return (
        <div
            className={`m-3 flex flex-col gap-2 rounded-md border border-[color:var(--border)] bg-[color:var(--background)] bg-card transition-all ${isMinimized ? 'h-12 px-3 pt-1' : 'p-4'} ${className}`}
        >
            <div className="mb-2 flex w-full items-center">
                <h2 className="text-lg font-semibold tracking-tight text-[color:var(--card-foreground)]">
                    {label}
                </h2>
                <div className="ml-auto">
                    <Button
                        variant={'outline'}
                        size={'icon'}
                        onClick={() => setIsMinimized((v) => !v)}
                        aria-expanded={!isMinimized}
                    >
                        {isMinimized ? (
                            <Maximize2 className="w-5" />
                        ) : (
                            <Minimize2 className="w-5" />
                        )}
                    </Button>
                </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
                {!isMinimized && children}
            </div>
        </div>
    );
};

export default StatsContainer;
