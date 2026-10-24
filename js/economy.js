// Lógica pura do jogo: estado, exposição, clientes, vendas, noite e upgrades com sistema de qualidade

import { ITEMS, UPGRADES, BALANCE, MOODS } from './data.js';
import { generateItem, generatePrimoStock, calculatePrice, decayQuality, isPrimoDay, primoPriceForDay } from './shop.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const between = (rng, [a, b]) => a + (b - a) * rng();
const LOG_LIMIT = 40;

function emptyStats() {
  return { revenue: 0, sales: 0, haggles: 0, trip: 0, rapa: 0, rent: 0, food: 0, restock: 0, upgrades: 0 };
}

export function newGame(rng = Math.random) {
  return {
    version: 4,
    day: 1,
    phase: 'day',
    money: BALANCE.startSavings,
    fome: BALANCE.startFome,
    social: BALANCE.startSocial,
    inventory: Object.fromEntries(Object.entries(ITEMS).map(([id, item]) => [
      id,
      Array.from({ length: item.start }, () => generateItem(id, 'common', null, rng)),
    ])),
    shopStock: [], // estoque da loja
    shopLastQualities: [],
    primoStock: [], // estoque do primo (quando vier)
    exposure: Array(BALANCE.baseSlots).fill(null), // [null, null, { itemId, quality }, ...]
    upgrades: Object.fromEntries(Object.keys(UPGRADES).map((k) => [k, 0])),
    stats: emptyStats(),
    history: [],
    log: ['DIA 1 - COMEÇOU NA FEIRA'],
    rapaTimesCaught: 0,
    lastClientGoneTime: null, // timestamp de quando último cliente saiu
    sceneDarkness: 0, // 0-1, intensidade do escurecimento
    nightChoices: { payRent: true, payFood: true },
    nightBase: null,
    returningCustomers: [],
    dayEvents: [],
    rapaMinuteChecked: 0,
    rapaCaughtToday: false,
    rapaWaveStarted: false,
    rapaWaveRemaining: 0,
    rapaCaptureStartedAt: null,
    rapaCaptureConsequences: null,
  };
}

export function addLog(state, text) {
  state.log.push(text);
  if (state.log.length > LOG_LIMIT) state.log.splice(0, state.log.length - LOG_LIMIT);
}

export function slotCount(state) {
  return Math.min(BALANCE.maxSlots, BALANCE.baseSlots + (state.upgrades.slots ?? 0));
}

export function ensureSlots(state) {
  const n = slotCount(state);
  while (state.exposure.length < n) state.exposure.push(null);
}

// Retorna número de unidades expostas de um item
export function exposedCount(state, itemId) {
  return state.exposure.filter((item) => item && item.itemId === itemId).length;
}

// Retorna unidades em inventário de um item
export function inventoryCount(state, itemId) {
  if (!state.inventory[itemId]) return 0;
  return state.inventory[itemId].length;
}

export function unitsAvailableToExpose(state, itemId) {
  return inventoryCount(state, itemId) - exposedCount(state, itemId);
}

export function purchasePrice(item) {
  const definition = ITEMS[item?.itemId];
  if (!definition) return Infinity;
  return Math.max(1, Math.round(definition.cost * (item.quality ?? 1) + (item.rarity === 'rare' ? BALANCE.rareItemBonus : 0)));
}

export function isUnlocked(state, id) {
  return state.day >= ITEMS[id].unlockDay;
}

