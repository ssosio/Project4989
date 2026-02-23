# Project4989
쌍용교육센터 파이널프로젝트
📦 Project4989 — 중고 경매 거래 플랫폼

React + Spring Boot 기반 에스크로 결제 지원 중고 경매 플랫폼

사용자가 안전하게 중고 물품을 경매 방식으로 거래할 수 있도록 제작한 웹 서비스입니다.
입찰 보증금 시스템과 에스크로 결제를 통해 거래 신뢰도를 높이고, JWT 인증 기반으로 안전한 사용자 관리를 제공합니다.

🧾 프로젝트 소개

Project4989는 기존 중고거래의 문제점인 거래 신뢰성 부족을 해결하기 위해 제작된 서비스입니다.

✔ 해결하고자 한 문제

무책임한 입찰 (노쇼 / 장난 입찰)

사기 거래 위험

거래 신뢰도 판단 어려움

✔ 해결 방법

✅ 최초 입찰 시 보증금 결제 시스템

✅ 에스크로 기반 안전 결제

✅ 사용자 신용등급(Tier) 관리

✅ JWT 인증 기반 보안 강화

🛠 기술 스택
🔹 Frontend

React

Axios

React Router

CSS / Styled Components

🔹 Backend

Spring Boot

MyBatis

JWT Authentication

REST API

🔹 Database

MySQL

🔹 Payment

PortOne (KG이니시스)

가상계좌 + 에스크로 결제

🔹 DevOps / Tools

GitHub

Git Flow (main / dev branch)

RESTful API 설계

🏗 프로젝트 구조
Project4989/
 ├── Project4989/      # Frontend (React)
 └── Spring4989/       # Backend (Spring Boot)
Frontend
src/
 ├── pages/
 ├── components/
 ├── api/
 └── routes/
Backend
controller/
service/
mapper/
domain/
security(JWT)
🔐 주요 기능
👤 사용자 기능

회원가입 / 로그인 (JWT 인증)

사용자 Tier 기반 신뢰도 관리

마이페이지

🛒 경매 시스템

상품 등록

경매 시작가 설정

실시간 입찰

💰 보증금 시스템 (핵심 기능)

최초 입찰 시 시작가의 10% 보증금 결제

동일 경매 재입찰 시 추가 결제 없음

서버 검증 기반 결제 처리

💳 결제 시스템

KG이니시스 연동

가상계좌 발급

에스크로 결제 처리

Webhook 기반 결제 상태 동기화

🔄 결제 흐름
입찰 시도
   ↓
최초 입찰 여부 확인
   ↓
보증금 결제창 호출
   ↓
결제 완료
   ↓
입찰 가능 상태 변경
🔑 인증 구조

JWT Access Token 기반 인증

인증 필요 API → 서버 검증

Webhook API → permitAll 처리

🚀 실행 방법 (Getting Started)
1️⃣ Backend 실행
cd Spring4989
./mvnw spring-boot:run

또는

Run Spring4989Application.java
2️⃣ Frontend 실행
cd Project4989
npm install
npm start

접속:

http://localhost:3000
⚙️ 환경 변수 설정
Backend (application.yml)
DB_URL=
DB_USERNAME=
DB_PASSWORD=

JWT_SECRET=

PORTONE_API_KEY=
PORTONE_SECRET=
📡 API 예시
입찰 요청
POST /api/bid
Authorization: Bearer {JWT}
👨‍💻 담당 역할

전체 서비스 설계

Spring Boot REST API 개발

JWT 인증 구현

경매 로직 설계

KG이니시스 결제 연동

보증금 검증 서버 로직 구현

📈 핵심 구현 포인트

✔ 최초 입찰 시에만 보증금 결제 로직

✔ 서버 검증 기반 결제 confirm 처리

✔ Webhook 비동기 상태 동기화

✔ 사용자 신용 등급(Tier) 시스템

🔮 향후 개선 사항

WebSocket 실시간 입찰

알림 시스템

Redis 캐싱

Docker 배포

CI/CD 구축

📄 License

This project is for educational and portfolio purposes.

📷 Preview (추가 예정)

메인 화면

경매 상세 페이지

결제 화면
