import Phaser from "phaser";
import { COLORS, TEX, TILE_DRAW, TILE_SIZE } from "../config";

const T = TILE_SIZE;

function rand(x: number, y: number, salt = 1): number {
  const v = Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453;
  return v - Math.floor(v);
}

function pixel(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number, alpha = 1): void {
  g.fillStyle(color, alpha);
  g.fillRect(x, y, 1, 1);
}

function drawFloorTile(g: Phaser.GameObjects.Graphics, salt: number): void {
  g.clear();
  g.fillStyle(COLORS.floorBase, 1);
  g.fillRect(0, 0, T, T);

  for (let y = 0; y < T; y++) {
    for (let x = 0; x < T; x++) {
      const n = rand(x, y, salt);
      if (n < 0.06) pixel(g, x, y, COLORS.floorLo, 0.6);
      else if (n < 0.12) pixel(g, x, y, COLORS.floorHi, 0.35);
    }
  }

  for (let i = 0; i < 5; i++) {
    const cx = Math.floor(rand(i, 1, salt + 11) * (T - 4)) + 2;
    const cy = Math.floor(rand(i, 2, salt + 13) * (T - 4)) + 2;
    pixel(g, cx, cy, COLORS.floorLo, 0.85);
    pixel(g, cx + 1, cy, COLORS.floorLo, 0.55);
    pixel(g, cx, cy + 1, COLORS.floorLo, 0.55);
    pixel(g, cx - 1, cy, COLORS.floorHi, 0.3);
  }

  const plateW = T / 2;
  g.lineStyle(1, COLORS.wallLo, 0.18);
  g.beginPath();
  g.moveTo(plateW, 0);
  g.lineTo(plateW, T);
  g.strokePath();
  g.beginPath();
  g.moveTo(0, plateW);
  g.lineTo(T, plateW);
  g.strokePath();
}

function drawBrickWall(g: Phaser.GameObjects.Graphics, edge: "top" | "bottom" | "left" | "right"): void {
  g.clear();
  g.fillStyle(COLORS.wallBase, 1);
  g.fillRect(0, 0, T, T);

  const brickH = 8;
  for (let row = 0; row < T / brickH; row++) {
    const offset = row % 2 === 0 ? 0 : T / 2;
    g.lineStyle(1, COLORS.wallLo, 0.85);
    g.beginPath();
    g.moveTo(0, row * brickH);
    g.lineTo(T, row * brickH);
    g.strokePath();
    for (let bx = 0; bx <= T; bx += T / 2) {
      const x = (bx + offset) % T;
      g.beginPath();
      g.moveTo(x, row * brickH);
      g.lineTo(x, row * brickH + brickH);
      g.strokePath();
    }
  }

  for (let y = 0; y < T; y++) {
    for (let x = 0; x < T; x++) {
      const n = rand(x, y, edge.length);
      if (n < 0.05) pixel(g, x, y, COLORS.wallHi, 0.4);
      else if (n < 0.1) pixel(g, x, y, COLORS.wallLo, 0.5);
    }
  }

  g.fillStyle(COLORS.wallEdge, 0.7);
  if (edge === "top") g.fillRect(0, 0, T, 2);
  if (edge === "bottom") g.fillRect(0, T - 2, T, 2);
  if (edge === "left") g.fillRect(0, 0, 2, T);
  if (edge === "right") g.fillRect(T - 2, 0, 2, T);

  if (edge === "top" || edge === "bottom") {
    const yMoss = edge === "top" ? T - 4 : 1;
    for (let i = 0; i < 6; i++) {
      const x = Math.floor(rand(i, 7, edge.length) * T);
      pixel(g, x, yMoss, COLORS.mossA, 0.7);
      if (rand(i, 8, edge.length) < 0.5) pixel(g, x, yMoss + 1, COLORS.mossB, 0.6);
    }
  }
}

function drawCorner(g: Phaser.GameObjects.Graphics, corner: "tl" | "tr" | "bl" | "br"): void {
  g.clear();
  g.fillStyle(COLORS.wallBase, 1);
  g.fillRect(0, 0, T, T);

  g.fillStyle(COLORS.wallLo, 1);
  if (corner === "tl") {
    g.fillRect(0, 0, 4, T);
    g.fillRect(0, 0, T, 4);
  }
  if (corner === "tr") {
    g.fillRect(T - 4, 0, 4, T);
    g.fillRect(0, 0, T, 4);
  }
  if (corner === "bl") {
    g.fillRect(0, 0, 4, T);
    g.fillRect(0, T - 4, T, 4);
  }
  if (corner === "br") {
    g.fillRect(T - 4, 0, 4, T);
    g.fillRect(0, T - 4, T, 4);
  }

  g.fillStyle(COLORS.wallEdge, 0.7);
  const cs = 4;
  if (corner === "tl") g.fillRect(cs, cs, 2, 2);
  if (corner === "tr") g.fillRect(T - cs - 2, cs, 2, 2);
  if (corner === "bl") g.fillRect(cs, T - cs - 2, 2, 2);
  if (corner === "br") g.fillRect(T - cs - 2, T - cs - 2, 2, 2);
}

