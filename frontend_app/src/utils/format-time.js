import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import duration from 'dayjs/plugin/duration';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';

// ----------------------------------------------------------------------

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Docs: https://day.js.org/docs/en/display/format
 */
export const formatStr = {
  dateTime: 'MMM DD YYYY h:mm a', // 17 Apr 2022 12:00 am
  date: 'DD MMM YYYY', // 17 Apr 2022
  time: 'h:mm a', // 12:00 am
  split: {
    dateTime: 'DD/MM/YYYY h:mm a', // 17/04/2022 12:00 am
    date: 'DD/MM/YYYY', // 17/04/2022
  },
  default: {
    dateTime: 'YYYY-MM-DD h:mm a', 
    date: 'YYYY-MM-DD',
  },
  paramCase: {
    dateTime: 'DD-MM-YYYY h:mm a', // 17-04-2022 12:00 am
    date: 'DD-MM-YYYY', // 17-04-2022
  },
};

export function today(format) {
  return dayjs(new Date()).startOf('day').format(format);
}

// ----------------------------------------------------------------------

export function fDuration(startDate, endDate) {
  const elapsed = dayjs(startDate).to(dayjs(endDate).add(1, 'day'), true);
  return elapsed
    .replace('a few seconds', '1 day')
    .replace('a minute', '1 minute')
    .replace('an hour', '1 hour')
    .replace('a month', '1 month')
    .replace('a day', '1 day')
    .replace('a year', '1 year');
}

export function fDurationInFormat(startDate, endDate) {
  const start = dayjs(startDate);
  const end = dayjs(endDate);

  const years = end.diff(start, 'year');
  start.add(years, 'year');
  const months = end.diff(start, 'month');
  start.add(months, 'month');
  const days = end.diff(start, 'day');
  start.add(days, 'day');
  const hours = end.diff(start, 'hour');
  start.add(hours, 'hour');
  const minutes = end.diff(start, 'minute');
  start.add(minutes, 'minute');
  const seconds = end.diff(start, 'second');

  const result = [];
  if (years > 0) {
    result.push(`${years} year${years > 1 ? 's' : ''}`);
  }
  if (months > 0) {
    result.push(`${months} month${months > 1 ? 's' : ''}`);
  }
  if (days > 0) {
    result.push(`${days} day${days > 1 ? 's' : ''}`);
  }
  if (hours > 0) {
    result.push(`${hours} hr${hours > 1 ? 's' : ''}`);
  }
  if (minutes > 0) {
    result.push(`${minutes} min${minutes > 1 ? 's' : ''}`);
  }
  if (seconds > 0) {
    result.push(`${seconds} sec${seconds > 1 ? 's' : ''}`);
  }

  return result.join(' ');
}

export function fDurationFormatted(durationObj) {
  const years = durationObj.years();
  const months = durationObj.months();
  const days = durationObj.days();
  const hours = durationObj.hours();
  const minutes = durationObj.minutes();
  const seconds = durationObj.seconds();

  const result = [];

  if (years > 0) {
    result.push(`${years} year${years > 1 ? 's' : ''}`);
  }
  if (months > 0) {
    result.push(`${months} month${months > 1 ? 's' : ''}`);
  }
  if (days > 0) {
    result.push(`${days} day${days > 1 ? 's' : ''}`);
  }
  if (hours > 0) {
    result.push(`${hours} hr${hours > 1 ? 's' : ''}`);
  }
  if (minutes > 0) {
    result.push(`${minutes} min${minutes > 1 ? 's' : ''}`);
  }
  // if (seconds > 0) {
  //   result.push(`${seconds} sec${seconds > 1 ? 's' : ''}`);
  // }

  return result.slice(0, 3).join(' ');
}

// ----------------------------------------------------------------------

export function fAverageDuration(arrayDates) {
  if (!arrayDates || arrayDates.length === 0) {
    return null;
  }

  const totalDuration = arrayDates.reduce((total, { startDate, endDate }) => {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const diff = end.diff(start);
    return total + diff;
  }, 0);

  const averageDuration = totalDuration / arrayDates.length;

  const durationObj = dayjs.duration(averageDuration);

  return fDurationFormatted(durationObj);
}

