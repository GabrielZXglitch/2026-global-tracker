
import { TransitionStatus } from '../types';
import { TARGET_DATE_UTC } from '../constants';

export const downloadCalendarEvent = (status: TransitionStatus) => {
  // Calculate the specific UTC time when this country hits 2026
  // Formula: Target (UTC Jan 1 00:00) - Offset (in ms)
  // Example: Kiribati (UTC+14) hits it 14 hours BEFORE UTC.
  const arrivalTime = TARGET_DATE_UTC - (status.offset * 60 * 1000);
  
  const startDate = new Date(arrivalTime);
  const endDate = new Date(arrivalTime + (60 * 60 * 1000)); // Event lasts 1 hour

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const now = new Date();

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Global Horizons//2026 Tracker//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${Date.now()}@2026tracker.app
DTSTAMP:${formatDate(now)}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:New Year 2026 in ${status.country}
DESCRIPTION:Celebrate the arrival of 2026 in ${status.country}! (Timezone: ${status.zone})
LOCATION:${status.country}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `new_year_2026_${status.country.replace(/\s+/g, '_').toLowerCase()}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
