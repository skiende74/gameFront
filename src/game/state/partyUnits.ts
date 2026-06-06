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
  const next = party.map((unit) => ({ ...unit }));
  const rank2 = next.find((unit) => unit.id === id && unit.rank === 2);
  if (rank2) {
    rank2.rank = 3;
    return next;
  }

  const rank1 = next.find((unit) => unit.id === id && unit.rank === 1);
  if (rank1) {
    rank1.rank = 2;
    return next;
  }

  return [...next, createPartyUnit(id)];
}

export function canAddOrMergeUnit(party: PartyUnit[], id: string, maxFollowers: number): boolean {
  if (party.some((unit) => unit.id === id && unit.rank < 3)) return true;
  return party.filter((unit) => !unit.isPlayer).length < maxFollowers;
}
