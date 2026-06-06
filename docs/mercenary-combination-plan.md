## 동일 직업 합체/승급 구현계획

> **목표:** 같은 직업 유닛을 추가로 뽑으면 여러 유닛이 버프를 받는 것이 아니라, 기존 유닛과 **합체**해서 2성/3성 상위 유닛으로 승급한다.  
> **범위:** 1차 구현은 동일 직업 2개 조합과 동일 직업 3개 조합만 다룬다. 혼합 직업 조합, 전용 스킬 해금, 카드 확률 보정은 제외한다.  
> **핵심 차이:** 시너지는 "여러 명이 동시에 있으면 강함"이고, 조합은 "여러 명을 소모해 한 명을 강하게 만듦"이다.

### 1차 조합 규칙

총 재료 수 기준으로 생각한다. 2번째 같은 직업을 얻으면 2성, 3번째 같은 직업을 얻으면 3성이 된다.

| 상황 | 결과 | 파티 슬롯 |
|---|---|---|
| `검사 1성` + `검사 1성` | `검사 2성` 1개 | 2칸 → 1칸 |
| `검사 2성` + `검사 1성` | `검사 3성` 1개 | 2칸 → 1칸 |
| `검사 3성` + `검사 1성` | 조합 불가, 새 `검사 1성` 유지 | 1칸 추가 |
| 플레이어가 `검사 1성`이고 검사 고용 | 플레이어 본체가 `검사 2성` | follower 생성 없음 |
| 플레이어가 `검사 2성`이고 검사 고용 | 플레이어 본체가 `검사 3성` | follower 생성 없음 |

플레이어 본체도 하나의 유닛으로 취급한다. 시작 직업과 같은 직업을 계속 뽑으면 플레이어가 직접 승급하고, 다른 직업을 뽑으면 follower 유닛으로 합류한다.

### 1차 승급 수치

직업별 특수 효과는 나중에 붙이고, 1차는 공통 승급 계수만 둔다. 이렇게 해야 먼저 시스템이 깔끔하게 동작한다.

| 등급 | 공격/회복 | 쿨타임 | 사거리 | 광역 반경 | 표시 |
|---|---:|---:|---:|---:|---|
| 1성 | x1.0 | x1.0 | +0px | +0px | `★` |
| 2성 | x1.6 | x0.85 | +10px | +15px | `★★` |
| 3성 | x2.4 | x0.70 | +25px | +30px | `★★★` |

예시:

- 전사 1성: 스플래시 45px
- 전사 2성: 스플래시 60px, 공격력 1.6배
- 전사 3성: 스플래시 75px, 공격력 2.4배
- 성직자는 `atk` 대신 `heal`에 같은 배율 적용

### 파일 구조

- Create: `src/game/data/unitRanks.ts`  
  등급 타입, 승급 계수, 전투 스펙 보정 함수를 담당한다.
- Create: `src/game/state/partyUnits.ts`  
  `PartyUnit` 타입, 유닛 생성, 같은 직업 합체 로직을 담당한다.
- Modify: `src/game/state/GameState.ts`  
  `party: string[]`를 `party: PartyUnit[]`로 바꾸고, `addMerc()`가 유닛 추가 후 자동 합체하게 한다.
- Modify: `src/game/systems/MercManager.ts`  
  `PartyUnit`의 `id`와 `rank`를 기준으로 플레이어/follower 전투 스펙을 계산한다.
- Modify: `src/game/entities/Mercenary.ts`  
  follower 스프라이트가 `mercId`뿐 아니라 `unitId`, `rank`도 들고 있게 한다.
- Modify: `src/game/hud/GameHud.ts`  
  기존 직업별 `x2` 묶음 표시를 버리고, 유닛 슬롯마다 별 등급을 표시한다.
- Test: `tests/partyUnits.test.ts`, `tests/unitRanks.test.ts`  
  합체 규칙과 등급별 전투 스펙 보정을 순수 함수로 검증한다.

### Task 1: 등급 전투 스펙 보정 추가