function drawTorchSconce(g: Phaser.GameObjects.Graphics): void {
  g.clear();

  g.fillStyle(0x5a3a22, 1);
  g.fillRect(13, 14, 6, 14);
  g.fillStyle(0x3a2412, 1);
  g.fillRect(13, 27, 6, 1);
  g.fillRect(13, 14, 1, 14);

  g.fillStyle(0x8a5a2a, 1);
  g.fillRect(11, 11, 10, 4);
  g.fillStyle(0x5a3a18, 1);
  g.fillRect(11, 14, 10, 1);

  g.fillStyle(COLORS.torch, 1);
  g.fillRect(14, 4, 4, 8);
  g.fillStyle(COLORS.torchCore, 1);
  g.fillRect(15, 6, 2, 5);
  g.fillStyle(0xffe6a8, 1);
  g.fillRect(15, 8, 2, 2);

  g.fillStyle(COLORS.torch, 0.6);
  pixel(g, 13, 5, COLORS.torch, 0.6);
  pixel(g, 18, 5, COLORS.torch, 0.6);
  pixel(g, 14, 2, COLORS.torchCore, 0.5);
  pixel(g, 17, 2, COLORS.torchCore, 0.5);
}

function drawFlameParticle(g: Phaser.GameObjects.Graphics): void {
  g.clear();
  g.fillStyle(0xffffff, 1);
  g.fillCircle(4, 4, 3);
}

export function ensureVignetteTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
): void {
  if (scene.textures.exists(key)) return;
  const canvas = scene.textures.createCanvas(key, width, height);
  if (!canvas) return;
  const ctx = canvas.getContext();
  const cx = width / 2;
  const cy = height / 2;
  const innerR = Math.min(width, height) * 0.18;
  const outerR = Math.hypot(cx, cy);
  const grad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
  grad.addColorStop(0, "rgba(0, 0, 0, 0)");
  grad.addColorStop(0.55, "rgba(0, 0, 0, 0.35)");
  grad.addColorStop(1, "rgba(0, 0, 0, 0.85)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  canvas.refresh();
}

function bake(scene: Phaser.Scene, key: string, draw: (g: Phaser.GameObjects.Graphics) => void, size = T): void {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics({ x: 0, y: 0 });
  g.setVisible(false);
  draw(g);
  g.generateTexture(key, size, size);
  g.destroy();
}

/**
 * Bakes a single repeating-patch texture by copying random floor frames out
 * of the source spritesheet straight onto a Canvas2D texture. Direct ctx
 * drawImage stays compatible with Phaser 4 (RenderTexture in v4 requires
 * an explicit render() pass which is easy to forget); a Canvas texture is
 * immediately usable as a TileSprite source.
 */
export function ensureFloorPatch(
  scene: Phaser.Scene,
  patchKey: string,
  tilesetKey: string,
  floorIndices: readonly number[],
  tilesPerSide: number,
): void {
  if (scene.textures.exists(patchKey)) return;
  if (!scene.textures.exists(tilesetKey)) return;

  const tex = scene.textures.get(tilesetKey);
  const source = tex.source[0];
  const sourceImage = source?.image as CanvasImageSource | undefined;
  if (!sourceImage) return;

  const SRC = TILE_SIZE;
  const DRAW = TILE_DRAW;
  const cols = Math.floor(source.width / SRC);
  const patchPx = DRAW * tilesPerSide;

  const canvas = scene.textures.createCanvas(patchKey, patchPx, patchPx);
  if (!canvas) return;
  const ctx = canvas.getContext();
  ctx.imageSmoothingEnabled = false;

  for (let r = 0; r < tilesPerSide; r++) {
    for (let c = 0; c < tilesPerSide; c++) {
      const seed = Math.abs(Math.sin(c * 12.9898 + r * 78.233 + 17) * 43758.5453);
      const idxPos = Math.floor((seed - Math.floor(seed)) * floorIndices.length);
      const frame = floorIndices[idxPos];
      const sx = (frame % cols) * SRC;
      const sy = Math.floor(frame / cols) * SRC;
      ctx.drawImage(sourceImage, sx, sy, SRC, SRC, c * DRAW, r * DRAW, DRAW, DRAW);
    }
  }

  canvas.refresh();
}

export function ensureProceduralTiles(scene: Phaser.Scene): void {
  bake(scene, TEX.procFloor, (g) => drawFloorTile(g, 1));
  bake(scene, TEX.procFloorAlt, (g) => drawFloorTile(g, 2));
  bake(scene, TEX.procWallTop, (g) => drawBrickWall(g, "top"));
  bake(scene, TEX.procWallBottom, (g) => drawBrickWall(g, "bottom"));
  bake(scene, TEX.procWallSide, (g) => drawBrickWall(g, "left"));
  bake(scene, TEX.procWallTL, (g) => drawCorner(g, "tl"));
  bake(scene, TEX.procWallTR, (g) => drawCorner(g, "tr"));
  bake(scene, TEX.procWallBL, (g) => drawCorner(g, "bl"));
  bake(scene, TEX.procWallBR, (g) => drawCorner(g, "br"));
  bake(scene, TEX.procTorch, drawTorchSconce);
  bake(scene, TEX.flameParticle, drawFlameParticle, 8);
}
