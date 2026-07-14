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
        // CPU fallback
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

export async function startCamera(
  video: HTMLVideoElement,
  facingMode: 'user' | 'environment' = 'user',
): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('getUserMedia unsupported');
  }

  video.setAttribute('playsinline', 'true');
  video.setAttribute('webkit-playsinline', 'true');
  video.muted = true;

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 720 },
        height: { ideal: 1280 },
      },
    });
  } catch {
    // Looser fallback for some Android WebViews
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: true,
    });
  }

  video.srcObject = stream;
  try {
    await video.play();
  } catch {
    // Autoplay policies — muted + playsinline usually OK after user gesture
  }
  return stream;
}

export function stopCamera(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop());
}
