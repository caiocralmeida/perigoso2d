import {
  newGame, ensureSlots, planDay, makeOrder, orderDelay, sellDeal, refuseCustomer,
  buyPrimoTrip, adjustOffer, resolveRapa, settleNight, isGameOver, startNextDay, placeItem, removeItem,
  buyRestock, buyUpgrade, applyNightExpenses, purchasePrice,
  planRapaCustomerWave, replenishRapaCustomerWave, rapaCaptureRemainingMs,
} from './economy.js';
import { saveGame, loadGame, clearSave, hasSave } from './save.js';
import { Scene, W, H, inLona } from './scene.js';
import { Perigoso } from './perigoso.js';
import { CustomerActor } from './customers.js';
import * as ui from './ui.js';
import { ITEMS, PATIENCE_DRAIN_PER_SEC, BALANCE } from './data.js';
import { t, setLanguage, getCurrentLanguage } from './i18n.js';
import * as audio from './audio.js';
import { generateShopStock, isPrimoDay } from './shop.js';

const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;

const scene = new Scene();
const perigoso = new Perigoso();
const rng = Math.random;

let state = null;
let queue = [];
let visitQueue = [];
let actors = [];
let activeActor = null;
let spawnTimer = 0;
let transition = false;
let lastSummary = null;
let lastTime = performance.now();

const money = (v) => `₽${Math.round(v)}`;

function startCareer() {
  if (hasSave() && !window.confirm('Começar uma nova carreira apaga o save atual. Continuar?')) return;
  clearSave();
  state = newGame();
  ensureSlots(state);
  lastSummary = null;
  beginDay();
}

function continueCareer() {
  const saved = loadGame();
  if (!saved) return startCareer();
  state = saved;
  ensureSlots(state);
  ui.hideStart();
  if (state.phase === 'over') return ui.showGameOver(state, gameOverHandlers);
  if (state.phase === 'night') {
    lastSummary = state.history[state.history.length - 1] ?? null;
    return showNight();
  }
  beginDay();
}

function beginDay() {
  ui.hideStart();
  ui.closeNight();
  state.phase = 'day';
  if (state.rapaCaughtToday) {
    queue = [];
    visitQueue = [];
    actors = [];
    activeActor = null;
    if (!Number.isFinite(state.rapaCaptureStartedAt)) state.rapaCaptureStartedAt = Date.now();
    transition = false;
    ui.renderHUD(state);
    ui.setDayButton(false, 'POLÍCIA');
    return;
  }
  const afterClients = state.lastClientGoneTime != null;
  queue = afterClients
    ? planRapaCustomerWave(state, Math.max(4, state.rapaWaveRemaining), rng)
    : planDay(state, rng);
  if (afterClients) {
    state.rapaWaveStarted = true;
    state.rapaWaveRemaining = queue.length;
  }
  visitQueue = afterClients ? [] : [{ kind: 'loja' }];
  if (!afterClients && isPrimoDay(state.day, state)) visitQueue.push({ kind: 'primo' });
  if (!Array.isArray(state.shopStock) || state._shopStockDay !== state.day) {
    state.shopStock = generateShopStock(state.day, state, rng, state.shopLastQualities);
    state.shopLastQualities = state.shopStock.map((item) => item.quality);
    state._shopStockDay = state.day;
  }
  actors = [];
  activeActor = null;
  spawnTimer = 1.0;
  transition = false;
  ui.renderHUD(state);
  ui.setDayButton(true);
  ui.showToast(t('toast.day_start', { day: state.day }));
  saveGame(state);
}

function endDay() {
  if (transition || state.phase !== 'day') return;
  if (ui.stockOpen()) ui.closeStock();
  transition = true;
  ui.setDayButton(false, 'FECHANDO...');
  ui.closeDialog();
  if (activeActor) {
    const c = activeActor.c;
    if (c.kind === 'cliente' && !c.resolved) refuseCustomer(state, c);
    activeActor.walkOut();
    activeActor.bubble = null;
  }
  queue = [];
  visitQueue = [];
  ui.setFade(true);
  setTimeout(() => {
    lastSummary = settleNight(state, rng);
    ui.setFade(false);
    transition = false;
    saveGame(state);
    ui.renderHUD(state);
    showNight();
  }, 900);
}

function showNight() {
  state.phase = 'night';
  ui.setDayButton(false, 'NOITE');
  ui.openNight(state, lastSummary, nightHandlers);
}

function spawnNext() {
  const c = visitQueue.shift() ?? queue.shift();
  if (!c) return;
  if (c.rapaWave) {
    state.rapaWaveRemaining = Math.max(0, state.rapaWaveRemaining - 1);
    saveGame(state);
  }
  if (c.kind !== 'cliente') {
    Object.assign(c, { id: `${c.kind}-${state.day}`, mood: 'neutro', patience: 999, maxPatience: 999, resolved: false });
  }
  const a = new CustomerActor(c, rng);
  actors.push(a);
  activeActor = a;
}