**Files:**
- Create: `src/game/data/unitRanks.ts`
- Test: `tests/unitRanks.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
import assert from "node:assert/strict";
import { applyRankToCombat } from "../src/game/data/unitRanks.ts";
import { MERC_COMBAT } from "../src/game/data/mercs.ts";

const sword2 = applyRankToCombat(MERC_COMBAT.sword, 2);
assert.equal(sword2.atk, Math.round(MERC_COMBAT.sword.atk * 1.6));
assert.equal(sword2.cooldownMs, Math.round(MERC_COMBAT.sword.cooldownMs * 0.85));
assert.equal(sword2.range, MERC_COMBAT.sword.range + 10);
assert.equal(sword2.aoeRadius, (MERC_COMBAT.sword.aoeRadius ?? 0) + 15);

const sword3 = applyRankToCombat(MERC_COMBAT.sword, 3);
assert.equal(sword3.atk, Math.round(MERC_COMBAT.sword.atk * 2.4));
assert.equal(sword3.cooldownMs, Math.round(MERC_COMBAT.sword.cooldownMs * 0.7));
assert.equal(sword3.range, MERC_COMBAT.sword.range + 25);
assert.equal(sword3.aoeRadius, (MERC_COMBAT.sword.aoeRadius ?? 0) + 30);

const cleric3 = applyRankToCombat(MERC_COMBAT.cleric, 3);
assert.equal(cleric3.heal, Math.round((MERC_COMBAT.cleric.heal ?? 0) * 2.4));
```

- [ ] **Step 2: 실패 확인**

Run:

```bash
node --experimental-strip-types tests/unitRanks.test.ts
```

Expected: `Cannot find module .../src/game/data/unitRanks.ts`

- [ ] **Step 3: 최소 구현**

```ts
import type { MercCombat } from "./mercs";

export type UnitRank = 1 | 2 | 3;

export const RANK_STARS: Record<UnitRank, string> = {
  1: "★",
  2: "★★",
  3: "★★★",
};

const RANK_BONUS: Record<UnitRank, {
  powerMultiplier: number;
  cooldownMultiplier: number;
  rangeBonus: number;
  aoeRadiusBonus: number;
}> = {
  1: { powerMultiplier: 1, cooldownMultiplier: 1, rangeBonus: 0, aoeRadiusBonus: 0 },
  2: { powerMultiplier: 1.6, cooldownMultiplier: 0.85, rangeBonus: 10, aoeRadiusBonus: 15 },
  3: { powerMultiplier: 2.4, cooldownMultiplier: 0.7, rangeBonus: 25, aoeRadiusBonus: 30 },
};

export function applyRankToCombat(base: MercCombat, rank: UnitRank): MercCombat {
  const bonus = RANK_BONUS[rank];
  return {
    ...base,
    atk: Math.max(1, Math.round(base.atk * bonus.powerMultiplier)),
    heal: base.heal === undefined ? base.heal : Math.max(1, Math.round(base.heal * bonus.powerMultiplier)),
    cooldownMs: Math.max(1, Math.round(base.cooldownMs * bonus.cooldownMultiplier)),
    range: base.range + bonus.rangeBonus,
    aoeRadius:
      base.aoeRadius === undefined
        ? base.aoeRadius
        : base.aoeRadius + bonus.aoeRadiusBonus,
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run:

```bash
node --experimental-strip-types tests/unitRanks.test.ts
```

Expected: 종료 코드 `0`

### Task 2: 파티 유닛 모델과 자동 합체 로직 추가

**Files:**
- Create: `src/game/state/partyUnits.ts`
- Test: `tests/partyUnits.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
import assert from "node:assert/strict";
import { addUnitWithMerge, createPartyUnit } from "../src/game/state/partyUnits.ts";

const player = createPartyUnit("sword", { isPlayer: true });
const afterSecondSword = addUnitWithMerge([player], "sword");

assert.equal(afterSecondSword.length, 1);
assert.equal(afterSecondSword[0].id, "sword");
assert.equal(afterSecondSword[0].rank, 2);
assert.equal(afterSecondSword[0].isPlayer, true);

const afterThirdSword = addUnitWithMerge(afterSecondSword, "sword");
assert.equal(afterThirdSword.length, 1);
assert.equal(afterThirdSword[0].rank, 3);
assert.equal(afterThirdSword[0].isPlayer, true);

const afterCappedSword = addUnitWithMerge(afterThirdSword, "sword");
assert.equal(afterCappedSword.length, 2);
assert.equal(afterCappedSword[0].rank, 3);
assert.equal(afterCappedSword[1].rank, 1);

const mixed = addUnitWithMerge([createPartyUnit("sword", { isPlayer: true })], "bow");
assert.equal(mixed.length, 2);
assert.equal(mixed[0].id, "sword");
assert.equal(mixed[1].id, "bow");
```

- [ ] **Step 2: 실패 확인**

Run:

```bash
node --experimental-strip-types tests/partyUnits.test.ts
```

Expected: `Cannot find module .../src/game/state/partyUnits.ts`

- [ ] **Step 3: 최소 구현**

```ts
import type { UnitRank } from "../data/unitRanks";

export type PartyUnit = {
  uid: string;
  id: string;
  rank: UnitRank;
  isPlayer?: boolean;
};

let nextUnitSeq = 1;

