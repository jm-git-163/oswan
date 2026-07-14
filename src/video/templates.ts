export type PrideTemplateId = 'oswan-clear' | 'neon-phonk' | 'squat-arena';

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
};

export const PRIDE_TEMPLATES: PrideTemplate[] = [
  {
    id: 'oswan-clear',
    title: '오스완 클리어',
    subtitle: '오늘 스쿼트 완료 · 라임 스탬프',
    accent: '#C8F54A',
    accent2: '#FFFFFF',
    bgTop: '#0A0A0A',
    bgBot: '#12180A',
    bgmSrc: '/bgm/anomy5-aggressive-sport-phonk-464391.mp3',
    bgmVolume: 0.72,
    bpm: 140,
    moodLabel: 'CLEAR',
  },
  {
    id: 'neon-phonk',
    title: '네온 폰크',
    subtitle: '핑크·시안 비트 레이어',
    accent: '#FF3CAC',
    accent2: '#00F0FF',
    bgTop: '#090014',
    bgBot: '#001018',
    bgmSrc: '/bgm/anomy5-neon-night-phonk-house-by-anomy5-178380.mp3',
    bgmVolume: 0.7,
    bpm: 128,
    moodLabel: 'NEON',
  },
  {
    id: 'squat-arena',
    title: '스쿼트 아레나',
    subtitle: '인디고 × 에너지 옐로',
    accent: '#FFD23F',
    accent2: '#FF3B3B',
    bgTop: '#0A1530',
    bgBot: '#1B2A4E',
    bgmSrc: '/bgm/anomy5-aggressive-sport-phonk-464391.mp3',
    bgmVolume: 0.68,
    bpm: 145,
    moodLabel: 'ARENA',
  },
];

export function getPrideTemplate(id: PrideTemplateId): PrideTemplate {
  return PRIDE_TEMPLATES.find((t) => t.id === id) ?? PRIDE_TEMPLATES[0]!;
}
