# 10분 용병단 구현 점검 보고서

점검 기준 문서: `docs/game-mvp-plan.md`  
보고서 양식: `docs/report-form.md`  
점검 일자: 2026-05-31

## 1. 점검 요약

전체 구현 상태: **부분 구현**. 시작 화면, 직업 선택, Phaser 게임 실행, 플레이어 이동, 적 스폰/추적, 접촉 피해, 일부 자동 전투, 패배/승리 결과 화면은 존재한다. 다만 MVP 핵심 루프인 **30초 웨이브 종료 → 업그레이드 카드 3택1 → 효과 적용 → 다음 웨이브**가 아직 없다.

실행 가능 여부: **가능**. 현재 `http://localhost:5173/` dev 서버가 응답하고, `/game?class=bow` 진입 시 1280x720 Phaser canvas가 생성된다.

빌드/타입 체크 결과:

- `npm install --package-lock=false`: 성공, 취약점 0개
- `npm run build`: 성공
- `npm run lint`: 실패
  - `src/game/tiles/proceduralTiles.ts` 102~105행의 comma expression 형태가 `@typescript-eslint/no-unused-expressions`에 걸림
- dev 서버 확인: `http://localhost:5173/` HTTP 200 OK
- 브라우저 런타임 확인: `/game?class=bow`에서 canvas 1개, canvas size 1280x720, console error 없음

가장 큰 리스크:

1. 업그레이드 시스템이 없어 기획의 핵심 성장 루프가 끊겨 있다.
2. HUD에 Kills/Score/남은 시간이 없고, 결과 화면에도 최종 점수가 없다.
3. 초기 궁수 1명 지급 구조가 아니라 직업 선택 캐릭터가 곧 플레이어이자 자동 공격 주체로 동작한다.
4. 기획은 미니멀 도형 스타일인데 현재는 외부 RPG 캐릭터 에셋 중심이다.
5. 플레이어가 화면 밖으로 나갈 수 없다는 조건과 달리, 현재는 큰 월드에서 카메라가 따라가는 구조다.

## 2. 프로젝트 구조 요약

현재 프로젝트는 React + Vite + TypeScript + Phaser 구조다.

- `src/main.tsx`: React StrictMode, BrowserRouter 진입점
- `src/App.tsx`: 라우팅 관리
  - `/`: 타이틀 화면
  - `/game`: 직업 선택 또는 Phaser 게임 진입
- `src/ui/`
  - `TitleScreen.tsx`: 시작/설정/조작법/튜토리얼 메뉴
  - `CharacterSelectModal.tsx`: 게임 시작 전 검사/궁수/마법사/성직자 선택
  - `MercenaryRow.tsx`, `mercenaries.ts`: 타이틀 용병 미리보기
  - `SettingsModal.tsx`, `ControlsModal.tsx`, `TutorialModal.tsx`: React 모달 UI
- `src/game/`
  - `PhaserGame.tsx`: Phaser.Game 생성/파괴, 1280x720 FIT 스케일
  - `config.ts`: 해상도, 타일, 텍스처 키, 직업/용병 HUD 설정
  - `scenes/PreloadScene.ts`: 에셋 로딩, 절차 텍스처 생성
  - `scenes/DungeonScene.ts`: 메인 게임 루프, 입력, 카메라, 충돌, HUD, pause/result 메뉴
  - `state/GameState.ts`: 시간, 웨이브, HP, kills, party, game over 상태
  - `systems/WaveManager.ts`: 적 스폰/추적
  - `systems/MercManager.ts`: 플레이어/용병 자동 전투
  - `systems/ProjectileManager.ts`: 화살/마법 투사체와 광역 피해
  - `entities/Enemy.ts`, `Mercenary.ts`, `Projectile.ts`: Phaser 오브젝트
  - `hud/GameHud.ts`, `PauseMenu.ts`, `GameOverMenu.ts`: Phaser 내부 HUD/메뉴
  - `data/enemies.ts`, `mercs.ts`, `waves.ts`: 적/용병/웨이브 밸런스 데이터

## 3. 기획 대비 구현 현황표

