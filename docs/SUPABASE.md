# SUPABASE.md — 오스완 백엔드

데이터 관리 · 그래프 · 랭킹용 Supabase 준비 가이드.

## 1. 프로젝트 만들기

1. [https://supabase.com](https://supabase.com) 로그인  
2. **New project** → 이름 `oswan`, DB 비밀번호 저장  
3. 지역: Northeast Asia (Tokyo/Seoul) 권장  

## 2. SQL 실행

1. 대시보드 → **SQL Editor** → New query  
2. 파일 내용 전체 붙여넣기:

`oswan/supabase/migrations/001_oswan_schema.sql`

3. **Run**

생성되는 것:

| 개체 | 용도 |
|---|---|
| `soft_users` | Soft ID + 닉네임 |
| `sessions` | 세션 기록 |
| `challenges` | 도전장 |
| `daily_stats` | 일별 집계 (트리거 자동) |
| `leaderboard_today` | 오늘 랭킹 뷰 |
| `leaderboard_week` | 주간 랭킹 뷰 |

## 3. API 키 복사

**Project Settings → API**

| 키 | 앱 환경변수 |
|---|---|
| Project URL | `VITE_SUPABASE_URL` |
| `anon` `public` | `VITE_SUPABASE_ANON_KEY` |

⚠️ `service_role` 키는 절대 프론트/Vercel 공개 env에 넣지 마세요.

## 4. 로컬 `.env`

`oswan/.env` 파일 생성 (`.env.example` 참고):

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

```powershell
cd "c:\Users\user\Desktop\스쿼트\oswan"
npm run dev
```

앱 **나** 탭에 `백엔드: Supabase 연결됨`이 보이면 OK.  
스쿼트 1회 → **랭킹**에 닉네임이 올라오는지 확인.

## 5. 보안 메모 (MVP)

현재 RLS는 Soft ID MVP용으로 **anon 읽기/쓰기 허용**입니다.  
닉네임·reps만 공개되는 전제입니다.

출시 전 강화 방향:

- Edge Function + Soft ID HMAC  
- 전국 랭킹은 로그인(L2) 유저만  
- rate limit / DeviceCheck  

## 6. 앱이 하는 일

| 이벤트 | API |
|---|---|
| 닉네임 생성/변경 | `soft_users` upsert |
| 세션 종료 | `sessions` upsert → trigger → `daily_stats` |
| 도전 생성/수락/완료 | `challenges` upsert |
| 기록 그래프 | `daily_stats` 7일 |
| 랭킹 | `leaderboard_today` / `leaderboard_week` |