function presentOrder(a) {
  const c = a.c;
  if (c.kind === 'cliente') {
    const r = makeOrder(state, c, rng);
    if (!r.ok) {
      a.bubble = { lines: ['...nada aqui?'], accent: '#ff5578' };
      ui.showToast(t('toast.customer_left'), 'bad');
      audio.soundRefuse();
      a.setState('angry', 1.6);
      return;
    }
    a.bubble = { lines: [`Quero ${ITEMS[c.itemId].name}`], accent: '#b7ff3c' };
  } else if (c.kind === 'primo') {
    a.bubble = { lines: ['Primo! Viagem pro Paraguai?'], accent: '#f5c542' };
    audio.soundPrimo();
  } else if (c.kind === 'loja') {
    a.bubble = { lines: ['Loja - Compre estoque!'], accent: '#00d4ff' };
  }
  a.state = 'order';
  perigoso.state = 'talk';
  perigoso.timer = 0;
  ui.openDialog(c, state, dialogHandlers);
}

function customerLeaves(a, anim = 'angry') {
  if (!a) return;
  a.bubble = null;
  a.setState(anim, 1.0);
  ui.closeDialog();
}

function afterSale(a, amount, mode) {
  scene.burst(a.x, a.feetY - 60, '#f5c542', 18);
  scene.floatText(`+${amount}`, a.x, a.feetY - 150, '#b7ff3c');
  perigoso.set('happy');
  a.setState('happy', 1.4);
  a.bubble = { lines: [mode === 'negociar' ? 'Fechado!' : 'Vendido!'], accent: '#b7ff3c' };
  ui.closeDialog();
  audio.soundSell();
  ui.showToast(`VENDA! ${money(amount)}`, 'good');
  ui.renderHUD(state);
  saveGame(state);
}

function refreshNightSummary() {
  if (!lastSummary) return;
  const stats = state.stats;
  lastSummary.costs = stats.rent + stats.food + stats.trip + stats.rapa + stats.restock + stats.upgrades;
  lastSummary.profit = lastSummary.revenue - lastSummary.costs;
  const index = state.history.length - 1;
  if (index >= 0) state.history[index] = { ...lastSummary };
}

function checkActiveOrder() {
  const a = activeActor;
  if (!a || a.c.kind !== 'cliente' || a.c.resolved || !a.c.item) return;
  if (a.state !== 'order') return;
  if (!state.exposure.includes(a.c.item)) {
    ui.showToast('O item saiu da lona. O cliente foi embora.', 'bad');
    customerLeaves(a, 'angry');
    refuseCustomer(state, a.c);
  }
}