export function createPartyUnit(id: string, opts: { isPlayer?: boolean } = {}): PartyUnit {
  const uid = opts.isPlayer ? "player" : `merc-${nextUnitSeq++}`;
  return { uid, id, rank: 1, isPlayer: opts.isPlayer };
}

export function addUnitWithMerge(party: PartyUnit[], id: string): PartyUnit[] {
  const next = party.map((unit) => ({ ...unit }));
  const candidate = createPartyUnit(id);

  const rank2Target = next.find((unit) => unit.id === id && unit.rank === 2);
  if (rank2Target) {
    rank2Target.rank = 3;
    return next;
  }

  const rank1Target = next.find((unit) => unit.id === id && unit.rank === 1);
  if (rank1Target) {
    rank1Target.rank = 2;
    return next;
  }

  next.push(candidate);
  return next;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run:

```bash
node --experimental-strip-types tests/partyUnits.test.ts
```

Expected: 종료 코드 `0`

### Task 3: GameState를 `PartyUnit[]` 기반으로 변경

**Files:**
- Modify: `src/game/state/GameState.ts`
- Modify: `src/game/scenes/DungeonScene.ts`

- [ ] **Step 1: `GameState` import 추가**

```ts
import { addUnitWithMerge, createPartyUnit, type PartyUnit } from "./partyUnits";
```

- [ ] **Step 2: party 타입 변경**

```ts
party: PartyUnit[] = [];
```

- [ ] **Step 3: 플레이어 유닛 추가 메서드 작성**

```ts
addPlayerClass(id: string): void {
  if (this.party.some((unit) => unit.isPlayer)) return;
  this.party = [createPartyUnit(id, { isPlayer: true })];
  this.emit(GAME_EVENT.party, this.party);
}
```

- [ ] **Step 4: 고용 메서드 변경**

```ts
addMerc(id: string): void {
  this.party = addUnitWithMerge(this.party, id);
  this.emit(GAME_EVENT.party, this.party);
}
```

- [ ] **Step 5: hiredMercCount 변경**

```ts
get hiredMercCount(): number {
  return this.party.filter((unit) => !unit.isPlayer).length;
}
```

- [ ] **Step 6: DungeonScene 초기화 변경**

`buildHud()`의 초기 플레이어 등록을 다음처럼 바꾼다.

```ts
const classId = this.registry.get("classId") as string | null;
this.state.addPlayerClass(classId ?? "sword");
```

- [ ] **Step 7: 빌드 실패 확인**

Run:

```bash
npm run build
```

Expected: `party`가 `string[]`이라고 가정하던 `MercManager`, `GameHud`에서 타입 오류 발생

### Task 4: MercManager에 등급 적용

**Files:**
- Modify: `src/game/systems/MercManager.ts`
- Modify: `src/game/entities/Mercenary.ts`

- [ ] **Step 1: Mercenary가 PartyUnit을 받도록 변경**

```ts
import type { PartyUnit } from "../state/partyUnits";

export class Mercenary extends Phaser.GameObjects.Sprite {
  readonly unit: PartyUnit;
  readonly mercId: string;

  constructor(scene: Phaser.Scene, unit: PartyUnit) {
    super(scene, 0, 0, mercIdleTex(unit.id), 0);
    this.unit = unit;
    this.mercId = unit.id;
    this.combat = MERC_COMBAT[unit.id];
    // 기존 생성 로직 유지
  }
}
```

- [ ] **Step 2: MercManager import 추가**

```ts
import { MERC_COMBAT, type MercCombat } from "../data/mercs";
import { applyRankToCombat } from "../data/unitRanks";
import type { PartyUnit } from "../state/partyUnits";
```

- [ ] **Step 3: 전투 스펙 헬퍼 추가**

```ts
private combatFor(unit: PartyUnit): MercCombat | null {
  const base = MERC_COMBAT[unit.id];
  return base ? applyRankToCombat(base, unit.rank) : null;
}
```

- [ ] **Step 4: `syncParty()`를 유닛 기준으로 변경**

```ts
private syncParty(party: PartyUnit[]): void {
  const playerUnit = party.find((unit) => unit.isPlayer);
  this.playerCombat = playerUnit ? this.combatFor(playerUnit) : null;

  const followers = party.filter((unit) => !unit.isPlayer);

  while (this.mercs.length > followers.length) {
    this.mercs.pop()?.destroy();
  }

  while (this.mercs.length < followers.length) {
    const unit = followers[this.mercs.length];
    const merc = new Mercenary(this.scene, unit);
    const player = this.getPlayer();
    if (player) merc.setPosition(player.x, player.y);
    this.mercs.push(merc);
  }
}
```

- [ ] **Step 5: follower 공격 시 등급 스펙 사용**

```ts
private runCombat(merc: Mercenary): void {
  const combat = this.combatFor(merc.unit);
  if (!combat) return;
  // 이후 기존 runCombat 로직에서 merc.combat 대신 combat 사용
}
```

- [ ] **Step 6: 빌드 확인**

Run:

```bash
npm run build
```

Expected: `MercManager`와 `Mercenary` 타입 오류 없음. 남은 오류가 있으면 `GameHud`의 `party` 처리 쪽이어야 한다.

### Task 5: HUD를 조합 등급 표시로 변경

**Files:**
- Modify: `src/game/hud/GameHud.ts`

- [ ] **Step 1: 기존 카운트 배지 방식 폐기**

현재 `syncParty()`는 `party: string[]`를 직업별로 묶어 `x2` 배지를 보여준다. 조합 시스템에서는 같은 직업이 합쳐져 하나의 유닛이 되므로, 직업별 카운트가 아니라 **유닛 하나당 슬롯 하나**를 보여준다.

- [ ] **Step 2: PartyUnit import 추가**

```ts
import type { PartyUnit } from "../state/partyUnits";
import { RANK_STARS } from "../data/unitRanks";
```

- [ ] **Step 3: `syncParty()` 시그니처 변경**

```ts
private syncParty(party: PartyUnit[]): void {
  for (const slot of this.slots) {
    slot.group.destroy();
  }
  this.slots = [];

  for (const unit of party) {
    if (!MERC_HUD[unit.id]) continue;
    const slot = this.createSlot(unit.id);
    slot.count = unit.rank;
    slot.badgeText.setText(RANK_STARS[unit.rank]);
    slot.badge.setVisible(unit.rank > 1);
    this.slots.push(slot);
  }

  this.layoutMercBar();
}
```

- [ ] **Step 4: 별 표시 색상**

```ts
if (unit.rank === 3) {
  slot.badge.setFillStyle(0xffd54a, 1);
  slot.badgeText.setColor("#1b1024");
} else if (unit.rank === 2) {
  slot.badge.setFillStyle(0x6effe0, 1);
  slot.badgeText.setColor("#1b1024");
}
```

- [ ] **Step 5: 빌드 확인**

Run:

```bash
npm run build
```

Expected: TypeScript 오류 없이 build 완료

### Task 6: 최종 검증

**Files:**
- Verify only

- [ ] **Step 1: 순수 함수 테스트**

Run:

```bash
node --experimental-strip-types tests/unitRanks.test.ts
node --experimental-strip-types tests/partyUnits.test.ts
```

Expected: 둘 다 종료 코드 `0`

- [ ] **Step 2: 린트**

Run:

```bash
npm run lint
```

Expected: ESLint 오류 없음

- [ ] **Step 3: 빌드**

Run:

```bash
npm run build
```

Expected: TypeScript 오류 없음. Vite bundle size 경고는 기존 경고라 실패로 보지 않는다.

- [ ] **Step 4: 수동 플레이 체크**

1. 전사로 시작한다.
2. 전사 고용 카드를 한 번 고른다.
3. follower가 새로 생기지 않고 플레이어 전사가 `★★`로 표시되는지 확인한다.
4. 전사 고용 카드를 한 번 더 고른다.
5. 플레이어 전사가 `★★★`로 표시되고 전사 공격력/스플래시가 강해졌는지 확인한다.
6. 궁수 고용 카드를 고른다.
7. 궁수는 별도 follower `★`로 생기는지 확인한다.
8. 궁수를 두 번 더 고르면 궁수 follower가 `★★★` 하나로 합쳐지는지 확인한다.

### 구현 시 주의점

- 이 기능은 시너지가 아니다. 같은 직업이 여러 명 존재해서 전체가 강해지는 구조를 만들지 않는다.
- 같은 직업을 뽑으면 기존 1성/2성 유닛을 우선 승급한다.
- 3성은 최고 등급이다. 이후 같은 직업을 더 뽑으면 새 1성 유닛으로 추가한다.
- 플레이어 본체도 합체 대상이다. 시작 직업과 같은 직업 카드를 뽑으면 플레이어가 승급한다.
- 조합으로 follower 수가 줄 수 있으므로 `MercManager.syncParty()`는 늘어나는 경우뿐 아니라 줄어드는 경우도 처리해야 한다.
- `MAX_HIRED_MERCS`는 실제 follower 슬롯 수 기준으로 유지한다. 재료로 소모된 유닛은 슬롯을 차지하지 않는다.
- 기존 전역 강화(`tactics`, `haste`)는 등급 보정 뒤에 적용한다.