export function placeItem(state, slot, itemId, shopItem = null, rng = Math.random, unitId = null) {
  ensureSlots(state);
  if (!ITEMS[itemId]) return { ok: false, reason: 'Item desconhecido.' };
  if (shopItem && shopItem.itemId !== itemId) return { ok: false, reason: 'O item da loja não corresponde ao espaço escolhido.' };
  if (!isUnlocked(state, itemId)) return { ok: false, reason: `Disponível no dia ${ITEMS[itemId].unlockDay}.` };
  if (slot < 0 || slot >= state.exposure.length) return { ok: false, reason: 'Espaço inválido.' };
  if (state.exposure[slot]) return { ok: false, reason: 'Espaço ocupado.' };
  
  // Se vindo da loja, compra; senão usa inventário
  if (shopItem) {
    const price = purchasePrice(shopItem);
    if (state.money < price) return { ok: false, reason: 'Dinheiro insuficiente.' };
    state.money -= price;
    const item = { ...shopItem };
    if (!state.inventory[itemId]) state.inventory[itemId] = [];
    state.inventory[itemId].push(item);
    state.stats.restock += price;
  } else {
    if (unitsAvailableToExpose(state, itemId) <= 0) return { ok: false, reason: 'Sem unidades disponíveis.' };
  }
  
  // Quando a unidade veio selecionada da bolsa, expõe exatamente aquela qualidade.
  const itemToExpose = unitId
    ? state.inventory[itemId].find((item) => item.unitId === unitId)
    : [...state.inventory[itemId]].reverse().find((item) => !state.exposure.includes(item));
  if (!itemToExpose || state.exposure.includes(itemToExpose)) {
    return { ok: false, reason: 'Essa unidade não está disponível.' };
  }
  state.exposure[slot] = itemToExpose;
  return { ok: true };
}

export function removeItem(state, slot) {
  if (slot < 0 || slot >= state.exposure.length || !state.exposure[slot]) return { ok: false, reason: 'Espaço vazio.' };
  state.exposure[slot] = null;
  return { ok: true };
}

function makeCustomer(kind, state, rng) {
  const moodNames = Object.keys(MOODS);
  const mood = kind === 'cliente' ? moodNames[Math.floor(rng() * moodNames.length)] : 'neutro';
  const m = MOODS[mood];
  const patience = Math.round(between(rng, m.patience));
  return {
    id: `${kind}-${state.day}-${Math.floor(rng() * 1e9)}`,
    kind,
    mood,
    patience,
    maxPatience: patience,
    budgetFactor: between(rng, m.budget),
    item: null,
    budget: 0,
    resolved: false,
  };
}

export function planDay(state, rng = Math.random) {
  const total = 3 + Math.floor((state.day - 1) / 2) + Math.floor(rng() * 3);
  const customers = [];
  state.returningCustomers ??= [];
  for (let index = 0; index < total; index++) {
    const customer = makeCustomer('cliente', state, rng);
    const returnChance = (state.upgrades.fidelidade ?? 0) * 0.1;
    if (state.returningCustomers.length && rng() < returnChance) {
      const previous = state.returningCustomers.splice(Math.floor(rng() * state.returningCustomers.length), 1)[0];
      customer.mood = previous.mood;
      customer.budgetFactor = previous.budgetFactor;
      customer.returning = true;
      customer.profile = previous.profile;
    }
    customers.push(customer);
  }
  return customers;
}

export function planRapaCustomerWave(state, count = 4, rng = Math.random) {
  return Array.from({ length: Math.max(0, Math.floor(count)) }, () => {
    const customer = makeCustomer('cliente', state, rng);
    customer.rapaWave = true;
    return customer;
  });
}

export function replenishRapaCustomerWave(state, queue, rng = Math.random) {
  if (!state.rapaWaveStarted || state.rapaCaughtToday || queue.length > 0) return false;
  const wave = planRapaCustomerWave(state, 4, rng);
  queue.push(...wave);
  state.rapaWaveRemaining += wave.length;
  return true;
}

export function makeOrder(state, c, rng = Math.random) {
  if (c.kind !== 'cliente') return { ok: true, item: null };
  const exposed = state.exposure.filter(Boolean);
  if (exposed.length === 0) return { ok: false, reason: 'Nada exposto.' };
  
  const item = exposed[Math.floor(rng() * exposed.length)];
  let factor = c.budgetFactor;
  if (rng() < BALANCE.rich.chancePerLevel * (state.upgrades.vitrininista ?? 0)) factor += BALANCE.rich.boost;
  
  c.item = item;
  c.itemId = item.itemId;
  c.budget = Math.round(calculatePrice(item) * factor);
  c.suggestedPrice = Math.round(calculatePrice(item) * (1 + (state.upgrades.negociador ?? 0) * 0.05));
  c.offerPrice = c.suggestedPrice;
  return { ok: true, item: item.itemId };
}

