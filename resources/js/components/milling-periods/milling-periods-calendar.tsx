import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth';
import type { DateSelectArg, EventClickArg, EventInput } from '@fullcalendar/core';

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
    return (
        <div className="rounded-lg border border-border/80 bg-card p-3 shadow-sm max-h-150 overflow-y-auto p-2">
            <FullCalendar
                plugins={[multiMonthPlugin, dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
              
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'multiMonthYear,dayGridMonth,timeGridWeek,timeGridDay',
                }}
                events={events}
                selectable
                editable={false}
                selectMirror
                dayMaxEvents
                height="auto"
                select={onDateSelect}
                eventClick={onEventClick}
                eventColor='#148c1a'
            />
        </div>
    );
}