| 항목 | 기획 기준 | 현재 구현 | 상태 | 비고 |
|---|---|---|---|---|
| 기술 스택 | React, Vite, TypeScript, Phaser | 일치 | 완료 | Phaser 4.1.0 사용 |
| 시작 화면 | 제목, 한 줄 설명, 조작법, 시작 버튼 | 제목, 부제, 메뉴, 조작/튜토리얼 모달 | 부분 | 한 줄 설명은 문구가 다르고 설정/튜토리얼이 추가됨 |
| 게임 시작 흐름 | 시작 버튼 클릭 후 바로 게임 | 시작 후 직업 선택 모달 필요 | 다름 | 직업 선택은 기획에 없음 |
| Phaser 캔버스 | 게임 캔버스 표시 | 1280x720, FIT 스케일 | 완료 | 전체 viewport에 맞춤 |
| 플레이어 이동 | WASD/방향키 | WASD/방향키 | 완료 | 속도는 200으로 기획 220과 다름 |
| 공격 버튼 없음 | 직접 공격 입력 없음 | 직접 공격 버튼 없음 | 완료 | 단, 선택한 플레이어 직업이 자동 공격함 |
| 플레이어 표현 | 파란 원/명확한 도형 | 직업별 RPG 스프라이트 | 다름 | 외부 캐릭터 에셋 사용 |
| 화면 밖 이동 제한 | 화면 밖으로 나갈 수 없음 | 큰 월드에서 카메라 추적, collideWorldBounds false | 다름 | 실질적으로 화면 경계 제한 없음 |
| 초기 용병 | 궁수 1명 기본 지급 | 선택한 직업 1명이 playerCombat으로 등록 | 다름 | 독립 궁수 용병이 기본 지급되지 않음 |
| 용병 자동공격 | 주변 용병들이 자동 공격 | party[0] 플레이어 자동 전투, 추가 용병 로직 있음 | 부분 | 추가 용병은 업그레이드가 없어 정상 루프에서는 늘지 않음 |
| 검사 | 피해 16, 간격 800ms, 사거리 85 | 피해 15, 간격 800ms, 사거리 70 | 부분 | 수치 불일치 |
| 궁수 | 피해 12, 간격 700ms, 사거리 320 | 피해 10, 간격 1000ms, 사거리 300 | 부분 | 수치 불일치 |
| 마법사 | 피해 28, 간격 1800ms, 사거리 300, 반경 70 | 피해 25, 간격 2000ms, 사거리 280, 반경 80 | 부분 | 수치 불일치 |
| 성직자 | 5 회복, 2500ms | 5 회복, 5000ms | 부분 | 회복 간격 불일치 |
| 적 3종 | grunt/runner/tank 수치 | slime/rusher/brute로 에셋 매핑 | 부분 | HP/속도/피해/점수 수치 다수 불일치, score 없음 |
| 적 스폰 | 화면 가장자리 근처 | 플레이어 주변 반경 760~900 | 부분 | 카메라 화면 기준 가장자리는 아님 |
| 적 추적 | 플레이어를 향해 이동 | 구현됨 | 완료 | 단순 직선 추적 |
| 접촉 피해 | 적과 닿으면 HP 감소 | 구현됨 | 완료 | 피격 쿨다운 700ms |
| 처치 수 | 적 처치 시 증가 | GameState.kills 증가 | 부분 | HUD에는 표시되지 않음 |
| 점수 | 적 처치 시 점수 증가 | score 상태 없음 | 미구현 | 결과 점수도 없음 |
| 웨이브 | 30초마다 종료, 일시정지 | 30초마다 wave 값만 증가 | 부분 | 업그레이드 pause 없음 |
| 업그레이드 카드 | 웨이브 종료 시 3택1 | 구현 없음 | 미구현 | 관련 데이터/모달/이벤트 없음 |
| 업그레이드 효과 | 용병 추가, 배율, 회복, 최대 HP | 구현 없음 | 미구현 | GameState.maxHp도 readonly |
| 승리 조건 | 600초 생존 | elapsedSec 600 도달 시 victory | 완료 | 결과 화면 표시 |
| 패배 조건 | HP 0 | HP 0 시 defeat | 완료 | physics world pause |
| 결과 화면 | 승패, 생존 시간, 처치 수, 최종 점수, 다시하기 | 승패, 생존 시간, 처치 수, 도달 웨이브, 다시 시작 | 부분 | 최종 점수 없음 |
| HUD | HP, 남은 시간, Wave, Kills, Score, Mercenaries | HP, 경과 시간, Wave, 용병 바, 조작 힌트 | 부분 | Kills/Score 없음, 남은 시간이 아니라 경과 시간 |
| React/Phaser 역할 | Phaser 로직, React UI/HUD/업그레이드 | Phaser 내부 HUD/메뉴 중심 | 다름 | React는 타이틀/선택/모달 담당 |
| 성능 제한 | 적 120, 투사체 100 | 적 80, 투사체 120 | 부분 | 기준과 상반됨 |
| 그래픽 스타일 | 외부 에셋 없는 미니멀 도형 | Tiny RPG 캐릭터 에셋과 던전 타일 사용 | 다름 | 기획 금지사항과 충돌 |

