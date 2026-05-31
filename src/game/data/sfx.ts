export const SFX_ASSETS = {
  uiConfirm: "assets/RPG_Essentials_Free/10_UI_Menu_SFX/013_Confirm_03.wav",
  uiDenied: "assets/RPG_Essentials_Free/10_UI_Menu_SFX/033_Denied_03.wav",
  upgradeSelect: "assets/RPG_Essentials_Free/10_UI_Menu_SFX/070_Equip_10.wav",
  pause: "assets/RPG_Essentials_Free/10_UI_Menu_SFX/092_Pause_04.wav",
  unpause: "assets/RPG_Essentials_Free/10_UI_Menu_SFX/098_Unpause_04.wav",

  swordAttack: "assets/RPG_Essentials_Free/10_Battle_SFX/22_Slash_04.wav",
  bowAttack: "assets/RPG_Essentials_Free/12_Player_Movement_SFX/56_Attack_03.wav",
  hitFlesh: "assets/RPG_Essentials_Free/10_Battle_SFX/15_Impact_flesh_02.wav",
  playerHurt: "assets/RPG_Essentials_Free/10_Battle_SFX/77_flesh_02.wav",
  enemyDeath: "assets/RPG_Essentials_Free/10_Battle_SFX/69_Enemy_death_01.wav",

  magicCast: "assets/RPG_Essentials_Free/8_Atk_Magic_SFX/45_Charge_05.wav",
  magicExplosion: "assets/RPG_Essentials_Free/8_Atk_Magic_SFX/04_Fire_explosion_04_medium.wav",
  heal: "assets/RPG_Essentials_Free/8_Buffs_Heals_SFX/02_Heal_02.wav",

  atkBuff: "assets/RPG_Essentials_Free/8_Buffs_Heals_SFX/16_Atk_buff_04.wav",
  speedBuff: "assets/RPG_Essentials_Free/8_Buffs_Heals_SFX/48_Speed_up_02.wav",
  maxHpBuff: "assets/RPG_Essentials_Free/8_Buffs_Heals_SFX/17_Def_buff_01.wav",
  encounter: "assets/RPG_Essentials_Free/10_Battle_SFX/55_Encounter_02.wav",
  victory: "assets/RPG_Essentials_Free/8_Buffs_Heals_SFX/30_Revive_03.wav",
} as const;

export type SfxId = keyof typeof SFX_ASSETS;

export function sfxKey(id: SfxId): string {
  return `sfx-${id}`;
}
