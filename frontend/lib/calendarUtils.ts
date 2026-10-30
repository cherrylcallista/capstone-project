export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getHourFromOffset(offsetY: number, halfHourHeight: number) {
  return Math.min(23.5, Math.max(0, Math.floor(offsetY / halfHourHeight) / 2));
}

export function formatTime(hour: number) {
  const minutes = Math.round(hour * 60);
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export function formatDuration(hours: number) {
  if (hours % 1 === 0) return `${hours} jam`;
  const wholeHours = Math.floor(hours);
  return wholeHours > 0 ? `${wholeHours} jam 30 menit` : '30 menit';
}
