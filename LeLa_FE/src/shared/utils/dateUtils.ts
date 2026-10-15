export function hourInTz(tz = 'Asia/Ho_Chi_Minh', d = new Date()): number {
  return Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone: tz }).format(d));
}

export type Mood = 'sleepy' | 'happy' | 'cheer' | 'idle';

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
  const h = hourInTz(timezone, now);
  const n = name?.trim();
  const who = n ? `, ${n}` : '';

  if (h >= 0 && h <= 4) {
    return { text: `Khuya rồi${who}, học nhẹ rồi đi ngủ nhé!`, mood: 'sleepy' };
  }
  if (h >= 5 && h <= 10) {
    return { text: `Chào buổi sáng${who}! Sẵn sàng học cùng LeLa chưa?`, mood: 'happy' };
  }
  if (h >= 11 && h <= 12) {
    return { text: `Chào buổi trưa${who}! Nghỉ một chút và nạp thêm vài từ vựng nhé.`, mood: 'happy' };
  }
  if (h >= 13 && h <= 17) {
    return { text: `Chào buổi chiều${who}! Giữ vững phong độ học tập nhé.`, mood: 'happy' };
  }
  if (h >= 18 && h <= 21) {
    return { text: `Chào buổi tối${who}! Cùng ôn lại bài hôm nay thôi.`, mood: 'happy' };
  }
  // 22 - 23
  return { text: `Tối muộn rồi${who}, làm vài thẻ nhẹ nhàng trước khi ngủ nhé.`, mood: 'sleepy' };
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
