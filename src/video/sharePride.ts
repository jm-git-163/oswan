import { isLikelyInAppBrowser } from '../lib/browser';
import type { ShareOutcome } from '../lib/share';

function isUserCancel(err: unknown) {
  return err instanceof DOMException && err.name === 'AbortError';
}

export type PrideShareResult = {
  outcome: ShareOutcome | 'unsupported';
  message: string;
  downloaded?: boolean;
  captionCopied?: boolean;
};

export function canShareVideoFile(file: File): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false;
  if (typeof navigator.canShare !== 'function') {
    // Older Safari: try share anyway
    return true;
  }
  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

/** Ensure File has SNS-friendly name/mime (Kakao prefers mp4). */
export function preparePrideShareFile(blob: Blob, basename = 'oswan-clear'): File {
  const type = blob.type || 'video/webm';
  const isMp4 = /mp4|quicktime/i.test(type);
  const ext = isMp4 ? 'mp4' : 'webm';
  const mime = isMp4 ? 'video/mp4' : type.includes('webm') ? 'video/webm' : type;
  return new File([blob], `${basename}.${ext}`, { type: mime });
}

/**
 * Opens OS share sheet with the video file so user can pick Kakao / Instagram / etc.
 * Must be called directly from a tap (user gesture).
 */
export async function sharePrideVideo(file: File, caption: string): Promise<PrideShareResult> {
  if (isLikelyInAppBrowser()) {
    return {
      outcome: 'unsupported',
      message: '카톡 안 브라우저에서는 SNS 공유가 막혀요. Chrome에서 열고 다시 눌러 주세요.',
    };
  }

  if (file.size < 8_000) {
    return { outcome: 'unsupported', message: '영상이 비어 있어요. 다시 만들어 주세요.' };
  }

  // Path 1: native file share → Kakao / Instagram / Files appear in sheet
  if (canShareVideoFile(file)) {
    try {
      await navigator.share({
        files: [file],
        title: '오스완 · 오늘 스쿼트 완료',
        text: caption,
      });
      return { outcome: 'shared', message: '공유 앱을 선택했어요.' };
    } catch (err) {
      if (isUserCancel(err)) {
        return { outcome: 'cancelled', message: '공유가 취소됐어요.' };
      }
      // fall through
    }
  }

  // Path 2: some browsers share without canShare
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({
        files: [file],
        title: '오스완 · 오늘 스쿼트 완료',
        text: caption,
      });
      return { outcome: 'shared', message: '공유 앱을 선택했어요.' };
    } catch (err) {
      if (isUserCancel(err)) {
        return { outcome: 'cancelled', message: '공유가 취소됐어요.' };
      }
    }
  }

  // Path 3: save + caption — user attaches in SNS manually
  downloadPrideFile(file);
  let captionCopied = false;
  try {
    await navigator.clipboard.writeText(caption);
    captionCopied = true;
  } catch {
    /* */
  }

  const webmHint = /webm/i.test(file.type)
    ? ' (이 기기는 webm이라 카톡 첨부가 안 될 수 있어요. 인스타·갤러리 앱을 써 보세요.)'
    : '';

  return {
    outcome: 'copied',
    message: captionCopied
      ? `영상을 저장했고 캡션을 복사했어요. 카톡/인스타를 열고 갤러리에서 첨부하세요.${webmHint}`
      : `영상을 저장했어요. SNS 앱에서 갤러리로 첨부하세요.${webmHint}`,
    downloaded: true,
    captionCopied,
  };
}

export function downloadPrideFile(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function copyPrideCaption(caption: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(caption);
    return true;
  } catch {
    return false;
  }
}

export function prideCaption(nickname: string, reps: number, cleared: boolean) {
  return cleared
    ? `${nickname} · ${reps}개 · 오스완!\n오늘 스쿼트 완료 #오스완 #오늘스쿼트완료 #스쿼트챌린지`
    : `${nickname} · ${reps}개 · 다시 오스완! #오스완`;
}

export function openInstagram() {
  // Do not use intent:// — can bounce to Play Store. Soft open.
  window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
}

export function openYouTubeStudio() {
  window.open('https://www.youtube.com/upload', '_blank', 'noopener,noreferrer');
}
