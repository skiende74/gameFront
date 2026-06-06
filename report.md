# 게임 밸런스 진단 및 조정 제안

## 현재 구조 요약

- 20웨이브 / 웨이브당 30초 → 끝나면 카드 3택1 → 다음 웨이브. 보스는 5·10·15·20웨이브.
- 플레이어 본체(party[0]) + 고용 용병 최대 5명까지. 카드로만 성장.
- 강화 카드 9종: 용병 고용 4종 / 공격력 +10% / 공속 +10% / 이속 +10% / 즉시회복 +30 / 최대체력 +20.

---

## 진단: 왜 너무 쉬운가 (근본 원인 4가지)

### 1. 적 능력치가 웨이브 내내 "고정"이다 (가장 큰 문제)

`waves.ts`는 **동시 생존 수만** 6→65로 늘릴 뿐, 적 1마리의 HP/공격력은 끝까지 그대로다.

```ts
// src/game/data/enemies.ts
slime: { hp: 18, speed: 70, damage: 8, ... }
```

20웨이브에서도 슬라임은 여전히 HP 18. 반면 플레이어 전력은 (용병 수 × % 버프)로 **곱연산 성장**하므로, 후반엔 5명 군단이 18HP 잡몹을 즉시 녹여버린다. 파워 곡선이 발산한다.

### 2. 무적시간이 "전역 1개"라 다굴이 안 아프다

피격 쿨다운이 플레이어에 하나만 걸려서, 65마리에 둘러싸여도 650ms마다 딱 1대만 맞는다.

```ts
// src/game/scenes/DungeonScene.ts
const HURT_IFRAME_MS = 650;
```

최악의 경우에도 초당 약 1.5회 피격(잡몹 기준 ~12~23 dmg/s). 포위 자체에 위험이 없어 "몰리면 죽는다"는 긴장감이 사라진다.

### 3. 용병 고용이 항상 압도적 이득 (todo.md에 적힌 문제)

초반에 군대가 1~2유닛(20~40 DPS)일 때:

- **고용 카드** = 통째로 +15~20 DPS (군대 규모 2배)
- **공격력 +10% 카드** = 고작 +2~4 DPS

비교가 안 된다. 게다가 고용에 **비용·기회손실이 전혀 없고**, 5명 채우는 데 5픽이면 충분한데 카드 기회는 ~19번이라 "일단 5명 풀고 나머지 % 버프"가 정해진 정답이 된다. 선택의 고민이 없다.

### 4. 전략적 선택지가 사실상 없다

- 카드는 9종 중 랜덤 3장 단순 추출, **시너지·상성·분기 없음**.
- 적 종류(슬라임/돌진/덩치)가 플레이어에게 **다른 대응을 강요하지 않음** (전부 그냥 직진 추적).
- 보스만 HP가 500→2600으로 점프하고 잡몹 구간은 평탄해서 난이도 곡선이 들쭉날쭉하다.

---

## 조정 방향 제안

### A. 적 웨이브 스케일링 도입 (최우선, 효과 가장 큼)

수만 늘리지 말고 능력치도 웨이브에 따라 키운다. 예시 계수:

- HP 배율 = `1 + 0.13 × (wave-1)` → 10웨이브 ≈ 2.2배, 20웨이브 ≈ 3.5배
- 공격력 배율 = `1 + 0.06 × (wave-1)` (HP보다 완만하게)
- 속도는 살짝만 (+0~20%) 늘려 후반 카이팅 난이도 상승

이러면 "더 강해진 군단 vs 더 단단해진 적"이 맞물려 곡선이 평행해진다. 보스 HP도 잡몹 곡선 위에 자연스럽게 얹히도록 재계산하면 점프가 완화된다.

### B. 피격 처리를 "다굴이 아프게" 변경

선택지 중 하나:

