// Rule-based sleep planning — no AI, just honest math: work backward from
// tomorrow's earliest commitment to a recommended bedtime, given a target
// number of sleep hours plus a wind-down buffer.

const BLOCK_START_HOUR = {
  morning: 7,
  afternoon: 13,
  evening: 18,
  anytime: 9, // treat "anytime" tasks as not time-critical; default to a normal wake hour
};

const WIND_DOWN_MINUTES = 30;

// Given tomorrow's tasks, find the earliest hour something is scheduled for.
// morning/afternoon/evening/anytime blocks don't carry exact times in this
// app, so we use each block's typical start hour as a reasonable proxy.
export function earliestCommitmentHour(tomorrowTasks) {
  if (!tomorrowTasks.length) return null;
  const hours = tomorrowTasks
    .filter((t) => t.timeBlock && t.timeBlock !== "anytime")
    .map((t) => BLOCK_START_HOUR[t.timeBlock]);
  if (hours.length === 0) return null;
  return Math.min(...hours);
}

// sleepHoursTarget: desired hours of sleep (default 7.5, a common healthy target)
export function suggestSleepPlan(tomorrowTasks, sleepHoursTarget = 7.5) {
  const wakeHour = earliestCommitmentHour(tomorrowTasks);
  if (wakeHour === null) {
    return {
      hasCommitment: false,
      wakeTime: null,
      bedtime: null,
      sleepHoursTarget,
    };
  }

  const wakeMinutesTotal = wakeHour * 60;
  const bedtimeMinutesTotal =
    (((wakeMinutesTotal - sleepHoursTarget * 60 - WIND_DOWN_MINUTES) % 1440) + 1440) % 1440;

  return {
    hasCommitment: true,
    wakeTime: minutesToLabel(wakeMinutesTotal),
    bedtime: minutesToLabel(bedtimeMinutesTotal),
    sleepHoursTarget,
  };
}

function minutesToLabel(totalMinutes) {
  const h24 = Math.floor(totalMinutes / 60) % 24;
  const m = Math.round(totalMinutes % 60);
  const period = h24 >= 12 ? "PM" : "AM";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}