export function fTypeDuration(arrayDates, typeDuration) {
  if (!arrayDates || arrayDates.length === 0) {
    return null;
  }

  let selectedDuration = null; // <-- Mucho mejor que 0 para distinguir sin errores

  arrayDates.forEach(({ startDate, endDate }) => {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const diff = end.diff(start); // ms

    // === Si estamos buscando el MINIMO ===
    if (typeDuration === 'min') {
      // ignorar valores menores a 1 hora (3600000 ms)
      if (diff < 3600000) return;

      // si aún no hay uno o este es menor, tomarlo
      if (selectedDuration === null || diff < selectedDuration) {
        selectedDuration = diff;
      }

      return;
    }

    // === Si estamos buscando el MAXIMO ===
    if (typeDuration === 'max') {
      if (selectedDuration === null || diff > selectedDuration) {
        selectedDuration = diff;
      }
    }
  });

  // Si no se encontró un valor válido para min (todos < 1 min)
  if (selectedDuration === null) {
    return null;
  }

  const durationObj = dayjs.duration(selectedDuration);

  return fDurationFormatted(durationObj);
}


export function fDurationStats(arrayDates) {
  if (!arrayDates || arrayDates.length === 0) {
    return {
      averageDuration: null,
      minDuration: null,
      maxDuration: null,
    };
  }

  let totalDuration = 0;       // suma de todos los diff
  let count = 0;               // por si algún registro invalido lo saltamos
  let minDurationMs = null;    // solo duraciones < 1h
  let maxDurationMs = null;    // cualquier duración
  let minProjectId = null;
  let maxProjectId = null;
  let minProjectName = null;
  let maxProjectName = null;
  let minProjectNumber = null;
  let maxProjectNumber = null;

  arrayDates.forEach(({ startDate, endDate, id, name, number }) => {
    const start = dayjs(startDate);
    const end = dayjs(endDate);

    if (!start.isValid() || !end.isValid()) return;

    const diff = end.diff(start); // milisegundos

    // acumulamos para el promedio
    totalDuration += diff;
    count += 1;

    // MAX normal
    if (maxDurationMs === null || diff > maxDurationMs) {
      maxDurationMs = diff;
      maxProjectId = id;
      maxProjectName = name;
      maxProjectNumber = number;
    }

    // MIN solo si es < 1 hora (3600000 ms)
    if (diff >= 3600000) {
      if (minDurationMs === null || diff < minDurationMs) {
        minDurationMs = diff;
        minProjectId = id;
        minProjectName = name;
        minProjectNumber = number;
      }
    }
  });

  // si no hubo ni un registro válido
  if (count === 0) {
    return {
      averageDuration: null,
      minDuration: null,
      maxDuration: null,
      minProjectId: null,
      maxProjectId: null,
      minProjectName: null,
      maxProjectName: null,
      minProjectNumber: null,
      maxProjectNumber: null,
    };
  }

  // promedio
  const averageDuration =
    totalDuration > 0
      ? fDurationFormatted(dayjs.duration(totalDuration / count))
      : null;

  // min y max formateados
  const minDuration =
    minDurationMs !== null
      ? fDurationFormatted(dayjs.duration(minDurationMs))
      : null;

  const maxDuration =
    maxDurationMs !== null
      ? fDurationFormatted(dayjs.duration(maxDurationMs))
      : null;

  return {
    averageDuration,
    minDuration,
    maxDuration,
    minProjectId,
    maxProjectId,
    minProjectName,
    maxProjectName,
    minProjectNumber,
    maxProjectNumber,
  };
}



// ----------------------------------------------------------------------

/** output: Apr 17 2022 12:00 am
 */
export function fDateTime(date, format, timeZone = dayjs.tz.guess()) {
  if (!date) {
    return null;
  }

  const isValid = dayjs(date).isValid();

  return isValid ? dayjs(date).tz(timeZone).format(format ?? formatStr.dateTime) : 'Invalid time value';
}

// ----------------------------------------------------------------------

/** output: 17 Apr 2022
 */
export function fDate(date, format) {
  if (!date) {
    return null;
  }

  const isValid = dayjs(date).isValid();

  return isValid ? dayjs(date).format(format ?? formatStr.date) : 'Invalid time value';
}

// ----------------------------------------------------------------------

/** output: 12:00 am
 */
export function fTime(date, format) {
  if (!date) {
    return null;
  }

  const isValid = dayjs(date).isValid();

  return isValid ? dayjs(date).format(format ?? formatStr.time) : 'Invalid time value';
}

// ----------------------------------------------------------------------

/** output: 1713250100
 */
export function fTimestamp(date) {
  if (!date) {
    return null;
  }

  const isValid = dayjs(date).isValid();

  return isValid ? dayjs(date).valueOf() : 'Invalid time value';
}

// ----------------------------------------------------------------------

