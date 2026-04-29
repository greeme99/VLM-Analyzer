# Firebase/Firestore 마이그레이션 가이드

## 개요

VLM MODAPTS Motion Analyzer는 MySQL 데이터베이스에서 Firebase/Firestore로의 마이그레이션을 지원합니다. 이 가이드는 단계별 마이그레이션 절차를 설명합니다.

## 아키텍처

### 이전 (MySQL)
- **Database**: MySQL/TiDB
- **Storage**: S3 또는 로컬 스토리지
- **Authentication**: Manus OAuth

### 이후 (Firebase)
- **Database**: Firestore
- **Storage**: Firebase Storage
- **Authentication**: Firebase Auth (선택적) 또는 Manus OAuth 유지
- **Realtime**: Realtime Database (선택적)

## 마이그레이션 전략

### 1. 병행 운영 (권장)

```
┌─────────────────────────────────────┐
│   기존 MySQL 시스템 (계속 운영)      │
│   - 기존 데이터 유지                  │
│   - 기존 API 계속 작동                │
└─────────────────────────────────────┘
           ↓ 동기화 ↓
┌─────────────────────────────────────┐
│   신규 Firestore 시스템 (병행)       │
│   - 새로운 데이터 저장                │
│   - 양방향 동기화                     │
│   - 테스트 및 검증                    │
└─────────────────────────────────────┘
```

### 2. 마이그레이션 단계

#### Phase 1: 환경 설정 (완료 ✅)
- [x] Firebase 프로젝트 생성
- [x] 서비스 계정 설정
- [x] 환경 변수 구성
- [x] Firebase Admin SDK 초기화

#### Phase 2: Firestore 스키마 설계 (진행 중)
- [ ] 컬렉션 구조 설계
- [ ] 인덱스 설정
- [ ] 보안 규칙 구성

#### Phase 3: 데이터 마이그레이션
- [ ] 사용자 데이터 마이그레이션
- [ ] 프로젝트 데이터 마이그레이션
- [ ] 분석 결과 마이그레이션
- [ ] 데이터 검증

#### Phase 4: 애플리케이션 통합
- [ ] Firestore 쿼리 헬퍼 구현
- [ ] Firebase Storage 통합
- [ ] 양방향 동기화 구현
- [ ] API 업데이트

#### Phase 5: 테스트 및 배포
- [ ] 통합 테스트
- [ ] 성능 테스트
- [ ] 사용자 수용 테스트 (UAT)
- [ ] 프로덕션 배포

## Firestore 컬렉션 구조

```
firestore-root/
├── users/
│   ├── {openId}
│   │   ├── openId: string
│   │   ├── name: string
│   │   ├── email: string
│   │   ├── role: "user" | "admin"
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│
├── projects/
│   ├── {projectId}
│   │   ├── id: string
│   │   ├── userId: string
│   │   ├── title: string
│   │   ├── description: string
│   │   ├── videoUrl: string (Firebase Storage URL)
│   │   ├── videoKey: string
│   │   ├── videoDuration: number
│   │   ├── status: "pending" | "analyzing" | "completed" | "failed"
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│
├── motionEvents/
│   ├── {eventId}
│   │   ├── id: string
│   │   ├── projectId: string
│   │   ├── sequenceNumber: number
│   │   ├── startTime: string
│   │   ├── endTime: string
│   │   ├── modaptsCode: string
│   │   ├── modValue: number
│   │   ├── timeSeconds: string
│   │   ├── description: string
│   │   ├── bodyPart: string
│   │   ├── confidence: string
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│
├── corrections/
│   ├── {correctionId}
│   │   ├── id: string
│   │   ├── projectId: string
│   │   ├── eventId: string
│   │   ├── userId: string
│   │   ├── originalCode: string
│   │   ├── newCode: string
│   │   ├── reason: string
│   │   ├── comment: string
│   │   └── createdAt: timestamp
│
└── reports/
    ├── {reportId}
    │   ├── id: string
    │   ├── projectId: string
    │   ├── reportType: "pdf" | "excel"
    │   ├── reportUrl: string (Firebase Storage URL)
    │   ├── reportKey: string
    │   └── generatedAt: timestamp
```

## Firestore 인덱스 설정

### 복합 인덱스 (자동 생성)

```
projects 컬렉션:
- userId + createdAt (내림차순)

motionEvents 컬렉션:
- projectId + sequenceNumber (오름차순)

corrections 컬렉션:
- projectId + createdAt (내림차순)

reports 컬렉션:
- projectId + generatedAt (내림차순)
```

## Firebase Storage 구조

```
gs://vlm-analyzer.appspot.com/
├── videos/
│   ├── {timestamp}-{randomId}-{filename}
│   └── ...
├── reports/
│   ├── {projectId}/
│   │   ├── report-{timestamp}.pdf
│   │   ├── report-{timestamp}.xlsx
│   │   └── ...
│   └── ...
└── temp/
    ├── {sessionId}/
    │   └── ...
```

## 마이그레이션 스크립트

### 1. MySQL에서 Firestore로 데이터 내보내기

