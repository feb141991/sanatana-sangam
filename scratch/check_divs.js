
import fs from 'fs';

const content = fs.readFileSync('src/app/(main)/kul/KulClient.tsx', 'utf8');
const lines = content.split('\n');
const start = 1439;
const end = 1663;
const sub = lines.slice(start - 1, end).join('\n');

let balance = 0;
let pos = 0;

while (pos < sub.length) {
    if (sub.startsWith('<div', pos)) {
        // Check if self-closing
        let endTag = sub.indexOf('>', pos);
        if (endTag !== -1 && sub[endTag - 1] === '/') {
            // self closing
        } else {
            balance++;
        }
        pos = endTag === -1 ? pos + 4 : endTag + 1;
    } else if (sub.startsWith('</div', pos)) {
        balance--;
        pos += 6;
    } else {
        pos++;
    }
}

console.log('Balance:', balance);
