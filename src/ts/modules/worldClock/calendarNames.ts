let originalMonthNames: Record<string, string> | undefined;
let originalWeekdayNames: Record<string, string> | undefined;

export function applyCustomCalendarNames(): void {
  originalMonthNames = { ...CONFIG.PF2E.worldClock.AR.Months };
  originalWeekdayNames = { ...CONFIG.PF2E.worldClock.AR.Weekdays };

  Object.assign(CONFIG.PF2E.worldClock.AR.Months, {
    January: "January",
    February: "February",
    March: "March",
    April: "April",
    May: "May",
    June: "June",
    July: "July",
    August: "August",
    September: "September",
    October: "October",
    November: "November",
    December: "December",
  });

  Object.assign(CONFIG.PF2E.worldClock.AR.Weekdays, {
    Sunday: "Sunday",
    Monday: "Monday",
    Tuesday: "Tuesday",
    Wednesday: "Wednesday",
    Thursday: "Thursday",
    Friday: "Friday",
    Saturday: "Saturday",
  });
}

export function restoreOriginalCalendarNames(): void {
  if (!originalMonthNames) return;
  Object.assign(CONFIG.PF2E.worldClock.AR.Months, originalMonthNames);
  originalMonthNames = undefined;

  if (!originalWeekdayNames) return;
  Object.assign(CONFIG.PF2E.worldClock.AR.Weekdays, originalWeekdayNames);
  originalWeekdayNames = undefined;
}