- (간단) `HURT_IFRAME_MS`를 650 → 300~400으로 단축, 또는
- (권장) 무적을 **적 개체별**로 관리 → 여러 적이 동시에 때리면 실제로 더 아프다. 포위가 위험해지고, 탱킹(최대체력)·이속(카이팅)·성직자(힐) 선택의 가치가 살아난다.

### C. 고용 vs 강화 가치 균형

"고용 무조건 이득" 깨기:

- **고용 디미니싱**: 새 용병은 처음엔 능력치 70%로 합류 후 시간/웨이브로 100%까지 성장 → 막픽 고용의 즉발 가치를 낮춤.
- **% 버프 강화**: +10% → +15~20%로 올려 5명 채운 뒤 버프 픽이 실질 보상이 되게.
- **역할 차별 강화**: 현재 마법사 DPS(약 7.8)가 검사(20)·궁수(15)보다 한참 낮다. 마법사는 광역이 핵심이니 쿨다운 1800→1300 또는 반경 75→100으로 "광역 특화" 정체성을 분명히.

```ts
// src/game/data/mercs.ts
mage: { atk: 14, range: 300, cooldownMs: 1800, aoeRadius: 75, ... }
```

### D. 전략/테크 요소 추가 (재미 깊이)

머리 쓰게 만드는 요소:

- **적 상성**: 예) 돌진병은 빠르지만 약함(원거리로 끊기), 덩치는 느리지만 방어형(마법 광역/관통 필요). 종류별로 "이 카드가 필요"한 상황을 만들기.
- **카드 시너지/분기**: 같은 카드 중첩 시 특수효과(예 공격력 3중첩 → 치명타 해금), 또는 "근접 특화 / 원거리 특화" 갈림길.
- **고용에 약한 비용 개념**: 골드까진 아니어도 "고용하면 그 웨이브 강화 1개 포기" 같은 기회비용이 이미 카드 구조에 있으니, 위 A·C로 강화 쪽 매력을 올리면 자연히 트레이드오프가 생긴다.

---

## 우선순위 정리

| 순위 | 항목 | 난이도에 미치는 효과 | 구현 부담 |
|---|---|---|---|
| 1 | A. 적 웨이브 스케일링 | ★★★ | 낮음 (`waves.ts`/`Enemy.spawn`에 배율) |
| 2 | B. 피격 처리(개체별 무적) | ★★★ | 중간 |
| 3 | C. 고용 디미니싱 + 버프 강화 | ★★ | 낮음 (수치 조정) |
| 4 | D. 상성/시너지/테크 | ★★ (재미) | 높음 |

가장 적은 노력으로 가장 큰 효과는 **A(적 스케일링)** 와 **C의 수치 조정**이다. 이 둘만 해도 "용병 5명 풀면 끝"이 깨지고, 후반 긴장감이 생긴다.

---

## 폐기된 초안: 롤토체스식 시너지

> 아래 초안은 "같이 있으면 강해지는 시너지" 방식이라 현재 의도와 다르다. 실제 구현은 하단의 **동일 직업 합체/승급 구현계획**을 따른다.

같은 직업 N명을 모으면 시너지가 발동하는 구조. 군대 규모가 작고(플레이어 포함 최대 6명) 직업이 4종이라 잘 어울린다.

### 설계 전제

- 최대 편성 = 플레이어 본체(party[0]) + 고용 5명 = **6유닛**, 직업 4종.
- 임계값은 **2명 / 3명** 두 단계가 적당 (롤토체스의 2/4/6처럼 잘게 못 나눔).
- **플레이어 직업도 카운트에 포함** → 시작 직업 선택이 빌드 방향을 결정 (지금은 시작 직업이 그냥 1유닛일 뿐 의미가 약함).

### 직업별 시너지 (단일 직업 N명)

기존 스탯(atk·range·cooldown·aoeRadius·heal)에 얹기 좋게 설계.