## 4. 구현 완료된 기능

- React/Vite/TypeScript/Phaser 앱 구조가 실행된다.
- 타이틀 화면, 설정, 조작법, 튜토리얼 모달이 있다.
- 게임 시작 후 직업 선택 모달이 뜨고, 선택한 직업으로 게임에 진입한다.
- Phaser 게임은 1280x720 기준 해상도로 생성되고 브라우저 화면에 FIT 스케일된다.
- WASD/방향키 이동이 가능하다.
- 적이 주기적으로 생성되고 플레이어를 추적한다.
- 적과 접촉하면 HP가 줄고, 피격 쿨다운과 시각 피드백이 있다.
- 선택한 직업 기준으로 자동 전투가 동작한다.
  - 검사: 근접 공격
  - 궁수: 화살 투사체
  - 마법사: 마법 투사체 착탄 후 광역 폭발
  - 성직자: 주기적 회복
- 적 사망 처리와 kills 증가가 있다.
- HP 0 패배와 600초 승리 조건이 있다.
- ESC 일시정지 메뉴와 게임오버/결과 메뉴가 있다.
- 결과 화면에서 다시 시작, 나가기가 가능하다.
- `PhaserGame`에서 unmount 시 `game.destroy(true)`를 반환하도록 작성되어 있다.

## 5. 부분 구현 또는 기획과 다른 기능

- **핵심 성장 루프 부재**
  - 현재 wave는 시간에 따라 증가하지만 웨이브 종료 상태가 없다.
  - 게임이 멈추지 않고, 업그레이드 요청 이벤트도 발생하지 않는다.

- **용병 구조가 기획과 다름**
  - 기획은 플레이어 주변 용병들이 싸우고, 초기 궁수 1명 지급이다.
  - 현재는 선택한 직업이 플레이어 본인이며 party[0]으로 자동 공격한다.
  - 추가 용병 스프라이트/전투 로직은 있으나, 추가하는 카드 루프가 없다.

- **React UI 연동 기준과 다름**
  - 기획은 React HUD와 React UpgradeModal을 우선한다.
  - 현재 HUD, Pause, Result는 Phaser 내부 GameObject로 구현되어 있다.

- **그래픽 스타일 불일치**
  - 기획은 외부 에셋 없이 미니멀 도형, RPG Maker풍 에셋 금지다.
  - 현재는 Tiny RPG Character Asset Pack, 던전 타일, 스프라이트 애니메이션을 적극 사용한다.
  - 시각 완성도는 높지만 문서 기준으로는 방향이 다르다.

- **밸런스 수치 불일치**
  - 플레이어 속도 200 vs 기획 220
  - 용병 피해/사거리/쿨다운 다수 불일치
  - 적 HP/속도/피해 수치가 기획과 다름
  - 피격 쿨다운 700ms vs 권장 600ms

- **HUD 정보 부족**
  - HP와 Wave, 시간, 용병 구성은 일부 표시된다.
  - Kills, Score가 없다.
  - Time은 남은 시간이 아니라 경과 시간이다.

