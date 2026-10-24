// Primitivas de desenho em Canvas 2D: pessoas, itens, lona e cenário.
// Todas as funções recebem coordenadas lógicas (960x540) e não mantêm estado.

export function rr(ctx, x, y, w, h, r = 6) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function outlined(ctx, fill, stroke = '#0b0c10', width = 3) {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = width;
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

// Pessoa de corpo inteiro. `feet` é o ponto de contato com o chão.
// pose: { walk: 0..1 fase da caminhada, arm: 'down'|'up'|'reach'|'point', head: ângulo, mouth: 0..1, eyes: 'open'|'closed'|'x', hat, color, skin, hair }
export function drawPerson(ctx, x, feet, pose = {}) {
  const p = {
    color: '#3b6fb6', skin: '#f2c49b', hair: '#2a1d14', walk: 0, arm: 'down', mouth: 0, eyes: 'open', ...pose,
  };
  const legSwing = Math.sin(p.walk * Math.PI * 2) * 16;
  const hipBob = Math.abs(Math.sin(p.walk * Math.PI));
  ctx.save();
  ctx.translate(x, feet - hipBob * 3);
  if (p.head) ctx.rotate(p.head);

  // sapatos
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#0b0c10';
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.ellipse(-12 + legSwing * 0.2, 2, 8, 4, 0.1, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(8 - legSwing * 0.2, 2, 8, 4, -0.1, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // pernas (mais compridas e com definição)
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = '#0b0c10';
  ctx.fillStyle = '#2b2f3d';
  rr(ctx, -16 + legSwing * 0.3, -50, 14, 52, 5); outlined(ctx, '#2b2f3d', '#0b0c10', 3.5);
  rr(ctx, 2 - legSwing * 0.3, -50, 14, 52, 5); outlined(ctx, '#2b2f3d', '#0b0c10', 3.5);

  // joelho sombra
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(-16 + legSwing * 0.3, -15, 14, 3);
  ctx.fillRect(2 - legSwing * 0.3, -15, 14, 3);

  // tronco (cintura mais definida)
  ctx.fillStyle = p.color;
  rr(ctx, -22, -100, 44, 58, 8);
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = '#0b0c10';
  ctx.stroke();
  ctx.fill();

  // cintura
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(-22, -42, 44, 4);

  // braços (mais detalhados)
  const armAngle = { down: 0.15, up: -2.6, reach: -1.2, point: -1.5 }[p.arm] ?? 0.15;
  const swing = p.arm === 'down' ? -legSwing * 0.05 : 0;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 22, -90);
    ctx.rotate(side === -1 ? -armAngle + swing : armAngle - swing);
    rr(ctx, -6, 0, 12, 48, 6);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#0b0c10';
    ctx.stroke();
    // mão
    ctx.fillStyle = p.skin;
    ctx.beginPath(); ctx.arc(0, 52, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // ombro sombra
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  rr(ctx, -24, -96, 48, 6, 3);
  ctx.fill();

  // cabeça
  ctx.fillStyle = p.skin;
  ctx.beginPath(); ctx.arc(0, -120, 23, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = '#0b0c10';
  ctx.stroke();

  // cabelo (mais volume)
  ctx.fillStyle = p.hair;
  ctx.beginPath(); ctx.arc(0, -130, 24, Math.PI * 0.95, Math.PI * 2.05); ctx.fill();

  // sombra rosto
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath(); ctx.arc(0, -120, 22, 0, Math.PI * 2); ctx.fill();

  if (p.hat) {
    ctx.fillStyle = p.hat;
    rr(ctx, -25, -138, 50, 11, 4); outlined(ctx, p.hat, '#0b0c10', 3);
    rr(ctx, -14, -158, 28, 22, 5); outlined(ctx, p.hat, '#0b0c10', 3);
  }

  // olhos (mais expressivos)
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-9, -124, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(9, -124, 5, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#0b0c10';
  if (p.eyes === 'closed') {
    ctx.beginPath(); ctx.ellipse(-9, -124, 4, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(9, -124, 4, 2, 0, 0, Math.PI * 2); ctx.fill();
  } else if (p.eyes === 'x') {
    ctx.lineWidth = 2.5;
    for (const ex of [-9, 9]) {
      ctx.beginPath(); ctx.moveTo(ex - 4, -128); ctx.lineTo(ex + 4, -120);
      ctx.moveTo(ex + 4, -128); ctx.lineTo(ex - 4, -120); ctx.stroke();
    }
  } else {
    ctx.beginPath(); ctx.arc(-9, -124, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(9, -124, 3, 0, Math.PI * 2); ctx.fill();
  }

  // nariz
  ctx.strokeStyle = '#0b0c10';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, -122); ctx.lineTo(0, -110); ctx.stroke();

  // boca
  ctx.lineWidth = 2.5;
  if (p.mouth > 0.05) {
    ctx.fillStyle = '#3a0d14';
    ctx.beginPath(); ctx.ellipse(0, -104, 6, 1 + p.mouth * 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#0b0c10';
    ctx.stroke();
  } else {
    ctx.strokeStyle = '#0b0c10';
    ctx.beginPath(); ctx.moveTo(-6, -104); ctx.lineTo(6, -104); ctx.stroke();
  }
  ctx.restore();
}

// Itens individuais. Cada chamada desenha uma unidade centralizada em (x, y) com base no chão (bottom).
export function drawItem(ctx, id, x, bottom, color) {
  ctx.save();
  ctx.lineWidth = 3.5;
  if (id === 'perfume') {
    // Frasco de perfume com mais detalhes
    ctx.fillStyle = color;
    rr(ctx, x - 13, bottom - 38, 26, 38, 7);
    ctx.fill();
    ctx.strokeStyle = '#0b0c10';
    ctx.stroke();

    // rótulo
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    rr(ctx, x - 12, bottom - 28, 24, 8, 3);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#0b0c10';
    ctx.stroke();

    // tampa
    ctx.fillStyle = '#f5f5f5';
    rr(ctx, x - 6, bottom - 48, 12, 12, 3);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#0b0c10';
    ctx.stroke();

    // pulverizador
    ctx.fillStyle = '#ddd';
    ctx.fillRect(x - 2, bottom - 52, 4, 6);
    ctx.strokeStyle = '#0b0c10';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 2, bottom - 52, 4, 6);

    // shine
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    rr(ctx, x - 10, bottom - 32, 6, 16, 2);
    ctx.fill();
  } else if (id === 'dvd') {
    // DVD com mais profundidade
    ctx.fillStyle = color;
    rr(ctx, x - 20, bottom - 32, 40, 32, 3);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#0b0c10';
    ctx.stroke();

    // espinha da capa
    ctx.fillStyle = '#0b0c10';
    ctx.fillRect(x - 21, bottom - 32, 2, 32);

    // círculo do disco
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x, bottom - 16, 11, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#0b0c10';
    ctx.stroke();

    // centro do disco
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, bottom - 16, 4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#0b0c10';
    ctx.lineWidth = 2;
    ctx.stroke();

    // raias do disco
    ctx.strokeStyle = 'rgba(11,12,16,0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(x, bottom - 16); ctx.lineTo(x + Math.cos(i * Math.PI / 2) * 8, bottom - 16 + Math.sin(i * Math.PI / 2) * 8); ctx.stroke();
    }
  } else if (id === 'relogio') {
    // Relógio de pulso mais realista
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, bottom - 22, 20, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#0b0c10';
    ctx.stroke();

    // borda interna
    ctx.fillStyle = '#f5f5f5';
    ctx.beginPath(); ctx.arc(x, bottom - 22, 17, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#0b0c10';
    ctx.stroke();

    // visor números (12, 3, 6, 9)
    ctx.fillStyle = '#0b0c10';
    ctx.font = 'bold 8px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('12', x, bottom - 36);
    ctx.fillText('6', x, bottom - 8);
    ctx.fillText('3', x + 14, bottom - 22);
    ctx.fillText('9', x - 14, bottom - 22);

    // ponteiros
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#0b0c10';
    ctx.beginPath(); ctx.moveTo(x, bottom - 22); ctx.lineTo(x, bottom - 32); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, bottom - 22); ctx.lineTo(x + 10, bottom - 22); ctx.stroke();

    // centro
    ctx.fillStyle = '#0b0c10';
    ctx.beginPath(); ctx.arc(x, bottom - 22, 2, 0, Math.PI * 2); ctx.fill();

    // pulseira
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.beginPath(); ctx.moveTo(x - 22, bottom - 22); ctx.lineTo(x - 28, bottom - 20);
    ctx.moveTo(x + 22, bottom - 22); ctx.lineTo(x + 28, bottom - 20);
    ctx.stroke();
  } else {
    rr(ctx, x - 16, bottom - 30, 32, 30, 4);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#0b0c10';
    ctx.stroke();
  }
  ctx.restore();
}

export function drawLabel(ctx, text, x, y, color = '#f8f8f2', size = 14) {
  ctx.save();
  ctx.font = `bold ${size}px "VT323", "Courier New", monospace`;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  const w = ctx.measureText(text).width + 10;
  ctx.fillRect(x - w / 2, y - size, w, size + 4);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

// Balão de fala acima de (x, y). lines: array de strings.
export function drawBubble(ctx, x, y, lines, accent = '#b7ff3c') {
  ctx.save();
  ctx.font = '18px "VT323", "Courier New", monospace';
  const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 22;
  const h = lines.length * 20 + 14;
  const bx = x - w / 2;
  const by = y - h - 14;
  rr(ctx, bx, by, w, h, 8);
  outlined(ctx, '#fff', '#0b0c10', 3);
  ctx.beginPath();
  ctx.moveTo(x - 6, by + h); ctx.lineTo(x, y - 2); ctx.lineTo(x + 6, by + h); ctx.closePath();
  ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#0b0c10';
  ctx.textAlign = 'left';
  lines.forEach((l, i) => ctx.fillText(l, bx + 11, by + 22 + i * 20));
  ctx.fillStyle = accent;
  ctx.fillRect(bx + 4, by + 4, 4, h - 8);
  ctx.restore();
}
