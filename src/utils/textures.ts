import * as THREE from 'three';

/**
 * Procedural Canvas Texture Generator for Abyssal Depths
 * Creates detailed stone floor tiles, ancient dungeon masonry, barrel wood, and heraldry.
 */

// Generate stone pavers floor texture
export function createStoneFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Base dark slate tone
    ctx.fillStyle = '#1e1c1a';
    ctx.fillRect(0, 0, 512, 512);

    // Stone tile grid
    const tileSize = 64;
    for (let y = 0; y < 512; y += tileSize) {
      for (let x = 0; x < 512; x += tileSize) {
        // Subtle random shade per flagstone
        const toneVar = Math.floor((Math.sin(x * 12.3 + y * 9.7) * 0.5 + 0.5) * 25);
        const r = 38 + toneVar;
        const g = 35 + toneVar;
        const b = 32 + toneVar;

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

        // Stone bevel highlight (top/left)
        ctx.strokeStyle = `rgba(255,255,255,0.06)`;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 3, y + 3, tileSize - 6, tileSize - 6);

        // Stone bevel shadow (bottom/right)
        ctx.strokeStyle = `rgba(0,0,0,0.45)`;
        ctx.strokeRect(x + 1, y + 1, tileSize - 2, tileSize - 2);

        // Surface speckles and stone grit
        for (let i = 0; i < 35; i++) {
          const sx = x + 4 + Math.random() * (tileSize - 8);
          const sy = y + 4 + Math.random() * (tileSize - 8);
          const brightness = Math.random() > 0.5 ? 255 : 0;
          ctx.fillStyle = `rgba(${brightness},${brightness},${brightness},${Math.random() * 0.12})`;
          ctx.fillRect(sx, sy, 2, 2);
        }

        // Occasional stone crack
        if ((x + y) % 128 === 0) {
          ctx.strokeStyle = 'rgba(10, 8, 6, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x + 10, y + 10);
          ctx.lineTo(x + 28, y + 32);
          ctx.lineTo(x + 45, y + 35);
          ctx.stroke();
        }
      }
    }

    // Mortar groove lines
    ctx.strokeStyle = '#0d0b0a';
    ctx.lineWidth = 3;
    for (let i = 0; i <= 512; i += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Generate ancient dungeon wall masonry texture
export function createStoneWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#141210';
    ctx.fillRect(0, 0, 512, 512);

    const rowHeight = 48;
    const blockWidth = 96;

    for (let row = 0; row < 512 / rowHeight; row++) {
      const y = row * rowHeight;
      const xOffset = (row % 2 === 0) ? 0 : blockWidth / 2;

      for (let col = -1; col < 512 / blockWidth + 1; col++) {
        const x = col * blockWidth + xOffset;

        const noise = (Math.sin(col * 3.7 + row * 8.1) * 0.5 + 0.5);
        const r = Math.floor(40 + noise * 20);
        const g = Math.floor(36 + noise * 18);
        const b = Math.floor(34 + noise * 15);

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x + 2, y + 2, blockWidth - 4, rowHeight - 4);

        // Highlight top rim of stone
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(x + 2, y + 2, blockWidth - 4, 3);

        // Shadow bottom rim
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x + 2, y + rowHeight - 4, blockWidth - 4, 3);

        // Weathering and moss in crevices
        if ((row + col) % 3 === 0) {
          ctx.fillStyle = 'rgba(28, 42, 22, 0.35)';
          ctx.fillRect(x + 4, y + rowHeight - 8, blockWidth - 8, 5);
        }
      }
    }

    // Heavy mortar lines
    ctx.strokeStyle = '#080706';
    ctx.lineWidth = 4;
    for (let row = 0; row <= 512; row += rowHeight) {
      ctx.beginPath();
      ctx.moveTo(0, row);
      ctx.lineTo(512, row);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Generate wooden barrel plank texture
export function createWoodBarrelTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Rich aged oak wood base
    ctx.fillStyle = '#4a2f1c';
    ctx.fillRect(0, 0, 256, 256);

    // Vertical wood staves
    const staveWidth = 32;
    for (let x = 0; x < 256; x += staveWidth) {
      const varR = (Math.sin(x * 5) * 0.5 + 0.5) * 15;
      ctx.fillStyle = `rgb(${74 + varR}, ${47 + varR * 0.7}, ${28 + varR * 0.4})`;
      ctx.fillRect(x + 1, 0, staveWidth - 2, 256);

      // Wood grain lines
      ctx.strokeStyle = 'rgba(40, 20, 10, 0.4)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const gx = x + 4 + i * 6;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.bezierCurveTo(gx + 3, 80, gx - 3, 160, gx + 2, 256);
        ctx.stroke();
      }
    }

    // Horizontal dark gaps
    ctx.strokeStyle = '#1e1108';
    ctx.lineWidth = 2;
    for (let x = 0; x <= 256; x += staveWidth) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Generate heraldic shield insignia texture
export function createShieldTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Deep royal blue / steel field
    ctx.fillStyle = '#1c2833';
    ctx.fillRect(0, 0, 256, 256);

    // Golden border
    ctx.strokeStyle = '#c49746';
    ctx.lineWidth = 12;
    ctx.strokeRect(10, 10, 236, 236);

    // Inner gold trim
    ctx.strokeStyle = '#e5be66';
    ctx.lineWidth = 3;
    ctx.strokeRect(22, 22, 212, 212);

    // Golden Knightly Cross
    ctx.fillStyle = '#d4af37';
    // Vertical beam
    ctx.fillRect(116, 36, 24, 184);
    // Horizontal beam
    ctx.fillRect(56, 88, 144, 24);

    // Center ruby jewel
    ctx.fillStyle = '#9e1b1b';
    ctx.beginPath();
    ctx.arc(128, 100, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
