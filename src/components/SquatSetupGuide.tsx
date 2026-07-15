type Props = {
  variant?: 'gate' | 'stance';
};

/** One-panel guide: stance → count start → down/up = +1 · music/cheer ON by default. */
export function SquatSetupGuide({ variant = 'gate' }: Props) {
  const gate = variant === 'gate';

  return (
    <div
      className="card"
      style={{
        marginBottom: gate ? 16 : 0,
        padding: gate ? 14 : 10,
        border: '1px solid rgba(200,245,74,0.35)',
        background: 'linear-gradient(165deg, #161a10, #111)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 10,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: gate ? 16 : 13 }}>카운트 이렇게 돼요</div>
        <div className="meta" style={{ fontSize: 11, color: 'var(--accent)' }}>
          한 장으로 보기
        </div>
      </div>

      <svg
        viewBox="0 0 360 600"
        width="100%"
        style={{ display: 'block', borderRadius: 12, background: '#0a0a0a' }}
        role="img"
        aria-label="① 폰 세우기 ② 점이 원 안에 들어가면 카운트 시작 ③ 내려갔다 올라오면 1개 ④ 음악·응원은 처음부터 켜짐. 자세·조명에 따라 개수가 ±1~2개 어긋날 수 있음"
      >
        <rect width="360" height="600" fill="#0a0a0a" />

        <text x="24" y="28" fill="#C8F54A" fontSize="13" fontWeight="800" fontFamily="sans-serif">
          ① 폰을 앞에 세우기
        </text>
        <circle cx="70" cy="68" r="11" fill="none" stroke="#fff" strokeWidth="2" />
        <path
          d="M70 80 L70 108 M70 92 L52 100 M70 92 L88 100 M70 108 L58 130 M70 108 L82 130"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect x="130" y="48" width="40" height="70" rx="6" fill="#1e1e1e" stroke="#C8F54A" strokeWidth="1.5" />
        <rect x="136" y="56" width="28" height="46" rx="2" fill="#2a2a2a" />
        <text x="188" y="78" fill="#a1a1a1" fontSize="11" fontFamily="sans-serif">
          전면 카메라 · 전신이 보이게
        </text>
        <text x="188" y="96" fill="#6e6e6e" fontSize="10" fontFamily="sans-serif">
          너무 가깝거나 기울이면 인식이 흔들려요
        </text>

        <text x="24" y="158" fill="#C8F54A" fontSize="13" fontWeight="800" fontFamily="sans-serif">
          ② 머리 점이 동그라미 안 → 카운트 시작
        </text>
        {/* taller cards so vertical oval + caption don't overlap */}
        <rect x="24" y="170" width="150" height="126" rx="14" fill="#151515" stroke="#3a3a3a" strokeWidth="1.5" />
        <text x="40" y="190" fill="#6e6e6e" fontSize="10" fontFamily="sans-serif">
          아직 밖
        </text>
        <ellipse cx="99" cy="230" rx="20" ry="30" fill="none" stroke="#6e6e6e" strokeWidth="2.5" strokeDasharray="5 4" />
        <circle cx="54" cy="218" r="6" fill="#ff6b6b" />
        <text x="52" y="280" fill="#ff8a8a" fontSize="10" fontFamily="sans-serif" textAnchor="middle">
          대기 중…
        </text>

        <rect x="186" y="170" width="150" height="126" rx="14" fill="#151515" stroke="rgba(200,245,74,0.45)" strokeWidth="1.5" />
        <text x="202" y="190" fill="#C8F54A" fontSize="10" fontFamily="sans-serif">
          원 안 OK
        </text>
        <ellipse cx="261" cy="230" rx="20" ry="30" fill="none" stroke="#C8F54A" strokeWidth="3" />
        <circle cx="261" cy="230" r="7" fill="#C8F54A" />
        <text x="261" y="280" fill="#C8F54A" fontSize="10" fontWeight="700" fontFamily="sans-serif" textAnchor="middle">
          ▶ 카운트 시작!
        </text>

        <text x="24" y="322" fill="#C8F54A" fontSize="13" fontWeight="800" fontFamily="sans-serif">
          ③ 내려갔다 올라오면 +1개
        </text>
        <rect x="24" y="334" width="312" height="132" rx="14" fill="#151515" stroke="#2a2a2a" strokeWidth="1.5" />
        {/* figures sit above captions — feet end ~424, labels at 446 */}
        <circle cx="72" cy="362" r="8" fill="none" stroke="#fff" strokeWidth="2" />
        <path
          d="M72 371 L72 398 M72 382 L58 390 M72 382 L86 390 M72 398 L62 424 M72 398 L82 424"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <text x="72" y="446" fill="#a1a1a1" fontSize="10" fontFamily="sans-serif" textAnchor="middle">
          서 있음
        </text>

        <path d="M108 392 L136 392" stroke="#C8F54A" strokeWidth="2.5" />

        <circle cx="178" cy="378" r="8" fill="none" stroke="#C8F54A" strokeWidth="2" />
        <path
          d="M178 387 L178 404 M178 394 L162 402 M178 394 L194 402 M178 404 L166 424 M178 404 L190 424"
          fill="none"
          stroke="#C8F54A"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <text x="178" y="446" fill="#C8F54A" fontSize="10" fontFamily="sans-serif" textAnchor="middle">
          내려감
        </text>

        <path d="M214 392 L242 392" stroke="#C8F54A" strokeWidth="2.5" />

        <circle cx="290" cy="362" r="8" fill="none" stroke="#fff" strokeWidth="2" />
        <path
          d="M290 371 L290 398 M290 382 L276 390 M290 382 L304 390 M290 398 L280 424 M290 398 L300 424"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect x="268" y="436" width="44" height="18" rx="9" fill="#C8F54A" />
        <text x="290" y="449" fill="#0a0a0a" fontSize="11" fontWeight="800" fontFamily="sans-serif" textAnchor="middle">
          +1
        </text>

        <text x="24" y="492" fill="#C8F54A" fontSize="13" fontWeight="800" fontFamily="sans-serif">
          ④ 음악 · 응원 — 처음부터 켜짐
        </text>
        <rect x="24" y="504" width="150" height="40" rx="20" fill="rgba(200,245,74,0.18)" stroke="#C8F54A" strokeWidth="1.5" />
        <text x="48" y="530" fill="#C8F54A" fontSize="13" fontWeight="800" fontFamily="sans-serif">
          ♪ 음악 ON
        </text>
        <rect x="186" y="504" width="150" height="40" rx="20" fill="rgba(200,245,74,0.18)" stroke="#C8F54A" strokeWidth="1.5" />
        <text x="208" y="530" fill="#C8F54A" fontSize="13" fontWeight="800" fontFamily="sans-serif">
          응원 ON
        </text>
        <text x="24" y="568" fill="#a1a1a1" fontSize="11" fontFamily="sans-serif">
          스쿼트 화면의 그 버튼을 누르면 끌 수 있어요
        </text>
        <text x="24" y="588" fill="#6e6e6e" fontSize="10" fontFamily="sans-serif">
          앉아 올라올 때 1회 · 반도 안 세요
        </text>
      </svg>

      <p
        className="meta"
        style={{
          margin: gate ? '10px 0 0' : '8px 0 0',
          fontSize: gate ? 12 : 11,
          lineHeight: 1.45,
          wordBreak: 'keep-all',
        }}
      >
        조명·각도·속도에 따라 개수가 ±1~2개 어긋날 수 있어요. 머리 점을 원 안에 두고 일정한 속도로 해 주세요.
      </p>

      {gate && (
        <p className="meta" style={{ margin: '8px 0 0', fontSize: 12, lineHeight: 1.5, wordBreak: 'keep-all' }}>
          <strong style={{ color: 'var(--accent)' }}>점 → 원 안</strong>이면 시작,{' '}
          <strong style={{ color: 'var(--accent)' }}>앉았다 일어서면</strong> 1개. 음악·안내는{' '}
          <strong style={{ color: 'var(--accent)' }}>처음부터 켜져 있고</strong>, 「♪ 음악」「안내·응원」
          버튼으로 끌 수 있어요.
        </p>
      )}
    </div>
  );
}
