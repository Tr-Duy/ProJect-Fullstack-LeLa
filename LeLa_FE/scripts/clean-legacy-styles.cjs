const fs = require('fs');
const path = require('path');

let totalFixed = 0;
const changedFiles = [];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  const isAiFile = filePath.includes('voice-conversation') || filePath.includes('ai-chat');

  // 1. Blue hex colors
  content = content.replace(/#(1F5BFF|1d5cff|1544C9|0B2E99)/gi, 'var(--brand)');
  content = content.replace(/#(1677ff|2563eb|3b82f6)/gi, 'var(--brand)');
  content = content.replace(/\b(text|bg|border)-geist-blue-([0-9]+)\b/g, (match, type, num) => {
    if (type === 'text') return 'text-[var(--brand-700)]';
    if (type === 'bg') return Number(num) <= 200 ? 'bg-[var(--brand-50)]' : 'bg-[var(--brand)]';
    return 'border-[var(--brand-100)]';
  });

  // 2. Blue Tailwind classes
  if (isAiFile) {
    content = content.replace(/\btext-blue-([0-9]+)\b/g, 'text-[var(--teal)]');
    content = content.replace(/\bbg-blue-50\b/g, 'bg-[var(--teal-50)]');
    content = content.replace(/\bbg-blue-([0-9]+)\b/g, 'bg-[var(--teal)]');
    content = content.replace(/\bborder-blue-([0-9]+)\b/g, 'border-[var(--teal)]/20');
  } else {
    content = content.replace(/\btext-blue-([6-9][0-9]*)\b/g, 'text-[var(--brand-700)]');
    content = content.replace(/\btext-blue-([1-5][0-9]*)\b/g, 'text-[var(--brand)]');
    content = content.replace(/\bbg-blue-50\b/g, 'bg-[var(--brand-50)]');
    content = content.replace(/\bbg-blue-100\b/g, 'bg-[var(--brand-100)]');
    content = content.replace(/\bbg-blue-([2-9][0-9]*)\b/g, 'bg-[var(--brand)]');
    content = content.replace(/\bborder-blue-([0-9]+)\b/g, 'border-[var(--border)]');
    content = content.replace(/\bfocus:ring-blue-([0-9]+)\b/g, 'focus:ring-[var(--brand)]');
    content = content.replace(/\bselection:bg-geist-blue-200\b/g, 'selection:bg-[var(--brand-100)]');
    content = content.replace(/\bfocus-visible:ring-geist-blue-700\b/g, 'focus-visible:ring-[var(--brand)]');
    content = content.replace(/\bfocus:ring-geist-blue-700\b/g, 'focus:ring-[var(--brand)]');
  }

  // 3. Indigo/Sky
  if (isAiFile) {
    content = content.replace(/\bfrom-indigo-600 to-violet-500\b/g, 'from-[var(--teal)] to-[var(--teal)]/80');
    content = content.replace(/\bhover:from-indigo-500 hover:to-violet-400\b/g, 'hover:brightness-110');
    content = content.replace(/\bshadow-\[0_0_25px_rgba\(99,102,241,0\.6\)\]\b/g, 'shadow-[var(--shadow-md)]');
  } else {
    content = content.replace(/\b(text|bg|border)-indigo-[a-z0-9]+/g, 'text-[var(--brand-700)]');
    content = content.replace(/\b(text|bg|border)-sky-[a-z0-9]+/g, 'text-[var(--brand-700)]');
  }

  // 4. Black borders
  content = content.replace(/border-\[[1-9]+px\] border-black/g, 'border border-[var(--border)]');
  content = content.replace(/border-\[[0-9.]+px\] border-black/g, 'border border-[var(--border)]');
  content = content.replace(/\b\[&_\.ant-modal-content\]:!border-\[[0-9]+px\]\s+\[&_\.ant-modal-content\]:!border-black/g, '[&_.ant-modal-content]:!border [&_.ant-modal-content]:!border-[var(--border)]');
  content = content.replace(/\b\[&_\.ant-tabs-nav::before\]:!border-b-\[[0-9]+px\]\s+\[&_\.ant-tabs-nav::before\]:!border-black/g, '[&_.ant-tabs-nav::before]:!border-b [&_.ant-tabs-nav::before]:!border-[var(--border)]');
  content = content.replace(/border-black/g, 'border-[var(--border)]');

  // 5. Brutal classes & hard black shadows
  content = content.replace(/shadow-\[[0-9]+px_[0-9]+px_0px_0px_#000\]/g, 'shadow-[var(--shadow-sm)]');
  content = content.replace(/shadow-\[[0-9]+px_[0-9]+px_0px_0px_rgba\(0,\s*0,\s*0,\s*1\)\]/g, 'shadow-[var(--shadow-md)]');
  content = content.replace(/shadow-\[[0-9]+px_[0-9]+px_0px_0px_rgba\(0,0,0,1\)\]/g, 'shadow-[var(--shadow-md)]');
  content = content.replace(/shadow-\[2px_2px_0px_0px_#000\]/g, 'shadow-[var(--shadow-sm)]');
  content = content.replace(/shadow-\[3px_3px_0px_0px_#000\]/g, 'shadow-[var(--shadow-sm)]');
  content = content.replace(/shadow-\[4px_4px_0px_0px_#000\]/g, 'shadow-[var(--shadow-md)]');
  content = content.replace(/brutal-shadow/g, 'shadow-[var(--shadow-md)]');
  content = content.replace(/brutal-border/g, 'border border-[var(--border)]');
  content = content.replace(/brutal-card/g, 'rounded-[var(--radius-card)]');
  content = content.replace(/brutal-box/g, '');

  // 6. Font mono and IBM Plex
  content = content.replace(/'IBM Plex Mono',?\s*/g, "'Be Vietnam Pro', ");
  content = content.replace(/font-\['IBM_Plex_Mono'\]/g, 'font-sans');
  content = content.replace(/\bfont-mono\b/g, 'font-sans');

  // 7. Dark navy brutal backgrounds & text
  content = content.replace(/#1D2A3A/g, '#2B1B0E');
  content = content.replace(/#0F1729/g, '#2B1B0E');

  // 8. tracking-widest and tracking-wider
  content = content.replace(/\btracking-(?:widest|wider)\b/g, 'tracking-normal');

  // 9. uppercase where it's not a status badge (leave status badges e.g. text-[10px] uppercase)
  content = content.replace(/\buppercase\s+tracking-(?:wider|widest|wide|normal)\b/g, '');
  content = content.replace(/\btracking-(?:wider|widest|wide|normal)\s+uppercase\b/g, '');
  content = content.replace(/\bfont-bold\s+uppercase\b/g, 'font-bold');
  content = content.replace(/\bfont-black\s+uppercase\b/g, 'font-bold');
  content = content.replace(/\bfont-semibold\s+uppercase\b/g, 'font-semibold');
  content = content.replace(/(text-(?:[1-9]xl|lg|base|sm|2xl|3xl|4xl|5xl)\s+[^"']*)\buppercase\b/g, '$1');
  content = content.replace(/\buppercase\s+([^"']*text-(?:[1-9]xl|lg|base|sm|2xl|3xl|4xl|5xl))/g, '$1');
  content = content.replace(/(\[&_\.ant-tabs-tab\]:!)uppercase/g, '');

  if (content !== original) {
    // Count diff
    const origLines = original.split('\n');
    const newLines = content.split('\n');
    let diffCount = 0;
    origLines.forEach((line, idx) => {
      if (line !== newLines[idx]) diffCount++;
    });
    totalFixed += diffCount;
    changedFiles.push({ file: filePath, changes: diffCount });
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

function traverse(dir) {
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      traverse(full);
    } else if (/\.(tsx|ts|css|scss)$/.test(item)) {
      processFile(full);
    }
  }
}

traverse('src');
console.log(`Successfully updated ${changedFiles.length} files with ${totalFixed} modified lines!`);
changedFiles.forEach(f => console.log(` - ${f.file}: ${f.changes} lines`));
