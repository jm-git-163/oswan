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

/**
 * Real-time canvas compose (MotiQ-style): play clip once, burn layers + BGM.
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
      videoBitsPerSecond: 2_500_000,
      audioBitsPerSecond: 96_000,
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
  // slight tail so last frames flush
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
  const { accent, accent2, bgTop, bgBot } = template;
  const beatPhase = (ms % beatPeriod) / beatPeriod;
  const beatPulse = Math.pow(1 - beatPhase, 2.4);

  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, bgTop);
  g.addColorStop(1, bgBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.globalAlpha = 0.2 + beatPulse * 0.08;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1;
  const scroll = (ms * 0.04) % 48;
  for (let y = -48; y < H + 48; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y + scroll);
    ctx.lineTo(W, y + scroll);
    ctx.stroke();
  }
  for (let x = 0; x < W; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  for (let i = 0; i < 18; i++) {
    const life = ((ms * 0.0004) + i / 18) % 1;
    const x = (Math.sin(i * 12.7) * 0.5 + 0.5) * W;
    const y = H - life * (H + 40);
    ctx.globalAlpha = (1 - life) * 0.55;
    ctx.fillStyle = i % 2 ? accent : accent2;
    ctx.beginPath();
    ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  const padX = 36;
  const top = 160;
  const camH = H * 0.58;
  const camW = W - padX * 2;
  ctx.save();
  rr(ctx, padX, top, camW, camH, 28);
  ctx.clip();
  const vw = video.videoWidth || 1;
  const vh = video.videoHeight || 1;
  const scale = Math.max(camW / vw, camH / vh);
  const dw = vw * scale;
  const dh = vh * scale;
  ctx.drawImage(video, padX + (camW - dw) / 2, top + (camH - dh) / 2, dw, dh);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = hexAlpha(accent, 0.45 + beatPulse * 0.4);
  ctx.lineWidth = 3 + beatPulse * 4;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 12 + beatPulse * 18;
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

  if (ms < 2200) {
    const a = ms < 400 ? ms / 400 : ms > 1800 ? (2200 - ms) / 400 : 1;
    ctx.save();
    ctx.globalAlpha = Math.max(0, a);
    ctx.fillStyle = accent;
    ctx.font = '800 54px Pretendard, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`SQUAT × ${meta.targetReps}`, W / 2, top + camH / 2);
    ctx.restore();
  }

  const progress = Math.min(1, ms / Math.max(1, totalMs));
  const shown = Math.min(
    meta.reps,
    Math.max(1, Math.round(meta.reps * Math.max(progress, 0.15))),
  );
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 72px Pretendard, sans-serif';
  ctx.fillText(`${shown}`, W / 2, top + camH + 90);
  ctx.fillStyle = accent;
  ctx.font = '700 22px Pretendard, sans-serif';
  ctx.fillText(`/ ${meta.targetReps} · 목표 개수`, W / 2, top + camH + 126);

  const r = 26;
  const cx = padX + 40;
  const cy = top + 40;
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 4;
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.strokeStyle = accent;
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
  ctx.stroke();

  ctx.save();
  const flashA = 0.12 + beatPulse * 0.28;
  const gt = ctx.createLinearGradient(0, 0, 0, 120);
  gt.addColorStop(0, hexAlpha(accent, flashA));
  gt.addColorStop(1, hexAlpha(accent, 0));
  ctx.fillStyle = gt;
  ctx.fillRect(0, 0, W, 120);
  const gb = ctx.createLinearGradient(0, H - 140, 0, H);
  gb.addColorStop(0, hexAlpha(accent, 0));
  gb.addColorStop(1, hexAlpha(accent, flashA));
  ctx.fillStyle = gb;
  ctx.fillRect(0, H - 140, W, 140);
  ctx.restore();

  if (ms > totalMs - 2800) {
    const local = (ms - (totalMs - 2800)) / 2800;
    ctx.save();
    ctx.globalAlpha = Math.min(1, local * 2);
    ctx.translate(W / 2, H - 210);
    ctx.rotate((-8 * Math.PI) / 180);
    rr(ctx, -110, -36, 220, 72, 16);
    ctx.fillStyle = meta.cleared ? accent : '#FF5A5A';
    ctx.fill();
    ctx.fillStyle = '#0A0A0A';
    ctx.font = '800 34px Pretendard, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(meta.cleared ? '오스완!' : '다시!', 0, 2);
    ctx.restore();
  }

  ctx.fillStyle = '#6E6E6E';
  ctx.font = '600 14px Pretendard, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('#오스완  #오늘스쿼트완료  #스쿼트챌린지', W / 2, H - 36);

  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}

export function prideFileFromBlob(blob: Blob, templateId: string): File {
  const ext = extForMime(blob.type);
  return new File([blob], `oswan-${templateId}.${ext}`, {
    type: blob.type || `video/${ext}`,
  });
}
