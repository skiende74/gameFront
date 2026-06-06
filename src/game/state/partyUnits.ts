import type { UnitRank } from "../data/unitRanks";

export type PartyUnit = {
  uid: string;
  id: string;
  rank: UnitRank;
  isPlayer?: boolean;
};

let nextUnitSeq = 1;

export function createPartyUnit(id: string, opts: { isPlayer?: boolean } = {}): PartyUnit {
  return {
    uid: opts.isPlayer ? "player" : `merc-${nextUnitSeq++}`,
    id,
    rank: 1,
    isPlayer: opts.isPlayer,
  };
}

export function addUnitWithMerge(party: PartyUnit[], id: string): PartyUnit[] {
  return mergeSameRank([...cloneParty(party), createPartyUnit(id)], id);
}

export function canAddOrMergeUnit(party: PartyUnit[], id: string, maxFollowers: number): boolean {
  const preview = mergeSameRank([...cloneParty(party), { uid: "preview", id, rank: 1 }], id);
  return preview.filter((unit) => !unit.isPlayer).length <= maxFollowers;
}

function cloneParty(party: PartyUnit[]): PartyUnit[] {
  return party.map((unit) => ({ ...unit }));
}

function mergeSameRank(party: PartyUnit[], id: string): PartyUnit[] {
  let next = party;
  for (const rank of [1, 2] as const) {
    while (true) {
      const matches = next.filter((unit) => unit.id === id && unit.rank === rank);
      if (matches.length < 2) break;

      const target = matches.find((unit) => unit.isPlayer) ?? matches[0];
      const consumed = matches.find((unit) => unit.uid !== target.uid);
      if (!consumed) break;

      target.rank = (rank + 1) as UnitRank;
      next = next.filter((unit) => unit.uid !== consumed.uid);
    }
  }
  return next;
}