export function orderDelay(state) {
  return 1.2;
}

export function adjustOffer(state, customer, direction) {
  if (customer.resolved || customer.kind !== 'cliente' || !customer.item) return { ok: false, reason: 'Negociação indisponível.' };
  const step = Math.max(1, Math.round(customer.suggestedPrice * BALANCE.offerStepRatio));
  if (direction === 'more') {
    if (customer.patience <= 0) return { ok: false, expired: true, reason: 'O cliente perdeu a paciência.' };
    customer.offerPrice = Math.min(customer.suggestedPrice * 2, customer.offerPrice + step);
    customer.patience = Math.max(0, customer.patience - BALANCE.offerMorePatienceCost);
    state.stats.haggles += 1;
  } else if (direction === 'less') {
    customer.offerPrice = Math.max(1, customer.offerPrice - step);
  } else {
    return { ok: false, reason: 'Ajuste de preço inválido.' };
  }
  return { ok: true, price: customer.offerPrice, expired: customer.patience <= 0 };
}

export function sellDeal(state, c, mode, suggestedPrice = null, rng = Math.random) {
  if (c.resolved) return { ok: false, reason: 'Cliente já atendido.' };
  if (c.kind !== 'cliente' || !c.item) return { ok: false, reason: 'Pedido inválido.' };

  const requestedId = typeof c.item === 'string' ? c.item : c.item.itemId;
  const item = typeof c.item === 'string'
    ? state.exposure.find((entry) => entry?.itemId === requestedId)
    : c.item;
  const idx = state.exposure.indexOf(item);
  if (idx < 0) return { ok: false, cancel: true, reason: 'O item saiu da exposição.' };

  c.item = item;
  c.itemId = item.itemId;
  const listPrice = calculatePrice(item);
  let price = listPrice;

  if (mode === 'vender') {
    price = suggestedPrice ?? c.offerPrice ?? c.suggestedPrice ?? listPrice;
    if (!Number.isFinite(price) || price < 1) return { ok: false, reason: 'Preço inválido.' };
    if (c.budget < price) {
      return { ok: false, refused: true, reason: 'O cliente não tem orçamento para o preço.' };
    }
  } else if (mode === 'negociar') {
    price = suggestedPrice ?? Math.round(listPrice * 0.8);
    if (!Number.isFinite(price) || price <= 0 || price > listPrice) {
      return { ok: false, reason: 'Oferta inválida.' };
    }
    if (price > c.budget) return { ok: false, refused: true, reason: 'A oferta ainda passa do orçamento.' };

    if (c.budget < price) return { ok: false, refused: true, reason: 'O cliente não tem orçamento para essa oferta.' };
  } else {
    return { ok: false, reason: 'Ação de venda inválida.' };
  }

  // Remove item do inventário e da exposição
  c.resolved = true;
  state.exposure[idx] = null;
  const inventory = state.inventory[c.itemId] ?? [];
  const invIdx = inventory.indexOf(item);
  if (invIdx >= 0) inventory.splice(invIdx, 1);
  
  // Adiciona dinheiro
  state.money += price;
  state.stats.revenue += price;
  state.stats.sales += 1;
  if (state.upgrades.fidelidade > 0) {
    state.returningCustomers.push({ mood: c.mood, budgetFactor: c.budgetFactor, profile: c.profile });
    if (state.returningCustomers.length > 12) state.returningCustomers.shift();
  }
  addLog(state, `VENDA ${c.itemId.toUpperCase()} ${price}`);
  
  return { ok: true, amount: price };
}

export function refuseCustomer(state, c) {
  if (!c.resolved) {
    c.resolved = true;
    state.stats.sales += 0;
    addLog(state, `CLIENTE RECUSADO: ${c.kind}`);
  }
}

