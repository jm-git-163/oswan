# COST_SAFE.md — 유료 결제 방지

오스완은 **무료만** 쓰도록 설계됨. 카드 결제/Pro 업그레이드 금지.

## 사용 중인 것 (전부 $0 가능)

| 항목 | 플랜 | 비고 |
|---|---|---|
| Vercel | Hobby | https://oswan.vercel.app |
| Supabase | Free | Org이 FREE여야 함 |
| MediaPipe CDN | 무료 | 영상 서버 업로드 없음 |
| OpenAI / Stripe 등 | **미사용** | |

## 절대 하지 말 것

1. Supabase **Upgrade to Pro** / Team  
2. Vercel **Upgrade to Pro**  
3. Spend Cap **끄기** (Pro를 쓰면 안 되지만, 실수로 Pro가 되어도 Cap은 켜 두기)  
4. Compute / Disk 유료 애드온 추가  
5. 유료 AI API 키를 `.env`에 넣기  

## 대시보드 확인 (지금 1회)

### Supabase
1. https://supabase.com/dashboard/org/_/billing  
2. Plan = **Free**  
3. Payment method 없어도 됨 (연결하지 말 것)  
4. Active projects ≤ 2  

### Vercel
1. https://vercel.com/account/billing  
2. Plan = **Hobby**  
3. “Upgrade” 누르지 말 것  

## 한도 넘치면?

- Free/Hobby는 보통 **서비스가 멈추거나 제한**되고, 자동으로 카드에서 빠지지 않음  
- (단, Pro로 올리고 Spend Cap을 끈 경우는 과금됨 → Pro 사용 금지)

## 앱 배포 URL

https://oswan.vercel.app
