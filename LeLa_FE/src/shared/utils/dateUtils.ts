export type Mood = 'sleepy' | 'happy';

export interface GreetingResult {
  text: string;
  mood: Mood;
}

/**
 * Get greeting based on current hour in user's timezone (default Asia/Ho_Chi_Minh).
 */
export function getGreeting(
  now: Date = new Date(),
  name?: string | null,
  timezone: string = 'Asia/Ho_Chi_Minh'
): GreetingResult {
  let h = now.getHours();

  // If Intl is available, extract the exact hour in the target timezone
  try {
    const hourFormatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: timezone,
    });
    const formattedHour = parseInt(hourFormatter.format(now), 10);
    if (!Number.isNaN(formattedHour)) {
      h = formattedHour;
    }
  } catch {
    // Fallback to local getHours
    h = now.getHours();
  }

  const n = name?.trim();
  const who = n ? `, ${n}` : '';

  if (h < 5) return { text: `Khuya rồi${who}. Học nhẹ một chút rồi đi ngủ nhé!`, mood: 'sleepy' };
  if (h < 11) return { text: `Chào buổi sáng${who}!`, mood: 'happy' };
  if (h < 13) return { text: `Chào buổi trưa${who}!`, mood: 'happy' };
  if (h < 18) return { text: `Chào buổi chiều${who}!`, mood: 'happy' };
  if (h < 22) return { text: `Chào buổi tối${who}!`, mood: 'happy' };
  return { text: `Tối muộn rồi${who}. Ôn vài từ rồi nghỉ ngơi nhé!`, mood: 'sleepy' };
}

/**
 * Format a Date object to YYYY-MM-DD in the target timezone without UTC shift bugs.
 */
export function formatLocalISODate(date: Date, timezone: string = 'Asia/Ho_Chi_Minh'): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: timezone,
    });
    return formatter.format(date); // en-CA produces YYYY-MM-DD
  } catch {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