| 직업 | 2명 | 3명+ | 컨셉 |
|---|---|---|---|
| **검사** (전열) | 공격범위 +25%, 검사 받는 피해 -20% | 적 넉백 + **플레이어 받는 피해 -20%** (전열 방벽) | `todo.md`의 "검사 범위·딜 올리기" 의도와 직결. 탱킹 빌드 |
| **궁수** (연사) | 공격 시 화살 **관통**(일직선 다중 타격) | 공속 +30% 또는 치명타 해금 | 원거리 폭딜. 직선 정렬 유도 |
| **마법사** (광역) | 폭발 반경 75→110 | 폭발 자리에 **장판(지속 피해)** 생성 | 다수 잡몹 학살 특화 |
| **성직자** (축복) | 힐량 +50% + **주변 용병도 회복**(현재는 플레이어만) | 주기적 **전체 보호막** | 장기전·고웨이브 생존 |

핵심: 검사=생존, 궁수=단일딜, 마법사=광역, 성직자=지속력 → **역할이 뚜렷하게 갈리게** 만드는 게 포인트.

### 혼합 시너지 (크로스 보너스, 선택)

단일 직업만 강하면 "한 직업 몰빵"이 정답이 된다. 견제하려면 혼합 보상을 같이 둔다.

| 시너지 | 조건 | 효과 |
|---|---|---|
| **균형 편성** | 검·궁·마 각 1명 이상 | 전체 공격력 +15% |
| **포격대** | 근접(검사) 0명 + 원거리 3명+ | 딜 +30% **but** 플레이어 받는 피해 +25% (글래스캐논) |
| **친위대** | 검사 2명 + 성직자 1명 | 검사가 플레이어 주위에 밀착 방어 진형 |

### 드래프트(카드)와의 연결 — 가장 중요

롤토체스 시너지를 넣으려면 **카드가 원하는 직업을 뽑을 수 있어야** 빌드가 성립한다. 지금은 9종 중 완전 랜덤 3장이라 "3검사"를 노려도 안 나올 수 있다. 보완책:

- 카드에 **현재 시너지 진행도 표시** ("검사 2/3 — 1명 더 모으면 전열 방벽!").
- 약한 **천장(pity)**: 같은 고용 카드가 N웨이브 연속 안 나오면 등장 확률 가중.
- 강화 카드도 "검사 강화 / 궁수 강화"처럼 **직업 귀속 옵션**을 섞어 빌드 색을 진하게.

### 추천 우선순위

1. **검사 3 / 궁수 2 / 마법사 2 / 성직자 2** 단일 시너지부터 (구현 쉽고 체감 큼).
2. 플레이어 직업을 카운트에 포함 (시작 선택 의미 부여).
3. 카드에 시너지 진행도 UI.
4. 여유 되면 혼합 시너지(균형/포격대).

이렇게 하면 "용병 5명 아무거나 풀기"가 아니라 **"내가 무슨 조합을 갈지"** 고민이 생겨서, `todo.md`의 "전략 생각할 요소"가 채워진다.

---

## 동일 직업 합체/승급 구현계획

별도 문서로 분리: [docs/mercenary-combination-plan.md](docs/mercenary-combination-plan.md)

---

## 폐기된 초안: 단일 직업 2/3 시너지 구현계획

> **목표:** 플레이어 본체를 포함한 `GameState.party`에서 같은 직업이 2명 또는 3명 이상 모이면 해당 직업 전투 스펙에 시너지 보너스를 적용한다.  
> **범위:** 1차 구현은 단일 직업 시너지(`검사`, `궁수`, `마법사`, `성직자`)만 포함한다. 혼합 시너지, 카드 확률 보정, 신규 패시브 카드는 제외한다.  
> **원칙:** 3명 이상은 3단계 효과만 적용한다. 4명, 5명, 6명이어도 추가 중첩은 없다.

### 1차 시너지 수치

