export namespace DateUtil {
  export function getStartAndEndOfDayMs(): [number, number] {
    const now = new Date();

    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );

    const startOfDayMs = startOfDay.getTime();
    const endOfDayMs = endOfDay.getTime();

    return [startOfDayMs, endOfDayMs];
  }

  export function getTimePassed(timestamp: number): string {
    const now = Date.now();
    const diffMilliseconds = now - timestamp;
    const diffSeconds = diffMilliseconds / 1000;
    const diffMinutes = diffSeconds / 60;
    const diffHours = diffMinutes / 60;
    const diffDays = diffHours / 24;

    if (diffHours < 1) {
      return `${Math.floor(diffMinutes)} minutes ago`;
    } else if (diffDays < 1) {
      return `${Math.floor(diffHours)} hours ago`;
    } else {
      const past = new Date(timestamp);
      const year = past.getFullYear();
      const month = (past.getMonth() + 1).toString().padStart(2, "0");
      const day = past.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }
}
