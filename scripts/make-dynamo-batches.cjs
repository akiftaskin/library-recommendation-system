const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'books.json');
const outDir = __dirname;

function toAttr(v) {
  if (v === null || v === undefined) return undefined;
  if (typeof v === 'string') return { S: v };
  if (typeof v === 'number') return { N: String(v) };
  if (typeof v === 'boolean') return { BOOL: v };
  if (Array.isArray(v)) return { L: v.map(toAttr).filter(Boolean) };
  if (typeof v === 'object') {
    const m = {};
    for (const [k, val] of Object.entries(v)) {
      const a = toAttr(val);
      if (a) m[k] = a;
    }
    return { M: m };
  }
  return { S: String(v) };
}

function toItem(obj) {
  const item = {};
  for (const [k, v] of Object.entries(obj)) {
    const a = toAttr(v);
    if (a) item[k] = a;
  }
  return item;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const books = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
if (!Array.isArray(books)) throw new Error('books.json must be an array');

const batches = chunk(books, 25);

batches.forEach((batch, idx) => {
  const request = {
    Books: batch.map((b) => ({ PutRequest: { Item: toItem(b) } })),
  };
  const outPath = path.join(outDir, `books-batch-${idx + 1}.json`);
  fs.writeFileSync(outPath, JSON.stringify(request, null, 2));
  console.log('Wrote:', outPath, `(${batch.length} items)`);
});

console.log('Done.');
