export function toCSV(rows: Record<string, any>[], options?: { headers?: string[]; delimiter?: string }): string {
  const delimiter = options?.delimiter ?? ',';
  if (!rows || rows.length === 0) return '';

  // Build union of keys deterministically
  const headerSet: Set<string> = new Set<string>();
  for (const row of rows) {
    for (const k of Object.keys(row)) headerSet.add(k);
  }
  const headers = options?.headers ?? Array.from(headerSet);

  const escape = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    let s = typeof val === 'string' ? val : typeof val === 'object' ? JSON.stringify(val) : String(val);
    // Normalize newlines
    s = s.replace(/\r\n|\r|\n/g, '\n');
    // Escape quotes by doubling them and wrap with quotes if needed
    const needsQuotes = s.includes(delimiter) || s.includes('"') || s.includes('\n');
    if (needsQuotes) {
      s = '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };

  const headerLine = headers.map(escape).join(delimiter);
  const lines = rows.map((row) => headers.map((h) => escape((row as any)[h])).join(delimiter));
  return [headerLine, ...lines].join('\n');
}