export function buyPrimoTrip(state, c) {
  if (state.phase !== 'day' || c.resolved || c.kind !== 'primo') return { ok: false, reason: 'Viagem indisponível.' };
  const cost = primoPriceForDay(state.day, state);
  if (state.money < cost) return { ok: false, reason: 'Dinheiro insuficiente para a viagem.' };
  state.money -= cost;
  state.stats.trip += cost;
  c.resolved = true;
  state.primoStock = generatePrimoStock(state.day, state);
  addLog(state, `VIAGEM AO PARAGUAI: -${cost}`);
  return { ok: true, cost };
}

export function resolveRapa(state, elapsedMs, rng = Math.random) {
  if (state.phase !== 'day' || state.rapaCaughtToday || elapsedMs < 60000) return { ok: false, chance: 0 };
  state.sceneDarkness = clamp(elapsedMs / 240000, 0, 1);
  let chance = 0;
  const minute = Math.floor(elapsedMs / 60000);
  for (let currentMinute = state.rapaMinuteChecked + 1; currentMinute <= minute; currentMinute++) {
    chance = Math.min(BALANCE.rapaMaxChance, currentMinute * BALANCE.rapaChancePerMinute);
    state.rapaMinuteChecked = currentMinute;
    if (rng() < chance) {
      const units = Object.values(state.inventory).flat();
      const toLose = Math.min(units.length, Math.ceil(units.length * 0.5));
      for (let count = 0; count < toLose; count++) {
        const index = Math.floor(rng() * units.length);
        const item = units.splice(index, 1)[0];
        const inventory = state.inventory[item.itemId];
        inventory.splice(inventory.indexOf(item), 1);
        const slot = state.exposure.indexOf(item);
        if (slot >= 0) state.exposure[slot] = null;
      }
      const fine = state.rapaTimesCaught * BALANCE.rapaFineBase;
      state.money -= fine;
      state.stats.rapa += fine;
      state.rapaTimesCaught += 1;
      state.rapaCaughtToday = true;
      state.rapaCaptureStartedAt = Date.now();
      state.rapaCaptureConsequences = { lost: toLose, fine };
      const event = `Polícia levou metade do estoque (${toLose} unidade(s)) e aplicou multa de ₽${fine}.`;
      state.dayEvents.push(event);
      addLog(state, `RAPA: -${fine}; perdeu ${toLose} unidade(s)`);
      return { ok: true, chance, fine, lost: toLose };
    }
  }
  return { ok: false, chance };
}

export function rapaCaptureRemainingMs(state, now = Date.now()) {
  if (!state.rapaCaughtToday || !Number.isFinite(state.rapaCaptureStartedAt)) return null;
  return Math.max(0, BALANCE.rapaCaptureDurationMs - (now - state.rapaCaptureStartedAt));
}

export function settleNight(state) {
  const s = state;
  if (s.phase !== 'day' || s._nightSettled) return s.history.at(-1) ?? null;
  // Cada unidade é a mesma referência no inventário e na exposição; decai uma vez.
  Object.keys(s.inventory).forEach(id => {
    s.inventory[id].forEach(item => decayQuality(item, s));
  });
  const revenue = s.stats.revenue;
  const costs = s.stats.rent + s.stats.food + s.stats.trip + s.stats.rapa + s.stats.restock + s.stats.upgrades;
  const summary = {
    day: s.day,
    sales: s.stats.sales,
    revenue,
    costs,
    profit: revenue - costs,
    events: [...s.dayEvents],
  };
  s.social = clamp(s.social - 1, 0, BALANCE.maxNeed);
  s.nightBase = { money: s.money, fome: s.fome, social: s.social };
  s.nightChoices = { payRent: s.money >= BALANCE.rent, payFood: s.money >= BALANCE.rent + BALANCE.food };
  s.history.push(summary);
  s._nightSettled = true;
  s.phase = 'night';
  applyNightExpenses(s, s.nightChoices);
  addLog(s, `FIM DO DIA ${s.day}: lucro ${summary.profit}`);
  return summary;
}