/** output: a few seconds, 2 years
 */
export function fToNow(date) {
  if (!date) {
    return null;
  }

  const isValid = dayjs(date).isValid();

  const timeZone = dayjs.tz.guess()

  return isValid ? dayjs(date).tz(timeZone).toNow(true) : 'Invalid time value';
}

// ----------------------------------------------------------------------

/** output: boolean
 */
export function fIsBetween(inputDate, startDate, endDate) {
  if (!inputDate || !startDate || !endDate) {
    return false;
  }

  endDate = dayjs(endDate).endOf('day');

  const formattedInputDate = fTimestamp(inputDate);
  const formattedStartDate = fTimestamp(startDate);
  const formattedEndDate = fTimestamp(endDate);

  if (formattedInputDate && formattedStartDate && formattedEndDate) {
    return formattedInputDate >= formattedStartDate && formattedInputDate <= formattedEndDate;
  }

  return false;
}

// ----------------------------------------------------------------------

/** output: boolean
 */
export function fIsAfter(startDate, endDate, tz = dayjs.tz.guess()) {
  if (startDate === null) {
    startDate = dayjs.tz(endDate, tz).subtract(1, 'day');
  }
  return dayjs.tz(startDate, tz).isAfter(dayjs.tz(endDate, tz));
}

// ----------------------------------------------------------------------

/** output: boolean
 */
export function fIsSame(startDate, endDate, units) {
  if (!startDate || !endDate) {
    return false;
  }

  const isValid = dayjs(startDate).isValid() && dayjs(endDate).isValid();

  if (!isValid) {
    return 'Invalid time value';
  }

  return dayjs(startDate).isSame(endDate, units ?? 'year');
}

// ----------------------------------------------------------------------

/** output:
 * Same day: 26 Apr 2024
 * Same month: 25 - 26 Apr 2024
 * Same month: 25 - 26 Apr 2024
 * Same year: 25 Apr - 26 May 2024
 */
export function fDateRangeShortLabel(startDate, endDate, initial) {
  const isValid = dayjs(startDate).isValid() && dayjs(endDate).isValid();

  const isAfter = fIsAfter(startDate, endDate);

  if (!isValid || isAfter) {
    return 'Invalid time value';
  }

  let label = `${fDate(startDate)} - ${fDate(endDate)}`;

  if (initial) {
    return label;
  }

  const isSameYear = fIsSame(startDate, endDate, 'year');
  const isSameMonth = fIsSame(startDate, endDate, 'month');
  const isSameDay = fIsSame(startDate, endDate, 'day');

  if (isSameYear && !isSameMonth) {
    label = `${fDate(startDate, 'DD MMM')} - ${fDate(endDate)}`;
  } else if (isSameYear && isSameMonth && !isSameDay) {
    label = `${fDate(startDate, 'DD')} - ${fDate(endDate)}`;
  } else if (isSameYear && isSameMonth && isSameDay) {
    label = `${fDate(endDate)}`;
  }

  return label;
}


export function fDateShortLabel(date, initial) {
  const isValid = dayjs(date).isValid();

  if (!isValid) {
    return 'Invalid time value';
  }

  const label = `${fDate(date)}`;

  return label;
}


/** output: '2024-05-28T05:55:31+00:00'
 */
export function fAdd({
  years = 0,
  months = 0,
  days = 0,
  hours = 0,
  minutes = 0,
  seconds = 0,
  milliseconds = 0,
}) {
  const result = dayjs()
    .add(
      dayjs.duration({
        years,
        months,
        days,
        hours,
        minutes,
        seconds,
        milliseconds,
      })
    )
    .format();

  return result;
}

/** output: '2024-05-28T05:55:31+00:00'
 */
export function fSub({
  years = 0,
  months = 0,
  days = 0,
  hours = 0,
  minutes = 0,
  seconds = 0,
  milliseconds = 0,
}) {
  const result = dayjs()
    .subtract(
      dayjs.duration({
        years,
        months,
        days,
        hours,
        minutes,
        seconds,
        milliseconds,
      })
    )
    .format();

  return result;
}

// ----------------------------------------------------------------------

export function getDatesBetween(startDate, endDate, format = 'YYYY-MM-DD') {
  const dates = [];
  let current = dayjs(startDate);
  const last = dayjs(endDate);

  // console.log(current, last);
  
  while (current.isBefore(last, 'day') || current.isSame(last, 'day')) {
    dates.push(current.format(format));
    current = current.add(1, 'day');
  }
  return dates;
}