`3명` 효과는 `2명` 효과에 더하는 값이 아니라 **최종 적용값**으로 둔다. 그래야 밸런스 계산이 단순하다.

| 직업 id | 2명 | 3명 이상 | 구현 방식 |
|---|---:|---:|---|
| `sword` | 근접 스플래시 반경 +15px | 근접 스플래시 반경 +35px, 공격력 +10% | `aoeRadius`, `atk` 보정 |
| `bow` | 공격속도 +15% | 공격속도 +30%, 사거리 +40px | `cooldownMs`, `range` 보정 |
| `mage` | 폭발 반경 +20px | 폭발 반경 +40px, 공격력 +10% | `aoeRadius`, `atk` 보정 |
| `cleric` | 회복량 +3 | 회복량 +8, 회복 주기 15% 단축 | `heal`, `cooldownMs` 보정 |

### 파일 구조

- Create: `src/game/data/synergies.ts`  
  시너지 정의, 파티 카운트 계산, 현재 티어 계산, 전투 스펙 보정 함수를 담당한다.
- Modify: `src/game/systems/MercManager.ts`  
  플레이어와 고용 용병이 공격/회복할 때 기본 `MERC_COMBAT` 대신 시너지 적용 후 스펙을 사용하게 한다.
- Modify: `src/game/hud/GameHud.ts`  
  이미 직업별 `x2`, `x3` 배지를 표시하고 있으므로, 2명 이상일 때 배지 색만 강조한다.
- Test: `tests/synergies.test.ts`  
  순수 함수 기준으로 파티 카운트, 티어 판정, 전투 스펙 보정이 맞는지 검증한다.

### Task 1: 시너지 계산 모듈 추가

**Files:**
- Create: `src/game/data/synergies.ts`
- Test: `tests/synergies.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
import assert from "node:assert/strict";
import { applySynergyToCombat, countPartyByClass, getSynergyTier } from "../src/game/data/synergies.ts";
import { MERC_COMBAT } from "../src/game/data/mercs.ts";

assert.deepEqual(countPartyByClass(["sword", "sword", "mage"]), {
  sword: 2,
  mage: 1,
});

assert.equal(getSynergyTier(1), 0);
assert.equal(getSynergyTier(2), 2);
assert.equal(getSynergyTier(3), 3);
assert.equal(getSynergyTier(6), 3);

const sword2 = applySynergyToCombat(MERC_COMBAT.sword, ["sword", "sword"]);
assert.equal(sword2.aoeRadius, (MERC_COMBAT.sword.aoeRadius ?? 0) + 15);

const sword3 = applySynergyToCombat(MERC_COMBAT.sword, ["sword", "sword", "sword"]);
assert.equal(sword3.aoeRadius, (MERC_COMBAT.sword.aoeRadius ?? 0) + 35);
assert.equal(sword3.atk, Math.round(MERC_COMBAT.sword.atk * 1.1));

const bow3 = applySynergyToCombat(MERC_COMBAT.bow, ["bow", "bow", "bow"]);
assert.equal(bow3.range, MERC_COMBAT.bow.range + 40);
assert.equal(bow3.cooldownMs, Math.round(MERC_COMBAT.bow.cooldownMs / 1.3));
```

- [ ] **Step 2: 실패 확인**

Run:

```bash
node --experimental-strip-types tests/synergies.test.ts
```

Expected: `Cannot find module .../src/game/data/synergies.ts`

- [ ] **Step 3: 최소 구현 작성**

