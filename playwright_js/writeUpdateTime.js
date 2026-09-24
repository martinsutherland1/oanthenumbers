import * as fs from 'fs';
import path from 'path';

// Records when data was last collected so the app can show it in the footer
const filePath = path.resolve('../oanthenumberapp/src/data/data_update.json');

fs.mkdirSync(path.dirname(filePath), { recursive: true });
fs.writeFileSync(filePath, JSON.stringify({ updateTime: new Date().toISOString() }, null, 2) + '\n', 'utf-8');
console.log(`🕒 Update time saved → ${filePath}`);
