/**
 * Kakao/Line in-app WebView helpers — camera & Web Share break there.
 */

export function isLikelyInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = (navigator.userAgent || '').toLowerCase();
  return (
    ua.includes('kakaotalk') ||
    ua.includes('kakaostory') ||
    ua.includes('line/') ||
    ua.includes('; wv)') ||
    ua.includes('fbav') ||
    ua.includes('instagram')
  );
}

export function isKakaoInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = (navigator.userAgent || '').toLowerCase();
  return ua.includes('kakaotalk') || ua.includes('kakaostory');
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fallthrough */
    }
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return !!ok;
  } catch {
    return false;
  }
}

export type OpenExternalResult =
  | { method: 'android-chrome-intent' }
  | { method: 'ios-copy'; copied: boolean }
  | { method: 'navigate' }
  | { method: 'noop' };

/** Open current (or given) URL in Chrome/Safari outside the in-app WebView. */
export async function openInExternalBrowser(url?: string): Promise<OpenExternalResult> {
  if (typeof window === 'undefined') return { method: 'noop' };
  const href = url || window.location.href;
  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isIOS =
    /iPhone|iPad|iPod/i.test(ua) ||
    (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);

  if (isAndroid) {
    const stripped = href.replace(/^https?:\/\//i, '');
    const intent =
      `intent://${stripped}` +
      '#Intent;scheme=https;action=android.intent.action.VIEW;' +
      'package=com.android.chrome;S.browser_fallback_url=' +
      encodeURIComponent(href) +
      ';end';
    window.location.href = intent;
    return { method: 'android-chrome-intent' };
  }

  if (isIOS) {
    const copied = await copyTextToClipboard(href);
    return { method: 'ios-copy', copied };
  }

  try {
    window.open(href, '_blank', 'noopener,noreferrer');
  } catch {
    window.location.href = href;
  }
  return { method: 'navigate' };
}

/** Set when native app stores go live. */
export const NATIVE_APP = {
  available: false as boolean,
  androidUrl: '' as string,
  iosUrl: '' as string,
  label: '오스완 앱 설치 (곧 출시)',
};
