// Perigoso: personagem atrás da bancada com máquina de estados de animação.
// Estados: idle (respiração e piscar), work (mexe na exposição), talk (negociação),
// happy (venda concluída), sad (recusa ou negociação falhou).

import { drawPerson } from './sprites.js';

const DURATIONS = { work: 0.7, talk: 0.9, happy: 1.4, sad: 1.2 };

export class Perigoso {
  constructor() {
    this.state = 'idle';
    this.t = 0;
    this.timer = 0;
    this.blinkTimer = 2.5;
    this.blinking = 0;
    this.x = 650;
    this.feetY = 395;
  }

  set(state) {
    this.state = state;
    this.timer = DURATIONS[state] ?? 0;
    this.t = 0;
  }

  update(dt) {
    this.t += dt;
    if (this.timer > 0) {
      this.timer -= dt;
      if (this.timer <= 0) this.state = 'idle';
    }
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
      this.blinking = 0.12;
      this.blinkTimer = 2.2 + Math.random() * 2.5;
    }
    if (this.blinking > 0) this.blinking -= dt;
  }

  draw(ctx) {
    const breath = Math.sin(this.t * 2.2) * 2;
    let arm = 'down';
    let mouth = 0;
    let eyes = this.blinking > 0 ? 'closed' : 'open';
    let head = 0;
    let bodyLift = breath;

    if (this.state === 'work') {
      arm = Math.sin(this.t * 14) > 0 ? 'reach' : 'down';
      head = -0.08;
    } else if (this.state === 'talk') {
      mouth = 0.5 + 0.5 * Math.abs(Math.sin(this.t * 12));
      arm = 'point';
    } else if (this.state === 'happy') {
      arm = 'up';
      bodyLift = Math.abs(Math.sin(this.t * 9)) * 10;
      eyes = 'closed';
      mouth = 0.8;
    } else if (this.state === 'sad') {
      head = 0.22 + Math.sin(this.t * 10) * 0.04;
      eyes = 'open';
    }

    ctx.save();
    ctx.translate(0, -bodyLift);
    drawPerson(ctx, this.x, this.feetY, {
      color: '#2b2f3d', skin: '#e9b98c', hair: '#c8102e', arm, mouth, eyes, head, hat: '#b7ff3c', walk: 0,
    });
    ctx.restore();
  }
}