```typescript
// server/scripts/migrate-to-firestore.ts
import { getDb } from "../db";
import { firestoreBatchMigrateProjects, firestoreBatchMigrateMotionEvents } from "../firestore-db";

export async function migrateToFirestore() {
  try {
    // 1. 프로젝트 마이그레이션
    const projects = await getDb().then(db => 
      db?.select().from(projects).all()
    );
    
    if (projects) {
      await firestoreBatchMigrateProjects(projects);
      console.log(`✅ ${projects.length} projects migrated`);
    }

    // 2. 동작 이벤트 마이그레이션
    const events = await getDb().then(db => 
      db?.select().from(motionEvents).all()
    );
    
    if (events) {
      await firestoreBatchMigrateMotionEvents(events);
      console.log(`✅ ${events.length} motion events migrated`);
    }

    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}
```

### 2. 실행 방법

```bash
# 마이그레이션 스크립트 실행
pnpm tsx server/scripts/migrate-to-firestore.ts

# 또는 tRPC를 통한 마이그레이션
curl -X POST http://localhost:3000/api/trpc/admin.migrateToFirestore
```

## 양방향 동기화

### MySQL → Firestore (실시간)

```typescript
// 새로운 데이터 생성 시 자동 동기화
export async function createProject(data: InsertProject) {
  // 1. MySQL에 저장
  const result = await db.createProject(data);
  
  // 2. Firestore에도 저장
  await firestoreCreateProject(data);
  
  return result;
}
```

### Firestore → MySQL (선택적)

```typescript
// Firestore 변경 감지 및 MySQL 업데이트
export function watchFirestoreChanges() {
  const firestore = getFirestore();
  
  firestore.collection("projects").onSnapshot(async (snapshot) => {
    for (const change of snapshot.docChanges()) {
      if (change.type === "added" || change.type === "modified") {
        // MySQL에 업데이트
        const data = change.doc.data();
        await db.updateProject(data.id, data);
      }
    }
  });
}
```

## 보안 규칙 (Firestore)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 컬렉션: 자신의 데이터만 접근
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // 프로젝트: 소유자만 접근
    match /projects/{projectId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
    
    // 동작 이벤트: 프로젝트 소유자만 접근
    match /motionEvents/{eventId} {
      allow read, write: if 
        request.auth.uid == get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.userId;
    }
    
    // 보정: 프로젝트 소유자만 접근
    match /corrections/{correctionId} {
      allow read, write: if 
        request.auth.uid == get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.userId;
    }
    
    // 보고서: 프로젝트 소유자만 접근
    match /reports/{reportId} {
      allow read, write: if 
        request.auth.uid == get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.userId;
    }
  }
}
```

## 성능 최적화

### 1. 배치 쓰기
```typescript
// 대량 데이터 쓰기 시 배치 사용
const batch = firestore.batch();
projects.forEach((project) => {
  const ref = firestore.collection("projects").doc(project.id);
  batch.set(ref, project);
});
await batch.commit();
```

### 2. 인덱싱
```typescript
// Firestore 콘솔에서 자동 생성되는 인덱스 확인
// 또는 firestore.indexes.json에서 수동 설정
```

### 3. 쿼리 최적화
```typescript
// ❌ 비효율적
const allProjects = await firestore.collection("projects").get();
const userProjects = allProjects.docs.filter(doc => doc.data().userId === userId);

// ✅ 효율적
const userProjects = await firestore
  .collection("projects")
  .where("userId", "==", userId)
  .get();
```

## 비용 추정

### Firebase 가격 (2024년 기준)

| 항목 | 무료 | 가격 |
|------|------|------|
| Firestore 읽기 | 50,000/일 | $0.06/100만 |
| Firestore 쓰기 | 20,000/일 | $0.18/100만 |
| Firestore 삭제 | 20,000/일 | $0.02/100만 |
| Storage | 5GB | $0.18/GB |

### 예상 월 비용 (중소 규모)
- 일일 활성 사용자: 100명
- 일일 분석: 50개
- 월 비용: $5-15

## 트러블슈팅

### 1. 인증 오류
```
Error: Failed to initialize Firebase Admin SDK
```
**해결책**: 환경 변수 확인
```bash
echo $FIREBASE_PROJECT_ID
echo $FIREBASE_PRIVATE_KEY
```

### 2. 쓰기 권한 오류
```
Error: Missing or insufficient permissions
```
**해결책**: Firestore 보안 규칙 확인

### 3. 쿼리 성능 저하
**해결책**: 복합 인덱스 생성
```
Firestore 콘솔 → Indexes → Create Index
```

## 롤백 계획

마이그레이션 중 문제 발생 시:

1. **즉시 롤백**: MySQL로 복구
2. **데이터 검증**: 불일치 데이터 확인
3. **근본 원인 분석**: 문제점 파악
4. **재마이그레이션**: 수정 후 재시도

## 지원 및 문의

- Firebase 문서: https://firebase.google.com/docs
- Firestore 가이드: https://firebase.google.com/docs/firestore
- 이슈 보고: GitHub Issues

## 마이그레이션 체크리스트

- [ ] Firebase 프로젝트 생성
- [ ] 서비스 계정 설정
- [ ] 환경 변수 구성
- [ ] Firestore 컬렉션 생성
- [ ] 인덱스 설정
- [ ] 보안 규칙 적용
- [ ] 데이터 마이그레이션
- [ ] 양방향 동기화 구현
- [ ] 통합 테스트
- [ ] 성능 테스트
- [ ] 사용자 수용 테스트
- [ ] 프로덕션 배포
- [ ] 모니터링 설정
- [ ] 문서화 완료
