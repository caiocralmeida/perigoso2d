// Clientes como entidades independentes com movimento real.
// Estados de movimento: walk_in -> stand -> (order/happy/angry) -> walk_out -> gone.
// O pedido e a negociação são decididos por economy.js; aqui só há corpo, caminhada e reações.

import { drawPerson, drawBubble } from './sprites.js';

export const STAND_X = 300;
const ENTER_X = -80;
const SPEED = 110; // px/s, fixa: rapidez não acelera caminhada
const SHIRTS = ['#c94f3d', '#3d8fc9', '#8a5cc9', '#c9a23d', '#3dc98a'];

export class CustomerActor {
  constructor(customer, rng = Math.random) {
    this.c = customer;
    this.x = ENTER_X;
    this.state = 'walk_in';
    this.t = 0;
    this.waitTimer = 0;
    this.reactTimer = 0;
    this.walkPhase = 0;
    customer.profile ??= {
      shirt: SHIRTS[Math.floor(rng() * SHIRTS.length)],
      skin: ['#f2c49b', '#d9a679', '#8d5a3b'][Math.floor(rng() * 3)],
      hat: rng() < 0.3 ? '#2b2f3d' : null,
    };
    this.shirt = customer.profile.shirt;
    this.skin = customer.profile.skin;
    this.hat = customer.profile.hat;
    this.feetY = 412;
    this.bubble = null;
  }

  get gone() {
    return this.state === 'gone';
  }

  // Chamado quando o cliente está parado e pronto para o pedido.
  beginOrderWait(delay) {
    this.state = 'order_wait';
    this.waitTimer = delay;
  }

  setState(state, duration = 0) {
    this.state = state;
    this.reactTimer = duration;
    this.t = 0;
  }

  walkOut() {
    this.state = 'walk_out';
    this.bubble = null;
  }

  update(dt) {
    this.t += dt;
    if (this.state === 'walk_in' || this.state === 'walk_out') {
      const dir = this.state === 'walk_in' ? 1 : -1;
      this.x += dir * SPEED * dt;
      this.walkPhase += dt * 1.6;
      if (this.state === 'walk_in' && this.x >= STAND_X) {
        this.x = STAND_X;
        this.state = 'arrived';
      }
      if (this.state === 'walk_out' && this.x <= ENTER_X) this.state = 'gone';
      return;
    }
    if (this.state === 'arrived') {
      this.state = 'stand';
    }
    if (this.state === 'order_wait') {
      this.waitTimer -= dt;
    }
    if (this.reactTimer > 0) {
      this.reactTimer -= dt;
      if (this.reactTimer <= 0) {
        if (this.state === 'happy' || this.state === 'angry') this.walkOut();
        else this.state = 'stand';
      }
    }
  }

  draw(ctx) {
    if (this.state === 'gone') return;
    const moving = this.state === 'walk_in' || this.state === 'walk_out';
    let eyes = 'open';
    let mouth = 0;
    let arm = 'down';
    let lift = 0;
    let shake = 0;
    let head = 0;

    if (moving) {
      lift = Math.abs(Math.sin(this.walkPhase * Math.PI)) * 3;
    } else if (this.state === 'happy') {
      arm = 'up';
      lift = Math.abs(Math.sin(this.t * 8)) * 10;
      mouth = 0.9;
    } else if (this.state === 'angry') {
      shake = Math.sin(this.t * 40) * 3;
      head = -0.1;
      eyes = 'x';
    } else if (this.state === 'order_wait' || this.state === 'stand' || this.state === 'talk') {
      lift = Math.sin(this.t * 2.2 + this.x) * 1.5;
      if (this.c.kind === 'cliente' && this.c.item && this.state === 'talk') arm = 'point';
    }

    const walk = moving ? this.walkPhase / 2 : 0;
    ctx.save();
    ctx.translate(shake, -lift);
    drawPerson(ctx, this.x, this.feetY, {
      color: this.shirt, skin: this.skin, hat: this.hat, hair: '#2a1d14', walk, arm, mouth, eyes, head,
    });
    ctx.restore();

    if (this.bubble) drawBubble(ctx, this.x, this.feetY - 165 - lift, this.bubble.lines, this.bubble.accent);
  }
}
