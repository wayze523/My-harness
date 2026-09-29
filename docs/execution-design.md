# 허들링 앱 — 실행 구조 설계 (R4)

pipeline-gates.md의 파이프라인/게이트를 실제 Claude Code 파일 구조로 매핑합니다.

## 호출

- 진입점: `/design-screen [화면명]` (Skill로 구현 — Skill 이름이 `design-screen`이면 `/design-screen`으로 트리거됨)
- 인자: 대상 화면/플로우명 (story-purpose.md의 인스턴스 변수 ①), 필요 시 레퍼런스 소스도 함께 (인스턴스 변수 ②)

## 파일 구조

| 경로 | 역할 |
|---|---|
| `.claude/skills/design-screen/SKILL.md` | 오케스트레이터. 1~4단계 순차 실행 → GATE① 대기 → 6단계 실행 → GATE② 자동 호출·재시도 루프 |
| `scripts/check-guide.js` | GATE② 판정 스크립트 (Node.js, Figma REST API 호출) |
| `docs/design.md` | GATE②가 참조하는 허용 색상/radius 원본 (이미 존재) |

## SKILL.md 오케스트레이션 로직 (의사코드)

```
1. 레퍼런스 수집 (uibowl)
2. 레퍼런스 분석 → 반영 포인트
3. 화면 설계 문서 구체화
4. Figma 키스크린 2~3개 제작 (390×844)
   → 결과를 사용자에게 제시하고 멈춤

[여기서 대기: 사용자가 "승인"이라고 입력할 때까지 6단계로 진행하지 않음]
[사용자가 피드백을 주면: 1~4를 처음부터 재실행]

승인 수신 →
6. 토큰/컴포넌트 제작 + 화면 디자인
   → Bash로 `node scripts/check-guide.js <figma-file-key> <node-id>` 실행
   → 위반 0건 → 완료 보고 (story-purpose.md 완료 기준 충족)
   → 위반 N건 → 위반 목록을 반영해 6번 재실행 → 다시 검사 (사람 개입 없이 자동 반복)
```

## scripts/check-guide.js 사양

- **입력**: Figma 파일 키, 검사 대상 노드 ID(또는 프레임 전체)
- **필요 환경변수**: `FIGMA_TOKEN` (Figma Personal Access Token)
- **동작**: Figma REST API(`GET /v1/files/:key/nodes`)로 노드 트리 조회 → 모든 노드의 `fills[].color`(hex 변환), `cornerRadius`를 pipeline-gates.md의 허용 목록과 대조
- **출력**: pipeline-gates.md에 정의된 `GATE② 결과: 위반 N건` 형식의 텍스트 + exit code (0=통과, 1=위반 존재) — SKILL.md가 exit code로 루프 여부 판단
