import { Event } from "@/types/event";

interface EventIndicatorsProps {
  dayEvents: Event[];
  dateStr: string;
}

export default function EventIndicators({ dayEvents, dateStr }: EventIndicatorsProps) {
  const maxVisibleEvents = 2;
  const visibleEvents = dayEvents.slice(0, maxVisibleEvents);
  const hiddenCount = dayEvents.length - maxVisibleEvents;

  return (
    <div className="schedule-indicators">
      {visibleEvents.map((event, idx) => {
        const isMultiDay = event.startTime.split('T')[0] !== event.endTime.split('T')[0];
        
        if (isMultiDay) {
          const startDate = new Date(event.startTime);
          const endDate = new Date(event.endTime);
          const currentDate = new Date(dateStr);
          
          const isStart = currentDate.getTime() === startDate.getTime();
          const isEnd = currentDate.getTime() === endDate.getTime();
          const isMiddle = currentDate > startDate && currentDate < endDate;
          
          if (isStart || isMiddle || isEnd) {
            return (
              <div
                key={`event-${idx}`}
                className={`schedule-highlight ${isStart ? 'start' : ''} ${isMiddle ? 'middle' : ''} ${isEnd ? 'end' : ''}`}
                style={{ backgroundColor: event.category.color }}
                title={`${event.title} (${event.startTime.split('T')[0]} ~ ${event.endTime.split('T')[0]})`}
              />
            );
          }
          return null;
        } else {
          return (
            <div
              key={`event-${idx}`}
              className="schedule-dot"
              style={{ backgroundColor: event.category.color }}
              title={`${event.title} (${event.startTime.split('T')[1]})`}
            />
          );
        }
      })}
      
      {hiddenCount > 0 && (
        <span className="more-indicator">+{hiddenCount}</span>
      )}
    </div>
  );
}

