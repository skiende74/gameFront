# Dungeons & Pixels — 에셋 드롭 가이드

DungeonScene 이 자동으로 인식하는 파일은 **딱 2개**.

| 저장 이름 | 원본 (Free Demo zip) | 용도 |
|---|---|---|
| `tileset.png` | `Tilesets/Tileset_Dungeon.png` (384×160, 12×5 = 60 tiles) | 바닥/벽/모서리 |
| `torch_strip.png` | `Props/Animated/torch_strip.png` (96×32, 3 frames) | 벽 위 횃불 애니메이션 |

두 파일이 모두 존재하면 진짜 픽셀아트가 그려지고, 없으면 `src/game/tiles/proceduralTiles.ts` 의 같은 톤 placeholder 로 자동 대체된다.

> 출처: <https://indie-vova.itch.io/dungeons-and-pixels-starter-pack>

## 코드에서 쓰는 타일 인덱스

`src/game/config.ts` 의 `TILE` 상수 참조. 핵심:

- 모서리: `cornerTL=0`, `cornerTR=5`, `cornerBL=48`, `cornerBR=53`
- 윗벽: `1, 2, 3, 4` 중 랜덤
- 아랫벽: `49, 50, 51, 52` 중 랜덤
- 좌벽: `12, 24, 36` 중 랜덤
- 우벽: `17, 29, 41` 중 랜덤
- 바닥: `13~16, 25~28, 37~40` 중 랜덤 (위치 시드 기반 결정론적)

## 라이선스

상업/비상업 사용 OK. **재배포(zip 통째로 다른 마켓 업로드 등)는 금지.**
최종 제출 README 와 게임 내 크레딧에 `Assets by Indie_Vova (Vladimir Ivanov)` 출처 표기 필수.
