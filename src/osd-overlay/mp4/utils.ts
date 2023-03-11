/**
 * Convert a date to a time in seconds since 1904-01-01T00:00:00Z, as used by
 * MP4 files.
 * @param date Date to convert. If not provided, the current date is used.
 * @returns Number of seconds since 1904-01-01T00:00:00Z
 */
export function getMp4Time(date?: Date): number {
  if (date === undefined) {
    date = new Date();
  }

  const startDate = new Date("1904-01-01T00:00:00Z");
  const diffSeconds = Math.floor(
    (date.getTime() - startDate.getTime()) / 1000
  );

  return diffSeconds;
}