```ts
import type { MercCombat } from "./mercs";

export type SynergyTier = 0 | 2 | 3;

type SynergyBonus = {
  atkRatio?: number;
  attackSpeedRatio?: number;
  rangeBonus?: number;
  aoeRadiusBonus?: number;
  healBonus?: number;
};

type SynergyDef = {
  label: string;
  tiers: Record<2 | 3, SynergyBonus>;
};

export const SYNERGY_DEFS: Record<string, SynergyDef> = {
  sword: {
    label: "검사",
    tiers: {
      2: { aoeRadiusBonus: 15 },
      3: { aoeRadiusBonus: 35, atkRatio: 0.1 },
    },
  },
  bow: {
    label: "궁수",
    tiers: {
      2: { attackSpeedRatio: 0.15 },
      3: { attackSpeedRatio: 0.3, rangeBonus: 40 },
    },
  },
  mage: {
    label: "마법사",
    tiers: {
      2: { aoeRadiusBonus: 20 },
      3: { aoeRadiusBonus: 40, atkRatio: 0.1 },
    },
  },
  cleric: {
    label: "성직자",
    tiers: {
      2: { healBonus: 3 },
      3: { healBonus: 8, attackSpeedRatio: 0.15 },
    },
  },
};

export function countPartyByClass(party: string[]): Record<string, number> {
  return party.reduce<Record<string, number>>((counts, id) => {
    if (!SYNERGY_DEFS[id]) return counts;
    counts[id] = (counts[id] ?? 0) + 1;
    return counts;
  }, {});
}

export function getSynergyTier(count: number): SynergyTier {
  if (count >= 3) return 3;
  if (count >= 2) return 2;
  return 0;
}

export function applySynergyToCombat(base: MercCombat, party: string[]): MercCombat {
  const tier = getSynergyTier(countPartyByClass(party)[base.id] ?? 0);
  if (tier === 0) return { ...base };

  const bonus = SYNERGY_DEFS[base.id]?.tiers[tier];
  if (!bonus) return { ...base };

  return {
    ...base,
    atk: Math.max(1, Math.round(base.atk * (1 + (bonus.atkRatio ?? 0)))),
    range: base.range + (bonus.rangeBonus ?? 0),
    cooldownMs: Math.max(1, Math.round(base.cooldownMs / (1 + (bonus.attackSpeedRatio ?? 0)))),
    aoeRadius:
      base.aoeRadius === undefined && !bonus.aoeRadiusBonus
        ? base.aoeRadius
        : (base.aoeRadius ?? 0) + (bonus.aoeRadiusBonus ?? 0),
    heal: base.heal === undefined ? base.heal : base.heal + (bonus.healBonus ?? 0),
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run:

```bash
node --experimental-strip-types tests/synergies.test.ts
```

Expected: 종료 코드 `0`

### Task 2: 전투 로직에 시너지 적용

**Files:**
- Modify: `src/game/systems/MercManager.ts`

- [ ] **Step 1: 적용 지점 확인**

현재 구조:

- 플레이어 본체 스펙: `syncParty()`에서 `MERC_COMBAT[party[0]]`를 `playerCombat`에 저장
- 고용 용병 스펙: `Mercenary.combat`이 생성 시점의 `MERC_COMBAT[id]`를 저장
- 실제 피해/쿨다운 계산: `damageFor(combat)`, `cooldownFor(combat)`에서 처리

따라서 기존 `Mercenary.combat`을 직접 바꾸지 말고, `MercManager`가 공격 직전에 `applySynergyToCombat(base, state.party)`를 호출한다.

- [ ] **Step 2: import 추가**

```ts
import { applySynergyToCombat } from "../data/synergies";
```

- [ ] **Step 3: 헬퍼 추가**

```ts
private combatFor(id: string): MercCombat | null {
  const base = MERC_COMBAT[id];
  return base ? applySynergyToCombat(base, this.state.party) : null;
}
```

- [ ] **Step 4: 플레이어 스펙 갱신 변경**

```ts
private syncParty(party: string[]): void {
  this.playerCombat = party.length > 0 ? this.combatFor(party[0]) : null;

  const wanted = Math.max(0, party.length - 1);
  while (this.mercs.length < wanted) {
    const id = party[this.mercs.length + 1];
    const merc = new Mercenary(this.scene, id);
    const player = this.getPlayer();
    if (player) merc.setPosition(player.x, player.y);
    this.mercs.push(merc);
  }
}
```

- [ ] **Step 5: 고용 용병 공격 시점에 적용**

```ts
private runCombat(merc: Mercenary): void {
  const combat = this.combatFor(merc.mercId);
  if (!combat) return;

  if (combat.role === "heal") {
    if (merc.ready) {
      merc.resetCooldown(this.cooldownFor(combat));
      merc.playAttackCue();
      this.scheduleHeal(combat.heal ?? 0);
    }
    return;
  }

  const center = this.bodyCenter(merc);
  const target = this.nearestEnemy(center.x, center.y, combat.range);
  if (!target) return;

  merc.faceTo(target.x);
  if (!merc.ready) return;
  merc.resetCooldown(this.cooldownFor(combat));
  merc.playAttackCue();
  this.performAttack(combat, merc.x, merc.y, target);
}
```

- [ ] **Step 6: 빌드 확인**

Run:

```bash
npm run build
```

Expected: TypeScript 오류 없이 Vite build 완료

### Task 3: HUD에 최소 피드백 추가

**Files:**
- Modify: `src/game/hud/GameHud.ts`

- [ ] **Step 1: 현재 배지 재사용**

이미 `syncParty()`에서 직업별 개수를 세고 `x2`, `x3` 배지를 표시한다. 1차 구현은 새 UI를 만들지 않고 배지 색으로만 시너지 활성화를 보여준다.

- [ ] **Step 2: 배지 색상 규칙 적용**

`slot.badgeText.setText(...)` 아래에 다음 규칙을 추가한다.

```ts
if (count >= 3) {
  slot.badge.setFillStyle(0xffd54a, 1);
  slot.badgeText.setColor("#1b1024");
} else if (count >= 2) {
  slot.badge.setFillStyle(0x6effe0, 1);
  slot.badgeText.setColor("#1b1024");
} else {
  slot.badge.setFillStyle(0xc41e1e, 1);
  slot.badgeText.setColor("#fff4d6");
}
```

- [ ] **Step 3: 표시 확인**

Run:

```bash
npm run build
```

Expected: build 통과. 게임에서 같은 직업 2명 이상일 때 하단 용병 슬롯 배지 색이 바뀐다.

### Task 4: 최종 검증

**Files:**
- Verify only

- [ ] **Step 1: 순수 함수 테스트**

Run:

```bash
node --experimental-strip-types tests/synergies.test.ts
```

Expected: 종료 코드 `0`

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

Expected: TypeScript 오류 없음. Vite bundle 경고는 기존 대용량 번들 경고라 실패로 보지 않는다.

- [ ] **Step 4: 수동 플레이 체크**

1. 전사 시작 후 전사 1명 고용 → 전사 `2명` 시너지로 스플래시 반경 증가 체감 확인.
2. 전사 2명을 추가 고용해 전사 `3명` 이상 → 스플래시 반경과 공격력 증가 확인.
3. 궁수 3명 → 공격 주기가 짧아지고 사거리 증가 확인.
4. 마법사 3명 → 폭발 반경 증가 확인.
5. 성직자 3명 → 회복량 증가와 회복 주기 단축 확인.

### 구현 시 주의점

- `party[0]`인 플레이어 직업도 반드시 카운트에 포함한다.
- 3명 이상은 3티어만 적용한다. 4명 이상 추가 중첩 금지.
- `MERC_COMBAT` 원본 객체를 직접 수정하지 않는다. 매 공격 시점에 보정된 복사본을 만들어 사용한다.
- `tactics`, `haste` 같은 기존 전역 강화는 유지한다. 시너지 보정 후 `damageFor()`와 `cooldownFor()`에서 기존 전역 배율이 한 번 더 적용되게 둔다.
- 혼합 시너지, 카드 확률 보정, 카드 설명 UI는 이번 범위에서 제외한다.
