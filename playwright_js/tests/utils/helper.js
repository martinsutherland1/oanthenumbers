import * as fs from 'fs';
import path from 'path';

export function saveJSON(filename, data) {
  const filePath = path.resolve(filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`📁 JSON saved → ${filePath}`);
}

export function saveText(filename, text) {
  const filePath = path.resolve(filename);
  fs.writeFileSync(filePath, text, 'utf-8');
  console.log(`📁 Text saved → ${filePath}`);
}

export function saveCSV(filename, rows) {
  const filePath = path.resolve(filename);
  const csv = rows.map(r => r.join(',')).join('\n');
  fs.writeFileSync(filePath, csv, 'utf-8');
  console.log(`📁 CSV saved → ${filePath}`);
}