export function isGameOver(state) {
  return state.fome <= 0 && state.social <= 0;
}

export function applyNightExpenses(state, choices) {
  if (state.phase !== 'night' || !state.nightBase) return { ok: false, reason: 'Despesas indisponíveis.' };
  const payRent = Boolean(choices.payRent) && state.nightBase.money >= BALANCE.rent;
  const payFood = Boolean(choices.payFood) && state.nightBase.money - (payRent ? BALANCE.rent : 0) >= BALANCE.food;
  state.nightChoices = { payRent, payFood };
  state.money = state.nightBase.money - (payRent ? BALANCE.rent : 0) - (payFood ? BALANCE.food : 0);
  state.social = clamp(state.nightBase.social - (payRent ? 0 : 1), 0, BALANCE.maxNeed);
  state.fome = clamp(state.nightBase.fome + (payFood ? BALANCE.foodNeedGain : -1), 0, BALANCE.maxNeed);
  state.stats.rent = payRent ? BALANCE.rent : 0;
  state.stats.food = payFood ? BALANCE.food : 0;
  state._expensesChosen = true;
  const summary = state.history.at(-1);
  if (summary) {
    summary.costs = state.stats.rent + state.stats.food + state.stats.trip + state.stats.rapa + state.stats.restock + state.stats.upgrades;
    summary.profit = summary.revenue - summary.costs;
  }
  return { ok: true, spent: { rent: state.stats.rent, food: state.stats.food } };
}

export function buyRestock(state, id, shopItem) {
  if (!['day', 'night'].includes(state.phase)) return { ok: false, reason: 'Compras indisponíveis nesta fase.' };
  if (!ITEMS[id] || !isUnlocked(state, id)) return { ok: false, reason: 'Item indisponível.' };
  shopItem ??= generateItem(id);
  const price = purchasePrice(shopItem);
  if (state.money < price) return { ok: false, reason: 'Dinheiro insuficiente.' };
  
  state.money -= price;
  if (!state.inventory[id]) state.inventory[id] = [];
  state.inventory[id].push(shopItem);
  state.stats.restock += price;
  addLog(state, `COMPROU ${id.toUpperCase()} -${price}`);
  return { ok: true };
}

export function upgradeCost(state, key) {
  return UPGRADES[key].base * (state.upgrades[key] + 1);
}

export function buyUpgrade(state, key) {
  if (state.phase !== 'night') return { ok: false, reason: 'Melhorias só à noite.' };
  const def = UPGRADES[key];
  if (!def) return { ok: false, reason: 'Melhoria desconhecida.' };
  if (state.upgrades[key] >= def.max) return { ok: false, reason: 'Nível máximo.' };
  const cost = upgradeCost(state, key);
  if (state.money < cost) return { ok: false, reason: 'Dinheiro insuficiente.' };
  state.money -= cost;
  if (state.nightBase) state.nightBase.money -= cost;
  state.upgrades[key] += 1;
  state.stats.upgrades += cost;
  ensureSlots(state);
  addLog(state, `MELHORIA ${def.name} nível ${state.upgrades[key]}`);
  return { ok: true };
}

export function startNextDay(state) {
  if (isGameOver(state)) {
    state.phase = 'over';
    return { ok: false, reason: 'A carreira terminou.' };
  }
  if (state.phase !== 'night') return { ok: false, reason: 'Só é possível começar o dia depois da noite.' };
  state.day += 1;
  state.phase = 'day';
  state.stats = emptyStats();
  state._expensesChosen = false;
  state._nightSettled = false;
  state.lastClientGoneTime = null;
  state.sceneDarkness = 0;
  state.rapaMinuteChecked = 0;
  state.rapaCaughtToday = false;
  state.rapaWaveStarted = false;
  state.rapaWaveRemaining = 0;
  state.rapaCaptureStartedAt = null;
  state.rapaCaptureConsequences = null;
  state.dayEvents = [];
  state.nightBase = null;
  addLog(state, `--- DIA ${state.day} ---`);
  return { ok: true };
}