- **결과 화면 정보 부족**
  - 최종 점수 계산이 없다.
  - 점수 상태 자체가 없다.

- **플레이어 경계 조건 불일치**
  - `WORLD_BOUNDARY = 200_000`, `setCollideWorldBounds(false)`로 사실상 무한 필드다.
  - 기획의 "화면 밖으로 나갈 수 없음"과 다르다.

## 6. 미구현 기능

### P0: MVP 진행 불가 수준

- 30초 웨이브 종료 시 게임 일시정지
- 업그레이드 카드 3장 랜덤 표시
- 업그레이드 선택 이벤트와 효과 적용
- 다음 웨이브 재개
- 업그레이드 중 적 이동/공격/피해/스폰 중단
- Score 상태와 최종 점수 계산

### P1: MVP 핵심 재미에 필요

- 초기 궁수 1명 기본 지급 구조
- 고용 카드로 검사/궁수/마법사/성직자 수 증가
- 여러 용병 보유 수가 실제 전투에 반영되는 정상 플레이 루프
- 전술 훈련, 속공 지휘, 민첩한 대장, 응급 치료, 방어 진형 구현
- HUD에 Kills, Score, 남은 시간 표시
- 결과 화면에 최종 점수 표시

### P2: 있으면 좋음

- 기획 수치에 맞춘 용병/적 밸런스 보정
- 적 HP 웨이브 스케일링
- 적 종류 비율 가중치 조정
- 최대 적 120, 최대 투사체 100 등 성능 제한 기준 정렬
- React HUD/React UpgradeModal로 역할 분리

### P3: 나중에 해도 됨

- 현재 캐릭터 선택 흐름을 유지할지 기획에 맞춰 제거할지 결정
- 외부 에셋 기반 비주얼을 유지할지, 미니멀 도형 스타일로 회귀할지 결정
- README를 실제 게임 설명으로 갱신

## 7. 버그 가능성 및 안정성 리스크

- `npm run lint`가 실패한다.
  - `src/game/tiles/proceduralTiles.ts`의 102~105행 comma expression이 lint를 막는다.
  - 빌드는 통과하지만 제출 전 정적 검사 기준이 있으면 실패 위험이 있다.

- 업그레이드 구현 시 현재 구조와 충돌할 수 있다.
  - `GameState.maxHp`가 `readonly`라 방어 진형 같은 최대 HP 증가가 바로 들어가기 어렵다.
  - 용병 공격력/공격속도 배율 상태가 없다.
  - 플레이어 이동속도도 상수 `PLAYER_SPEED`라 민첩한 대장 적용 구조가 없다.

- 웨이브 종료 이벤트가 없다.
  - 현재 `GameState.tick()`은 wave 숫자만 갱신한다.
  - 30초 단위 pause/upgrade를 추가하려면 시간 진행, physics pause, manager update 중단 조건을 다시 설계해야 한다.

- 점수 시스템이 없다.
  - `EnemyDef`에 점수 필드가 없고, kill 시 `kills`만 증가한다.
  - 결과 점수 공식 적용을 위해 enemy score, survivalSeconds, kills 기반 계산이 필요하다.

- React StrictMode 관련은 현재 큰 문제는 발견되지 않았다.
  - `PhaserGame` callback ref에서 `game.destroy(true)` cleanup을 반환한다.
  - 브라우저 확인 시 canvas가 1개만 생성되었다.
  - 단, React ref cleanup 동작에 의존하므로 재진입/라우트 이동 테스트는 계속 필요하다.

- 다시 시작은 `scene.restart()` 기반이다.
  - 새 `GameState`, HUD, managers가 다시 만들어진다.
  - 현재 관찰상 치명 문제는 보이지 않지만, 업그레이드/전역 이벤트가 추가되면 중복 리스너 정리가 중요해진다.

- 성능 제한이 기획과 다르다.
  - 적은 80 제한, 투사체는 120 제한이다.
  - 후반 웨이브 생존 압박과 성능 목표 모두 기획 수치와 어긋날 수 있다.

## 8. 밸런스/재미 관점 피드백

