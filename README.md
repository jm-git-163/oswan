# 오스완 (Oswan)

> 오늘 스쿼트 완료.

AI 스쿼트 카운트 + 목표 개수 클리어 + 친구 도전장 + **Supabase 그래프/랭킹** 웹앱.

## 실행

```powershell
cd "c:\Users\user\Desktop\스쿼트\oswan"
npm install
copy .env.example .env   # Supabase 키 입력
npm run dev
```

## 백엔드 · 배포 문서

| 문서 | 내용 |
|---|---|
| [docs/SUPABASE.md](docs/SUPABASE.md) | SQL 실행, 키, 그래프/랭킹 |
| [docs/VERCEL.md](docs/VERCEL.md) | `vercel login` → 영구 HTTPS 배포 |
| [supabase/migrations/001_oswan_schema.sql](supabase/migrations/001_oswan_schema.sql) | 스키마 원본 |

## 포함 기능

| 기능 | 설명 |
|---|---|
| Soft ID | 닉네임만, 가입 없음 |
| 스쿼트 세션 | HSS-v3 + MediaPipe |
| 기록 그래프 | 로컬 + Supabase `daily_stats` |
| 랭킹 | 오늘/주간 (`leaderboard_*` 뷰) |
| 도전장 | 로컬 + Supabase sync + 링크 payload |
| Vercel | `vercel.json` SPA rewrite 포함 |

환경변수 없으면 **로컬만**으로 동작합니다. 넣으면 자동 동기화됩니다.

## Vercel 한 줄 요약

```powershell
npx vercel login
npx vercel env add VITE_SUPABASE_URL production
npx vercel env add VITE_SUPABASE_ANON_KEY production
npx vercel --prod
```

상세는 [docs/VERCEL.md](docs/VERCEL.md).
