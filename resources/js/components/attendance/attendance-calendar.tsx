import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventContentArg, EventInput } from '@fullcalendar/core';

type AttendanceCalendarProps = {
    events: EventInput[];
};

const AttendanceCalendar = ({ events }: AttendanceCalendarProps) => {
    const renderEventContent = ({ event }: EventContentArg) => {
        const names = (event.extendedProps?.names ?? []) as string[];
        const displayNames = names.slice(0, 4);
        const remaining = Math.max(names.length - displayNames.length, 0);

        return (
            <div className="flex flex-wrap gap-1 rounded bg-white/80 p-1">
                {displayNames.map((name) => (
                    <span
                        key={name}
                        className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] leading-none font-medium text-black"
                    >
                        {name}
                    </span>
                ))}
                {remaining > 0 && (
                    <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] leading-none font-medium text-slate-700">
                        +{remaining} more
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className="rounded-lg border border-border/80 bg-card p-3 shadow-sm">
            <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth',
                }}
                events={events}
                height="auto"
                dayMaxEvents
                selectable={false}
                editable={false}
                eventClassNames={() => ['border-0', 'p-0', 'shadow-none']}
                eventContent={renderEventContent}
            />
        </div>
    );
};

export default AttendanceCalendar;
