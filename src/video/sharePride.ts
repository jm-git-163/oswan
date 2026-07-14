import type { ShareOutcome } from '../lib/share';

function isUserCancel(err: unknown) {
  return err instanceof DOMException && err.name === 'AbortError';
}

export async function sharePrideVideo(file: File, caption: string): Promise<ShareOutcome> {
  if (typeof navigator.share === 'function') {
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: '오스완 · 오늘 스쿼트 완료',
          text: caption,
        });
        return 'shared';
      }
      await navigator.share({ title: '오스완', text: `${caption}` });
      // still download so they have the file
      downloadPrideFile(file);
      return 'shared';
    } catch (err) {
      if (isUserCancel(err)) return 'cancelled';
    }
  }

  downloadPrideFile(file);
  try {
    await navigator.clipboard.writeText(caption);
  } catch {
    /* */
  }
  return 'copied';
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

export function prideCaption(nickname: string, reps: number, cleared: boolean) {
  return cleared
    ? `${nickname} · ${reps}개 · 오스완!\n오늘 스쿼트 완료 #오스완 #오늘스쿼트완료 #스쿼트챌린지`
    : `${nickname} · ${reps}개 · 다시 오스완! #오스완`;
}
