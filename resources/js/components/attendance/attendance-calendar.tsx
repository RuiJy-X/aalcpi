import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventContentArg, EventInput } from '@fullcalendar/core';

type AttendanceCalendarProps = {
    events: EventInput[];
};

const AttendanceCalendar = ({ events }: AttendanceCalendarProps) => {
    const renderEventContent = ({ event }: EventContentArg) => {
        const isHoliday = Boolean(event.extendedProps?.isHoliday);

        if (isHoliday) {
            const hType = event.extendedProps?.type;
            const hName = event.extendedProps?.name ?? event.title;
            const isRegular = hType === 'regular';

            return (
                <div
                    className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-tight shadow-xs ${
                        isRegular
                            ? 'border border-amber-500/40 bg-amber-500/15 text-amber-900 dark:text-amber-200'
                            : 'border border-indigo-500/40 bg-indigo-500/15 text-indigo-900 dark:text-indigo-200'
                    }`}
                >
                    <span>{isRegular ? '🎉' : '⭐'}</span>
                    <span className="truncate">{hName}</span>
                </div>
            );
        }

        const names = (event.extendedProps?.names ?? []) as string[];
        const displayNames = names.slice(0, 3);
        const remaining = Math.max(names.length - displayNames.length, 0);

        return (
            <div className="flex flex-wrap gap-0.5 rounded bg-background/80 p-0.5">
                {displayNames.map((name) => (
                    <span
                        key={name}
                        className="rounded bg-emerald-100 px-1 py-0.5 text-[9px] font-semibold leading-none text-emerald-950 dark:bg-emerald-950/80 dark:text-emerald-300"
                    >
                        {name}
                    </span>
                ))}
                {remaining > 0 && (
                    <span className="rounded bg-muted px-1 py-0.5 text-[9px] font-semibold leading-none text-muted-foreground">
                        +{remaining}
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className="compact-calendar-wrapper rounded-lg border border-border/80 bg-card p-2 shadow-xs">
            <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: '',
                }}
                events={events}
                contentHeight={350}
                dayMaxEvents={2}
                selectable={false}
                editable={false}
                eventClassNames={() => ['border-0', 'p-0', 'shadow-none']}
                eventContent={renderEventContent}
            />
        </div>
    );
};

export default AttendanceCalendar;
