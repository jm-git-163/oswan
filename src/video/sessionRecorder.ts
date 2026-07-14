import { extForMime, pickRecordingMimeType } from './codec';

/**
 * Records the live camera <video> via mirrored canvas (no BGM).
 * Compose step adds templates + music later (MotiQ pattern).
 */
export class SessionRecorder {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private raf = 0;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private mime = 'video/webm';
  private running = false;

  start(video: HTMLVideoElement): boolean {
    this.stopSync();
    const mime = pickRecordingMimeType();
    if (!mime) return false;

    const W = 720;
    const H = 1280;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return false;

    this.canvas = canvas;
    this.ctx = ctx;
    this.mime = mime;
    this.chunks = [];
    this.running = true;

    const draw = () => {
      if (!this.running || !this.ctx || !this.canvas) return;
      const c = this.ctx;
      c.fillStyle = '#0A0A0A';
      c.fillRect(0, 0, W, H);
      const vw = video.videoWidth || 1;
      const vh = video.videoHeight || 1;
      const scale = Math.max(W / vw, H / vh);
      const dw = vw * scale;
      const dh = vh * scale;
      const dx = (W - dw) / 2;
      const dy = (H - dh) / 2;
      // mirror like preview
      c.save();
      c.translate(W, 0);
      c.scale(-1, 1);
      c.drawImage(video, W - dx - dw, dy, dw, dh);
      c.restore();
      this.raf = requestAnimationFrame(draw);
    };
    draw();

    const stream = canvas.captureStream(30);
    try {
      this.recorder = new MediaRecorder(stream, {
        mimeType: mime,
        videoBitsPerSecond: 2_000_000,
      });
    } catch {
      this.recorder = new MediaRecorder(stream);
    }

    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.recorder.start(1000);
    return true;
  }

  stop(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const rec = this.recorder;
      if (!rec || rec.state === 'inactive') {
        this.stopSync();
        resolve(null);
        return;
      }
      rec.onstop = () => {
        const blob = this.chunks.length
          ? new Blob(this.chunks, { type: this.mime })
          : null;
        this.stopSync();
        resolve(blob && blob.size > 8_000 ? blob : null);
      };
      try {
        rec.stop();
      } catch {
        this.stopSync();
        resolve(null);
      }
    });
  }

  private stopSync() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.recorder = null;
    this.canvas = null;
    this.ctx = null;
    this.chunks = [];
  }

  fileFromBlob(blob: Blob, basename = 'oswan-raw'): File {
    const ext = extForMime(blob.type || this.mime);
    return new File([blob], `${basename}.${ext}`, { type: blob.type || this.mime });
  }
}