const dialogHandlers = {
  onSell(mode, suggestedPrice) {
    const a = activeActor;
    if (!a || a.c.resolved || a.state !== 'order') return;
    
    if (a.c.kind === 'cliente') {
      const res = sellDeal(state, a.c, mode, suggestedPrice, rng);
      if (res.ok) return afterSale(a, res.amount, mode);
      if (res.cancel) {
        ui.showToast(res.reason, 'bad');
        audio.soundRefuse();
        refuseCustomer(state, a.c);
        customerLeaves(a, 'angry');
        return;
      }
      if (res.failedHaggle) {
        audio.soundHaggle();
        ui.showToast(`Oferta recusada (${Math.round(res.chance * 100)}%).`, 'bad');
        ui.setDialogPatience(a.c);
        perigoso.set('talk');
        if (a.c.patience <= 0) {
          refuseCustomer(state, a.c);
          customerLeaves(a, 'angry');
          ui.renderHUD(state);
          saveGame(state);
        }
        return;
      }
      if (res.refused) {
        ui.showToast(res.reason, 'bad');
        audio.soundRefuse();
        refuseCustomer(state, a.c);
        customerLeaves(a, 'angry');
        ui.renderHUD(state);
        saveGame(state);
        return;
      }
      ui.showToast(res.reason ?? 'Não foi possível concluir a venda.', 'bad');
    }
  },
  onRefuse() {
    const a = activeActor;
    if (!a || a.c.resolved) return;
    refuseCustomer(state, a.c);
    perigoso.set('sad');
    audio.soundRefuse();
    customerLeaves(a, 'angry');
    ui.renderHUD(state);
    saveGame(state);
  },
  onPrimo() {
    const a = activeActor;
    if (!a || a.c.resolved) return;
    const res = buyPrimoTrip(state, a.c);
    if (!res.ok) return ui.showToast(res.reason, 'bad');
    a.bubble = { lines: ['Viagem fechada!'], accent: '#f5c542' };
    ui.openShopPanel(state, state.primoStock, (shopItem) => {
      const purchase = buyRestock(state, shopItem.itemId, shopItem);
      if (!purchase.ok) return ui.showToast(purchase.reason, 'bad');
      state.primoStock = state.primoStock.filter((item) => item !== shopItem);
      ui.showToast(`Raro comprado: ${shopItem.name}.`, 'good');
      audio.soundPrimo();
      ui.renderHUD(state);
      saveGame(state);
      return true;
    }, () => customerLeaves(a, 'happy'));
    ui.renderHUD(state);
    saveGame(state);
  },
  onAdjustOffer(direction) {
    const a = activeActor;
    if (!a || a.c.resolved) return { ok: false };
    const result = adjustOffer(state, a.c, direction);
    if (!result.ok) return result;
    audio.soundHaggle();
    if (result.expired) {
      refuseCustomer(state, a.c);
      customerLeaves(a, 'angry');
      ui.showToast('O cliente perdeu a paciência.', 'bad');
      ui.renderHUD(state);
      saveGame(state);
    }
    ui.setDialogPatience(a.c);
    return result;
  },
  onShop() {
    const a = activeActor;
    if (!a || a.c.kind !== 'loja' || a.c.resolved) return;
    ui.openShopPanel(state, state.shopStock, (shopItem) => {
      const res = buyRestock(state, shopItem.itemId, shopItem);
      if (!res.ok) return ui.showToast(res.reason, 'bad');
      state.shopStock = state.shopStock.filter((item) => item !== shopItem);
      ui.showToast(`Comprado: ${shopItem.name} (${money(purchasePrice(shopItem))})`, 'good');
      audio.soundTick();
      ui.renderHUD(state);
      saveGame(state);
      return true;
    }, () => {
      if (activeActor === a) {
        a.c.resolved = true;
        customerLeaves(a, 'angry');
        saveGame(state);
      }
    });
  },
};

const nightHandlers = {
  onExpensesSelected(choices) {
    const result = applyNightExpenses(state, choices);
    if (!result.ok) return ui.showToast(result.reason, 'bad');
    refreshNightSummary();
    saveGame(state);
    ui.openNight(state, lastSummary, nightHandlers);
  },
  onUpgrade(key) {
    const res = buyUpgrade(state, key);
    if (!res.ok) return ui.showToast(res.reason, 'bad');
    ui.showToast('Melhoria comprada.', 'good');
    audio.soundTick();
    refreshNightSummary();
    saveGame(state);
    ui.openNight(state, lastSummary, nightHandlers);
  },
  onNextDay() {
    ui.closeNight();
    if (isGameOver(state)) {
      state.phase = 'over';
      saveGame(state);
      audio.soundGameOver();
      return ui.showGameOver(state, gameOverHandlers);
    }
    const result = startNextDay(state);
    if (!result.ok) return ui.showToast(result.reason, 'bad');
    beginDay();
  },
};

const gameOverHandlers = {
  onNew: () => {
    clearSave();
    state = newGame();
    ensureSlots(state);
    lastSummary = null;
    ui.closeNight();
    beginDay();
  },
};

