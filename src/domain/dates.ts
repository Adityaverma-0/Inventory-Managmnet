// WHY: single shared date formatting so every admin screen shows the same
// Asia/Kolkata calendar date and submitted time, and so tests exercise the
// real code (a copied helper once hid a broken one).

// Accepts: millisecond epoch (number or numeric string), ISO datetime string,
// and second-epoch timestamps. Returns 'N/A' for empty, 'Invalid Date' for
// unparseable input.
export function formatDateTimeIST(val: unknown): string {
  if (val === null || val === undefined || val === '') return 'N/A';
  let ms: number;
  if (typeof val === 'number' || (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val)))) {
    const n = Number(val);
    // WHY: some older payloads store epoch SECONDS (10 digits), not ms.
    ms = n < 1e12 ? n * 1000 : n;
  } else {
    ms = new Date(String(val)).getTime();
  }
  const d = new Date(ms);
  if (isNaN(d.getTime())) return 'Invalid Date';
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

// WHY: calendar dates are plain 'YYYY-MM-DD' strings; parse as UTC noon so
// the Asia/Kolkata wall date always matches the stored date.
export function formatCalendarDateIST(val: unknown): string {
  if (!val) return 'N/A';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(val));
  if (!match) return String(val);
  const d = new Date(Date.UTC(+match[1], +match[2] - 1, +match[3], 12));
  return d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
  });
}
