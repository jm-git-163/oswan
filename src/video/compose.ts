import { extForMime, pickRecordingMimeType } from './codec';
import type { PrideTemplate } from './templates';

export type ComposeMeta = {
  nickname: string;
  reps: number;
  targetReps: number;
  cleared: boolean;
};

export type ComposeProgress = {
  phase: string;
  percent: number;
};

const W = 720;
const H = 1280;
const FPS = 24;

function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function hexAlpha(hex: string, a: number) {
  const n = Math.round(Math.min(1, Math.max(0, a)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${n}`;
}

async function loadVideo(blob: Blob): Promise<{ video: HTMLVideoElement; url: string }> {
  const url = URL.createObjectURL(blob);
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = url;
  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('영상 로드 실패'));
  });
  return { video, url };
}

async function loadAudioBuffer(ctx: AudioContext, src: string): Promise<AudioBuffer | null> {
  try {
    const res = await fetch(src);
    const ab = await res.arrayBuffer();
    return await ctx.decodeAudioData(ab.slice(0));
  } catch {
    return null;
  }
}

function coverVideo(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const vw = video.videoWidth || 1;
  const vh = video.videoHeight || 1;
  const scale = Math.max(w / vw, h / vh);
  const dw = vw * scale;
  const dh = vh * scale;
  ctx.drawImage(video, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

/**
 * Real-time canvas compose: play clip once, burn layout + BGM.
 */
export async function composePrideVideo(
  raw: Blob,
  template: PrideTemplate,
  meta: ComposeMeta,
  onProgress?: (p: ComposeProgress) => void,
): Promise<Blob> {
  const mime = pickRecordingMimeType() || 'video/webm';
  const { video, url } = await loadVideo(raw);
  const durationSec = Math.min(Math.max(video.duration || 8, 3), 60);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { alpha: false })!;

  const audioCtx = new AudioContext();
  const dest = audioCtx.createMediaStreamDestination();
  const bgmGain = audioCtx.createGain();
  bgmGain.gain.value = template.bgmVolume;
  bgmGain.connect(dest);

  const bgmBuf = await loadAudioBuffer(audioCtx, template.bgmSrc);
  let bgmSrcNode: AudioBufferSourceNode | null = null;
  if (bgmBuf) {
    bgmSrcNode = audioCtx.createBufferSource();
    bgmSrcNode.buffer = bgmBuf;
    bgmSrcNode.loop = true;
    bgmSrcNode.connect(bgmGain);
  }

  const vStream = canvas.captureStream(FPS);
  const mixed = new MediaStream([
    ...vStream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ]);

  const chunks: Blob[] = [];
  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(mixed, {
      mimeType: mime,
      videoBitsPerSecond: 3_200_000,
      audioBitsPerSecond: 128_000,
    });
  } catch {
    recorder = new MediaRecorder(mixed);
  }
  recorder.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };

  const done = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      URL.revokeObjectURL(url);
      void audioCtx.close();
      const out = new Blob(chunks, { type: recorder.mimeType || mime });
      if (out.size < 8_000) reject(new Error('합성 결과가 비었어요'));
      else resolve(out);
    };
    recorder.onerror = () => reject(new Error('녹화 오류'));
  });

  video.currentTime = 0;
  await video.play();
  if (bgmSrcNode) bgmSrcNode.start(0);
  recorder.start(400);
  onProgress?.({ phase: '합성 중', percent: 0 });

  const beatPeriod = 60_000 / template.bpm;
  const started = performance.now();

  await new Promise<void>((resolve) => {
    let lastPct = -1;
    const tick = () => {
      const elapsed = (performance.now() - started) / 1000;
      const t = Math.min(elapsed, durationSec);
      const ms = t * 1000;
      drawFrame(ctx, video, template, meta, ms, durationSec * 1000, beatPeriod);

      const pct = Math.min(99, Math.round((t / durationSec) * 100));
      if (pct !== lastPct) {
        lastPct = pct;
        onProgress?.({ phase: '레이어·음악 입히는 중', percent: pct });
      }

      if (t >= durationSec - 0.05 || video.ended) {
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  video.pause();
  onProgress?.({ phase: '마무리', percent: 100 });
  try {
    bgmSrcNode?.stop();
  } catch {
    /* */
  }
  await new Promise((r) => setTimeout(r, 120));
  recorder.stop();
  return done;
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  template: PrideTemplate,
  meta: ComposeMeta,
  ms: number,
  totalMs: number,
  beatPeriod: number,
) {
  const beatPhase = (ms % beatPeriod) / beatPeriod;
  const beatPulse = Math.pow(1 - beatPhase, 2.4);
  const progress = Math.min(1, ms / Math.max(1, totalMs));
  const shown = Math.min(
    meta.reps,
    Math.max(1, Math.round(meta.reps * Math.max(progress, 0.12))),
  );

  switch (template.layout) {
    case 'fullbleed':
      drawFullbleed(ctx, video, template, meta, ms, totalMs, beatPulse, shown, progress);
      break;
    case 'stamp':
      drawStamp(ctx, video, template, meta, ms, totalMs, beatPulse, shown, progress);
      break;
    case 'scoreboard':
      drawScoreboard(ctx, video, template, meta, ms, totalMs, beatPulse, shown, progress);
      break;
    default:
      drawFramed(ctx, video, template, meta, ms, totalMs, beatPulse, shown, progress);
  }
}

function drawBg(ctx: CanvasRenderingContext2D, template: PrideTemplate) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, template.bgTop);
  g.addColorStop(1, template.bgBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawBigRepCount(
  ctx: CanvasRenderingContext2D,
  value: number | string,
  x: number,
  y: number,
  accent: string,
  opts?: { size?: number; label?: string },
) {
  const size = opts?.size ?? 96;
  const text = String(value);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // plate behind number for contrast
  const tw = Math.max(160, text.length * size * 0.62);
  const th = size + (opts?.label ? 52 : 28);
  rr(ctx, x - tw / 2, y - th / 2, tw, th, 22);
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fill();
  ctx.strokeStyle = hexAlpha(accent, 0.85);
  ctx.lineWidth = 3;
  ctx.stroke();

  // outline then fill — readable on any footage
  ctx.font = `900 ${size}px Pretendard, sans-serif`;
  ctx.lineWidth = Math.max(6, size * 0.08);
  ctx.strokeStyle = '#0A0A0A';
  ctx.strokeText(text, x, opts?.label ? y - 12 : y);
  ctx.fillStyle = accent;
  ctx.fillText(text, x, opts?.label ? y - 12 : y);

  if (opts?.label) {
    ctx.font = '800 22px Pretendard, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(opts.label, x, y + size * 0.38);
  }
  ctx.restore();
}

function drawHashtags(ctx: CanvasRenderingContext2D, y = H - 36) {
  ctx.fillStyle = '#6E6E6E';
  ctx.font = '600 14px Pretendard, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('#오스완  #오늘스쿼트완료  #스쿼트챌린지', W / 2, y);
}

function drawEndBadge(
  ctx: CanvasRenderingContext2D,
  meta: ComposeMeta,
  ms: number,
  totalMs: number,
  accent: string,
) {
  if (ms <= totalMs - 2800) return;
  const local = (ms - (totalMs - 2800)) / 2800;
  ctx.save();
  ctx.globalAlpha = Math.min(1, local * 2);
  ctx.translate(W / 2, H - 200);
  ctx.rotate((-8 * Math.PI) / 180);
  rr(ctx, -120, -40, 240, 80, 18);
  ctx.fillStyle = meta.cleared ? accent : '#FF5A5A';
  ctx.fill();
  ctx.fillStyle = '#0A0A0A';
  ctx.font = '800 36px Pretendard, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(meta.cleared ? '오스완!' : '다시!', 0, 2);
  ctx.restore();
}

function drawVignette(ctx: CanvasRenderingContext2D, strength = 0.5) {
  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.18, W / 2, H / 2, H * 0.78);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}

/** Classic lime frame card */
function drawFramed(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  template: PrideTemplate,
  meta: ComposeMeta,
  ms: number,
  totalMs: number,
  beatPulse: number,
  shown: number,
  progress: number,
) {
  const { accent, accent2 } = template;
  drawBg(ctx, template);

  ctx.save();
  ctx.globalAlpha = 0.18 + beatPulse * 0.08;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1;
  const scroll = (ms * 0.04) % 48;
  for (let y = -48; y < H + 48; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y + scroll);
    ctx.lineTo(W, y + scroll);
    ctx.stroke();
  }
  ctx.restore();

  const padX = 36;
  const top = 150;
  const camH = H * 0.56;
  const camW = W - padX * 2;
  ctx.save();
  rr(ctx, padX, top, camW, camH, 28);
  ctx.clip();
  coverVideo(ctx, video, padX, top, camW, camH);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = hexAlpha(accent, 0.45 + beatPulse * 0.4);
  ctx.lineWidth = 3 + beatPulse * 4;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 12 + beatPulse * 16;
  rr(ctx, padX, top, camW, camH, 28);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = accent;
  ctx.font = '800 28px Pretendard, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('오스완', 40, 64);
  ctx.fillStyle = '#A1A1A1';
  ctx.font = '600 16px Pretendard, sans-serif';
  ctx.fillText('오늘 스쿼트 완료', 40, 92);
  ctx.textAlign = 'right';
  ctx.fillStyle = accent2;
  ctx.font = '700 14px Pretendard, sans-serif';
  ctx.fillText(template.moodLabel, W - 40, 64);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 18px Pretendard, sans-serif';
  ctx.fillText(meta.nickname, W - 40, 92);

  if (ms < 2000) {
    const a = ms < 350 ? ms / 350 : ms > 1600 ? (2000 - ms) / 400 : 1;
    ctx.save();
    ctx.globalAlpha = Math.max(0, a);
    ctx.fillStyle = accent;
    ctx.font = '800 52px Pretendard, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`SQUAT × ${meta.targetReps}`, W / 2, top + camH / 2);
    ctx.restore();
  }

  ctx.textAlign = 'center';
  drawBigRepCount(ctx, shown, W / 2, top + camH + 100, accent, {
    size: 88,
    label: `/ ${meta.targetReps} · 클리어 ${meta.cleared ? '✓' : '진행'}`,
  });

  drawProgressRing(ctx, padX + 40, top + 40, progress, accent);
  drawEndBadge(ctx, meta, ms, totalMs, accent);
  drawHashtags(ctx);
  drawVignette(ctx, 0.42);
}

/** Edge-to-edge camera — neon / cinematic */
function drawFullbleed(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  template: PrideTemplate,
  meta: ComposeMeta,
  ms: number,
  totalMs: number,
  beatPulse: number,
  shown: number,
  progress: number,
) {
  const { accent, accent2 } = template;
  const film = template.id === 'cinematic';

  coverVideo(ctx, video, 0, 0, W, H);

  if (film) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, W, 110);
    ctx.fillRect(0, H - 160, W, 160);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(0, 0, W, H);
  } else {
    const scrub = ctx.createLinearGradient(0, 0, 0, H);
    scrub.addColorStop(0, hexAlpha(template.bgTop, 0.75));
    scrub.addColorStop(0.35, 'rgba(0,0,0,0.15)');
    scrub.addColorStop(0.7, 'rgba(0,0,0,0.2)');
    scrub.addColorStop(1, hexAlpha(template.bgBot, 0.85));
    ctx.fillStyle = scrub;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalAlpha = 0.35 + beatPulse * 0.35;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, W - 36, H - 36);
    ctx.strokeStyle = accent2;
    ctx.strokeRect(28, 28, W - 56, H - 56);
    ctx.restore();
  }

  ctx.fillStyle = accent;
  ctx.font = film ? '600 18px Pretendard, sans-serif' : '800 26px Pretendard, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(film ? 'OSWAN' : '오스완', 36, film ? 58 : 56);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 20px Pretendard, sans-serif';
  ctx.fillText(meta.nickname, 36, film ? 86 : 84);

  ctx.textAlign = 'right';
  ctx.fillStyle = accent2;
  ctx.font = '800 14px Pretendard, sans-serif';
  ctx.fillText(template.moodLabel, W - 36, 56);

  // kinetic intro
  if (ms < 2400) {
    const a = ms < 400 ? ms / 400 : ms > 2000 ? (2400 - ms) / 400 : 1;
    const scale = 0.92 + beatPulse * 0.08;
    ctx.save();
    ctx.globalAlpha = Math.max(0, a);
    ctx.translate(W / 2, H * 0.42);
    ctx.scale(scale, scale);
    ctx.fillStyle = accent;
    ctx.font = film ? '800 48px Pretendard, sans-serif' : '900 56px Pretendard, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(film ? "TODAY'S SQUAT" : '오늘 스쿼트', 0, 0);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 64px Pretendard, sans-serif';
    ctx.fillText(`${meta.targetReps}`, 0, 70);
    ctx.restore();
  }

  // bottom score strip
  ctx.fillStyle = film ? 'rgba(0,0,0,0.0)' : hexAlpha(accent, 0.12 + beatPulse * 0.1);
  rr(ctx, 28, H - 230, W - 56, 120, 20);
  ctx.fill();
  drawBigRepCount(ctx, shown, W / 2, H - 170, accent, {
    size: 92,
    label: `${meta.cleared ? 'CLEARED' : 'IN PROGRESS'}  ·  목표 ${meta.targetReps}`,
  });

  // progress bar
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  rr(ctx, 40, H - 88, W - 80, 8, 4);
  ctx.fill();
  ctx.fillStyle = accent;
  rr(ctx, 40, H - 88, (W - 80) * progress, 8, 4);
  ctx.fill();

  drawEndBadge(ctx, meta, ms, totalMs, accent);
  drawHashtags(ctx, H - 48);
  if (!film) drawVignette(ctx, 0.35);
}

/** Big diagonal stamp — viral thumbnail style */
function drawStamp(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  template: PrideTemplate,
  meta: ComposeMeta,
  ms: number,
  totalMs: number,
  beatPulse: number,
  shown: number,
  progress: number,
) {
  const { accent, accent2 } = template;
  coverVideo(ctx, video, 0, 0, W, H);

  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.fillRect(0, 0, W, H);

  // floating particles
  ctx.save();
  for (let i = 0; i < 22; i++) {
    const life = (ms * 0.00035 + i / 22) % 1;
    const x = ((Math.sin(i * 9.1) * 0.5 + 0.5) * W);
    const y = H - life * (H + 60);
    ctx.globalAlpha = (1 - life) * 0.7;
    ctx.fillStyle = i % 2 ? accent : accent2;
    ctx.beginPath();
    ctx.arc(x, y, 3 + (i % 4), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // top chip
  rr(ctx, 28, 40, 220, 48, 14);
  ctx.fillStyle = hexAlpha(accent, 0.95);
  ctx.fill();
  ctx.fillStyle = '#0A0A0A';
  ctx.font = '800 22px Pretendard, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('오늘 스쿼트 완료', 48, 64);
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 18px Pretendard, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(meta.nickname, W - 36, 70);

  // giant diagonal stamp
  const stampPop = 1 + beatPulse * 0.04;
  ctx.save();
  ctx.translate(W / 2, H * 0.48);
  ctx.rotate((-18 * Math.PI) / 180);
  ctx.scale(stampPop, stampPop);
  ctx.strokeStyle = hexAlpha(accent, 0.9);
  ctx.lineWidth = 10;
  rr(ctx, -250, -70, 500, 140, 24);
  ctx.stroke();
  ctx.fillStyle = hexAlpha(accent, 0.18);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.font = '900 72px Pretendard, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(meta.cleared ? 'OSWAN' : `${shown} REP`, 0, 0);
  ctx.restore();

  // bottom ticker
  ctx.fillStyle = accent;
  ctx.fillRect(0, H - 170, W, 170);
  drawBigRepCount(ctx, shown, W / 2, H - 95, '#0A0A0A', {
    size: 100,
    label: `목표 ${meta.targetReps} · ${Math.round(progress * 100)}%`,
  });

  drawEndBadge(ctx, meta, ms, totalMs, accent2);
}

/** Broadcast scoreboard strip */
function drawScoreboard(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  template: PrideTemplate,
  meta: ComposeMeta,
  ms: number,
  totalMs: number,
  beatPulse: number,
  shown: number,
  progress: number,
) {
  const { accent, accent2 } = template;
  drawBg(ctx, template);

  // live camera window
  const camTop = 200;
  const camH = H * 0.5;
  ctx.save();
  rr(ctx, 24, camTop, W - 48, camH, 20);
  ctx.clip();
  coverVideo(ctx, video, 24, camTop, W - 48, camH);
  ctx.restore();
  ctx.strokeStyle = hexAlpha(accent, 0.5 + beatPulse * 0.3);
  ctx.lineWidth = 3;
  rr(ctx, 24, camTop, W - 48, camH, 20);
  ctx.stroke();

  // LIVE badge
  rr(ctx, 40, camTop + 20, 72, 28, 8);
  ctx.fillStyle = '#FF3B3B';
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 14px Pretendard, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LIVE', 76, camTop + 34);
  ctx.textBaseline = 'alphabetic';

  // header board
  ctx.fillStyle = hexAlpha(accent, 0.12);
  rr(ctx, 24, 36, W - 48, 140, 18);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.font = '800 18px Pretendard, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('OSWAN SCOREBOARD', 44, 68);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 28px Pretendard, sans-serif';
  ctx.fillText(meta.nickname, 44, 108);
  ctx.fillStyle = '#A1A1A1';
  ctx.font = '600 16px Pretendard, sans-serif';
  ctx.fillText(meta.cleared ? '미션 클리어' : '진행 중', 44, 140);

  ctx.textAlign = 'right';
  drawBigRepCount(ctx, shown, W - 150, 100, accent, {
    size: 72,
    label: `GOAL ${meta.targetReps}`,
  });

  // lower stats row
  const rowY = camTop + camH + 36;
  const cellW = (W - 48 - 16) / 2;
  drawStatCell(ctx, 24, rowY, cellW, 100, 'REPS', String(shown), accent);
  drawStatCell(ctx, 24 + cellW + 16, rowY, cellW, 100, 'TARGET', String(meta.targetReps), accent2);

  // progress
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  rr(ctx, 24, rowY + 120, W - 48, 14, 7);
  ctx.fill();
  ctx.fillStyle = accent;
  rr(ctx, 24, rowY + 120, (W - 48) * progress, 14, 7);
  ctx.fill();

  if (ms < 1800) {
    const a = ms < 300 ? ms / 300 : ms > 1400 ? (1800 - ms) / 400 : 1;
    ctx.save();
    ctx.globalAlpha = Math.max(0, a);
    ctx.fillStyle = hexAlpha(accent, 0.92);
    ctx.font = '900 40px Pretendard, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('COUNT IT UP', W / 2, camTop + camH / 2);
    ctx.restore();
  }

  drawEndBadge(ctx, meta, ms, totalMs, accent);
  drawHashtags(ctx);
  drawVignette(ctx, 0.4);
}

function drawStatCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  accent: string,
) {
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  rr(ctx, x, y, w, h, 16);
  ctx.fill();
  ctx.fillStyle = '#A1A1A1';
  ctx.font = '700 14px Pretendard, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(label, x + 18, y + 32);
  ctx.fillStyle = accent;
  ctx.font = '900 40px Pretendard, sans-serif';
  ctx.fillText(value, x + 18, y + 78);
}

function drawProgressRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  progress: number,
  accent: string,
) {
  const r = 26;
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 4;
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.strokeStyle = accent;
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
  ctx.stroke();
}

export function prideFileFromBlob(blob: Blob, templateId: string): File {
  const ext = extForMime(blob.type);
  return new File([blob], `oswan-${templateId}.${ext}`, {
    type: blob.type || `video/${ext}`,
  });
}
