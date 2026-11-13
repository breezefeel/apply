'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const startMark = '/* schedule-chip-tone:start */';
const endMark = '/* schedule-chip-tone:end */';
const start = html.indexOf(startMark);
const end = html.indexOf(endMark);
assert.ok(start !== -1 && end > start, 'index.html에 회차 톤 함수가 있어야 한다');

const source = html.slice(start + startMark.length, end);
const api = new Function(
  source +
    '\nreturn { parseChipRatio_, scheduleChipTone_, scheduleChipToneClass_, memberChipToneClassFromSess_ };'
)();

assert.deepStrictEqual(api.parseChipRatio_('26/27'), { current: 26, total: 27 });
assert.deepStrictEqual(api.parseChipRatio_(' 12 / 13 '), { current: 12, total: 13 });
assert.deepStrictEqual(api.parseChipRatio_('10:30 회원 28/27'), { current: 28, total: 27 });
assert.strictEqual(api.parseChipRatio_(''), null);
assert.strictEqual(api.parseChipRatio_('〃'), null);
assert.strictEqual(api.parseChipRatio_('결석'), null);
assert.strictEqual(api.parseChipRatio_('취소'), null);

assert.strictEqual(api.scheduleChipTone_(26, 27), 'low');
assert.strictEqual(api.scheduleChipTone_(7, 8), 'low');
assert.strictEqual(api.scheduleChipTone_(0, 1), 'low');
assert.strictEqual(api.scheduleChipToneClass_(26, 27), 'tone-last-1');

assert.strictEqual(api.scheduleChipTone_(8, 8), 'last');
assert.strictEqual(api.scheduleChipTone_(29, 29), 'last');
assert.strictEqual(api.scheduleChipTone_(28, 27), 'last');
assert.strictEqual(api.scheduleChipToneClass_(28, 27), 'tone-last');

assert.strictEqual(api.scheduleChipTone_(5, 8), '');
assert.strictEqual(api.scheduleChipToneClass_(5, 8), '');
assert.strictEqual(api.scheduleChipTone_(1, 0), '');
assert.strictEqual(api.scheduleChipTone_(1, -3), '');
assert.strictEqual(api.scheduleChipTone_('x', 4), '');

assert.strictEqual(api.memberChipToneClassFromSess_('9/10'), 'tone-last-1');
assert.strictEqual(api.memberChipToneClassFromSess_('10/10'), 'tone-last');
assert.strictEqual(api.memberChipToneClassFromSess_('11/10'), 'tone-last');
assert.strictEqual(api.memberChipToneClassFromSess_('3/10'), '');
assert.strictEqual(api.memberChipToneClassFromSess_('9/10', { absent: true }), '');
assert.strictEqual(api.memberChipToneClassFromSess_('10/10', { cancelled: true }), '');
assert.strictEqual(api.memberChipToneClassFromSess_('취소'), '');
assert.strictEqual(api.memberChipToneClassFromSess_(''), '');

// 기준은 '오늘 출석 전' 남은 회차. 출석 전 2회 남으면 노랑, 1회(이하) 남으면 빨강.
// 6/8 출석 전 → 2회 남음 → 노랑. 7/8 출석 전 → 1회 남음 → 빨강. 8/8 출석 전 → 0회 → 빨강.
assert.strictEqual(api.memberChipToneClassFromSess_('6/8', { pendingAttend: true }), 'tone-last-1');
assert.strictEqual(api.memberChipToneClassFromSess_('7/8', { pendingAttend: true }), 'tone-last');
assert.strictEqual(api.memberChipToneClassFromSess_('8/8', { pendingAttend: true }), 'tone-last');
// 출석 처리 후에도 출석 전 색을 그대로 유지. 출석된 칩은 사용회차-1을 출석 전 값으로 본다.
// 7/8 출석 후 → 출석 전 6/8(2회 남음) → 노랑. 8/8 출석 후 → 출석 전 7/8(1회 남음) → 빨강.
assert.strictEqual(api.memberChipToneClassFromSess_('6/8'), '');
assert.strictEqual(api.memberChipToneClassFromSess_('7/8'), 'tone-last-1');
assert.strictEqual(api.memberChipToneClassFromSess_('7/8', { pendingAttend: false }), 'tone-last-1');
assert.strictEqual(api.memberChipToneClassFromSess_('8/8'), 'tone-last');
// 결석은 회색 우선.
assert.strictEqual(api.memberChipToneClassFromSess_('6/8', { pendingAttend: true, absent: true }), '');
assert.strictEqual(api.memberChipToneClassFromSess_('7/8', { pendingAttend: true, absent: true }), '');
assert.strictEqual(api.memberChipToneClassFromSess_('8/8', { absent: true }), '');
assert.strictEqual(api.memberChipToneClassFromSess_('6/8', { pendingAttend: true, cancelled: true }), '');

assert.match(
  html,
  /function memberChipCountsPendingVisit_\(m\) \{\s*if \(!m \|\| isMemberAbsent\(m\) \|\| isMemberCompleted\(m\)\) return false;/
);
assert.match(html, /pendingAttend:\s*memberChipCountsPendingVisit_\(m\)/);

assert.match(html, /\.member-chip\.tone-last-1\s*\{[^}]*background:\s*#f6e27a\s*!important/);
assert.match(html, /\.member-chip\.tone-last\s*\{[^}]*background:\s*#f4b4b4\s*!important/);
assert.match(html, /color:\s*#1a1a1a\s*!important/);
assert.match(html, /@media \(min-width:520px\)[\s\S]*\.member-chip\.tone-last-1\s*\{[^}]*#f6e27a/);
assert.match(html, /@media \(min-width:520px\)[\s\S]*\.member-chip\.tone-last\s*\{[^}]*#f4b4b4/);
assert.match(
  html,
  /\.member-chip\.absent\s*\{\s*background:\s*#d9d9d9\s*!important;\s*border-color:\s*#bdbdbd\s*!important;\s*color:\s*#555;/
);
assert.match(html, /\.member-chip\.absent \.chip-name,\s*\n\s*\.member-chip\.absent \.sess[\s\S]*?color:\s*#555\s*!important/);
assert.match(html, /\.member-chip\.absent\.tone-last-1[\s\S]*?#d9d9d9\s*!important/);
assert.match(html, /\.member-chip\.absent\.tone-last[\s\S]*?color:\s*#555\s*!important/);
assert.match(
  html,
  /@media \(min-width:520px\)[\s\S]*\.member-chip\.absent,\s*\n\s*\.member-chip\.absent\.tone-last-1[\s\S]*?#d9d9d9\s*!important[\s\S]*?#bdbdbd[\s\S]*?#555/
);
assert.doesNotMatch(html, /\.member-chip\.absent[^{]*\{[^}]*background:\s*#fee2e2/);
assert.match(html, /\.member-chip\.absent\.on\s*\{[^}]*box-shadow:/);
assert.match(html, /\.member-chip\.absent\.done \.chip-name\s*\{[^}]*text-decoration:\s*line-through/);
assert.match(html, /\.member-chip\.done \.chip-name\s*\{[^}]*text-decoration:\s*line-through/);
assert.match(html, /memberChipToneClassFromSess_\(sessRaw/);
assert.doesNotMatch(source, /text-decoration/);

const toneCss = html.slice(html.indexOf('.member-chip.tone-last-1'), html.indexOf('.members-hd'));
assert.doesNotMatch(toneCss, /text-decoration:\s*none/);

console.log('ok chip-tone');
