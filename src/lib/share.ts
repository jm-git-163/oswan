import type { Challenge } from './types';
import { challengeShareUrl } from './storage';

export type ShareOutcome = 'shared' | 'cancelled' | 'copied' | 'fallback';

function isUserCancel(err: unknown) {
  // AbortError = user closed the sheet. NotAllowedError often = lost user-gesture — fall through.
  return err instanceof DOMException && err.name === 'AbortError';
}

export function challengeShareText(challenge: Challenge, url: string) {
  return [
    `🥊 오스완 도전장`,
    `${challenge.fromNickname}님이 ${challenge.targetReps}개 클리어에 도전합니다.`,
    `목표 채우면 오늘 스쿼트 완료 — 너도 오스완?`,
    url,
    `#오스완 #오늘스쿼트완료`,
  ].join('\n');
}

export function resultShareText(nickname: string, reps: number, target: number, cleared: boolean) {
  return cleared
    ? `${nickname} · ${reps}개 · 오스완!\n오늘 스쿼트 완료 #오스완 #오늘스쿼트완료`
    : `${nickname} · ${reps}/${target} · 다시 오스완!`;
}

/** Draw branded challenge card for messenger image share. */
export async function renderChallengeCardBlob(challenge: Challenge): Promise<Blob> {
  const w = 1080;
  const h = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0A0A0A';
  ctx.fillRect(0, 0, w, h);

  // card plate
  roundRect(ctx, 48, 48, w - 96, h - 96, 48, '#151515');

  // accent frame
  ctx.strokeStyle = '#C8F54A';
  ctx.lineWidth = 4;
  roundStroke(ctx, 48, 48, w - 96, h - 96, 48);

  // logo plate
  const lx = w / 2;
  const ly = 220;
  roundRect(ctx, lx - 70, ly - 70, 140, 140, 32, '#1E1E1E');
  ctx.strokeStyle = '#C8F54A';
  ctx.lineWidth = 3;
  roundStroke(ctx, lx - 70, ly - 70, 140, 140, 32);
  drawStick(ctx, lx, ly, 52);

  ctx.fillStyle = '#A1A1A1';
  ctx.font = '600 28px Pretendard, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('OSWAN · 오늘 스쿼트 완료', w / 2, 360);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 56px Pretendard, sans-serif';
  ctx.fillText('오스완 도전장', w / 2, 440);

  ctx.fillStyle = '#C8F54A';
  ctx.font = '700 34px Pretendard, sans-serif';
  ctx.fillText(`${challenge.fromNickname}님이 보냈어요`, w / 2, 520);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 200px Pretendard, sans-serif';
  ctx.fillText(String(challenge.targetReps), w / 2, 780);

  ctx.fillStyle = '#A1A1A1';
  ctx.font = '600 36px Pretendard, sans-serif';
  ctx.fillText('목표 개수 · 클리어하면 오스완', w / 2, 870);

  roundRect(ctx, 180, 980, w - 360, 100, 28, '#1E1E1E');
  ctx.fillStyle = '#C8F54A';
  ctx.font = '700 34px Pretendard, sans-serif';
  ctx.fillText('너도 오스완 할 수 있어?', w / 2, 1044);

  ctx.fillStyle = '#6E6E6E';
  ctx.font = '500 26px Pretendard, sans-serif';
  ctx.fillText('링크를 열어 도전을 수락하세요', w / 2, 1160);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('blob failed'))),
      'image/png',
      0.92,
    );
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function roundStroke(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.stroke();
}

function drawStick(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.strokeStyle = '#C8F54A';
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy - s * 0.55, s * 0.22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.3);
  ctx.lineTo(cx, cy + s * 0.1);
  ctx.moveTo(cx, cy + s * 0.1);
  ctx.lineTo(cx - s * 0.55, cy + s * 0.7);
  ctx.moveTo(cx, cy + s * 0.1);
  ctx.lineTo(cx + s * 0.55, cy + s * 0.7);
  ctx.moveTo(cx, cy - s * 0.05);
  ctx.lineTo(cx - s * 0.45, cy + s * 0.25);
  ctx.moveTo(cx, cy - s * 0.05);
  ctx.lineTo(cx + s * 0.45, cy + s * 0.25);
  ctx.stroke();
}

/**
 * Opens OS share sheet (Kakao/메신저 포함).
 * Text share first so we keep the user-gesture (iOS). Image share is opt-in.
 */
export async function shareChallengeInvite(
  challenge: Challenge,
  opts?: { withImage?: boolean },
): Promise<ShareOutcome> {
  const url = challengeShareUrl(challenge);
  const title = '오스완 도전장 · 오늘 스쿼트 완료';
  const text = challengeShareText(challenge, url);

  if (opts?.withImage && typeof navigator.share === 'function') {
    try {
      const blob = await renderChallengeCardBlob(challenge);
      const file = new File([blob], `oswan-${challenge.targetReps}.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title, text });
        return 'shared';
      }
    } catch (err) {
      if (isUserCancel(err)) return 'cancelled';
    }
  }

  if (typeof navigator.share === 'function') {
    try {
      // text에 URL 포함 — iOS/카톡이 url 필드를 버리는 경우 대비
      await navigator.share({ title, text });
      return 'shared';
    } catch (err) {
      if (isUserCancel(err)) return 'cancelled';
    }
  }

  // Desktop / 미지원 → 호출측에서 폴백 시트 표시
  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'fallback';
  }
}

export async function sharePlainText(title: string, text: string): Promise<ShareOutcome> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text });
      return 'shared';
    } catch (err) {
      if (isUserCancel(err)) return 'cancelled';
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'fallback';
  }
}

/** Kakao / SMS / Telegram deep helpers for desktop fallback sheet */
export function openSmsShare(text: string) {
  window.open(`sms:?&body=${encodeURIComponent(text)}`, '_self');
}

export function openTelegramShare(url: string, text: string) {
  window.open(
    `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    '_blank',
    'noopener,noreferrer',
  );
}
