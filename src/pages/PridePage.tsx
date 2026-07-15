import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandMark } from '../components/BrandMark';
import { PrideShareSheet } from '../components/PrideShareSheet';
import { useAppStore } from '../store';
import { composePrideVideo } from '../video/compose';
import { preparePrideShareFile, prideCaption } from '../video/sharePride';
import { getPrideTemplate, PRIDE_TEMPLATES, type PrideTemplateId } from '../video/templates';

type Phase = 'pick' | 'composing' | 'ready' | 'error';

export function PridePage() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user)!;
  const result = useAppStore((s) => s.lastResult);
  const rawBlob = useAppStore((s) => s.lastRawVideo);
  const [templateId, setTemplateId] = useState<PrideTemplateId>('viral-stamp');
  const [phase, setPhase] = useState<Phase>('pick');
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [outUrl, setOutUrl] = useState<string | null>(null);
  const [shareFile, setShareFile] = useState<File | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (outUrl) URL.revokeObjectURL(outUrl);
    };
  }, [outUrl]);

  const meta = useMemo(
    () => ({
      nickname: user.nickname,
      reps: result?.reps ?? 0,
      targetReps: result?.targetReps ?? 30,
      cleared: result?.cleared ?? false,
    }),
    [user.nickname, result],
  );

  const caption = prideCaption(meta.nickname, meta.reps, meta.cleared);

  const runCompose = async () => {
    if (!rawBlob) {
      setError('이번 세션 영상이 없어요. 스쿼트를 다시 한 뒤 와 주세요.');
      setPhase('error');
      return;
    }
    setPhase('composing');
    setError(null);
    setProgress(0);
    try {
      const template = getPrideTemplate(templateId);
      const blob = await composePrideVideo(rawBlob, template, meta, (p) => {
        setProgress(p.percent);
        setProgressLabel(p.phase);
      });
      const file = preparePrideShareFile(blob, `oswan-${templateId}`);
      setShareFile(file);
      if (outUrl) URL.revokeObjectURL(outUrl);
      setOutUrl(URL.createObjectURL(blob));
      setPhase('ready');
    } catch (e) {
      console.warn('[pride]', e);
      setError(e instanceof Error ? e.message : '합성에 실패했어요.');
      setPhase('error');
    }
  };

  if (!result) {
    return (
      <div className="page">
        <p className="meta">결과가 없어요.</p>
        <button className="cta-primary" style={{ marginTop: 16 }} onClick={() => navigate('/')}>
          홈
        </button>
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <BrandMark size={36} />
        <div>
          <div style={{ fontWeight: 800 }}>영상으로 자랑</div>
          <div className="meta" style={{ color: 'var(--accent)', fontWeight: 600 }}>
            선택 · 템플릿 + 음악 + 레이어
          </div>
        </div>
      </div>

      <p className="meta" style={{ marginTop: 16, lineHeight: 1.5, fontSize: 14 }}>
        풀화면·스탬프·스코어보드처럼 피드에서 멈추게 만드는 템플릿을 골라요. 합성은 기기에서만.
      </p>

      {!rawBlob && (
        <div
          className="card"
          style={{ marginTop: 16, border: '1px solid var(--warn)', color: 'var(--warn)', fontSize: 14 }}
        >
          원본 영상이 없습니다. 홈에서 스쿼트를 다시 완료한 뒤 「영상으로 자랑」을 눌러 주세요.
        </div>
      )}

      {(phase === 'pick' || phase === 'error') && (
        <>
          <div style={{ marginTop: 20, display: 'grid', gap: 10 }}>
            {PRIDE_TEMPLATES.map((t) => {
              const active = templateId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplateId(t.id)}
                  className="card"
                  style={{
                    textAlign: 'left',
                    border: active ? `1px solid ${t.accent}` : '1px solid transparent',
                    background: active
                      ? `linear-gradient(135deg, ${t.bgTop}, ${t.bgBot})`
                      : undefined,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontWeight: 800 }}>{t.title}</div>
                    <span style={{ color: t.accent, fontWeight: 700, fontSize: 12 }}>{t.moodLabel}</span>
                  </div>
                  <div className="meta" style={{ marginTop: 6 }}>
                    {t.subtitle}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: t.accent, lineHeight: 1.4 }}>
                    {t.hook}
                  </div>
                </button>
              );
            })}
          </div>

          {error && (
            <p className="meta" style={{ color: 'var(--danger)', marginTop: 12 }}>
              {error}
            </p>
          )}

          <button
            className="cta-primary"
            style={{ marginTop: 20 }}
            disabled={!rawBlob}
            onClick={() => void runCompose()}
          >
            이 템플릿으로 만들기
          </button>
          <button className="cta-secondary" style={{ marginTop: 10 }} onClick={() => navigate('/result')}>
            결과로 돌아가기
          </button>
        </>
      )}

      {phase === 'composing' && (
        <div className="card" style={{ marginTop: 28, textAlign: 'center', padding: 28 }}>
          <div className="hero-num" style={{ fontSize: 48, color: 'var(--accent)' }}>
            {progress}%
          </div>
          <div className="meta" style={{ marginTop: 12 }}>
            {progressLabel || '합성 중…'}
          </div>
          <div
            style={{
              marginTop: 20,
              height: 6,
              borderRadius: 999,
              background: 'var(--surface-3)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: 'var(--accent)',
                transition: 'width 0.2s',
              }}
            />
          </div>
          <p className="meta" style={{ marginTop: 16, fontSize: 12 }}>
            음악·그리드·파티클·HUD를 입히는 중이에요. 화면을 켜 두세요.
          </p>
        </div>
      )}

      {phase === 'ready' && outUrl && (
        <>
          <div
            className="card"
            style={{
              marginTop: 20,
              padding: 0,
              overflow: 'hidden',
              border: '1px solid rgba(200,245,74,0.25)',
            }}
          >
            <video
              src={outUrl}
              controls
              playsInline
              loop
              style={{ width: '100%', aspectRatio: '9/16', maxHeight: '58dvh', background: '#000' }}
            />
          </div>
          <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
            <button className="cta-primary" onClick={() => setSheetOpen(true)}>
              SNS로 바로 공유 / 업로드
            </button>
            <button
              className="cta-secondary"
              onClick={() => {
                setPhase('pick');
                setSheetOpen(false);
                setShareFile(null);
                if (outUrl) URL.revokeObjectURL(outUrl);
                setOutUrl(null);
              }}
            >
              다른 템플릿으로
            </button>
            <button className="cta-secondary" onClick={() => navigate('/')}>
              홈
            </button>
          </div>
        </>
      )}

      <PrideShareSheet
        open={sheetOpen}
        file={shareFile}
        caption={caption}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}
