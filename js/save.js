// Salvamento em localStorage. Todas as operações são protegidas: se o navegador bloquear o storage, o jogo continua.

import { BALANCE, ITEMS, UPGRADES } from './data.js';
import { generateItem } from './shop.js';

const KEY = 'perigoso2d.save.v2';

function normalizeSave(data) {
  const state = { ...data, version: 5 };
  const legacyUpgrades = {
    negociador: 'persuasao',
    vitrininista: 'sorte',
    slots: 'banca',
  };
  state.upgrades = Object.fromEntries(Object.entries(UPGRADES).map(([key, definition]) => [
    key,
    Math.min(definition.max, Math.max(0, data.upgrades?.[key] ?? data.upgrades?.[legacyUpgrades[key]] ?? 0)),
  ]));
  state.inventory = Object.fromEntries(Object.entries(ITEMS).map(([itemId, definition]) => {
    const saved = data.inventory?.[itemId];
    if (Array.isArray(saved)) {
      return [itemId, saved.map((item) => ({ ...item, itemId, unitId: item.unitId ?? `${itemId}-migrated-${Math.random()}` }))];
    }
    const count = Number.isFinite(saved) ? Math.max(0, Math.floor(saved)) : definition.start;
    return [itemId, Array.from({ length: count }, () => generateItem(itemId))];
  }));

  const used = new Set();
  state.exposure = (Array.isArray(data.exposure) ? data.exposure : []).map((savedItem) => {
    if (!savedItem) return null;
    const itemId = typeof savedItem === 'string' ? savedItem : savedItem.itemId;
    if (!state.inventory[itemId]) return null;
    const inventory = state.inventory[itemId];
    let item = inventory.find((candidate) => candidate.unitId === savedItem?.unitId && !used.has(candidate.unitId));
    if (!item && typeof savedItem === 'string') {
      item = inventory.find((candidate) => !used.has(candidate.unitId));
    }
    if (!item && typeof savedItem === 'object') {
      item = inventory.find((candidate) => candidate.quality === savedItem.quality && candidate.basePrice === savedItem.basePrice && !used.has(candidate.unitId));
    }
    if (!item) {
      item = typeof savedItem === 'object'
        ? { ...savedItem, itemId, unitId: savedItem.unitId ?? `${itemId}-migrated-${Math.random()}` }
        : generateItem(itemId);
      inventory.push(item);
    }
    used.add(item.unitId);
    return item;
  });
  state.stats = {
    revenue: 0, sales: 0, haggles: 0, primo: 0, trip: 0, rapa: 0,
    rent: 0, food: 0, restock: 0, upgrades: 0,
    ...data.stats,
  };
  state.money = Number.isFinite(data.money) ? data.money : (data.savings ?? 0) - (data.debt ?? 0);
  delete state.savings;
  delete state.debt;
  state.rapaTimesCaught = data.rapaTimesCaught ?? data.rapaTimesSinceBrought ?? 0;
  state.dayEvents = Array.isArray(data.dayEvents) ? data.dayEvents : [];
  state.rapaMinuteChecked = data.rapaMinuteChecked ?? 0;
  state.rapaCaughtToday = Boolean(data.rapaCaughtToday);
  state.lastClientGoneTime = data.lastClientGoneTime ?? null;
  state.rapaWaveStarted = data.rapaWaveStarted ?? (state.lastClientGoneTime !== null);
  state.rapaWaveRemaining = Number.isInteger(data.rapaWaveRemaining)
    ? Math.max(0, data.rapaWaveRemaining)
    : state.lastClientGoneTime !== null ? 4 : 0;
  state.rapaCaptureStartedAt = Number.isFinite(data.rapaCaptureStartedAt)
    ? data.rapaCaptureStartedAt
    : state.rapaCaughtToday ? Date.now() : null;
  state.rapaCaptureConsequences = data.rapaCaptureConsequences ?? null;
  state.shopLastQualities = Array.isArray(data.shopLastQualities)
    ? data.shopLastQualities.filter(Number.isFinite)
    : Array.isArray(data.shopStock) ? data.shopStock.map((item) => item.quality).filter(Number.isFinite) : [];
  state.returningCustomers = Array.isArray(data.returningCustomers) ? data.returningCustomers : [];
  state.history = Array.isArray(data.history) ? data.history : [];
  state.log = Array.isArray(data.log) ? data.log : [];
  state.phase = ['day', 'night', 'over'].includes(data.phase) ? data.phase : 'day';
  state._expensesChosen = Boolean(data._expensesChosen);
  state._nightSettled = Boolean(data._nightSettled);
  state.nightChoices = data.nightChoices ?? { payRent: state.stats.rent > 0, payFood: state.stats.food > 0 };
  state.nightBase = data.nightBase ?? (state.phase === 'night'
    ? { money: state.money + state.stats.rent + state.stats.food, fome: state.fome, social: state.social }
    : null);
  if (!Array.isArray(state.exposure)) state.exposure = Array(BALANCE.baseSlots).fill(null);
  return state;
}

export function saveGame(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...state, version: 5 }));
    return true;
  } catch (err) {
    console.warn('Não foi possível salvar:', err);
    return false;
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || ![2, 3, 4, 5].includes(data.version) || typeof data.day !== 'number') return null;
    return normalizeSave(data);
  } catch (err) {
    console.warn('Save inválido, ignorado:', err);
    return null;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch (err) {
    console.warn('Não foi possível apagar o save:', err);
  }
}

export function hasSave() {
  return loadGame() !== null;
}