function update(dt) {
  scene.update(dt);
  perigoso.update(dt);
  
  if (state && state.phase === 'day' && !transition) {
    if (!activeActor && (visitQueue.length || queue.length)) {
      spawnTimer -= dt;
      if (spawnTimer <= 0) spawnNext();
    }
  }

  const a = activeActor;
  if (a) {
    if (a.state === 'stand' && !a.ordered) {
      a.ordered = true;
      a.beginOrderWait(orderDelay(state));
    }
    if (a.state === 'order_wait' && a.waitTimer <= 0) presentOrder(a);
    if (a.state === 'order' && a.c.kind === 'cliente') {
      a.c.patience -= PATIENCE_DRAIN_PER_SEC * dt;
      ui.setDialogPatience(a.c);
      if (a.c.patience <= 0) {
        ui.showToast('Paciência acabou. Cliente foi embora.', 'bad');
        refuseCustomer(state, a.c);
        perigoso.set('sad');
        customerLeaves(a, 'angry');
        ui.renderHUD(state);
        saveGame(state);
      }
    }
  }

  if (state?.phase === 'day' && state.lastClientGoneTime !== null && !state.rapaCaughtToday) {
    const elapsed = Date.now() - state.lastClientGoneTime;
    state.sceneDarkness = Math.min(1, elapsed / 240000);
    const caught = resolveRapa(state, elapsed, rng);
    if (caught.ok) {
      queue = [];
      visitQueue = [];
      actors = [];
      activeActor = null;
      ui.closeDialog();
      if (ui.stockOpen()) ui.closeStock();
      ui.setDayButton(false, 'POLÍCIA');
      scene.burst(W / 2, 250, '#ff5578', 26);
      ui.showToast('VOCÊ FOI PEGO! A noite começa em 2 minutos.', 'bad');
      ui.renderHUD(state);
      saveGame(state);
    }
  }

  if (state?.phase === 'day' && state.rapaCaughtToday) {
    if (rapaCaptureRemainingMs(state) === 0) {
      endDay();
      return;
    }
  }

  if (ui.dialogOpen() && perigoso.state === 'idle') {
    perigoso.state = 'talk';
    perigoso.timer = 0;
  }

  for (const b of actors) b.update(dt);
  actors = actors.filter((b) => {
    if (b.gone) {
      if (activeActor === b) {
        activeActor = null;
        spawnTimer = 2.5 + Math.random() * 2;
        if (state && queue.length === 0 && visitQueue.length === 0 && state.phase === 'day') {
          if (b.c.kind === 'cliente') {
            if (state.lastClientGoneTime === null) state.lastClientGoneTime = Date.now();
            if (!state.rapaWaveStarted) {
              state.rapaWaveStarted = true;
              state.rapaWaveRemaining = 4;
              queue.push(...planRapaCustomerWave(state, state.rapaWaveRemaining, rng));
              ui.showToast('O rapa está chegando! Mais clientes estão a caminho.', 'bad');
            }
            replenishRapaCustomerWave(state, queue, rng);
            saveGame(state);
          }
          if (!queue.length && !visitQueue.length) {
            ui.showToast('Sem mais clientes. A loja está fechando.', 'info');
          }
        }
      }
      return false;
    }
    return true;
  });
}

function render() {
  ctx.clearRect(0, 0, W, H);
  scene.drawBackground(ctx, state ? state.sceneDarkness : 0);
  perigoso.draw(ctx);
  scene.drawCounter(ctx, state ? state.exposure : [], state ? state.inventory : {});
  if (state?.phase === 'day' && state.lastClientGoneTime !== null) {
    scene.drawRapaWarning(ctx, Date.now() - state.lastClientGoneTime);
  }
  for (const b of actors) b.draw(ctx);
  scene.drawEffects(ctx);
  if (state?.phase === 'day' && state.rapaCaughtToday) {
    const remaining = rapaCaptureRemainingMs(state) ?? 0;
    const minutes = Math.floor(remaining / 60000).toString().padStart(2, '0');
    const seconds = Math.floor((remaining % 60000) / 1000).toString().padStart(2, '0');
    const consequences = state.rapaCaptureConsequences ?? { lost: 0, fine: 0 };
    scene.drawPoliceCapture(ctx, [
      t('police.caught'),
      t('police.loss', { count: consequences.lost }),
      t('police.fine', { amount: consequences.fine }),
      t('police.night', { time: `${minutes}:${seconds}` }),
    ]);
  }
}

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  if (state) update(dt);
  render();
  requestAnimationFrame(frame);
}

function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
}

canvas.addEventListener('click', (e) => {
  if (!state || state.phase !== 'day' || state.rapaCaughtToday || transition || ui.stockOpen()) return;
  const p = canvasPoint(e);
  if (inLona(p.x, p.y)) {
    ui.openStock(state, stockHandlers);
  }
});

canvas.addEventListener('mousemove', (e) => {
  const p = canvasPoint(e);
  ui.setCursor(inLona(p.x, p.y));
});

document.getElementById('btn-dia').addEventListener('click', endDay);

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.classList.toggle('active', btn.dataset.lang === getCurrentLanguage());
  btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && ui.stockOpen()) {
    ui.closeStock();
    ui.renderHUD(state);
  }
});

const stockHandlers = {
  onPlace(slot, id, unitId) {
    if (slot < 0) return ui.showToast('Sem espaço livre.', 'bad');
    const prev = state.exposure[slot];
    if (prev) removeItem(state, slot);
    const res = placeItem(state, slot, id, null, Math.random, unitId);
    if (!res.ok) {
      if (prev) state.exposure[slot] = prev;
      return ui.showToast(res.reason, 'bad');
    }
    perigoso.set('work');
    checkActiveOrder();
    saveGame(state);
    ui.renderStock(state, stockHandlers);
  },
  onRemove(slot) {
    removeItem(state, slot);
    checkActiveOrder();
    saveGame(state);
    ui.renderStock(state, stockHandlers);
  },
  onClose() {
    ui.closeStock();
    ui.renderHUD(state);
  },
};

ui.showStart(hasSave(), { onNew: startCareer, onContinue: continueCareer });
requestAnimationFrame((t) => {
  lastTime = t;
  requestAnimationFrame(frame);
});

window.__perigoso = { get state() { return state; } };
