/**
 * calendarSync.js
 * Utility functions for Google Calendar integration and RFC-5545 .ics file downloads.
 */

/**
 * Parses date string (YYYY-MM-DD) and time string (HH:mm or hh:mm AM/PM) into start and end Date objects.
 * Defaults to 45 minutes duration if not specified.
 */
export const parseBookingDates = (dateStr, timeStr, durationMinutes = 45) => {
  if (!dateStr || !timeStr) {
    const now = new Date();
    const end = new Date(now.getTime() + durationMinutes * 60000);
    return { startDate: now, endDate: end };
  }

  // Parse time
  let hours = 0;
  let minutes = 0;

  const timeUpper = timeStr.trim().toUpperCase();
  const is12Hour = timeUpper.includes("AM") || timeUpper.includes("PM");

  if (is12Hour) {
    const isPM = timeUpper.includes("PM");
    const cleanTime = timeUpper.replace(/AM|PM/g, "").trim();
    const parts = cleanTime.split(":");
    hours = parseInt(parts[0], 10) || 0;
    minutes = parseInt(parts[1], 10) || 0;
    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
  } else {
    const parts = timeStr.trim().split(":");
    hours = parseInt(parts[0], 10) || 0;
    minutes = parseInt(parts[1], 10) || 0;
  }

  // Parse date: e.g. YYYY-MM-DD
  const dateParts = dateStr.trim().split("-");
  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1; // 0-indexed
  const day = parseInt(dateParts[2], 10);

  const startDate = new Date(year, month, day, hours, minutes, 0);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

  return { startDate, endDate };
};

/**
 * Formats a Date object into UTC format YYYYMMDDTHHmmssZ for calendar formats
 */
export const formatDateToUtc = (date) => {
  const pad = (num) => String(num).padStart(2, "0");
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
};

const getBaseUrl = () => {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "https://mentorconnect.app";
};

/**
 * Generates 1-click Google Calendar Web Intent URL
 */
export const generateGoogleCalendarUrl = (booking, counterpartEmail = "") => {
  const { startDate, endDate } = parseBookingDates(booking.date, booking.time);
  const startUtc = formatDateToUtc(startDate);
  const endUtc = formatDateToUtc(endDate);

  const baseUrl = getBaseUrl();
  const meetingUrl = booking.meeting_link || `${baseUrl}/video-call`;
  const otherUser = counterpartEmail || booking.mentor_email || booking.mentee_email || "Partner";
  const title = encodeURIComponent(`MentorConnect: Mentorship Session with ${otherUser}`);
  const details = encodeURIComponent(
    `1-on-1 Mentorship session on MentorConnect.\n\n` +
    `Date: ${booking.date}\nTime: ${booking.time}\n` +
    `Participant: ${otherUser}\n` +
    `Meeting Link: ${meetingUrl}\n\n` +
    `Notes: ${booking.meeting_note || "None"}`
  );
  const location = encodeURIComponent(meetingUrl);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startUtc}/${endUtc}&details=${details}&location=${location}`;
};

/**
 * Generates standard RFC-5545 iCalendar (.ics) string
 */
export const generateIcsContent = (booking, counterpartEmail = "") => {
  const { startDate, endDate } = parseBookingDates(booking.date, booking.time);
  const startUtc = formatDateToUtc(startDate);
  const endUtc = formatDateToUtc(endDate);
  const nowUtc = formatDateToUtc(new Date());

  const baseUrl = getBaseUrl();
  const otherUser = counterpartEmail || booking.mentor_email || booking.mentee_email || "Partner";
  const summary = `MentorConnect: Mentorship Session with ${otherUser}`;
  const meetingUrl = booking.meeting_link || `${baseUrl}/video-call`;
  const description = `1-on-1 Mentorship Session via MentorConnect.\\nParticipants: ${booking.mentor_email} and ${booking.mentee_email}\\nMeeting URL: ${meetingUrl}`;
  const uid = `mentorconnect-${booking.id || Date.now()}-${startDate.getTime()}`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MentorConnect//Mentorship Session//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}@mentorconnect.com`,
    `DTSTAMP:${nowUtc}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${meetingUrl}`,
    `URL:${meetingUrl}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder: Upcoming Mentorship Session in 15 minutes",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
};

/**
 * Initiates browser download of .ics calendar file
 */
export const downloadIcsFile = (booking, counterpartEmail = "") => {
  const icsData = generateIcsContent(booking, counterpartEmail);
  const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mentorship-session-${booking.date || "scheduled"}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
