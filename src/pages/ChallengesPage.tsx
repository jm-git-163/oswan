import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrandHeader } from '../components/BrandMark';
import { ShareSheet } from '../components/ShareSheet';
import { shareChallengeInvite } from '../lib/share';
import { createChallenge, listChallenges } from '../lib/storage';
import { useAppStore } from '../store';
import type { Challenge } from '../lib/types';

export function ChallengesPage() {
  const user = useAppStore((s) => s.user)!;
  const navigate = useNavigate();
  const [sheetChallenge, setSheetChallenge] = useState<Challenge | null>(null);
  const items = useMemo(
    () =>
      listChallenges().filter(
        (c) => c.fromSoftUserId === user.id || c.toSoftUserId === user.id,
      ),
    [user.id],
  );

  const createAndShare = async () => {
    const c = createChallenge({
      fromSoftUserId: user.id,
      fromNickname: user.nickname,
      targetReps: 30,
    });
    const outcome = await shareChallengeInvite(c);
    if (outcome === 'copied' || outcome === 'fallback') {
      setSheetChallenge(c);
      return;
    }
    navigate(`/c/${c.id}`);
  };

  return (
    <div className="page">
      <BrandHeader size="sm" showTagline={false} />
      <h1 className="page-title" style={{ marginTop: 16 }}>
        도전
      </h1>
      <p className="meta" style={{ marginBottom: 20 }}>
        같은 개수로 친구에게 도전장을 보내요.
      </p>

      <button className="cta-primary" style={{ marginBottom: 20 }} onClick={() => void createAndShare()}>
        새 도전장 보내고 공유 (30개)
      </button>

      <div style={{ display: 'grid', gap: 10 }}>
        {items.length === 0 && <div className="card meta">아직 도전장이 없어요.</div>}
        {items.map((c) => (
          <Link key={c.id} to={`/c/${c.id}`} className="card" style={{ display: 'block' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700 }}>{c.targetReps}개 도전장</div>
                <div className="meta" style={{ marginTop: 4 }}>
                  {c.fromNickname}
                  {c.toNickname ? ` ↔ ${c.toNickname}` : ' · 대기'}
                </div>
              </div>
              <div className="meta" style={{ textTransform: 'uppercase' }}>
                {c.status}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {sheetChallenge && (
        <ShareSheet
          open
          challenge={sheetChallenge}
          onClose={() => {
            const id = sheetChallenge.id;
            setSheetChallenge(null);
            navigate(`/c/${id}`);
          }}
        />
      )}
    </div>
  );
}
