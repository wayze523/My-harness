---
name: design-screen
description: 허들링 앱 화면 디자인 파이프라인 — 경쟁사 레퍼런스 수집부터 Figma 키스크린 제작, 내부 승인 대기, 토큰/컴포넌트 제작, design.md 가이드 자동 검증까지 실행한다. "/design-screen [화면명]"으로 호출.
---

이 스킬은 `docs/pipeline-gates.md`에 정의된 파이프라인을 실행한다. 시작 전 `docs/story-service.md`, `docs/process-service.md`, `docs/story-purpose.md`, `docs/pipeline-gates.md`, `design.md`를 참조한다.

## 1~4단계 (자동 실행, 순차)

1. uibowl에서 대상 화면(인자로 받은 화면명)의 경쟁사 레퍼런스를 수집한다.
2. 레퍼런스를 분석해 반영할 포인트를 정리한다.
3. 분석 내용을 토대로 화면 설계 문서를 구체화한다.
4. Figma에 레퍼런스와 화면설계를 반영한 키스크린 2~3개를 390×844 사이즈로 제작한다.

4단계 완료 후 결과(화면 설계 문서 요약 + Figma URL)를 사용자에게 제시하고 **턴을 종료한다.**

## GATE① — 승인 대기

- 사용자의 다음 메시지가 정확히 "승인"이 아니면: 진행하지 않는다. 피드백으로 간주하고 1~4단계를 다시 실행한다.
- 사용자가 "승인"이라고 응답하면 6단계로 진행한다.

## 6단계 + GATE② (자동 실행 + 자동 검증 루프)

6. 컨펌된 시안을 기반으로 디자인 토큰과 컴포넌트를 제작하고 화면 디자인을 완성한다.
7. Bash로 다음을 실행한다: `node scripts/check-guide.js <4단계에서 만든 Figma URL>`
8. exit code 0 (위반 0건) → 완료 보고. `docs/story-purpose.md`의 완료 기준 충족을 명시한다.
9. exit code 1 (위반 N건) → 출력된 위반 목록을 반영해 6번을 다시 수행하고, 7번부터 재검사한다. 사람에게 묻지 않고 자동으로 반복한다.
