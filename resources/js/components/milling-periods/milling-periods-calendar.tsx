import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth';
import type {
    DateSelectArg,
    EventClickArg,
    EventContentArg,
    EventInput,
} from '@fullcalendar/core';

type MillingPeriodsCalendarProps = {
    events: EventInput[];
    onDateSelect?: (selection: DateSelectArg) => void;
    onEventClick?: (event: EventClickArg) => void;
};

export default function MillingPeriodsCalendar({
    events,
    onDateSelect,
    onEventClick,
}: MillingPeriodsCalendarProps) {
    const renderEventContent = ({ event }: EventContentArg) => {
        const weekNo = event.extendedProps?.week_no;
        const cropYear = event.extendedProps?.crop_year;
        const sugarPrice = event.extendedProps?.sugar_price;
        const molPrice = event.extendedProps?.mol_price;

        return (
            <div
                className="flex w-full items-center justify-between gap-1 overflow-hidden rounded bg-emerald-600 px-1.5 py-0.5 text-[11px] font-medium text-white shadow-xs hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                title={event.title}
            >
                <span className="truncate font-bold">
                    {weekNo ? `Wk ${weekNo}${cropYear ? ` (${cropYear})` : ''}` : event.title}
                </span>
                {sugarPrice !== undefined && molPrice !== undefined && (
                    <span className="hidden text-[10px] font-normal opacity-90 md:inline">
                        ₱{Number(sugarPrice).toFixed(0)} / ₱{Number(molPrice).toFixed(0)}
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className="rounded-lg border border-border/80 bg-card p-3 shadow-xs [&_.fc-button]:h-8 [&_.fc-button]:px-2.5 [&_.fc-button]:text-xs [&_.fc-col-header-cell]:py-1 [&_.fc-col-header-cell]:text-xs [&_.fc-daygrid-day-number]:p-1 [&_.fc-daygrid-day-number]:text-xs [&_.fc-toolbar-title]:text-sm [&_.fc-toolbar-title]:font-bold sm:[&_.fc-toolbar-title]:text-base">
            <FullCalendar
                plugins={[
                    dayGridPlugin,
                    timeGridPlugin,
                    multiMonthPlugin,
                    interactionPlugin,
                ]}
                initialView="dayGridMonth"
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,multiMonthYear',
                }}
                events={events}
                contentHeight={380}
                dayMaxEvents={2}
                selectable
                editable={false}
                selectMirror
                select={onDateSelect}
                eventClick={onEventClick}
                eventContent={renderEventContent}
            />
        </div>
    );
}
