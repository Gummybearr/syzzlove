# Syzzlove - 데이터 분석 및 상관관계 시각화 플랫폼

이 프로젝트는 제조업의 **불량률(Defect Rate)** 와 **공정 매개변수(Process Parameters)** 간의 상관관계를 분석하고 시각화하는 웹 애플리케이션입니다.

## 🎯 주요 기능

- **상관관계 분석**: 불량률과 공정 매개변수 간의 상관계수 계산 및 분석
- **특성 중요도 분석**: 머신러닝 기반 특성 중요도 분석
- **실시간 시각화**: 산점도, 시계열, 막대그래프 등 다양한 차트 제공
- **다중 모델 지원**: 여러 모델의 데이터를 동시에 분석 및 비교
- **회귀선 표시**: 매개변수와 불량률 간의 회귀선 자동 계산 및 표시

## 🏗️ 프로젝트 구조

```
syzzlove/
├── frontend/          # Next.js 프론트엔드 (React + TypeScript)
│   ├── src/
│   │   ├── app/       # Next.js App Router
│   │   │   ├── page.tsx           # 메인 페이지
│   │   │   └── api/               # API 라우트
│   │   │       ├── defect-rate/   # 불량률 데이터 API
│   │   │       ├── models/        # 모델 목록 API
│   │   │       └── params/        # 매개변수 데이터 API
│   │   └── lib/
│   │       └── api.ts # API 클라이언트
│   └── package.json
│
└── backend/           # ASP.NET Core Web API (C#)
    ├── Controllers/
    │   └── DataController.cs      # 데이터 API 컨트롤러
    ├── CorrelationAnalysisAPI/
    │   ├── Models/                # 데이터 모델
    │   └── Services/              # 비즈니스 로직
    ├── Program.cs                 # 애플리케이션 진입점
    ├── WebApi.csproj             # 프로젝트 파일
    └── defect_rate.csv           # 샘플 데이터
```

## 🚀 시작하기

### 필수 사항

- **Node.js** (18.0 이상)
- **.NET 8.0 SDK**
- **npm** 또는 **yarn**

### 1. 저장소 복제

```bash
git clone <repository-url>
cd syzzlove
```

### 2. 백엔드 실행

```bash
cd backend
dotnet restore      # 패키지 복원
dotnet run          # 애플리케이션 실행 (기본포트: 5000번)
```

백엔드 서버가 `http://localhost:5000`에서 실행됩니다.

### 3. 프론트엔드 실행

새 터미널 창에서:

```bash
cd frontend
npm install         # 패키지 설치
npm run dev         # 개발 서버 실행
```

프론트엔드 서버가 `http://localhost:3000`에서 실행됩니다.

### 4. 애플리케이션 접속

브라우저에서 `http://localhost:3000`으로 접속하여 애플리케이션을 사용할 수 있습니다.

## 📊 사용 방법

### 기본 분석 절차

1. **날짜 범위 설정**: 분석할 기간을 시작일과 종료일로 설정
2. **모델 선택**: 분석하고 싶은 모델 ID를 선택 (다중 선택 가능)
3. **분석 실행**: "분석 실행" 버튼을 클릭하여 상관관계 및 특성 중요도 분석 수행
4. **결과 확인**: 
   - 불량률 산점도로 전체적인 데이터 분포 확인
   - 상관관계 혐의인자 중에서 관심 있는 매개변수 선택
   - 선택한 매개변수와 불량률 간의 산점도 및 회귀선 확인
   - 매개변수의 시계열 변화 추이 확인
   - Feature Importance 결과로 각 매개변수의 중요도 확인

### 주요 화면 구성

- **분석 조건 설정**: 날짜, 모델 선택 및 분석 실행
- **Defect Rate 산점도**: 시간에 따른 불량률 변화
- **상관관계 혐의인자**: 상관계수 순으로 정렬된 매개변수 목록
- **매개변수 vs 불량률**: 선택한 매개변수와 불량률 간의 상관관계 시각화
- **시계열 그래프**: 매개변수의 시간에 따른 변화
- **Feature Importance**: 머신러닝 기반 특성 중요도 분석 결과

## 🔧 주요 기술 스택

### 프론트엔드
- **Next.js 15**: React 기반 풀스택 프레임워크
- **TypeScript**: 정적 타입 지원
- **Material-UI (MUI)**: UI 컴포넌트 라이브러리
- **Recharts**: 데이터 시각화 차트 라이브러리
- **Tailwind CSS**: 유틸리티 CSS 프레임워크

### 백엔드
- **ASP.NET Core 8.0**: 웹 API 프레임워크
- **C#**: 백엔드 개발 언어
- **CsvHelper**: CSV 파일 처리
- **MathNet.Numerics**: 수치 연산 라이브러리
- **Swagger**: API 문서화

## 📈 API 엔드포인트

백엔드에서 제공하는 주요 API:

- `GET /api/data/health` - 서버 상태 확인
- `POST /api/data/process` - 데이터 처리
- `POST /api/correlation/analyze` - 상관관계 분석
- `POST /api/feature-importance/analyze` - 특성 중요도 분석
- `GET /swagger` - API 문서 (개발 환경에서만)

프론트엔드 API 라우트:

- `/api/defect-rate` - 불량률 데이터
- `/api/models` - 모델 목록
- `/api/params` - 매개변수 데이터

## 🛠️ 개발 및 빌드

### 프론트엔드 개발

```bash
cd frontend
npm run dev         # 개발 서버 실행
npm run build       # 프로덕션 빌드
npm run start       # 프로덕션 서버 실행
npm run lint        # 코드 검사
```

### 백엔드 개발

```bash
cd backend
dotnet run          # 개발 서버 실행
dotnet build        # 빌드
dotnet publish      # 배포용 빌드
```

## 📝 샘플 데이터

프로젝트에는 `backend/defect_rate.csv` 파일에 샘플 데이터가 포함되어 있습니다. 이 데이터는 다음과 같은 형식을 가집니다:

- **ModelID**: 제품 모델 식별자
- **LotID**: 생산 로트 식별자  
- **DefectDate**: 불량 발생 날짜
- **DefectRate**: 불량률 (백분율)
- **공정 매개변수**: thickness, temperature, humidity 등

## 🤝 기여하기

1. 프로젝트를 Fork합니다
2. 새 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 Push합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

## 📞 문의 및 지원

프로젝트 관련 문의사항이나 버그 리포트는 GitHub Issues를 통해 등록해주세요.

---

🎉 **Syzzlove**로 데이터 분석을 더 쉽고 직관적으로 경험해보세요!