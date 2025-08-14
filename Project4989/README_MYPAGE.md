# 마이페이지 구현 가이드

## 📋 개요
이 문서는 프로젝트의 마이페이지 구현에 대한 상세한 설명과 백엔드 API 요구사항을 정리한 것입니다.

## 🏗️ 구현된 기능

### 1. 회원정보 관리 (ProfileSection)
- **프로필 이미지**: 업로드 및 변경 기능
- **기본 정보**: 닉네임, 이메일, 휴대폰 번호 수정
- **비밀번호 변경**: SMS 인증을 통한 보안 강화
- **실시간 유효성 검사**: 입력값 검증 및 에러 처리

### 2. 거래내역 관리 (TransactionSection)
- **거래 상태별 분류**: 진행중, 완료, 취소 등
- **통계 대시보드**: 거래 현황을 한눈에 파악
- **상세 정보**: 상품명, 가격, 판매자, 배송 상태
- **리뷰 시스템**: 구매 후 리뷰 작성 및 관리

### 3. 위시리스트 관리 (WishlistSection)
- **상품 관리**: 찜한 상품 추가/제거
- **필터링**: 카테고리, 가격대, 재고 상태별 필터
- **정렬**: 날짜, 가격, 할인율 등 다양한 정렬 옵션
- **검색**: 상품명 및 설명으로 빠른 검색

## 🔐 보안 기능

### 토큰 기반 인증
- **JWT 토큰 검증**: 모든 API 요청 시 토큰 유효성 확인
- **자동 로그아웃**: 401 에러 발생 시 자동 로그아웃 처리
- **토큰 갱신**: 만료된 토큰에 대한 적절한 처리

### SMS 인증
- **비밀번호 변경**: SMS 인증을 통한 2단계 보안
- **인증번호 발송**: 휴대폰 번호로 인증번호 전송
- **인증 확인**: 6자리 인증번호 검증

## 🚀 백엔드 API 요구사항

### 1. 회원 정보 관리 API

#### 프로필 조회
```
GET /member/profile/{loginId}
Authorization: Bearer {jwtToken}
Response: {
  "nickname": "사용자닉네임",
  "email": "user@example.com",
  "phoneNumber": "010-1234-5678"
}
```

#### 프로필 수정
```
PUT /member/profile/{loginId}
Authorization: Bearer {jwtToken}
Body: {
  "nickname": "새닉네임",
  "email": "newemail@example.com",
  "phoneNumber": "010-9876-5432"
}
```

#### 비밀번호 변경
```
PUT /member/password/{loginId}
Authorization: Bearer {jwtToken}
Body: {
  "currentPassword": "현재비밀번호",
  "newPassword": "새비밀번호"
}
```

### 2. SMS 인증 API

#### 인증번호 발송
```
POST /sms/send
Authorization: Bearer {jwtToken}
Body: {
  "phoneNumber": "010-1234-5678"
}
```

#### 인증번호 확인
```
POST /sms/verify
Authorization: Bearer {jwtToken}
Body: {
  "phoneNumber": "010-1234-5678",
  "code": "123456"
}
```

### 3. 거래내역 API

#### 거래 목록 조회
```
GET /member/transactions/{loginId}
Authorization: Bearer {jwtToken}
Query Parameters:
  - status: pending|paid|shipped|delivered|completed|cancelled
  - page: 페이지 번호
  - size: 페이지 크기
```

#### 거래 상세 조회
```
GET /member/transactions/{loginId}/{transactionId}
Authorization: Bearer {jwtToken}
```

### 4. 위시리스트 API

#### 위시리스트 조회
```
GET /member/wishlist/{loginId}
Authorization: Bearer {jwtToken}
Query Parameters:
  - category: 카테고리 필터
  - priceRange: 가격대 필터
  - sortBy: 정렬 기준
  - availableOnly: 구매가능만 표시
```

#### 위시리스트 추가
```
POST /member/wishlist/{loginId}
Authorization: Bearer {jwtToken}
Body: {
  "productId": "상품ID",
  "productName": "상품명",
  "price": 100000
}
```

#### 위시리스트 제거
```
DELETE /member/wishlist/{loginId}/{wishlistId}
Authorization: Bearer {jwtToken}
```

## 🎨 UI/UX 특징

### Material-UI 기반 디자인
- **반응형 레이아웃**: 모바일, 태블릿, 데스크톱 지원
- **일관된 디자인**: 프로젝트 전체와 통일된 스타일
- **접근성**: ARIA 라벨 및 키보드 네비게이션 지원

### 사용자 경험
- **로딩 상태**: API 호출 중 적절한 로딩 표시
- **에러 처리**: 명확한 에러 메시지 및 복구 방법 제시
- **성공 피드백**: 작업 완료 시 즉각적인 피드백 제공

## 🔧 기술 스택

### 프론트엔드
- **React 18**: 함수형 컴포넌트 및 Hooks
- **Material-UI (MUI)**: UI 컴포넌트 라이브러리
- **Axios**: HTTP 클라이언트
- **React Router**: 클라이언트 사이드 라우팅

### 상태 관리
- **React Context**: 전역 상태 관리
- **useState/useEffect**: 로컬 상태 및 사이드 이펙트
- **Custom Hooks**: 재사용 가능한 로직 분리

## 📱 반응형 디자인

### 브레이크포인트
- **xs**: 0px - 599px (모바일)
- **sm**: 600px - 959px (태블릿)
- **md**: 960px - 1279px (작은 데스크톱)
- **lg**: 1280px+ (큰 데스크톱)

### 레이아웃 적응
- **모바일**: 세로 스택 레이아웃, 터치 친화적 버튼
- **태블릿**: 그리드 레이아웃, 중간 크기 컴포넌트
- **데스크톱**: 사이드바 + 메인 콘텐츠, 호버 효과

## 🚨 주의사항

### 보안
1. **토큰 만료**: JWT 토큰 만료 시 자동 로그아웃
2. **API 권한**: 인증된 사용자만 접근 가능
3. **입력 검증**: 클라이언트 및 서버 양쪽에서 검증

### 성능
1. **이미지 최적화**: 적절한 크기 및 포맷 사용
2. **API 호출 최소화**: 불필요한 중복 요청 방지
3. **메모리 관리**: 컴포넌트 언마운트 시 정리 작업

### 접근성
1. **키보드 네비게이션**: Tab 키로 모든 요소 접근 가능
2. **스크린 리더**: 적절한 ARIA 라벨 및 설명
3. **색상 대비**: WCAG 가이드라인 준수

## 🔮 향후 개선 사항

### 기능 확장
- [ ] 프로필 이미지 크롭 및 편집
- [ ] 2단계 인증 (2FA) 지원
- [ ] 소셜 미디어 연동
- [ ] 알림 설정 관리

### 성능 최적화
- [ ] 가상 스크롤링 (대량 데이터)
- [ ] 이미지 지연 로딩
- [ ] API 응답 캐싱
- [ ] 번들 크기 최적화

### 사용자 경험
- [ ] 다크 모드 지원
- [ ] 다국어 지원
- [ ] 키보드 단축키
- [ ] 드래그 앤 드롭 기능

## 📞 지원 및 문의

마이페이지 구현과 관련된 질문이나 개선 제안이 있으시면 개발팀에 문의해주세요.

---

**마지막 업데이트**: 2024년 1월
**버전**: 1.0.0
**작성자**: 개발팀
