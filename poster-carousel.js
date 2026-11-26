/* 과정 포스터 템플릿 · 캐러셀(인스타)
 * 영수증.html 포스터 탭(?tab=plan&branch=real → 포스터)에서 '캐러셀(인스타)' 레이아웃으로 씁니다.
 *
 * 구조 (데이터와 레이아웃 분리)
 *  - SAMPLES  : 과정별 샘플 데이터. 키는 '지점:트랙' (예: 'real:oneday').
 *               다음 과정은 샘플 하나를 복사해 값만 바꾸면 됩니다.
 *  - FIELDS   : 포스터 탭 입력 칸 ↔ 데이터 연결. 칸을 고치면 toModel()로 데이터가 다시 만들어집니다.
 *  - THEMES   : 색 묶음 (warm = 웜 뉴트럴).
 *  - LAYOUTS  : 레이아웃마다 자기 크기의 장(page) 목록. draw(ctx, W, H, m, th)
 *               carousel = 4:5(1080×1350) 4장 + 9:16(1080×1920) 스토리 1장.
 * 사진: poster-photos 안의 사진만 씁니다. 회원 얼굴은 photo.blur(원본 비율 좌표)로 흐리게 합니다.
 * QR: qr 이미지는 qrUrl 주소로 만든 것입니다. 신청 주소를 바꾸면 QR 이미지도 새로 넣어야 합니다.
 * 원본 시안: poster-trend-v1.js 스타일 2 (2026-11-09) → 여기 스타일 1(기본).
 * 스타일 2: 밝은 바탕, 큰 사진 블록, 글자 크기 순서가 분명한 에디토리얼.
 * 대기 신청: SAMPLES['지점:트랙:wait']. 수강료 없이 일정 문장과 신청 안내만.
 */
