# Firebase/Firestore 통합 가이드

VLM MODAPTS 동작분석 웹앱을 Google Firebase/Firestore로 마이그레이션하는 방법을 설명합니다.

## 1. Firebase 프로젝트 생성

### 1.1 Google Cloud Console에서 프로젝트 생성
- [Google Cloud Console](https://console.cloud.google.com)에 접속
- 새 프로젝트 생성
- 프로젝트 이름: `vlm-motion-analysis` (또는 원하는 이름)

### 1.2 Firebase 활성화
- Google Cloud Console에서 "Firebase" 검색
- Firebase 콘솔로 이동
- 프로젝트 생성 또는 기존 프로젝트 선택

## 2. Firestore 데이터베이스 설정

### 2.1 Firestore 데이터베이스 생성
1. Firebase 콘솔 > Firestore Database
2. "데이터베이스 만들기" 클릭
3. 위치: `asia-northeast1` (서울) 선택
4. 보안 규칙: "프로덕션 모드" 선택

### 2.2 Firestore 보안 규칙 설정
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 인증된 사용자만 접근 가능
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // 사용자는 자신의 데이터만 접근
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    match /projects/{projectId} {
      allow read, write: if request.auth != null;
    }
    
    match /motionEvents/{eventId} {
      allow read, write: if request.auth != null;
    }
    
    match /corrections/{correctionId} {
      allow read, write: if request.auth != null;
    }
    
    match /reports/{reportId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 3. Firebase Admin SDK 설정

### 3.1 서비스 계정 생성
1. Firebase 콘솔 > 프로젝트 설정 > 서비스 계정
2. "새 비공개 키 생성" 클릭
3. JSON 파일 다운로드

### 3.2 환경변수 설정
다운로드한 JSON 파일에서 다음 정보를 추출하여 `.env` 파일에 추가:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com
```

**주의:** `FIREBASE_PRIVATE_KEY`의 줄바꿈 문자를 `\n`으로 표현해야 합니다.

## 4. Firebase Authentication 설정

### 4.1 인증 방법 활성화
1. Firebase 콘솔 > Authentication > Sign-in method
2. 다음 인증 방법 활성화:
   - Email/Password
   - Google
   - (선택) GitHub, 기타 OAuth 제공자

### 4.2 OAuth 설정
- Google OAuth: Google Cloud Console에서 OAuth 2.0 클라이언트 ID 생성
- 리다이렉트 URI: `https://your-domain.com/api/oauth/callback`

## 5. 데이터 마이그레이션

### 5.1 MySQL에서 Firestore로 데이터 이전
```typescript
import { migrateData } from "./server/firebase_integration";
import { getAllDocuments } from "./server/db";

// MySQL에서 데이터 읽기
const usersData = await getAllDocuments("users");
const projectsData = await getAllDocuments("projects");
const motionEventsData = await getAllDocuments("motionEvents");

// Firestore로 마이그레이션
await migrateData([
  { collection: "users", documents: usersData },
  { collection: "projects", documents: projectsData },
  { collection: "motionEvents", documents: motionEventsData },
]);
```

### 5.2 마이그레이션 스크립트 실행
```bash
# 마이그레이션 스크립트 작성 후 실행
node migrate-to-firebase.mjs
```

## 6. 코드 변경사항

### 6.1 데이터베이스 헬퍼 함수 변경
기존 코드에서 `db.ts`의 함수를 사용하는 부분을 `db_firebase.ts`의 함수로 변경:

```typescript
// Before (MySQL)
import { upsertUser, getUserByOpenId } from "./db";

// After (Firestore)
import { upsertUserFirebase, getUserByOpenIdFirebase } from "./db_firebase";
```

### 6.2 tRPC 라우터 업데이트
```typescript
// Before
const user = await getUserByOpenId(openId);

// After
const user = await getUserByOpenIdFirebase(openId);
```

## 7. 프로덕션 배포

### 7.1 환경변수 설정 확인
- 배포 환경에서 Firebase 환경변수가 올바르게 설정되었는지 확인
- Manus 플랫폼의 Secrets 관리 페이지에서 설정

### 7.2 Firestore 백업 설정
1. Firebase 콘솔 > Firestore Database > 백업
2. 자동 백업 활성화 (권장: 일일 백업)

### 7.3 모니터링 및 로깅
- Firebase 콘솔 > Monitoring
- 데이터베이스 성능 및 사용량 모니터링

## 8. 비용 최적화

### 8.1 Firestore 가격 모델
- 읽기: 문서당 $0.06/100만 건
- 쓰기: 문서당 $0.18/100만 건
- 삭제: 문서당 $0.02/100만 건

### 8.2 비용 절감 방법
- 인덱싱 최소화
- 배치 작업 활용 (batchWrite 함수)
- 불필요한 쿼리 제거
- 캐싱 전략 구현

## 9. 문제 해결

### 9.1 인증 오류
```
Error: Failed to initialize Firebase
```
**해결:** 환경변수 확인 및 서비스 계정 권한 확인

### 9.2 권한 오류
```
Error: Missing or insufficient permissions
```
**해결:** Firestore 보안 규칙 확인 및 사용자 인증 상태 확인

### 9.3 연결 오류
```
Error: Could not reach Cloud Firestore backend
```
**해결:** 네트워크 연결 확인 및 Firebase 프로젝트 상태 확인

## 10. 추가 리소스

- [Firebase 공식 문서](https://firebase.google.com/docs)
- [Firestore 보안 규칙](https://firebase.google.com/docs/firestore/security/start)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Firestore 가격 계산기](https://firebase.google.com/pricing/calculator)
