// A small, dependency-free CSV reader/writer.
const escapeCsvValue = (value) => {
  const str = value === null || value === undefined ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const arrayToCsv = (columns, rows) => {
  const header = columns.map((c) => escapeCsvValue(c.label)).join(',');
  const body = rows.map((row) => columns.map((c) => escapeCsvValue(c.value(row))).join(',')).join('\n');
  return `${header}\n${body}`;
};

// The reverse of arrayToCsv - handles quoted fields containing commas, and
// "" inside a quoted field meaning a literal quote character.
const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  const pushField = () => { row.push(field); field = ''; };
  const pushRow = () => { pushField(); rows.push(row); row = []; };

  const normalized = text.replace(/\r\n/g, '\n');

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    if (inQuotes) {
      if (char === '"') {
        if (normalized[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      pushField();
    } else if (char === '\n') {
      pushRow();
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) pushRow();

  const [headerRow, ...dataRows] = rows.filter((r) => r.length > 1 || r[0] !== '');
  if (!headerRow) return [];

  const headers = headerRow.map((h) => h.trim());
  return dataRows.map((r) => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (r[i] || '').trim(); });
    return obj;
  });
};

module.exports = { arrayToCsv, parseCsv };
