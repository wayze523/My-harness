# 허들링 앱 — 파이프라인 & 게이트 설계 (R3)

process-service.md의 7단계 흐름을 실행 가능한 하네스 구조로 변환합니다.

## 파이프라인

| 단계 | 내용 | 실행 주체 | 산출물 |
|---|---|---|---|
| 1~4 | 레퍼런스 수집 → 분석 → 화면 설계 문서 → Figma 키스크린(2~3개, 390×844) 제작 | 에이전트 전담, 자동 실행 | 화면 설계 문서 + Figma 키스크린 |
| **GATE①** | 내부 관계자 협의·확정 | 사람(나) | 승인 여부 |
| 6 | 토큰/컴포넌트 제작 + 화면 디자인 | 에이전트 전담, 자동 실행 | 완성된 화면 디자인 |
| **GATE②** | 가이드(design.md) 위반 검토 | 자동 스크립트 | 위반 목록 (0건이면 통과) |

## GATE① — 내부 관계자 협의·확정

- **판정 방식**: 자동 감지 없음. 내가 직접 `승인` 명령을 입력해야 다음 단계(6번)로 진행.
- `승인` 입력 전까지 하네스는 4번 단계 산출물(키스크린) 상태에서 대기.
- 반려 시: 피드백을 받아 1~4단계를 다시 실행(재진입 지점 = 1~4 전체, 부분 재실행 아님).

## GATE② — 가이드 위반 검토 (자동 스크립트)

Figma REST API로 완성된 화면의 노드 속성(`fills`, `cornerRadius`)을 추출해 아래 허용 목록과 diff. **위반 0건이어야 통과.**

### 검사 범위: 색상 + radius만 (타이포그래피·spacing은 이번 라운드 범위 밖)

**허용 색상(hex, 9개)** — design.md 기준:

| hex | 토큰 |
|---|---|
| `#141414` | ink / primary |
| `#0066ff` | accent |
| `#ffffff` | canvas |
| `#f3f3f3` | canvas-soft |
| `#f0f0f0` | field / hairline-soft |
| `#e0e0e0` | hairline |
| `#262626` | ink-soft |
| `#707070` | text-muted |
| `#adadad` | text-faint |

→ 노드의 fill/stroke hex가 이 목록에 없으면 위반 1건 (노드 ID + hex 기록).

**허용 radius (px)**:

| 값 | 토큰 |
|---|---|
| `0` | rounded.none |
| `16` | rounded.sm |
| `24` | rounded.md |
| `9999` (또는 height/2 이상) | rounded.full |

→ 노드의 `cornerRadius`가 위 4개 값 중 하나가 아니면 위반 1건.
→ **예외**: 노드 이름에 `icon`/`squircle` 포함 시, `cornerRadius ≈ 0.3 × min(width, height)` (±1px 오차 허용)인지로 별도 판정.

### 결과 형식

```
GATE② 결과: 위반 N건
- [node_id] fill #xxxxxx → 허용 목록에 없음
- [node_id] cornerRadius=Npx → 0/16/24/9999 아님 (squircle 예외 대상 아님)
```

- N=0 → 통과, 완료 기준(story-purpose.md) 충족.
- N>0 → 6번 단계로 되돌아가 수정 후 재검사 (자동 루프, 사람 개입 없음).
