// Cenário diurno da loja: rua, prédio, bancada/lona, itens expostos e efeitos.

import { rr, outlined, drawItem, drawLabel } from './sprites.js';
import { ITEMS } from './data.js';

export const W = 960;
export const H = 540;
export const LONA = { x: 380, y: 338, w: 540, h: 84 }; // área clicável da bancada
const COUNTER_TOP = 350;

export function slotX(i) {
  return 430 + i * 74;
}

export function inLona(x, y) {
  return x >= LONA.x && x <= LONA.x + LONA.w && y >= LONA.y && y <= LONA.y + LONA.h;
}

export class Scene {
  constructor() {
    this.clouds = [
      { x: 120, y: 70, s: 1 }, { x: 520, y: 40, s: 0.7 }, { x: 800, y: 95, s: 0.9 },
    ];
    this.particles = [];
    this.texts = [];
    this.t = 0;
  }

  burst(x, y, color = '#f5c542', n = 14) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 80 + Math.random() * 120;
      this.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, life: 0.9 + Math.random() * 0.4, color });
    }
  }

  floatText(text, x, y, color = '#b7ff3c') {
    this.texts.push({ text, x, y, life: 1.4, color });
  }

  update(dt) {
    this.t += dt;
    for (const c of this.clouds) {
      c.x += dt * 6 * c.s;
      if (c.x > W + 80) c.x = -80;
    }
    for (const p of this.particles) {
      p.vy += 420 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const t of this.texts) {
      t.y -= 30 * dt;
      t.life -= dt;
    }
    this.texts = this.texts.filter((t) => t.life > 0);
  }

  drawBackground(ctx, darkness = 0) {
    // céu
    const sky = ctx.createLinearGradient(0, 0, 0, 430);
    sky.addColorStop(0, '#5fb8e8');
    sky.addColorStop(1, '#c8ecff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // sol
    ctx.fillStyle = '#ffe27a';
    ctx.beginPath(); ctx.arc(120, 90, 42, 0, Math.PI * 2); ctx.fill();

    // nuvens
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (const c of this.clouds) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 22 * c.s, 0, Math.PI * 2);
      ctx.arc(c.x + 26 * c.s, c.y - 8 * c.s, 28 * c.s, 0, Math.PI * 2);
      ctx.arc(c.x + 56 * c.s, c.y, 22 * c.s, 0, Math.PI * 2);
      ctx.fill();
    }

    // prédio da loja
    ctx.fillStyle = '#7a5a43';
    ctx.fillRect(360, 70, 600, 290);
    for (let y = 80; y < 350; y += 18) {
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(360, y, 600, 2);
    }
    // toldo
    ctx.fillStyle = '#c94f3d';
    ctx.beginPath();
    ctx.moveTo(350, 140); ctx.lineTo(970, 140); ctx.lineTo(950, 170); ctx.lineTo(370, 170); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0b0c10'; ctx.lineWidth = 3; ctx.stroke();
    for (let x = 370; x < 960; x += 40) {
      ctx.fillStyle = '#f5f0e6';
      ctx.fillRect(x, 140, 20, 30);
    }
    // placa
    ctx.fillStyle = '#0b0c10';
    rr(ctx, 520, 88, 260, 46, 6); ctx.fill();
    ctx.font = '36px "VT323", "Courier New", monospace';
    ctx.fillStyle = '#b7ff3c';
    ctx.textAlign = 'center';
    ctx.fillText('PERIGOSO', 650, 124);
    ctx.textAlign = 'left';

    // janela iluminada
    ctx.fillStyle = '#ffd36b';
    rr(ctx, 400, 200, 130, 100, 4); outlined(ctx, '#ffd36b', '#0b0c10', 3);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(400, 200, 130, 12);

    // rua e calçada
    ctx.fillStyle = '#b9b2a3';
    ctx.fillRect(0, 395, W, 36);
    ctx.fillStyle = '#8f8a7d';
    for (let x = 0; x < W; x += 80) ctx.fillRect(x, 395, 2, 36);
    ctx.fillStyle = '#5b5f6e';
    ctx.fillRect(0, 431, W, H - 431);
    ctx.fillStyle = '#f5f0e6';
    for (let x = 20; x < W; x += 120) ctx.fillRect(x, 490, 60, 6);

    if (darkness > 0) {
      ctx.fillStyle = `rgba(0,0,0,${Math.min(0.85, darkness * 0.72)})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  drawRapaWarning(ctx, elapsedMs) {
    if (!elapsedMs) return;
    const minute = Math.floor(elapsedMs / 60000);
    const chance = Math.min(0.95, minute * 0.25);
    const elapsed = Math.floor(elapsedMs / 1000);
    const label = minute ? `POLÍCIA ${Math.round(chance * 100)}%` : `POLÍCIA EM ${60 - elapsed}s`;
    ctx.fillStyle = '#08090d';
    ctx.fillRect(18, 18, 178, 34);
    ctx.strokeStyle = '#f5c542';
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, 178, 34);
    ctx.fillStyle = '#f5c542';
    ctx.font = '20px "VT323", "Courier New", monospace';
    ctx.fillText(label, 28, 42);
    ctx.fillStyle = '#ff5578';
    ctx.fillRect(28, 46, 154 * chance, 3);
  }

  drawPoliceCapture(ctx, lines) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.font = '42px "VT323", "Courier New", monospace';
    ctx.fillStyle = '#ff5578';
    ctx.fillText(lines[0], W / 2, 170);
    ctx.font = '26px "VT323", "Courier New", monospace';
    ctx.fillStyle = '#f8f8f2';
    lines.slice(1, 3).forEach((line, index) => ctx.fillText(line, W / 2, 230 + index * 40));
    ctx.fillStyle = '#f5c542';
    ctx.fillText(lines[3], W / 2, 340);
    ctx.textAlign = 'left';
  }

  drawCounter(ctx, exposure, inventory) {
    // bancada (lona) na frente de Perigoso
    ctx.fillStyle = '#e8d9b5';
    ctx.fillRect(LONA.x, COUNTER_TOP, LONA.w, LONA.h);
    ctx.fillStyle = '#c9b48a';
    ctx.fillRect(LONA.x, COUNTER_TOP + 60, LONA.w, 24);
    ctx.strokeStyle = '#0b0c10'; ctx.lineWidth = 3;
    ctx.strokeRect(LONA.x, COUNTER_TOP, LONA.w, LONA.h);
    // listras da lona
    ctx.fillStyle = '#d15b4a';
    for (let x = LONA.x; x < LONA.x + LONA.w; x += 54) ctx.fillRect(x, COUNTER_TOP, 27, 10);
    ctx.fillStyle = '#0b0c10';
    ctx.font = '16px "VT323", "Courier New", monospace';
    ctx.fillText('LONA · clique para expor', LONA.x + 10, COUNTER_TOP + 84 - 6);

    // itens expostos: unidades individuais, uma por espaço
    exposure.forEach((item, i) => {
      const x = slotX(i) + 26;
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(x - 30, COUNTER_TOP + 2, 60, 6);
      if (item) {
        drawItem(ctx, item.itemId, x, COUNTER_TOP + 4, ITEMS[item.itemId].color);
      } else {
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(x - 24, COUNTER_TOP - 40, 48, 42);
        ctx.setLineDash([]);
      }
    });
  }

  drawEffects(ctx) {
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 6, 6);
    }
    ctx.globalAlpha = 1;
    for (const t of this.texts) {
      ctx.globalAlpha = Math.max(0, Math.min(1, t.life));
      drawLabel(ctx, t.text, t.x, t.y, t.color, 26);
    }
    ctx.globalAlpha = 1;
  }
}
