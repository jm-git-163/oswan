import { getCoachPrefs } from './coachPrefs';

/** Reuse pride-pack sport track for session motivation (local asset). */
export const SESSION_BGM_SRC = '/bgm/anomy5-aggressive-sport-phonk-464391.mp3';
const BGM_VOLUME = 0.32;

export type CheerTone = 'go' | 'mid' | 'hot' | 'finish';

export type CheerCue = {
  line: string;
  tone: CheerTone;
};

const GO = ['시작!', '가자!', '올려!'];
const MID = ['좋아요!', '리듬!', '한 개씩!', '숨 고르고!', '계속!', '나이스!'];
const HOT = ['화이팅!', '강해져!', '굿!', '밀어붙여!'];
const HALF = ['절반!', '반 왔어요!', '페이스 굿!'];
const LATE = ['조금만 더!', '거의 다!', '막판이다!', '오스완!', '스퍼트!'];
const FINISH = ['마지막!', '하나 더!', '끝장내!'];

export function cheerForRep(count: number, target: number): CheerCue {
  if (count <= 0) return { line: pick(GO, 0), tone: 'go' };
  const left = Math.max(0, target - count);
  const ratio = target > 0 ? count / target : 0;

  if (left === 1) return { line: '마지막 하나!', tone: 'finish' };
  if (left === 2) return { line: '앞으로 2개!', tone: 'finish' };
  if (left === 3) return { line: '앞으로 3개!', tone: 'finish' };
  if (count === Math.ceil(target / 2) || (ratio >= 0.48 && ratio <= 0.52)) {
    return { line: pick(HALF, count), tone: 'hot' };
  }
  if (ratio >= 0.8) return { line: pick(FINISH, count), tone: 'finish' };
  if (ratio >= 0.6) return { line: pick(LATE, count), tone: 'hot' };
  if (count % 10 === 0) return { line: `${count}개!`, tone: 'hot' };
  if (count % 5 === 0) return { line: pick(HOT, count), tone: 'mid' };
  return { line: pick(MID, count), tone: 'mid' };
}

function pick(list: string[], seed: number): string {
  return list[Math.abs(seed) % list.length]!;
}

let bgmEl: HTMLAudioElement | null = null;

export function startSessionBgm(): void {
  if (!getCoachPrefs().music) return;
  try {
    if (!bgmEl) {
      bgmEl = new Audio(SESSION_BGM_SRC);
      bgmEl.loop = true;
      bgmEl.preload = 'auto';
    }
    bgmEl.volume = BGM_VOLUME;
    bgmEl.currentTime = 0;
    void bgmEl.play().catch(() => {
      /* need prior gesture */
    });
  } catch {
    /* ignore */
  }
}

export function stopSessionBgm(): void {
  try {
    bgmEl?.pause();
    if (bgmEl) bgmEl.currentTime = 0;
  } catch {
    /* ignore */
  }
}

export function speakCheer(text: string): void {
  if (!getCoachPrefs().cheer) return;
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 1.08;
    u.pitch = 1.05;
    u.volume = 0.85;
    const voices = window.speechSynthesis.getVoices();
    const ko = voices.find((v) => /ko/i.test(v.lang));
    if (ko) u.voice = ko;
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}
