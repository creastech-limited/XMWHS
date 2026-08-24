// src/components/shared/CalendarWidget.tsx
import React, { useEffect, useRef } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { FaCalendarAlt } from 'react-icons/fa';

interface CalendarWidgetProps {
  value: Date;
  onChange: (value: Date) => void;
  className?: string;
}

const calendarStyles = `
  .react-calendar {
    background: white;
    border: none !important;
    font-family: inherit;
  }
  
  .react-calendar__navigation {
    background: #6366f1;
    margin-bottom: 1em;
    border-radius: 0.5rem 0.5rem 0 0;
  }
  
  .react-calendar__navigation button {
    color: white;
    font-weight: 600;
    font-size: 1rem;
    background: none;
    border: none;
    padding: 0.75rem;
  }
  
  .react-calendar__navigation button:hover {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 0.25rem;
  }
  
  .react-calendar__month-view__weekdays {
    background: #f8fafc;
    padding: 0.5rem 0;
  }
  
  .react-calendar__month-view__weekdays__weekday {
    color: #6366f1;
    font-weight: 600;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .react-calendar__tile {
    background: white;
    border: 1px solid #e2e8f0;
    color: #374151;
    font-weight: 500;
    padding: 0.75rem 0.5rem;
    transition: all 0.2s ease;
  }
  
  .react-calendar__tile:hover {
    background: #ede9fe;
    color: #6366f1;
    transform: scale(1.05);
  }
  
  .react-calendar__tile--active {
    background: #6366f1 !important;
    color: white !important;
    border-color: #6366f1;
  }
  
  .react-calendar__tile--now {
    background: #fef3c7;
    color: #d97706;
    border-color: #f59e0b;
  }
  
  .react-calendar__tile--now:hover {
    background: #fde68a;
  }
`;

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    if (!styleRef.current) {
      const styleElement = document.createElement('style');
      styleElement.textContent = calendarStyles;
      document.head.appendChild(styleElement);
      styleRef.current = styleElement;
    }
    return () => {
      if (styleRef.current) {
        document.head.removeChild(styleRef.current);
        styleRef.current = null;
      }
    };
  }, []);

  const handleChange = (newValue: Date | Date[] | null) => {
    if (newValue instanceof Date) {
      onChange(newValue);
    } else if (Array.isArray(newValue) && newValue.length > 0 && newValue[0] instanceof Date) {
      onChange(newValue[0]);
    }
  };

  return (
    <div className={`bg-white rounded-lg p-6 shadow-sm border border-gray-100 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">School Calendar</h3>
        <div className="p-2 rounded-full bg-indigo-100 text-indigo-600">
          <FaCalendarAlt className="text-sm" />
        </div>
      </div>
      <div className="flex justify-center">
        <Calendar
          onChange={handleChange as any}
          value={value}
          className="react-calendar rounded-lg w-full shadow-sm"
        />
      </div>
    </div>
  );
};