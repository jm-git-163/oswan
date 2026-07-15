import { useState } from 'react';
import { CoachToggles } from '../components/CoachToggles';
import { NumberField } from '../components/NumberField';
import { SurfaceCard } from '../components/ui';
import { backendStatus, lastBackendSyncOk } from '../lib/api';
import { getCoachPrefs, type CoachPrefs } from '../lib/coachPrefs';
import {
  DEFAULT_BODY_WEIGHT_KG,
  getBodyWeightKg,
  hasCustomBodyWeight,
  setBodyWeightKg,
} from '../lib/estimates';
import { updateNickname, clearLocalAccount } from '../lib/storage';
import { useAppStore } from '../store';

export function MePage() {
  const user = useAppStore((s) => s.user)!;
  const setUser = useAppStore((s) => s.setUser);
  const [name, setName] = useState(user.nickname);
  const [saved, setSaved] = useState(false);
  const [weight, setWeight] = useState(() => getBodyWeightKg());
  const [weightSaved, setWeightSaved] = useState(false);
  const [coachPrefs, setCoachPrefsState] = useState<CoachPrefs>(() => getCoachPrefs());
  const backend = backendStatus();

  const wipeAccount = () => {
    if (
      !window.confirm(
        '이 기기의 Soft ID·세션·도전장·설정을 모두 삭제할까요? 되돌릴 수 없어요.',
      )
    ) {
      return;
    }
    clearLocalAccount();
    setUser(null);
    window.location.href = '/';
  };

  return (
    <div className="page page-enter">
      <h1 className="page-title">나</h1>
      <p className="meta" style={{ marginBottom: 20, lineHeight: 1.5 }}>
        Soft ID · 가입 없이 시작.
      </p>
      <span className={`status-pill${backend === 'on' ? ' on' : ''}`} style={{ marginBottom: 20 }}>
        {backend === 'on'
          ? lastBackendSyncOk()
            ? '동기화 연결됨'
            : '동기화 지연 · 로컬 우선'
          : '로컬만 · 동기화 대기'}
      </span>

      <div className="stack-md" style={{ marginTop: 16 }}>
        <SurfaceCard>
          <div className="meta">닉네임</div>
          <input
            className="field-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={12}
          />
          <button
            type="button"
            className="cta-primary"
            style={{ marginTop: 12 }}
            onClick={() => {
              const next = updateNickname(name);
              if (next) {
                setUser(next);
                setSaved(true);
                setTimeout(() => setSaved(false), 1200);
              }
            }}
          >
            {saved ? '저장됨' : '저장'}
          </button>
        </SurfaceCard>

        <SurfaceCard>
          <div className="meta">체중 (칼로리 추정용)</div>
          <div className="row" style={{ marginTop: 4, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <NumberField
                min={30}
                max={200}
                decimals={0}
                value={weight}
                onValueChange={setWeight}
                className="field-input"
              />
            </div>
            <span className="meta" style={{ marginBottom: 12 }}>
              kg
            </span>
          </div>
          <p className="meta" style={{ fontSize: 11, marginTop: 8, lineHeight: 1.4 }}>
            {hasCustomBodyWeight()
              ? '저장한 체중으로 칼로리를 추정합니다.'
              : `미입력 시 기본 ${DEFAULT_BODY_WEIGHT_KG}kg로 추정합니다.`}
          </p>
          <button
            type="button"
            className="cta-secondary"
            style={{ marginTop: 12 }}
            onClick={() => {
              setWeight(setBodyWeightKg(weight));
              setWeightSaved(true);
              setTimeout(() => setWeightSaved(false), 1200);
            }}
          >
            {weightSaved ? '저장됨' : '체중 저장'}
          </button>
        </SurfaceCard>

        <CoachToggles prefs={coachPrefs} onChange={setCoachPrefsState} />

        <SurfaceCard>
          <div className="meta">Soft ID</div>
          <div
            style={{
              fontSize: 12,
              wordBreak: 'break-all',
              marginTop: 8,
              color: 'var(--text-secondary)',
            }}
          >
            {user.id}
          </div>
        </SurfaceCard>

        <SurfaceCard to="/privacy">
          <div style={{ fontWeight: 700 }}>개인정보처리방침</div>
          <div className="meta" style={{ marginTop: 6 }}>
            Play·데이터 안내 · oswan.vercel.app/privacy
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div style={{ fontWeight: 700 }}>오스완</div>
          <div className="meta" style={{ marginTop: 6, lineHeight: 1.5 }}>
            오늘 스쿼트 완료.
            <br />
            영상은 서버로 전송되지 않아요. 개수·닉네임만 동기화됩니다.
            <br />
            도전장을 받은 사람은 <strong style={{ color: '#fff' }}>자기 닉네임으로 수락</strong>
            해야 보낸 사람과 기록이 따로 쌓여요.
          </div>
        </SurfaceCard>

        <button
          type="button"
          className="cta-secondary"
          style={{ color: 'var(--danger)', borderColor: 'rgba(255,90,90,0.35)' }}
          onClick={wipeAccount}
        >
          로컬 데이터 삭제 (Soft ID 초기화)
        </button>
      </div>
    </div>
  );
}
