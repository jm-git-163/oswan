import { useCallback, useEffect, useRef, useState } from 'react';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

export type Landmark = {
  x: number;
  y: number;
  z?: number;
  score?: number;
  visibility?: number;
};

const BP_TO_MN = [0, 2, 5, 7, 8, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];

const WASM =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

export function usePose(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled = true,
) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const rafRef = useRef<number>(0);
  const lastTs = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM);
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numPoses: 1,
        });
        if (cancelled) {
          landmarker.close();
          return;
        }
        landmarkerRef.current = landmarker;
        setReady(true);
      } catch (e) {
        console.error(e);
        try {
          const vision = await FilesetResolver.forVisionTasks(WASM);
          const landmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL, delegate: 'CPU' },
            runningMode: 'VIDEO',
            numPoses: 1,
          });
          if (cancelled) {
            landmarker.close();
            return;
          }
          landmarkerRef.current = landmarker;
          setReady(true);
        } catch (e2) {
          console.error(e2);
          setError('포즈 엔진을 불러오지 못했어요.');
        }
      }
    })();
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
      setReady(false);
    };
  }, [enabled]);

  const loop = useCallback(() => {
    const video = videoRef.current;
    const lm = landmarkerRef.current;
    if (video && lm && video.readyState >= 2 && video.videoWidth > 0) {
      const now = performance.now();
      if (now > lastTs.current) {
        lastTs.current = now;
        try {
          const result = lm.detectForVideo(video, now);
          const bp = result.landmarks?.[0];
          if (bp && bp.length >= 33) {
            setLandmarks(
              BP_TO_MN.map((i) => {
                const p = bp[i];
                return {
                  x: p.x,
                  y: p.y,
                  z: p.z,
                  score: p.visibility ?? 1,
                  visibility: p.visibility ?? 0,
                };
              }),
            );
          }
        } catch {
          /* frame skip */
        }
      }
    }
    rafRef.current = requestAnimationFrame(loop);
  }, [videoRef]);

  useEffect(() => {
    if (!ready || !enabled) return;
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [ready, enabled, loop]);

  return { ready, error, landmarks };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function stopCamera(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => {
    try {
      t.stop();
    } catch {
      /* ignore */
    }
  });
}

/** Release any stream already bound to this video element. */
export function releaseVideo(video: HTMLVideoElement | null) {
  if (!video) return;
  const prev = video.srcObject;
  if (prev instanceof MediaStream) stopCamera(prev);
  video.srcObject = null;
}

export async function startCamera(
  video: HTMLVideoElement,
  facingMode: 'user' | 'environment' = 'user',
): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('getUserMedia unsupported');
  }

  // Always free previous capture first (fixes NotReadableError from stale locks)
  releaseVideo(video);
  await sleep(250);

  video.setAttribute('playsinline', 'true');
  video.setAttribute('webkit-playsinline', 'true');
  video.muted = true;
  video.playsInline = true;

  const attempts: MediaStreamConstraints[] = [
    {
      audio: false,
      video: { facingMode: { ideal: facingMode }, width: { ideal: 640 }, height: { ideal: 480 } },
    },
    { audio: false, video: { facingMode } },
    { audio: false, video: true },
  ];

  let lastError: unknown;
  for (const constraints of attempts) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = stream;
      try {
        await video.play();
      } catch {
        /* muted + user gesture should be enough */
      }
      return stream;
    } catch (err) {
      lastError = err;
      await sleep(350);
    }
  }
  throw lastError;
}