현재 버전은 "자동전투 생존"의 감각은 일부 전달한다. 적이 몰려오고, 선택한 직업이 자동으로 공격하며, 도망 다니는 기본 플레이는 가능하다.

다만 기획의 재미 중심인 "웨이브마다 빌드를 선택해서 강해지는 용병단"은 아직 전달되지 않는다. 현재는 시작 직업 선택 후 10분 동안 시간이 흐르는 구조에 가깝고, 플레이 중 선택/성장/전략 전환이 없다.

난이도는 실제 플레이 길게 검증하지 않았지만 다음 가능성이 있다.

- 선택 직업에 따라 난이도가 크게 갈릴 수 있다. 궁수/마법사는 원거리 처리, 성직자는 회복 중심이라 초반 체감이 다를 수 있다.
- 점수와 업그레이드 보상이 없어서 처치의 피드백이 약하다.
- 적 HP 스케일링이 없고 동시 생존 수만 증가하므로 후반 압박이 단조로울 수 있다.
- 플레이어가 화면 경계에 갇히지 않고 큰 월드에서 이동하므로, 기획보다 도주 공간이 넓어 난이도가 낮아질 수 있다.

## 9. 다음 작업 추천 순서

1. `npm run lint` 실패 원인 수정
   - `proceduralTiles.ts`의 comma expression을 일반 block statement로 변경

2. 점수 시스템 추가
   - `EnemyDef.score`
   - `GameState.score`
   - kill 시 kills/score 동시 증가
   - 결과 점수 공식 반영

3. 웨이브 종료 상태 추가
   - 30초마다 combat/update 중단
   - `upgrade:request` 또는 동등 이벤트 발행
   - 선택 전까지 시간/스폰/피해/공격 중단

4. 업그레이드 데이터와 React UpgradeModal 추가
   - 3장 랜덤, 중복 없음
   - 카드 이름/설명/효과 표시
   - 선택 시 Phaser/GameState에 적용

5. 업그레이드 효과 구현
   - 용병 4종 고용
   - 공격력 배율
   - 공격속도 배율
   - 플레이어 이동속도 배율
   - 현재 HP 회복
   - 최대 HP 증가

6. HUD 보정
   - Time을 남은 시간으로 변경
   - Kills/Score 추가
   - 현재 용병 구성과 수량 유지

7. 기획 방향 결정
   - 현재 RPG 에셋/직업 선택형 비주얼을 유지할지
   - 문서대로 미니멀 도형/초기 궁수 지급 구조로 되돌릴지

8. 밸런스 수치 정렬
   - 플레이어 속도, 용병 수치, 적 수치, 성능 제한

## 10. 결론

판단: **아직 제출 어려움**

이유:

- 실행 가능한 게임 화면과 기본 전투는 있지만, MVP 핵심 루프인 업그레이드 3택1이 없다.
- Score/Kills HUD와 최종 점수 결과가 부족하다.
- 초기 궁수 지급, 용병단 성장, React 업그레이드 UI 등 핵심 기획과 구현이 다르다.
- 그래픽 스타일은 완성도와 별개로 문서의 "외부 에셋 없이 미니멀 도형" 기준과 충돌한다.
- `npm run build`는 통과하지만 `npm run lint`는 실패한다.

조건부 제출 가능으로 올리려면 최소한 다음이 필요하다.

1. 30초 웨이브 종료/업그레이드/다음 웨이브 루프
2. Score/Kills/최종 점수
3. 고용 및 강화 카드 효과
4. lint 오류 제거

## 작업 완료 기록

- 생성 파일: `docs/implementation-audit.md`
- 실행한 명령:
  - `rg --files docs src`
  - `Get-Content ... -Encoding UTF8`
  - `npm install --package-lock=false`
  - `npm run build`
  - `npm run lint`
  - `Invoke-WebRequest http://localhost:5173/`
  - in-app browser 런타임 확인: `/game?class=bow`
- 코드 수정 여부:
  - 이번 점검 작업에서는 소스 코드 수정 없음
  - 보고서 파일만 생성
  - 작업 시작 시점에 이미 `src/index.css`, `src/ui/MercenaryRow.tsx`, `src/ui/TitleScreen.tsx`는 수정된 상태였음
