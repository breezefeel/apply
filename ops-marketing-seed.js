/**
 * 지점 「마케팅 현황」 — 판단 기준 · 추가 채널 제안 (단일 소스)
 * 네이버 수치는 tools/marketing_report.py가 만든 JSON을 불러오고, 구글·당근은 화면에서 입력합니다.
 */
var OPS_MARKETING_SEED = {
  version: 'mkt-2026-10-21b',
  /** 운동센터 포지션과 맞지 않는 의료 의도 검색어 (노출되면 끄기 제안) */
  medicalPattern: '병원|의원|한의원|정형외과|신경외과|의학과|클리닉|전문의|명의|시술|수술|주사|치료|추나|디스크탈출',
  thresholds: {
    lowRank: 10,        // 평균 노출 순위가 이보다 크면 「아래쪽 노출」
    lowCtr: 0.5,        // % · 노출 1,000 이상인데 이보다 낮으면 문구·키워드 점검
    minImpForCtr: 1000,
    zeroImpShare: 0.5,  // 노출 0 그룹 비율
    bizmoneyDays: 7,    // 비즈머니가 일예산 × 이 일수보다 적으면 충전
    expSearchOffSince: '2026-10-21', // 네이버 확장 검색을 끈 날
    expSearchMinImp7: 500,           // 끈 뒤 7일이 지났는데 주간 노출이 이보다 적으면 켜기를 제안
  },
  googleStatus: [
    { id: 'canceled', label: '계정 취소됨 (재활성화 필요)' },
    { id: 'none', label: '캠페인 없음' },
    { id: 'paused', label: '캠페인 일시중지' },
    { id: 'review', label: '광고 검토 중' },
    { id: 'running', label: '운영 중' }
  ],
  karrotStatus: [
    { id: 'unknown', label: '확인 필요' },
    { id: 'none', label: '미진행' },
    { id: 'profile', label: '비즈프로필만 운영' },
    { id: 'running', label: '광고 운영 중' }
  ],
  /**
   * 콘텐츠 채널 목표 (주당 게시 수). 근거 우선순위: 계정 확인(보고서 channels · tools/channel_check.js) → 블로그 RSS → 플래너 발행 기록.
   * keys = 발행 기록 키, cats = 이 계정에 올라가는 프로그램(카테고리 id). 인스타 계정 매핑은 planner.js INSTAGRAM_* 와 같다.
   * branch: true 는 지점마다 따로 올리는 소식 → 최근 게시일을 지점별로 적는다.
   */
  contentChannels: [
    { id: 'blog', label: '네이버 블로그', perWeek: 3, keys: ['blog'], use: '블로그' },
    // 실제 운영: @dr.park_dc.pt가 모든 프로그램 글을 올리고, 프로그램 계정은 공동작업(콜라보)으로 함께 걸린다
    // source: 'planner' — 인스타·쓰레드는 로그인 없이 게시일을 읽을 수 없어 플래너 「발행완료」로만 센다
    { id: 'ig_park', label: '인스타 @dr.park_dc.pt', perWeek: 5, keys: ['insta'], cats: [0, 1, 2, 3, 4, 5], use: '인스타', source: 'planner' },
    { id: 'ig_movement', label: '인스타 @re.al_movement_official', perWeek: 2, keys: ['insta'], cats: [1], use: '인스타 (리얼무브먼트 콜라보)', source: 'planner' },
    { id: 'ig_cmt', label: '인스타 @cmt_academy', perWeek: 1, keys: ['insta'], cats: [3], use: '인스타 (CMT 콜라보)', source: 'planner' },
    { id: 'ig_face', label: '인스타 @dr.face_ifc', perWeek: 2, keys: ['insta'], cats: [2, 4], use: '인스타 (IFC·리얼페이스 콜라보)', source: 'planner' },
    { id: 'threads', label: '쓰레드 @dr.park_dc.pt', perWeek: 3, keys: ['threads', 'thread'], use: '쓰레드', source: 'planner' },
    { id: 'place', label: '네이버 플레이스 소식', perWeek: 1, keys: ['newsNaver'], branch: true, use: '소식 (네이버)' },
    { id: 'karrot', label: '당근 소식', perWeek: 1, keys: ['newsKarrot'], branch: true, use: '소식 (당근)' },
    { id: 'kakao', label: '카카오 채널 소식', perWeek: 0.5, keys: ['newsKakao'], branch: true, use: '소식 (카카오)' }
  ],
  /**
   * 홍보 현황 탭 — 브랜딩(키 mikadoc) · 약수점 · 인천점
   * 브랜딩 = 블로그·인스타·쓰레드·지점 소식 전부 + 채널 프로필 검토(ops-channel-review-seed.js)
   * 약수점·인천점 = 네이버·구글 키워드 광고 리포트만 (channels 비움)
   * channels: 위 contentChannels id → 이 탭에서 볼 프로그램(cats)·목표(perWeek)·표시 이름 덧붙임(note)만 바꾼다.
   *   branches: 지점 소식 채널을 지점마다 한 줄씩 보여 준다.
   * blog.rss: true 는 블로그 전체(RSS), 아니면 플래너 발행 기록에서 해당 프로그램 글만 센다.
   */
  promoScopes: {
    mikadoc: { label: '브랜딩', desc: '블로그 · 인스타 4개 계정 · 쓰레드 · 지점 소식(플레이스·당근·카카오) · 채널 프로필 검토', ads: false, cats: [0, 1, 2, 3, 4, 5],
      channels: {
        blog: { rss: true, perWeek: 3, note: '전체' },
        ig_park: { perWeek: 5, note: '전 프로그램' },
        ig_movement: { perWeek: 2, note: '리얼무브먼트' },
        ig_cmt: { perWeek: 1, note: 'CMT' },
        ig_face: { perWeek: 2, note: 'IFC·리얼페이스' },
        threads: { perWeek: 3 },
        place: { branches: ['yaksu', 'jakjeon'] },
        karrot: { branches: ['yaksu', 'jakjeon'] },
        kakao: { branches: ['yaksu', 'jakjeon'] }
      } },
    yaksu: { label: '약수점', desc: '리얼무브먼트 약수점 · 네이버·구글 키워드 광고 리포트', ads: true, cats: [1], channels: {} },
    jakjeon: { label: '인천점', desc: '리얼무브먼트·리얼페이스 인천점 · 네이버·구글 키워드 광고 리포트', ads: true, cats: [1, 2], face: true, channels: {} }
  },
  /** 인천점 리얼페이스 키워드 후보 — 네이버 키워드 도구 월간 검색수 (2026-10-21) · 아직 광고 계정에 없음 */
  faceKeywordCandidates: [
    { kw: '부평경락', vol: 2990, note: '지역 · 얼굴 관리 수요' },
    { kw: '인천경락', vol: 730, note: '지역' },
    { kw: '인천안면비대칭', vol: 65, note: '지역' },
    { kw: '부평안면비대칭', vol: 15, note: '지역' },
    { kw: '얼굴비대칭교정', vol: 6910, note: '전국 · 지역 타게팅 필요' },
    { kw: '얼굴경락', vol: 5420, note: '전국 · 지역 타게팅 필요' },
    { kw: '안면비대칭교정', vol: 4440, note: '전국 · 지역 타게팅 필요' },
    { kw: '턱교정', vol: 1320, note: '전국 · 치과 의도 섞임' },
    { kw: '인디바', vol: 570, note: '장비명 · 리얼페이스 고유' },
    { kw: '얼굴교정', vol: 180, note: '전국' }
  ],
  /** 브랜딩 탭에서 같이 해볼 것 (채널 검토 보고서 아래) */
  mikadocExtras: [
    { title: '프로필 링크 허브 점검', cost: '무료', fit: '필수',
      why: '인스타·블로그·쓰레드 프로필 링크가 미카닥 프로필(전문가 과정·지점·예약)로 한 번에 이어지는지 확인합니다.' },
    { title: '전문가 과정 모집 전 후기·사례 글', cost: '무료', fit: '높음',
      why: '모집 시작 2~3주 전부터 수강 후기·현장 사진·연구모임 소식을 블로그와 @cmt_academy·@dr.face_ifc에 올려 신청 직전 신뢰를 쌓습니다.' },
    { title: '시연 릴스 → 유튜브 쇼츠 재활용', cost: '무료', fit: '중간',
      why: '이미 만든 시연 영상을 그대로 쇼츠에 올리면 검색 노출 채널이 하나 늘어납니다.' },
    { title: '치료사 커뮤니티·협회 채널 공지', cost: '무료', fit: '중간',
      why: '물리치료·도수 치료사 모임, 학회 공지에 과정 일정을 올려 전문가 대상 유입을 늘립니다.' },
    { title: '네이버 블로그 증상·동작 글', cost: '무료 (시간)', fit: '높음',
      why: '검색광고에서 비싼 증상 검색어(거북목, 휜다리 교정 운동 등)는 블로그 글로 무료 노출을 노립니다. 리얼무브먼트·리얼페이스 글 끝에는 예약·오시는 길 링크가 자동으로 붙습니다.' },
    { title: '카카오톡 채널 재방문 메시지', cost: '건당 소액', fit: '중간',
      why: '기존·휴면 회원에게 재방문 안내를 보냅니다. 신규 광고보다 비용 대비 예약 전환이 높은 경우가 많습니다.' },
    { title: '인스타그램 지역 타깃 광고', cost: '하루 5,000원부터', fit: '중간',
      why: '이미 만드는 시연 릴스를 지점 반경 3km에 노출합니다. 검색광고가 「찾는 사람」이라면 이쪽은 「아직 안 찾은 사람」을 만납니다.' },
    { title: '주변 직장·아파트 제휴', cost: '인쇄비 정도', fit: '중간',
      why: '사무직 많은 직장, 단지 커뮤니티에 1:1 상담 체험을 안내합니다. 인천점은 힐스테이트자이 계양 커뮤니티 안이라 입주민 대상 안내가 가장 빠릅니다.' }
  ],
  /** 프로그램 균형 점검: 이 기간 동안 어느 채널에도 안 나간 프로그램을 알린다 */
  programGapDays: 14,
  programCats: [
    { id: 0, label: '도수치료' }, { id: 1, label: '리얼 무브먼트' }, { id: 2, label: '리얼 페이스' },
    { id: 3, label: 'CMT' }, { id: 4, label: 'IFC' }, { id: 5, label: 'Re:Al' }
  ],
  /** 약수점·인천점 탭: 키워드 광고와 같이 볼 것 (콘텐츠·SNS 제안은 브랜딩 탭) */
  extraChannels: [
    { title: '유입 경로 기록 · 전환 추적', cost: '무료', fit: '필수',
      why: '지금은 어느 광고로 상담이 왔는지 알 수 없습니다. 상담 때 「어디서 보고 오셨어요?」를 묻고, 아래 문의 수 칸에 채널별로 적습니다. 홈페이지(아임웹)에 네이버 전환추적·구글 태그를 붙이면 광고비 대비 문의를 계산할 수 있습니다.' },
    { title: '네이버 플레이스 광고', cost: '클릭당 과금 · 소액 가능', fit: '높음',
      why: '「{{areaSt}} PT」「{{area}} 체형교정」처럼 지역 검색에서 지도·플레이스 영역 위에 노출됩니다. 파워링크보다 동네 손님 의도가 강하고, 클릭당 비용이 낮은 편입니다. 플레이스 정리(브랜딩 탭 PL-01·PL-02)를 먼저 끝내고 켜세요.' },
    { title: '광고 랜딩 = 플레이스·홈페이지 정리', cost: '무료', fit: '높음',
      why: '광고를 눌러 들어온 손님은 홈페이지(/85·/120)와 플레이스를 같이 봅니다. 가격·소개·리뷰가 약하면 광고비를 써도 예약이 안 됩니다. 브랜딩 탭 「채널 프로필 검토」의 오늘 항목부터 처리하세요.' }
  ]
};