(function (root) {
  'use strict';

  var SAMPLES = {
    // 힘 적게 쓰는 패시브 스트레칭 · Re:Al 원데이 (academy #real 원데이 문구 기준)
    'real:oneday': {
      file: 'ReAl-패시브',
      program: 'Re:Al 움직임 과정',
      track: '원데이 클래스',
      titleL1: '힘 적게 쓰는',
      titleL2: '패시브 스트레칭',
      dateKo: '12월 13일(일)',
      time: '10:00–17:00',
      place: '리얼무브먼트 약수점',
      who: ['물리치료사', '필라테스 트레이너', '에스테티션'],
      seats: '4–6명',
      price: {
        regular: '30만 원', regularSub: '일반 신청',
        early: '27만 원', earlyUntil: '11월 26일', earlySub: '11/26까지', earlyNote: '11월 26일까지 신청 완료',
        min: '22만 원', minSub: '교육비 지원 시 최저',
        supportMax: '최대 5만 원'
      },
      support: [
        { h: '인스타 스토리 공유', s: '', a: '1만 원', short: '스토리 공유 1만' },
        { h: '피드·블로그 과정 소개', s: '', a: '1만 원', short: '피드·블로그 소개 1만' },
        { h: '동료 추천·동반 신청', s: '추천인·신청자 각각', a: '2만 원', short: '동료 추천·동반 2만' },
        { h: '수강 후기', s: '', a: '1만 원', short: '수강 후기 1만' }
      ],
      supportRule: '항목마다 1회만 인정하고, 최대 5만 원까지 지원합니다.',
      supportNote: '앞의 세 가지는 수강 당일 현장 결제에서 빼 드립니다. 후기 1만 원은 수강 뒤 후기를 확인하고 돌려드립니다.',
      lead: '강사가 움직임을 유도하는 패시브 스트레칭을 하루 만에 익힙니다. 말단에서 근위로 잇는 플로우를, 매트와 베드 모두에서 부담 적은 자세로 쓸 수 있게 됩니다.',
      currIntro: 'Supine · Prone 각각 상지/하지. 말단에서 근위로 연결하는 플로우입니다.',
      days: [
        { n: '01', pos: 'SUPINE', h: '하지 Lower', p: '발 → 발목 → 무릎 → 고관절. 중력 부하를 최소화한 상태에서 하체 가동성을 엽니다.' },
        { n: '02', pos: 'SUPINE', h: '상지 Upper', p: '손가락 → 손목 → 팔꿈치 → 어깨. 누운 자세에서 상지 시퀀스를 연결합니다.' },
        { n: '03', pos: 'PRONE', h: '하지 Lower', p: '엎드린 자세에서 하체 후방 조직을 다루며, Supine과 대비되는 접근을 익힙니다.' },
        { n: '04', pos: 'PRONE', h: '상지 Upper', p: '엎드린 자세의 상지·체간 연결. 베드 위에서도 안정적으로 진행 가능한 포지션입니다.' }
      ],
      coreH: '이 원데이의 핵심',
      core: '강사 부담이 적은 자세 · 말단에서 근위로 잇는 시퀀스 · 캐딜락·샵 베드에서도 가능',
      instructor: '박준규',
      instructorRole: '미국 카이로프랙틱 닥터 · 물리치료사',
      contact: '010-2468-4596',
      applyLabel: 'academy 페이지 Re:Al 신청서',
      applyUrl: 'breezefeel.github.io/academy/#real',
      igMain: '@dr.park_dc.pt',
      igTag: '@re.al_movement_official',
      photo: {
        src: 'poster-photos/real-spine.jpg',
        blur: [{ x: 0.515, y: 0.560, w: 0.115, h: 0.150 }]
      },
      qr: 'poster-photos/qr-academy-real.png',
      qrUrl: 'breezefeel.github.io/academy/#real',
      logo: 'poster-photos/rm-logo.png'
    }
  };

  // 대기 신청은 같은 과정 샘플에서 수강료를 걷어 내고 일정·안내 문장만 바꿉니다.
  (function () {
    var w = JSON.parse(JSON.stringify(SAMPLES['real:oneday']));
    w.file = 'ReAl-1월대기';
    w.track = '1월 대기 신청';
    w.dateKo = '1월 중순~말 예정';
    w.time = '';
    w.badge = '12월 과정 마감 · 2027년 1월 대기 신청';
    w.applyLabel = '대기 신청하기';
    w.applyUrl = 'breezefeel.github.io/academy/#real';
    w.qrUrl = 'breezefeel.github.io/academy/#real';
    w.waitlist = true;
    SAMPLES['real:oneday:wait'] = w;
  })();

  var THEMES = {
    warm: {
      paper: '#F2ECE3', card: '#FBF8F3', line: '#DED4C7', ink: '#2B2420', mute: '#7A6D60',
      accent: '#9C6A3C', accentSoft: '#E9DCCB', dark: '#2F2823', onDark: '#F6EFE5', onDarkMute: '#BFB2A3',
      sage: '#DCE1D3'
    },
    editorial: {
      paper: '#F6F4F0', card: '#FFFDF8', line: '#E3DDD4', ink: '#1B1916', mute: '#6E675E',
      accent: '#1E3A34', accentSoft: '#E5EEE8', dark: '#1B1916', onDark: '#F6F4F0', onDarkMute: '#C9C2B6',
      sage: '#E5EEE8'
    }
  };

  var F = 'Pretendard, "Noto Sans KR", "Noto Sans CJK KR", sans-serif';
  function font(w, s) { return w + ' ' + s + 'px ' + F; }

  /* ---------- 검사용 기록 ---------- */
  var PV_LOG = { boxes: [], warn: [] };
  var curPage = '';
  function pvBegin(name) { curPage = name; }

  function pvWrap(ctx, text, maxW) {
    var out = [];
    String(text || '').split('\n').forEach(function (para) {
      var line = '';
      para.split(' ').forEach(function (tok) {
        if (!tok) return;
        var trial = line ? line + ' ' + tok : tok;
        if (ctx.measureText(trial).width <= maxW) { line = trial; return; }
        if (line) out.push(line);
        if (ctx.measureText(tok).width <= maxW) { line = tok; return; }
        var buf = '';
        tok.split('').forEach(function (ch) {
          if (ctx.measureText(buf + ch).width <= maxW) buf += ch;
          else { if (buf) out.push(buf); buf = ch; }
        });
        line = buf;
      });
      if (line) out.push(line);
    });
    return out.length ? out : [''];
  }

  // 텍스트 1줄. maxW를 넘으면 경고 기록. 반환: 실제 너비
  function T(ctx, s, x, y, maxW, size, opt) {
    opt = opt || {};
    var w = ctx.measureText(s).width;
    var align = ctx.textAlign;
    var bx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    ctx.fillText(s, x, y);
    var box = { page: curPage, s: s, x: bx, y: y, w: w, h: size * 1.2, group: opt.group || '' };
    PV_LOG.boxes.push(box);
    if (maxW && w > maxW + 0.5) PV_LOG.warn.push(curPage + ': 넘침 "' + s + '" ' + Math.round(w) + '>' + Math.round(maxW));
    return w;
  }
  // 줄바꿈 단락. 반환: 높이
  function P(ctx, s, x, y, maxW, size, lh, maxLines) {
    var lines = pvWrap(ctx, s, maxW);
    if (maxLines && lines.length > maxLines) PV_LOG.warn.push(curPage + ': 줄 초과 "' + s.slice(0, 20) + '…" ' + lines.length + '>' + maxLines);
    lines.forEach(function (ln, i) { T(ctx, ln, x, y + i * lh, maxW, size); });
    return lines.length * lh;
  }
  // 너비에 맞춰 글자 크기 줄이기
  function fit(ctx, s, weight, size, min, maxW) {
    ctx.font = font(weight, size);
    while (size > min && ctx.measureText(s).width > maxW) { size -= 1; ctx.font = font(weight, size); }
    return size;
  }
  function rr(ctx, x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  }
  function label(ctx, s, x, y, color) {
    ctx.fillStyle = color;
    ctx.font = font(600, 20);
    if ('letterSpacing' in ctx) ctx.letterSpacing = /^[\x00-\x7F]+$/.test(s) ? '2px' : '0px';
    T(ctx, s, x, y, 0, 20, { group: 'label' });
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }

  /* ---------- 사진 ---------- */
  var pvImgCache = {};
  var pvBase = '';
  var pvOnLoad = null;
  function pvImg(src) {
    var hit = pvImgCache[src];
    if (hit) return hit;
    var img = new Image();
    pvImgCache[src] = img;
    img.onload = function () { if (pvOnLoad) pvOnLoad(); };
    img.src = pvBase + src;
    return img;
  }
  // fx, fy: 사진 안의 기준점(0~1). 그 점이 칸의 (ax, ay) 위치에 오도록 배치 (기본 가운데)
  function pvPhoto(ctx, ph, x, y, w, h, fx, fy, r, ax, ay) {
    var img = pvImg(ph.src);
    ctx.save();
    if (r) { rr(ctx, x, y, w, h, r); ctx.clip(); } else { ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); }
    ctx.fillStyle = '#CFC6BA';
    ctx.fillRect(x, y, w, h);
    if (img.complete && img.naturalWidth) {
      var sc = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      var dw = img.naturalWidth * sc, dh = img.naturalHeight * sc;
      var dx = x + w * (ax == null ? 0.5 : ax) - fx * dw;
      var dy = y + h * (ay == null ? 0.5 : ay) - fy * dh;
      if (dx > x) dx = x; if (dy > y) dy = y;
      if (dx + dw < x + w) dx = x + w - dw; if (dy + dh < y + h) dy = y + h - dh;
      ctx.drawImage(img, dx, dy, dw, dh);
      (ph.blur || []).forEach(function (b) {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(dx + (b.x + b.w / 2) * dw, dy + (b.y + b.h / 2) * dh, b.w * dw / 2, b.h * dh / 2, 0, 0, Math.PI * 2);
        ctx.clip();
        ctx.filter = 'blur(' + Math.round(18 * sc * 3) + 'px)';
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
      });
    }
    ctx.restore();
  }
  function pvQR(ctx, m, x, y, s) {
    var img = pvImg(m.qr);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, y, s, s);
    if (img.complete && img.naturalWidth) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, x, y, s, s);
      ctx.imageSmoothingEnabled = true;
    }
  }

  function pvLogo(ctx, m, cx, y, w, alpha) {
    var img = pvImg(m.logo);
    if (!(img.complete && img.naturalWidth)) return;
    var h = w * img.naturalHeight / img.naturalWidth;
    ctx.save(); ctx.globalAlpha = alpha == null ? 0.5 : alpha;
    ctx.drawImage(img, cx - w / 2, y, w, h);
    ctx.restore();
  }

  /* ---------- 공통 블록 ---------- */
  function priceTrio(ctx, m, th, x, y, w, h, big) {
    var gap = 16, cw = (w - gap * 2) / 3;
    var cells = [
      { l: '정가', v: m.price.regular, s: m.price.regularSub, bg: th.card, fg: th.ink, sub: th.mute },
      { l: '얼리버드', v: m.price.early, s: m.price.earlySub, bg: th.card, fg: th.ink, sub: th.mute },
      { l: '교육비 지원', v: m.price.supportMax, s: m.price.minSub + ' ' + m.price.min, bg: th.accent, fg: '#FFFFFF', sub: 'rgba(255,255,255,0.85)' }
    ];
    cells.forEach(function (c, i) {
      var cx = x + i * (cw + gap);
      rr(ctx, cx, y, cw, h, 22, c.bg, c.bg === th.card ? th.line : null);
      label(ctx, c.l, cx + 26, y + 24, c.sub);
      ctx.fillStyle = c.fg;
      var vs = fit(ctx, c.v, 700, big || 50, 30, cw - 52);
      T(ctx, c.v, cx + 26, y + 58, cw - 52, vs);
      ctx.fillStyle = c.sub;
      var ss = fit(ctx, c.s, 500, 20, 15, cw - 52);
      T(ctx, c.s, cx + 26, y + h - 26 - ss, cw - 52, ss);
    });
  }

  /* ========== 캐러셀(인스타) 레이아웃 ========== */
  function pageTag(ctx, W, y, n, total, color) {
    ctx.fillStyle = color; ctx.font = font(600, 22); ctx.textAlign = 'right';
    T(ctx, n + ' / ' + total, W - 60, y, 120, 22);
    ctx.textAlign = 'left';
  }
  function carouselHeader(ctx, W, m, th, en, ko, n) {
    var pad = 64;
    ctx.fillStyle = th.paper; ctx.fillRect(0, 0, W, 1350);
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    ctx.fillStyle = th.mute; ctx.font = font(600, 22);
    T(ctx, m.program + ' · ' + m.titleL1 + ' ' + m.titleL2, pad, 84, 760, 22);
    pageTag(ctx, W, 84, n, 4, th.mute);
    ctx.fillStyle = th.line; ctx.fillRect(pad, 126, W - pad * 2, 2);
    label(ctx, en, pad, 162, th.accent);
    ctx.fillStyle = th.ink;
    var s = fit(ctx, ko, 700, 60, 40, W - pad * 2);
    T(ctx, ko, pad - 2, 196, W - pad * 2, s);
    return 290;
  }

  function drawCarouselCover(ctx, W, H, m, th) {
    if (m.waitlist) { drawCarouselCoverWait(ctx, W, H, m, th); return; }
    pvBegin('cover');
    var pad = 64, inner = W - pad * 2;
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    pvPhoto(ctx, m.photo, 0, 0, W, H, 0.5, 0.06, 0, 0.5, 0.12);
    var g = ctx.createLinearGradient(0, 0, 0, 260);
    g.addColorStop(0, 'rgba(30,24,20,0.55)'); g.addColorStop(1, 'rgba(30,24,20,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 260);
    var g2 = ctx.createLinearGradient(0, 640, 0, H);
    g2.addColorStop(0, 'rgba(34,27,22,0)'); g2.addColorStop(0.45, 'rgba(34,27,22,0.82)'); g2.addColorStop(1, 'rgba(34,27,22,0.96)');
    ctx.fillStyle = g2; ctx.fillRect(0, 640, W, H - 640);

    ctx.fillStyle = '#FFFFFF'; ctx.font = font(600, 24);
    T(ctx, m.program + ' · ' + m.track, pad, 76, 700, 24);
    pageTag(ctx, W, 76, 1, 4, 'rgba(255,255,255,0.85)');

    ctx.fillStyle = th.accentSoft; ctx.font = font(600, 26);
    T(ctx, m.who.join(' · '), pad, 896, inner, 26);
    ctx.fillStyle = '#FFFFFF';
    var s1 = fit(ctx, m.titleL1, 700, 96, 64, inner);
    T(ctx, m.titleL1, pad - 3, 944, inner, s1);
    var s2 = fit(ctx, m.titleL2, 700, 96, 64, inner);
    T(ctx, m.titleL2, pad - 3, 944 + 112, inner, s2);

    var cy = 1192, cx = pad;
    ctx.font = font(600, 26);
    [m.dateKo + ' ' + m.time, m.place, '정원 ' + m.seats].forEach(function (c) {
      var w = ctx.measureText(c).width + 40;
      rr(ctx, cx, cy, w, 54, 27, 'rgba(255,255,255,0.14)', 'rgba(255,255,255,0.45)');
      ctx.fillStyle = '#FFFFFF';
      T(ctx, c, cx + 20, cy + 13, w - 40, 26);
      cx += w + 12;
    });
    if (cx - 12 > W - pad) PV_LOG.warn.push(curPage + ': 칩 줄 넘침');
  }

  function drawCarouselLearn(ctx, W, H, m, th) {
    pvBegin('learn');
    var pad = 64, inner = W - pad * 2, gap = 16;
    var y = carouselHeader(ctx, W, m, th, 'WHAT YOU LEARN', '무엇을 배우나', 2);
    ctx.fillStyle = th.ink; ctx.font = font(500, 28);
    y += P(ctx, m.lead, pad, y, inner, 28, 42, 3) + 18;
    ctx.fillStyle = th.mute; ctx.font = font(500, 22);
    y += P(ctx, m.currIntro, pad, y, inner, 22, 32, 1) + 22;

    var cw = (inner - gap) / 2, ch = 290;
    m.days.forEach(function (d, i) {
      var cx = pad + (i % 2) * (cw + gap), cy = y + Math.floor(i / 2) * (ch + gap);
      rr(ctx, cx, cy, cw, ch, 24, i === 0 ? th.dark : th.card, i === 0 ? null : th.line);
      var dark = i === 0;
      ctx.fillStyle = dark ? th.accentSoft : th.accent; ctx.font = font(700, 40);
      var nw = T(ctx, d.n, cx + 28, cy + 26, 80, 40);
      label(ctx, d.pos, cx + 28 + nw + 14, cy + 40, dark ? th.onDarkMute : th.mute);
      ctx.fillStyle = dark ? th.onDark : th.ink; ctx.font = font(700, 32);
      T(ctx, d.h, cx + 28, cy + 90, cw - 56, 32);
      ctx.fillStyle = dark ? th.onDarkMute : th.mute; ctx.font = font(500, 22);
      P(ctx, d.p, cx + 28, cy + 142, cw - 56, 22, 33, 3);
    });
    y += ch * 2 + gap + 18;

    var items = m.core.split(' · ');
    var bh = 62 + items.length * 44 + 14;
    rr(ctx, pad, y, inner, bh, 24, th.accentSoft);
    label(ctx, m.coreH, pad + 28, y + 24, th.accent);
    ctx.font = font(600, 26);
    items.forEach(function (it, i) {
      var iy = y + 62 + i * 44;
      ctx.fillStyle = th.accent; ctx.fillRect(pad + 28, iy + 12, 8, 8);
      ctx.fillStyle = th.ink;
      T(ctx, it, pad + 50, iy, inner - 78, 26);
    });
    if (y + bh > 1350 - 70) PV_LOG.warn.push(curPage + ': 핵심 상자 넘침');
  }

  function tableRows(ctx, th, x, y, w, rows, rowH, keyW) {
    rows.forEach(function (r, i) {
      var ry = y + i * rowH;
      if (i > 0) { ctx.fillStyle = th.line; ctx.fillRect(x + 28, ry, w - 56, 2); }
      ctx.fillStyle = th.mute; ctx.font = font(600, 22);
      T(ctx, r[0], x + 28, ry + (rowH - 26) / 2, keyW - 28, 22);
      ctx.fillStyle = th.ink;
      var s = fit(ctx, r[1], 700, r[3] || 28, 20, w - keyW - 56 - (r[2] ? 230 : 0));
      if (r[2]) {
        T(ctx, r[1], x + keyW, ry + (rowH - s * 1.2) / 2 - 2, w - keyW - 286, s);
        ctx.fillStyle = th.mute; ctx.font = font(500, 20); ctx.textAlign = 'right';
        T(ctx, r[2], x + w - 28, ry + (rowH - 24) / 2, 230, 20);
        ctx.textAlign = 'left';
      } else {
        T(ctx, r[1], x + keyW, ry + (rowH - s * 1.2) / 2, w - keyW - 56, s);
      }
    });
  }

  function drawCarouselFee(ctx, W, H, m, th) {
    if (m.waitlist) { drawCarouselFeeWait(ctx, W, H, m, th); return; }
    pvBegin('fee');
    var pad = 64, inner = W - pad * 2;
    var y = carouselHeader(ctx, W, m, th, 'SCHEDULE & FEE', '일정 · 수강료', 3);
    var rows = [
      ['일정', m.dateKo + ' ' + m.time],
      ['장소', m.place],
      ['대상', m.who.join(' · ')],
      ['정원', m.seats],
      ['강사', m.instructor + ' · ' + m.instructorRole]
    ];
    var rowH = 100, h1 = rows.length * rowH;
    rr(ctx, pad, y, inner, h1, 24, th.card, th.line);
    tableRows(ctx, th, pad, y, inner, rows, rowH, 160);
    y += h1 + 30;

    label(ctx, 'FEE', pad, y, th.accent);
    y += 38;
    var fee = [
      ['정가', m.price.regular, m.price.regularSub, 44],
      ['얼리버드', m.price.early, m.price.earlyNote, 44],
      ['교육비 지원 시', '최저 ' + m.price.min, m.price.supportMax + ' 지원', 44]
    ];
    var fH = 128, h2 = fee.length * fH;
    rr(ctx, pad, y, inner, h2, 24, th.card, th.line);
    // 마지막 줄 강조
    ctx.save(); rr(ctx, pad, y, inner, h2, 24); ctx.clip();
    ctx.fillStyle = th.accentSoft; ctx.fillRect(pad, y + fH * 2, inner, fH);
    ctx.restore();
    tableRows(ctx, th, pad, y, inner, fee, fH, 220);
    y += h2 + 24;
    ctx.fillStyle = th.mute; ctx.font = font(500, 21);
    P(ctx, '교육비 지원 항목은 다음 장에서 확인하세요.', pad, y, inner, 21, 30, 1);
  }

  function drawCarouselApply(ctx, W, H, m, th) {
    if (m.waitlist) { drawCarouselApplyWait(ctx, W, H, m, th); return; }
    pvBegin('apply');
    var pad = 64, inner = W - pad * 2;
    var y = carouselHeader(ctx, W, m, th, 'SUPPORT & APPLY', '교육비 지원 ' + m.price.supportMax, 4);
    ctx.fillStyle = th.ink; ctx.font = font(500, 24);
    y += P(ctx, m.supportRule, pad, y, inner, 24, 34, 1) + 14;

    var rowH = 112;
    rr(ctx, pad, y, inner, rowH * 4, 24, th.card, th.line);
    m.support.forEach(function (s, i) {
      var ry = y + i * rowH;
      if (i > 0) { ctx.fillStyle = th.line; ctx.fillRect(pad + 28, ry, inner - 56, 2); }
      ctx.fillStyle = th.ink; ctx.font = font(700, 29);
      var hw = T(ctx, s.h, pad + 28, ry + (rowH - 35) / 2, inner - 260, 29);
      if (s.s) {
        ctx.fillStyle = th.mute; ctx.font = font(500, 20);
        T(ctx, s.s, pad + 28 + hw + 14, ry + (rowH - 24) / 2 + 2, inner - 300 - hw, 20);
      }
      ctx.fillStyle = th.accent; ctx.font = font(700, 32); ctx.textAlign = 'right';
      T(ctx, s.a, W - pad - 28, ry + (rowH - 38) / 2, 180, 32);
      ctx.textAlign = 'left';
    });
    y += rowH * 4 + 16;
    ctx.fillStyle = th.mute; ctx.font = font(500, 20);
    y += P(ctx, m.supportNote, pad, y, inner, 20, 30, 2) + 26;

    var aH = Math.max(312, 1350 - 84 - y);
    rr(ctx, pad, y, inner, aH, 28, th.dark);
    var q = Math.min(aH - 64, 256);
    pvQR(ctx, m, pad + 28, y + (aH - q) / 2, q);
    var tx = pad + 28 + q + 32, tw = inner - (tx - pad) - 28;
    var ty = y + (aH - 250) / 2;
    label(ctx, 'APPLY', tx, ty, th.onDarkMute);
    ctx.fillStyle = th.onDark;
    var s = fit(ctx, m.applyLabel, 700, 32, 22, tw);
    T(ctx, m.applyLabel, tx, ty + 34, tw, s);
    ctx.fillStyle = th.onDarkMute; ctx.font = font(500, 20);
    T(ctx, m.applyUrl, tx, ty + 82, tw, 20);
    ctx.fillStyle = th.onDark; ctx.font = font(600, 24);
    T(ctx, '문의 ' + m.contact, tx, ty + 136, tw, 24);
    ctx.fillStyle = th.onDarkMute; ctx.font = font(500, 21);
    T(ctx, m.igMain, tx, ty + 184, tw, 21);
    T(ctx, m.igTag, tx, ty + 218, tw, 21);
  }

  function drawCarouselStory(ctx, W, H, m, th) {
    if (m.waitlist) { drawCarouselStoryWait(ctx, W, H, m, th); return; }
    pvBegin('story');
    var pad = 72, inner = W - pad * 2, gap = 16;
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    ctx.fillStyle = th.paper; ctx.fillRect(0, 0, W, H);
    var phH = 880;
    pvPhoto(ctx, m.photo, 0, 0, W, phH, 0.5, 0.05, 0, 0.5, 0.17);
    var g = ctx.createLinearGradient(0, 440, 0, phH);
    g.addColorStop(0, 'rgba(34,27,22,0)'); g.addColorStop(0.55, 'rgba(34,27,22,0.82)'); g.addColorStop(1, 'rgba(34,27,22,0.95)');
    ctx.fillStyle = g; ctx.fillRect(0, 440, W, phH - 440);

    ctx.fillStyle = th.accentSoft; ctx.font = font(600, 28);
    T(ctx, m.program + ' · ' + m.track, pad, 590, inner, 28);
    ctx.fillStyle = '#FFFFFF';
    var s1 = fit(ctx, m.titleL1, 700, 100, 64, inner);
    T(ctx, m.titleL1, pad - 3, 636, inner, s1);
    var s2 = fit(ctx, m.titleL2, 700, 100, 64, inner);
    T(ctx, m.titleL2, pad - 3, 636 + 112, inner, s2);

    var y = phH + 30;
    ctx.fillStyle = th.ink; ctx.font = font(700, 40);
    var dw = T(ctx, m.dateKo, pad, y, inner, 40);
    ctx.fillStyle = th.mute; ctx.font = font(600, 32);
    T(ctx, m.time, pad + dw + 18, y + 6, inner - dw - 18, 32);
    y += 60;
    ctx.fillStyle = th.ink; ctx.font = font(600, 28);
    T(ctx, m.place + ' · 정원 ' + m.seats, pad, y, inner, 28);
    y += 42;
    ctx.fillStyle = th.mute; ctx.font = font(500, 24);
    T(ctx, m.who.join(' · '), pad, y, inner, 24);
    y += 44;
    priceTrio(ctx, m, th, pad, y, inner, 164, 44);
    y += 164 + gap;
    var sH = 128;
    rr(ctx, pad, y, inner, sH, 24, th.card, th.line);
    label(ctx, '교육비 지원 항목 · 항목마다 1회', pad + 28, y + 22, th.mute);
    var scw = (inner - 56 - 16) / 2;
    ctx.font = font(600, 23);
    m.support.map(function (x) { return x.short || (x.h + ' ' + x.a); }).forEach(function (s, i) {
      var cx = pad + 28 + (i % 2) * (scw + 16), cy = y + 56 + Math.floor(i / 2) * 36;
      ctx.fillStyle = th.accent; ctx.fillRect(cx, cy + 10, 8, 8);
      ctx.fillStyle = th.ink; T(ctx, s, cx + 18, cy, scw - 18, 23);
    });
    y += sH + gap;
    var qW = 156, sw = inner - qW - gap, qH = 156;
    rr(ctx, pad, y, sw, qH, 24, th.dark);
    label(ctx, 'APPLY', pad + 28, y + 24, th.onDarkMute);
    ctx.fillStyle = th.onDark;
    var s = fit(ctx, m.applyLabel, 700, 28, 20, sw - 56);
    T(ctx, m.applyLabel, pad + 28, y + 56, sw - 56, s);
    ctx.fillStyle = th.onDarkMute; ctx.font = font(600, 22);
    T(ctx, '문의 ' + m.contact + '  ·  ' + m.igMain, pad + 28, y + 100, sw - 56, 22);
    rr(ctx, pad + sw + gap, y, qW, qH, 24, '#FFFFFF', th.line);
    pvQR(ctx, m, pad + sw + gap + 14, y + 14, qW - 28);
    if (y + qH > 1540) PV_LOG.warn.push(curPage + ': 하단 안전영역 침범 ' + (y + qH));
    pvLogo(ctx, m, W / 2, 1660, 190, 0.45);
  }

  /* ---------- 스타일 1 · 대기 신청 (기본 모집 그림은 그대로) ---------- */
  function drawCarouselCoverWait(ctx, W, H, m, th) {
    pvBegin('cover');
    var pad = 64, inner = W - pad * 2;
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    pvPhoto(ctx, m.photo, 0, 0, W, H, 0.5, 0.06, 0, 0.5, 0.12);
    var g = ctx.createLinearGradient(0, 0, 0, 260);
    g.addColorStop(0, 'rgba(30,24,20,0.55)'); g.addColorStop(1, 'rgba(30,24,20,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 260);
    var g2 = ctx.createLinearGradient(0, 640, 0, H);
    g2.addColorStop(0, 'rgba(34,27,22,0)'); g2.addColorStop(0.45, 'rgba(34,27,22,0.82)'); g2.addColorStop(1, 'rgba(34,27,22,0.96)');
    ctx.fillStyle = g2; ctx.fillRect(0, 640, W, H - 640);

    ctx.fillStyle = '#FFFFFF'; ctx.font = font(600, 24);
    T(ctx, m.program + ' · ' + m.track, pad, 76, 700, 24);
    pageTag(ctx, W, 76, 1, 4, 'rgba(255,255,255,0.85)');

    ctx.fillStyle = th.accentSoft; ctx.font = font(600, 26);
    T(ctx, m.who.join(' · '), pad, 860, inner, 26);
    ctx.fillStyle = '#FFFFFF';
    var s1 = fit(ctx, m.titleL1, 700, 92, 60, inner);
    T(ctx, m.titleL1, pad - 3, 908, inner, s1);
    var s2 = fit(ctx, m.titleL2, 700, 92, 60, inner);
    T(ctx, m.titleL2, pad - 3, 908 + 104, inner, s2);

    var cy = 1148, cx = pad;
    ctx.font = font(600, 26);
    [m.dateKo, m.place, '정원 ' + m.seats].filter(Boolean).forEach(function (c) {
      var w = ctx.measureText(c).width + 40;
      rr(ctx, cx, cy, w, 52, 26, 'rgba(255,255,255,0.14)', 'rgba(255,255,255,0.45)');
      ctx.fillStyle = '#FFFFFF';
      T(ctx, c, cx + 20, cy + 12, w - 40, 26);
      cx += w + 12;
    });
    if (cx - 12 > W - pad) PV_LOG.warn.push(curPage + ': 칩 줄 넘침');
    if (m.badge) {
      ctx.fillStyle = 'rgba(20,16,12,0.78)';
      ctx.fillRect(0, 1248, W, H - 1248);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      var bs = fit(ctx, m.badge, 600, 28, 18, inner);
      T(ctx, m.badge, W / 2, 1278, inner, bs);
      ctx.textAlign = 'left';
    }
  }

  function drawCarouselFeeWait(ctx, W, H, m, th) {
    pvBegin('fee');
    var pad = 64, inner = W - pad * 2;
    var y = carouselHeader(ctx, W, m, th, 'SCHEDULE', '일정', 3);
    label(ctx, 'DATE', pad, y, th.accent);
    y += 40;
    ctx.fillStyle = th.ink;
    var ds = fit(ctx, m.dateKo || '', 700, 64, 36, inner);
    T(ctx, m.dateKo || '', pad, y, inner, ds);
    y += Math.ceil(ds * 1.25) + 28;
    var rows = [
      ['장소', m.place || ''],
      ['대상', m.who.join(' · ')],
      ['정원', m.seats || ''],
      ['강사', (m.instructor || '') + (m.instructorRole ? ' · ' + m.instructorRole : '')]
    ];
    var rowH = 100, h1 = rows.length * rowH;
    rr(ctx, pad, y, inner, h1, 24, th.card, th.line);
    tableRows(ctx, th, pad, y, inner, rows, rowH, 160);
    y += h1 + 28;
    if (m.badge && y + 132 < H - 48) {
      rr(ctx, pad, y, inner, 132, 24, th.dark);
      label(ctx, 'WAITLIST', pad + 28, y + 26, th.onDarkMute);
      ctx.fillStyle = th.onDark;
      var s = fit(ctx, m.badge, 700, 30, 18, inner - 56);
      T(ctx, m.badge, pad + 28, y + 70, inner - 56, s);
    }
  }

  function drawCarouselApplyWait(ctx, W, H, m, th) {
    pvBegin('apply');
    var pad = 64, inner = W - pad * 2;
    var headline = m.applyLabel || '대기 신청하기';
    var y = carouselHeader(ctx, W, m, th, 'APPLY', headline, 4);
    if (m.badge) {
      ctx.fillStyle = th.ink;
      var bs = fit(ctx, m.badge, 600, 28, 18, inner);
      T(ctx, m.badge, pad, y, inner, bs);
      y += Math.ceil(bs * 1.3) + 12;
    }
    ctx.fillStyle = th.mute; ctx.font = font(600, 28);
    T(ctx, m.dateKo || '', pad, y, inner, 28);
    y += 46;
    ctx.fillStyle = th.ink; ctx.font = font(600, 24);
    T(ctx, (m.place || '') + (m.seats ? '  ·  정원 ' + m.seats : ''), pad, y, inner, 24);
    y += 44;
    ctx.fillStyle = th.ink; ctx.font = font(500, 26);
    y += P(ctx, m.lead, pad, y, inner, 26, 40, 3) + 24;
    var aH = Math.max(420, H - 56 - y);
    if (y + aH > H - 40) aH = H - 40 - y;
    rr(ctx, pad, y, inner, aH, 28, th.dark);
    var q = Math.min(aH - 72, 268);
    pvQR(ctx, m, pad + 32, y + (aH - q) / 2, q);
    var tx = pad + 32 + q + 32, tw = inner - (tx - pad) - 28;
    var ty = y + Math.max(36, (aH - 240) / 2);
    label(ctx, 'APPLY', tx, ty, th.onDarkMute);
    ctx.fillStyle = th.onDark;
    var s = fit(ctx, headline, 700, 36, 22, tw);
    T(ctx, headline, tx, ty + 38, tw, s);
    ctx.fillStyle = th.onDarkMute; ctx.font = font(500, 20);
    T(ctx, m.applyUrl || '', tx, ty + 96, tw, 20);
    ctx.fillStyle = th.onDark; ctx.font = font(600, 24);
    T(ctx, '문의 ' + (m.contact || ''), tx, ty + 142, tw, 24);
    ctx.fillStyle = th.onDarkMute; ctx.font = font(500, 21);
    T(ctx, m.igMain || '', tx, ty + 186, tw, 21);
    T(ctx, m.igTag || '', tx, ty + 220, tw, 21);
  }

  function drawCarouselStoryWait(ctx, W, H, m, th) {
    pvBegin('story');
    var pad = 72, inner = W - pad * 2, gap = 16;
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    ctx.fillStyle = th.paper; ctx.fillRect(0, 0, W, H);
    var phH = 880;
    pvPhoto(ctx, m.photo, 0, 0, W, phH, 0.5, 0.05, 0, 0.5, 0.17);
    var g = ctx.createLinearGradient(0, 440, 0, phH);
    g.addColorStop(0, 'rgba(34,27,22,0)'); g.addColorStop(0.55, 'rgba(34,27,22,0.82)'); g.addColorStop(1, 'rgba(34,27,22,0.95)');
    ctx.fillStyle = g; ctx.fillRect(0, 440, W, phH - 440);

    ctx.fillStyle = th.accentSoft; ctx.font = font(600, 28);
    T(ctx, m.program + ' · ' + m.track, pad, 590, inner, 28);
    ctx.fillStyle = '#FFFFFF';
    var s1 = fit(ctx, m.titleL1, 700, 92, 60, inner);
    T(ctx, m.titleL1, pad - 3, 636, inner, s1);
    var s2 = fit(ctx, m.titleL2, 700, 92, 60, inner);
    T(ctx, m.titleL2, pad - 3, 636 + 104, inner, s2);

    var y = phH + 32;
    ctx.fillStyle = th.ink;
    var ds = fit(ctx, m.dateKo || '', 700, 44, 28, inner);
    T(ctx, m.dateKo || '', pad, y, inner, ds);
    y += Math.ceil(ds * 1.25) + 12;
    ctx.fillStyle = th.ink; ctx.font = font(600, 28);
    T(ctx, (m.place || '') + (m.seats ? ' · 정원 ' + m.seats : ''), pad, y, inner, 28);
    y += 44;
    ctx.fillStyle = th.mute; ctx.font = font(500, 24);
    T(ctx, m.who.join(' · '), pad, y, inner, 24);
    y += 48;
    if (m.badge) {
      rr(ctx, pad, y, inner, 96, 24, th.dark);
      ctx.fillStyle = th.onDark;
      var bs = fit(ctx, m.badge, 600, 28, 18, inner - 56);
      T(ctx, m.badge, pad + 28, y + 32, inner - 56, bs);
      y += 96 + gap;
    }
    var qW = 168, sw = inner - qW - gap, qH = 168;
    rr(ctx, pad, y, sw, qH, 24, th.dark);
    label(ctx, 'APPLY', pad + 28, y + 24, th.onDarkMute);
    ctx.fillStyle = th.onDark;
    var s = fit(ctx, m.applyLabel || '대기 신청하기', 700, 32, 20, sw - 56);
    T(ctx, m.applyLabel || '대기 신청하기', pad + 28, y + 60, sw - 56, s);
    ctx.fillStyle = th.onDarkMute; ctx.font = font(500, 20);
    T(ctx, m.applyUrl || '', pad + 28, y + 108, sw - 56, 20);
    rr(ctx, pad + sw + gap, y, qW, qH, 24, '#FFFFFF', th.line);
    pvQR(ctx, m, pad + sw + gap + 14, y + 14, qW - 28);
    if (y + qH > 1540) PV_LOG.warn.push(curPage + ': 하단 안전영역 침범 ' + (y + qH));
    pvLogo(ctx, m, W / 2, 1660, 190, 0.45);
  }

  /* ---------- 스타일 2 · 에디토리얼 ---------- */
  function headMeta(ctx, W, m, th, pad, n) {
    ctx.fillStyle = th.mute;
    ctx.font = font(600, 20);
    T(ctx, m.program + (m.track ? '  ·  ' + m.track : ''), pad, 48, W - pad * 2 - 140, 20);
    pageTag(ctx, W, 48, n, 4, th.mute);
  }
  function band(ctx, W, H, th, text, h) {
    if (!text) return;
    var y = H - h;
    ctx.fillStyle = th.dark;
    ctx.fillRect(0, y, W, h);
    ctx.textAlign = 'center';
    ctx.fillStyle = th.onDark;
    var s = fit(ctx, text, 600, 28, 18, W - 140);
    T(ctx, text, W / 2, y + (h - s) / 2, W - 140, s);
    ctx.textAlign = 'left';
  }
  function sheet(ctx, x, y, w, h, fill, stroke) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    }
  }

  function drawCover2(ctx, W, H, m, th) {
    pvBegin('cover');
    var pad = 56, inner = W - pad * 2;
    var foot = m.waitlist && m.badge ? 120 : 0;
    ctx.fillStyle = th.paper; ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    var photoH = 600;
    pvPhoto(ctx, m.photo, pad, 44, inner, photoH, 0.50, 0.40, 0, 0.50, 0.42);
    var y = 44 + photoH + 28;
    ctx.fillStyle = th.mute; ctx.font = font(600, 20);
    T(ctx, m.program + (m.track ? '  ·  ' + m.track : ''), pad, y, inner - 130, 20);
    pageTag(ctx, W, y, 1, 4, th.mute);
    y += 42;
    ctx.fillStyle = th.ink;
    var s1 = fit(ctx, m.titleL1 || '', 700, 74, 46, inner);
    T(ctx, m.titleL1 || '', pad, y, inner, s1);
    y += Math.ceil(s1 * 1.14);
    var s2 = fit(ctx, m.titleL2 || '', 700, 74, 46, inner);
    T(ctx, m.titleL2 || '', pad, y, inner, s2);
    y += Math.ceil(s2 * 1.16) + 6;
    ctx.fillStyle = th.accent; ctx.fillRect(pad, y, 64, 4);
    y += 26;
    ctx.fillStyle = th.mute; ctx.font = font(600, 18);
    T(ctx, '일정', pad, y, 160, 18);
    y += 28;
    var date = m.dateKo || '';
    var dateMax = (!m.waitlist && m.time) ? inner * 0.66 : inner;
    ctx.fillStyle = th.ink;
    var ds = fit(ctx, date, 700, 44, 28, dateMax);
    var dateW = ctx.measureText(date).width;
    T(ctx, date, pad, y, dateMax, ds);
    if (!m.waitlist && m.time) {
      var ts = 28;
      ctx.fillStyle = th.mute; ctx.font = font(600, ts);
      T(ctx, m.time, pad + dateW + 22, y + Math.max(0, ds - ts), inner - dateW - 22, ts);
    }
    y += Math.ceil(ds * 1.22) + 14;
    ctx.fillStyle = th.ink; ctx.font = font(600, 26);
    T(ctx, (m.place || '') + (m.seats ? '    ·    정원 ' + m.seats : ''), pad, y, inner, 26);
    y += 42;
    ctx.fillStyle = th.mute; ctx.font = font(500, 22);
    T(ctx, m.who.join(' · '), pad, y, inner, 22);
    if (foot) band(ctx, W, H, th, m.badge, foot);
  }

  function drawLearn2(ctx, W, H, m, th) {
    pvBegin('learn');
    var pad = 64, inner = W - pad * 2;
    var foot = m.waitlist && m.badge ? 108 : 0;
    ctx.fillStyle = th.paper; ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    headMeta(ctx, W, m, th, pad, 2);
    label(ctx, '커리큘럼', pad, 104, th.accent);
    ctx.fillStyle = th.ink;
    var hs = fit(ctx, '무엇을 배우나', 700, 56, 40, inner);
    T(ctx, '무엇을 배우나', pad, 140, inner, hs);
    var y = 140 + Math.ceil(hs * 1.22) + 14;
    ctx.fillStyle = th.ink; ctx.font = font(500, 26);
    y += P(ctx, m.lead, pad, y, inner, 26, 40, 3) + 8;
    ctx.fillStyle = th.mute; ctx.font = font(500, 22);
    y += P(ctx, m.currIntro, pad, y, inner, 22, 34, 2) + 18;
    var days = m.days.slice(0, 4);
    var items = m.core.split(' · ').map(function (s) { return s.trim(); }).filter(Boolean);
    var coreBlock = 44 + items.length * 40;
    var listAvail = (H - foot - 28) - coreBlock - 12 - y;
    var stride = days.length ? Math.min(158, Math.floor(listAvail / days.length)) : 148;
    if (stride < 148) stride = 148;
    days.forEach(function (d, i) {
      var cy = y + i * stride;
      ctx.fillStyle = th.line; ctx.fillRect(pad, cy - 10, inner, 1);
      ctx.fillStyle = th.accent; ctx.font = font(700, 24);
      var nw = T(ctx, d.n, pad, cy, 72, 24);
      label(ctx, d.pos, pad + nw + 14, cy + 2, th.mute);
      ctx.fillStyle = th.ink; ctx.font = font(700, 28);
      T(ctx, d.h, pad, cy + 38, inner, 28);
      ctx.fillStyle = th.mute; ctx.font = font(500, 20);
      P(ctx, d.p, pad, cy + 76, inner, 20, 30, 2);
    });
    var cy = y + days.length * stride + 6;
    ctx.fillStyle = th.line; ctx.fillRect(pad, cy, inner, 1);
    label(ctx, m.coreH, pad, cy + 16, th.accent);
    ctx.font = font(600, 24);
    items.forEach(function (it, i) {
      var iy = cy + 52 + i * 40;
      ctx.fillStyle = th.accent; ctx.fillRect(pad, iy + 10, 8, 8);
      ctx.fillStyle = th.ink;
      T(ctx, it, pad + 24, iy, inner - 24, 24);
    });
    if (foot) band(ctx, W, H, th, m.badge, foot);
  }

  function drawFee2(ctx, W, H, m, th) {
    if (m.waitlist) { drawFee2Wait(ctx, W, H, m, th); return; }
    pvBegin('fee');
    var pad = 64, inner = W - pad * 2;
    ctx.fillStyle = th.paper; ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    headMeta(ctx, W, m, th, pad, 3);
    label(ctx, '일정 · 수강료', pad, 104, th.accent);
    ctx.fillStyle = th.ink;
    var hs = fit(ctx, '일정과 수강료', 700, 56, 36, inner);
    T(ctx, '일정과 수강료', pad, 140, inner, hs);
    var y = 140 + Math.ceil(hs * 1.22) + 20;
    var rows = [
      ['일정', ((m.dateKo || '') + '   ' + (m.time || '')).trim()],
      ['장소', m.place || ''],
      ['대상', m.who.join(' · ')],
      ['정원', m.seats || ''],
      ['강사', ((m.instructor || '') + (m.instructorRole ? '  ·  ' + m.instructorRole : '')).trim()]
    ];
    rows.forEach(function (r) {
      ctx.fillStyle = th.mute; ctx.font = font(600, 18);
      T(ctx, r[0], pad, y + 6, 120, 18);
      ctx.fillStyle = th.ink;
      var s = fit(ctx, r[1], 600, 28, 18, inner - 150);
      T(ctx, r[1], pad + 148, y, inner - 150, s);
      y += 62;
      ctx.fillStyle = th.line; ctx.fillRect(pad, y - 14, inner, 1);
    });
    y += 18;
    label(ctx, '수강료', pad, y, th.accent);
    y += 36;
    var gap = 16, cw = (inner - gap * 2) / 3, ch = 220;
    var cells = [
      { l: '정가', v: m.price.regular, s: m.price.regularSub || '' },
      { l: '얼리버드', v: m.price.early, s: m.price.earlyNote || m.price.earlySub || '' },
      { l: '교육비 지원', v: m.price.min, s: m.price.supportMax || '' }
    ];
    cells.forEach(function (c, i) {
      var cx = pad + i * (cw + gap);
      sheet(ctx, cx, y, cw, ch, i === 2 ? th.accent : th.card, i === 2 ? null : th.line);
      var sub = i === 2 ? 'rgba(255,255,255,0.82)' : th.mute;
      var fg = i === 2 ? '#FFFFFF' : th.ink;
      label(ctx, c.l, cx + 22, y + 22, sub);
      ctx.fillStyle = fg;
      var vs = fit(ctx, c.v || '', 700, 42, 24, cw - 44);
      T(ctx, c.v || '', cx + 22, y + 64, cw - 44, vs);
      ctx.fillStyle = sub; ctx.font = font(500, 18);
      P(ctx, c.s || '', cx + 22, y + 128, cw - 44, 18, 26, 2);
    });
    y += ch + 22;
    ctx.fillStyle = th.mute; ctx.font = font(500, 20);
    P(ctx, '교육비 지원 항목은 다음 장에서 확인하세요.', pad, y, inner, 20, 30, 1);
  }

  function drawFee2Wait(ctx, W, H, m, th) {
    pvBegin('fee');
    var pad = 64, inner = W - pad * 2;
    var foot = m.badge ? 132 : 0;
    ctx.fillStyle = th.paper; ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    headMeta(ctx, W, m, th, pad, 3);
    label(ctx, '일정', pad, 112, th.accent);
    ctx.fillStyle = th.ink;
    var ds = fit(ctx, m.dateKo || '', 700, 68, 36, inner);
    T(ctx, m.dateKo || '', pad, 156, inner, ds);
    var y = 156 + Math.ceil(ds * 1.22) + 20;
    ctx.fillStyle = th.accent; ctx.fillRect(pad, y, 64, 4);
    y += 36;
    var blocks = [
      { k: '장소', lines: [m.place || ''] },
      { k: '대상', lines: [m.who.join(' · ')] },
      { k: '정원', lines: [m.seats || ''] },
      { k: '강사', lines: [m.instructor || '', m.instructorRole || ''].filter(Boolean) }
    ].filter(function (b) { return b.lines.length && b.lines[0]; });
    var bottom = H - foot - 56;
    var slot = Math.floor((bottom - y) / Math.max(blocks.length, 1));
    if (slot > 196) slot = 196;
    if (slot < 132) slot = 132;
    blocks.forEach(function (b, i) {
      var fy = y + i * slot;
      ctx.fillStyle = th.mute; ctx.font = font(600, 18);
      T(ctx, b.k, pad, fy, inner, 18);
      ctx.fillStyle = th.ink;
      var s = fit(ctx, b.lines[0], 700, 36, 22, inner);
      T(ctx, b.lines[0], pad, fy + 32, inner, s);
      if (b.lines[1]) {
        ctx.fillStyle = th.mute; ctx.font = font(500, 22);
        T(ctx, b.lines[1], pad, fy + 80, inner, 22);
      }
    });
    if (foot) band(ctx, W, H, th, m.badge, foot);
  }

  function drawApply2(ctx, W, H, m, th) {
    if (m.waitlist) { drawApply2Wait(ctx, W, H, m, th); return; }
    pvBegin('apply');
    var pad = 64, inner = W - pad * 2;
    ctx.fillStyle = th.paper; ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    headMeta(ctx, W, m, th, pad, 4);
    label(ctx, '교육비 지원', pad, 104, th.accent);
    var title = (m.price && m.price.supportMax) || '교육비 지원';
    ctx.fillStyle = th.ink;
    var hs = fit(ctx, title, 700, 56, 36, inner);
    T(ctx, title, pad, 140, inner, hs);
    var y = 140 + Math.ceil(hs * 1.22) + 12;
    ctx.fillStyle = th.mute; ctx.font = font(500, 22);
    y += P(ctx, m.supportRule, pad, y, inner, 22, 34, 2) + 16;
    var rowH = 92;
    var list = m.support || [];
    sheet(ctx, pad, y, inner, rowH * list.length, th.card, th.line);
    list.forEach(function (s, i) {
      var ry = y + i * rowH;
      if (i > 0) { ctx.fillStyle = th.line; ctx.fillRect(pad + 24, ry, inner - 48, 1); }
      ctx.fillStyle = th.ink; ctx.font = font(700, 28);
      var hw = T(ctx, s.h, pad + 24, ry + 30, inner - 230, 28);
      if (s.s) {
        ctx.fillStyle = th.mute; ctx.font = font(500, 18);
        T(ctx, s.s, pad + 24 + hw + 12, ry + 36, inner - 250 - hw, 18);
      }
      ctx.fillStyle = th.accent; ctx.font = font(700, 28); ctx.textAlign = 'right';
      T(ctx, s.a, W - pad - 24, ry + 30, 170, 28);
      ctx.textAlign = 'left';
    });
    y += rowH * list.length + 18;
    ctx.fillStyle = th.mute; ctx.font = font(500, 20);
    y += P(ctx, m.supportNote, pad, y, inner, 20, 30, 2) + 20;
    var aH = 380;
    if (y + aH > H - 48) aH = H - 48 - y;
    sheet(ctx, pad, y, inner, aH, th.dark, null);
    var q = Math.min(aH - 64, 248);
    pvQR(ctx, m, pad + 28, y + (aH - q) / 2, q);
    var tx = pad + 28 + q + 28, tw = inner - (tx - pad) - 24;
    var ty = y + Math.max(28, (aH - 220) / 2);
    label(ctx, '신청', tx, ty, th.onDarkMute);
    ctx.fillStyle = th.onDark;
    var s = fit(ctx, m.applyLabel || '신청하기', 700, 36, 22, tw);
    T(ctx, m.applyLabel || '신청하기', tx, ty + 36, tw, s);
    ctx.fillStyle = th.onDarkMute; ctx.font = font(500, 20);
    T(ctx, m.applyUrl || '', tx, ty + 92, tw, 20);
    ctx.fillStyle = th.onDark; ctx.font = font(600, 22);
    T(ctx, '문의 ' + (m.contact || ''), tx, ty + 136, tw, 22);
    ctx.fillStyle = th.onDarkMute; ctx.font = font(500, 20);
    T(ctx, m.igMain || '', tx, ty + 174, tw, 20);
    T(ctx, m.igTag || '', tx, ty + 206, tw, 20);
  }

  function drawApply2Wait(ctx, W, H, m, th) {
    pvBegin('apply');
    var pad = 64, inner = W - pad * 2;
    ctx.fillStyle = th.paper; ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    headMeta(ctx, W, m, th, pad, 4);
    if (m.badge) {
      sheet(ctx, pad, 100, inner, 68, th.accentSoft, null);
      ctx.fillStyle = th.ink;
      var bs = fit(ctx, m.badge, 600, 24, 16, inner - 48);
      T(ctx, m.badge, pad + 24, 100 + (68 - bs) / 2, inner - 48, bs);
    }
    var cta = m.applyLabel || '대기 신청하기';
    ctx.fillStyle = th.ink;
    var cs = fit(ctx, cta, 700, 80, 48, inner);
    T(ctx, cta, pad, 204, inner, cs);
    var y = 204 + Math.ceil(cs * 1.16) + 8;
    ctx.fillStyle = th.mute; ctx.font = font(500, 28);
    T(ctx, m.dateKo || '', pad, y, inner, 28);
    y += 42;
    ctx.fillStyle = th.ink; ctx.font = font(600, 24);
    T(ctx, m.place || '', pad, y, inner, 24);
    y += 40;
    var photoH = Math.max(280, Math.min(520, H - 300 - y));
    pvPhoto(ctx, m.photo, 0, y, W, photoH, 0.50, 0.38, 0, 0.50, 0.40);
    var by = y + photoH + 36;
    var q = 232;
    pvQR(ctx, m, pad, by, q);
    var tx = pad + q + 36, tw = W - pad - tx;
    label(ctx, '신청 페이지', tx, by + 16, th.accent);
    ctx.fillStyle = th.ink;
    var us = fit(ctx, m.applyUrl || '', 600, 28, 18, tw);
    T(ctx, m.applyUrl || '', tx, by + 56, tw, us);
    ctx.fillStyle = th.ink; ctx.font = font(600, 26);
    T(ctx, '문의 ' + (m.contact || ''), tx, by + 112, tw, 26);
    ctx.fillStyle = th.mute; ctx.font = font(500, 22);
    T(ctx, m.igMain || '', tx, by + 158, tw, 22);
    T(ctx, m.igTag || '', tx, by + 194, tw, 22);
  }

  function drawStory2(ctx, W, H, m, th) {
    pvBegin('story');
    var pad = 64, inner = W - pad * 2;
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    ctx.fillStyle = th.paper; ctx.fillRect(0, 0, W, H);
    var photoH = m.waitlist ? 760 : 700;
    pvPhoto(ctx, m.photo, pad, 48, inner, photoH, 0.5, 0.38, 0, 0.5, 0.4);
    var y = 48 + photoH + 28;
    ctx.fillStyle = th.mute; ctx.font = font(600, 22);
    T(ctx, m.program + (m.track ? '  ·  ' + m.track : ''), pad, y, inner, 22);
    y += 40;
    ctx.fillStyle = th.ink;
    var s1 = fit(ctx, m.titleL1 || '', 700, 68, 44, inner);
    T(ctx, m.titleL1 || '', pad, y, inner, s1);
    y += Math.ceil(s1 * 1.12);
    var s2 = fit(ctx, m.titleL2 || '', 700, 68, 44, inner);
    T(ctx, m.titleL2 || '', pad, y, inner, s2);
    y += Math.ceil(s2 * 1.16) + 8;
    ctx.fillStyle = th.accent; ctx.fillRect(pad, y, 64, 4);
    y += 24;
    ctx.fillStyle = th.ink;
    var dateLine = m.waitlist ? (m.dateKo || '') : ((m.dateKo || '') + (m.time ? '   ' + m.time : ''));
    var ds = fit(ctx, dateLine, 700, 36, 24, inner);
    T(ctx, dateLine, pad, y, inner, ds);
    y += Math.ceil(ds * 1.25) + 8;
    ctx.font = font(600, 26);
    T(ctx, (m.place || '') + (m.seats ? '  ·  정원 ' + m.seats : ''), pad, y, inner, 26);
    y += 42;
    ctx.fillStyle = th.mute; ctx.font = font(500, 22);
    T(ctx, m.who.join(' · '), pad, y, inner, 22);
    y += 48;
    if (m.waitlist) {
      if (m.badge) {
        sheet(ctx, pad, y, inner, 84, th.dark, null);
        ctx.fillStyle = th.onDark;
        var bs = fit(ctx, m.badge, 600, 26, 16, inner - 48);
        T(ctx, m.badge, pad + 24, y + 28, inner - 48, bs);
        y += 84 + 16;
      }
    } else {
      priceTrio(ctx, m, th, pad, y, inner, 150, 40);
      y += 150 + 16;
    }
    var qW = 176, sw = inner - qW - 16, qH = 176;
    sheet(ctx, pad, y, sw, qH, th.dark, null);
    label(ctx, '신청', pad + 24, y + 22, th.onDarkMute);
    ctx.fillStyle = th.onDark;
    var s = fit(ctx, m.applyLabel || '신청하기', 700, 30, 18, sw - 48);
    T(ctx, m.applyLabel || '신청하기', pad + 24, y + 56, sw - 48, s);
    ctx.fillStyle = th.onDarkMute; ctx.font = font(500, 18);
    T(ctx, m.applyUrl || '', pad + 24, y + 104, sw - 48, 18);
    ctx.font = font(600, 20);
    T(ctx, '문의 ' + (m.contact || ''), pad + 24, y + 138, sw - 48, 20);
    sheet(ctx, pad + sw + 16, y, qW, qH, '#FFFFFF', th.line);
    pvQR(ctx, m, pad + sw + 30, y + 14, qW - 28);
    if (y + qH > 1680) PV_LOG.warn.push(curPage + ': 하단 안전영역 침범 ' + (y + qH));
    pvLogo(ctx, m, W / 2, 1760, 180, 0.55);
  }

  var LAYOUTS = {
    carousel: {
      id: 'carousel', label: '캐러셀(인스타)', theme: 'warm', scale: 1,
      note: '인스타 캐러셀 4장(4:5)과 스토리 1장(9:16)입니다.',
      pages: [
        { id: 'cover', label: '1 표지', w: 1080, h: 1350, draw: drawCarouselCover, draw2: drawCover2 },
        { id: 'learn', label: '2 배울 것', w: 1080, h: 1350, draw: drawCarouselLearn, draw2: drawLearn2 },
        { id: 'fee', label: '3 일정·수강료', labelWait: '3 일정', w: 1080, h: 1350, draw: drawCarouselFee, draw2: drawFee2 },
        { id: 'apply', label: '4 지원·신청', labelWait: '4 대기 신청', w: 1080, h: 1350, draw: drawCarouselApply, draw2: drawApply2 },
        { id: 'story', label: '스토리', w: 1080, h: 1920, draw: drawCarouselStory, draw2: drawStory2 }
      ]
    }
  };

  // 겹침·캔버스 밖 검사 (그린 뒤 호출)
  function check(layout) {
    var byPage = {};
    PV_LOG.boxes.forEach(function (b) { (byPage[b.page] = byPage[b.page] || []).push(b); });
    layout.pages.forEach(function (L) {
      var list = byPage[L.id] || [];
      list.forEach(function (b, i) {
        if (b.x < 0 || b.y < 0 || b.x + b.w > L.w || b.y + b.h > L.h) PV_LOG.warn.push(L.id + ': 캔버스 밖 "' + b.s + '"');
        for (var j = i + 1; j < list.length; j++) {
          var c = list[j];
          var ox = Math.min(b.x + b.w, c.x + c.w) - Math.max(b.x, c.x);
          var oy = Math.min(b.y + b.h * 0.85, c.y + c.h * 0.85) - Math.max(b.y, c.y);
          if (ox > 1 && oy > 1) PV_LOG.warn.push(L.id + ': 겹침 "' + b.s + '" / "' + c.s + '"');
        }
      });
    });
    return PV_LOG.warn.slice();
  }
  function resetLog() { PV_LOG.boxes.length = 0; PV_LOG.warn.length = 0; }

  /* ---------- 입력 칸 ↔ 데이터 ---------- */
  function lines(s) { return String(s || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean); }
  function cells(s) { return s.split('|').map(function (x) { return x.trim(); }); }
  function earlySubOf(until) {
    var d = /(\d{1,2})\s*월\s*(\d{1,2})\s*일/.exec(until || '');
    return d ? d[1] + '/' + d[2] + '까지' : (until ? until + '까지' : '');
  }
  function stripMax(s) { return String(s || '').replace(/^최대\s*/, ''); }
  // k: 칸 이름, label: 화면 이름, span: 두 칸 폭, area: 여러 줄, get/set: 데이터 ↔ 글자
  var FIELDS = [
    { k: 'titleL1', label: '제목 1줄', get: function (m) { return m.titleL1; }, set: function (m, v) { m.titleL1 = v; } },
    { k: 'titleL2', label: '제목 2줄', required: true, get: function (m) { return m.titleL2; }, set: function (m, v) { m.titleL2 = v; } },
    { k: 'program', label: '과정 이름(작게)', get: function (m) { return m.program; }, set: function (m, v) { m.program = v; } },
    { k: 'track', label: '구분', get: function (m) { return m.track; }, set: function (m, v) { m.track = v; } },
    { k: 'dateKo', label: '일정', required: true, get: function (m) { return m.dateKo; }, set: function (m, v) { m.dateKo = v; } },
    { k: 'time', label: '시간', required: true, modes: 'open', get: function (m) { return m.time; }, set: function (m, v) { m.time = v; } },
    { k: 'badge', label: '대기 안내', modes: 'waitlist', span: true, get: function (m) { return m.badge || ''; }, set: function (m, v) { m.badge = v; } },
    { k: 'place', label: '장소', required: true, get: function (m) { return m.place; }, set: function (m, v) { m.place = v; } },
    { k: 'seats', label: '정원', get: function (m) { return m.seats; }, set: function (m, v) { m.seats = v; } },
    { k: 'who', label: '대상 (· 로 구분)', span: true, get: function (m) { return m.who.join(' · '); }, set: function (m, v) { m.who = v.split(/\s*[·,]\s*/).filter(Boolean); } },
    { k: 'regular', label: '정가', required: true, modes: 'open', get: function (m) { return m.price.regular; }, set: function (m, v) { m.price.regular = v; } },
    { k: 'early', label: '얼리버드', modes: 'open', get: function (m) { return m.price.early; }, set: function (m, v) { m.price.early = v; } },
    { k: 'earlyUntil', label: '얼리버드 마감 (예: 11월 26일)', modes: 'open', get: function (m) { return m.price.earlyUntil; },
      set: function (m, v) { m.price.earlyUntil = v; m.price.earlySub = earlySubOf(v); m.price.earlyNote = v ? v + '까지 신청 완료' : ''; } },
    { k: 'min', label: '교육비 지원 시 최저', modes: 'open', get: function (m) { return m.price.min; }, set: function (m, v) { m.price.min = v; } },
    { k: 'supportMax', label: '교육비 지원 최대', modes: 'open', get: function (m) { return stripMax(m.price.supportMax); },
      set: function (m, v) { v = stripMax(v); m.price.supportMax = '최대 ' + v; m.supportRule = '항목마다 1회만 인정하고, 최대 ' + v + '까지 지원합니다.'; } },
    { k: 'support', label: '교육비 지원 항목 (한 줄에 하나: 항목 | 금액 | 작은 설명 | 짧은 이름)', modes: 'open', span: true, area: true,
      get: function (m) { return m.support.map(function (s) { return [s.h, s.a, s.s || '', s.short || ''].join(' | '); }).join('\n'); },
      set: function (m, v) {
        m.support = lines(v).map(function (ln) {
          var c = cells(ln);
          var a = c[1] || '';
          return { h: c[0] || '', a: a, s: c[2] || '', short: c[3] || ((c[0] || '') + ' ' + a.replace(/\s*원$/, '')) };
        });
      } },
    { k: 'supportNote', label: '교육비 지원 안내', modes: 'open', span: true, area: true, get: function (m) { return m.supportNote; }, set: function (m, v) { m.supportNote = v; } },
    { k: 'lead', label: '2장 소개 문장', span: true, area: true, get: function (m) { return m.lead; }, set: function (m, v) { m.lead = v; } },
    { k: 'currIntro', label: '2장 커리큘럼 한 줄', span: true, get: function (m) { return m.currIntro; }, set: function (m, v) { m.currIntro = v; } },
    { k: 'days', label: '2장 카드 4개 (번호 | 자세 | 제목 | 설명)', span: true, area: true,
      get: function (m) { return m.days.map(function (d) { return [d.n, d.pos, d.h, d.p].join(' | '); }).join('\n'); },
      set: function (m, v) {
        m.days = lines(v).slice(0, 4).map(function (ln) { var c = cells(ln); return { n: c[0] || '', pos: c[1] || '', h: c[2] || '', p: c[3] || '' }; });
      } },
    { k: 'coreH', label: '2장 핵심 제목', get: function (m) { return m.coreH; }, set: function (m, v) { m.coreH = v; } },
    { k: 'core', label: '2장 핵심 (· 로 구분)', get: function (m) { return m.core; }, set: function (m, v) { m.core = v; } },
    { k: 'instructor', label: '강사', get: function (m) { return m.instructor; }, set: function (m, v) { m.instructor = v; } },
    { k: 'instructorRole', label: '강사 소개', get: function (m) { return m.instructorRole; }, set: function (m, v) { m.instructorRole = v; } },
    { k: 'contact', label: '문의', get: function (m) { return m.contact; }, set: function (m, v) { m.contact = v; } },
    { k: 'applyLabel', label: '신청 안내', get: function (m) { return m.applyLabel; }, set: function (m, v) { m.applyLabel = v; } },
    { k: 'applyUrl', label: '신청 주소 (QR과 같아야 함)', span: true, get: function (m) { return m.applyUrl; }, set: function (m, v) { m.applyUrl = v; } },
    { k: 'igMain', label: '메인 계정', get: function (m) { return m.igMain; }, set: function (m, v) { m.igMain = v; } },
    { k: 'igTag', label: '태그 계정', get: function (m) { return m.igTag; }, set: function (m, v) { m.igTag = v; } }
  ];

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function sample(key) { return SAMPLES[key] ? clone(SAMPLES[key]) : null; }
  // 샘플 + 고친 값(칸 이름 → 글자) → 그릴 데이터
  function toModel(key, edits) {
    var m = sample(key);
    if (!m) return null;
    edits = edits || {};
    FIELDS.forEach(function (f) {
      if (Object.prototype.hasOwnProperty.call(edits, f.k)) f.set(m, String(edits[f.k]).trim());
    });
    return m;
  }
  function fieldOn(f, mode) {
    return !f.modes || f.modes === (mode || 'open');
  }
  function fieldsFor(mode) {
    return FIELDS.filter(function (f) { return fieldOn(f, mode || 'open'); });
  }
  function fieldValues(m) {
    var o = {};
    FIELDS.forEach(function (f) { o[f.k] = f.get(m) || ''; });
    return o;
  }
  function missing(edits, mode) {
    mode = mode || 'open';
    edits = edits || {};
    return FIELDS.filter(function (f) {
      return fieldOn(f, mode) && f.required && !String(edits[f.k] || '').trim();
    }).map(function (f) { return f.label; });
  }
  function draw(layout, page, ctx, m, opt) {
    var style = opt && String(opt.style) === '2' ? '2' : '1';
    var th = style === '2' ? THEMES.editorial : (THEMES[layout.theme] || THEMES.warm);
    var fn = style === '2' && page.draw2 ? page.draw2 : page.draw;
    pvBegin(page.id);
    fn(ctx, page.w, page.h, m, th);
  }
  function imagesFor(m) { return [m.photo.src, m.qr, m.logo].map(pvImg); }

  root.RM_POSTER_TPL = {
    SAMPLES: SAMPLES, THEMES: THEMES, LAYOUTS: LAYOUTS, FIELDS: FIELDS, LOG: PV_LOG,
    hasSample: function (key) { return !!SAMPLES[key]; },
    sample: sample, toModel: toModel, fieldValues: fieldValues, fieldsFor: fieldsFor, missing: missing,
    draw: draw, check: check, resetLog: resetLog, imagesFor: imagesFor,
    setBase: function (b) { pvBase = b; }, onLoad: function (fn) { pvOnLoad = fn; }
  };
})(window);
