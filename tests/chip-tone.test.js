'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const htmlPath = path.join(__dirname, '..', '강사앱.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const startMark = '/* schedule-chip-tone:start */';
const endMark = '/* schedule-chip-tone:end */';
const start = html.indexOf(startMark);
const end = html.indexOf(endMark);
assert.ok(start !== -1 && end > start, '강사앱.html에 회차 톤 함수가 있어야 한다');

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
