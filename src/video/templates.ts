export type PrideTemplateId =
  | 'oswan-clear'
  | 'neon-phonk'
  | 'squat-arena'
  | 'viral-stamp'
  | 'cinematic'
  | 'scoreboard';

/** Visual system for compose drawFrame */
export type PrideLayout = 'framed' | 'fullbleed' | 'stamp' | 'scoreboard';

export type PrideTemplate = {
  id: PrideTemplateId;
  title: string;
  subtitle: string;
  accent: string;
  accent2: string;
  bgTop: string;
  bgBot: string;
  bgmSrc: string;
  bgmVolume: number;
  bpm: number;
  moodLabel: string;
  layout: PrideLayout;
  /** Short viral hook under title in picker */
  hook: string;
};

export const PRIDE_TEMPLATES: PrideTemplate[] = [
  {
    id: 'oswan-clear',
    title: '오스완 클리어',
    subtitle: '라임 스탬프 · 비트 펄스',
    hook: '친구가 “뭐야 이거” 할 기본 자랑템',
    accent: '#C8F54A',
    accent2: '#FFFFFF',
    bgTop: '#0A0A0A',
    bgBot: '#12180A',
    bgmSrc: '/bgm/anomy5-aggressive-sport-phonk-464391.mp3',
    bgmVolume: 0.72,
    bpm: 140,
    moodLabel: 'CLEAR',
    layout: 'framed',
  },
  {
    id: 'viral-stamp',
    title: '바이럴 스탬프',
    subtitle: '대각선 OSWAN · 세로 풀블리드',
    hook: '릴스 썸네일로 바로 써먹는 큰 글자',
    accent: '#C8F54A',
    accent2: '#FF3CAC',
    bgTop: '#050505',
    bgBot: '#0A0A0A',
    bgmSrc: '/bgm/anomy5-aggressive-sport-phonk-464391.mp3',
    bgmVolume: 0.74,
    bpm: 148,
    moodLabel: 'STAMP',
    layout: 'stamp',
  },
  {
    id: 'neon-phonk',
    title: '네온 폰크',
    subtitle: '핑크·시안 · 풀화면 카메라',
    hook: '야간 클럽 무드 · 피드에 튀는 톤',
    accent: '#FF3CAC',
    accent2: '#00F0FF',
    bgTop: '#090014',
    bgBot: '#001018',
    bgmSrc: '/bgm/anomy5-neon-night-phonk-house-by-anomy5-178380.mp3',
    bgmVolume: 0.7,
    bpm: 128,
    moodLabel: 'NEON',
    layout: 'fullbleed',
  },
  {
    id: 'scoreboard',
    title: '스코어보드',
    subtitle: '방송 점수판 · 카운트업',
    hook: '도전 vs 결과 — 한눈에, 공유 클릭 유도',
    accent: '#C8F54A',
    accent2: '#FFFFFF',
    bgTop: '#070B05',
    bgBot: '#101810',
    bgmSrc: '/bgm/anomy5-aggressive-sport-phonk-464391.mp3',
    bgmVolume: 0.7,
    bpm: 136,
    moodLabel: 'LIVE',
    layout: 'scoreboard',
  },
  {
    id: 'cinematic',
    title: '시네마틱',
    subtitle: '레터박스 · 느린 훅 타이틀',
    hook: '진지하게 자랑할 때 · 프리미엄 톤',
    accent: '#E8E0D0',
    accent2: '#C8F54A',
    bgTop: '#050505',
    bgBot: '#0E0E0C',
    bgmSrc: '/bgm/anomy5-neon-night-phonk-house-by-anomy5-178380.mp3',
    bgmVolume: 0.55,
    bpm: 100,
    moodLabel: 'FILM',
    layout: 'fullbleed',
  },
  {
    id: 'squat-arena',
    title: '스쿼트 아레나',
    subtitle: '인디고 × 에너지 옐로',
    hook: '체육관 배틀 느낌 · 챌린지용',
    accent: '#FFD23F',
    accent2: '#FF3B3B',
    bgTop: '#0A1530',
    bgBot: '#1B2A4E',
    bgmSrc: '/bgm/anomy5-aggressive-sport-phonk-464391.mp3',
    bgmVolume: 0.68,
    bpm: 145,
    moodLabel: 'ARENA',
    layout: 'framed',
  },
];

export function getPrideTemplate(id: PrideTemplateId): PrideTemplate {
  return PRIDE_TEMPLATES.find((t) => t.id === id) ?? PRIDE_TEMPLATES[0]!;
}
