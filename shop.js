// Sistema de loja com qualidade variável e itens raros

import { ITEMS, BALANCE } from './data.js';

const QUALITY_PRECISION = 10000;

function roundQuality(quality) {
  return Math.round(quality * QUALITY_PRECISION) / QUALITY_PRECISION;
}

function uniqueShopQuality(usedQualities, rng, qualityBonus) {
  const range = Math.round((BALANCE.qualityMax - BALANCE.qualityMin) * QUALITY_PRECISION);
  const randomQuality = () => roundQuality(BALANCE.qualityMin + rng() * (BALANCE.qualityMax - BALANCE.qualityMin));
  const adjusted = (quality) => roundQuality(Math.min(BALANCE.qualityMax, quality + qualityBonus));

  for (let attempt = 0; attempt < 12; attempt++) {
    const quality = adjusted(randomQuality());
    if (!usedQualities.has(quality)) return quality;
  }

  const start = Math.floor(rng() * (range + 1));
  for (let offset = 0; offset <= range; offset++) {
    const quality = adjusted(BALANCE.qualityMin + ((start + offset) % (range + 1)) / QUALITY_PRECISION);
    if (!usedQualities.has(quality)) return quality;
  }
  throw new Error('Não há qualidades únicas disponíveis para o estoque da loja.');
}

// Gera um item com qualidade aleatória
export function generateItem(itemId, rarity = 'common', quality = null, rng = Math.random) {
  const item = ITEMS[itemId];
  if (!item) return null;
  
  // Qualidade aleatória entre min e max
  if (quality === null) {
    quality = BALANCE.qualityMin + rng() * (BALANCE.qualityMax - BALANCE.qualityMin);
  }
  
  return {
    unitId: `${itemId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    itemId,
    name: item.name,
    rarity, // 'common' ou 'rare'
    quality: roundQuality(quality),
    basePrice: item.basePrice,
    color: item.color,
    daysHeld: 0, // contador de noites no inventário
  };
}

// Calcula o preço de venda pelo valor base e pela qualidade.
export function calculatePrice(shopItem, qualityBonus = 0) {
  const quality = Math.max(BALANCE.qualityMin, shopItem.quality + qualityBonus);
  return Math.round(shopItem.basePrice * quality);
}

// Gera estoque da loja (comum)
export function generateShopStock(day, state, rng = Math.random, previousQualities = state.shopLastQualities ?? []) {
  const commonIds = Object.keys(ITEMS).filter((id) => ITEMS[id].unlockDay <= day);
  const count = BALANCE.shopCommonCount + BALANCE.shopCommonCountPerDistributor * (state.upgrades.distribuidor ?? 0);
  const stock = [];
  const usedQualities = new Set(previousQualities);
  const qualityBonus = (state.upgrades.qualidade ?? 0) * 0.05;
  
  // Embaralha e pega N itens aleatórios
  const shuffled = [...commonIds].sort(() => rng() - 0.5);
  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const quality = uniqueShopQuality(usedQualities, rng, qualityBonus);
    usedQualities.add(quality);
    const item = generateItem(shuffled[i], 'common', quality, rng);
    stock.push(item);
  }
  
  return stock;
}

// Gera estoque do Primo (raro)
export function generatePrimoStock(day, state, rng = Math.random) {
  const allIds = Object.keys(ITEMS).filter((id) => ITEMS[id].unlockDay <= day);
  const count = BALANCE.shopRareCount;
  const stock = [];
  
  // Embaralha todos os itens e pega N aleatórios (todos são raros aqui)
  const shuffled = [...allIds].sort(() => rng() - 0.5);
  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const item = generateItem(shuffled[i], 'rare', null, rng);
    item.quality = Math.min(BALANCE.qualityMax, item.quality + (state.upgrades.qualidade ?? 0) * 0.05);
    stock.push(item);
  }
  
  return stock;
}

// Aplica decaimento de qualidade (2% por noite, modificado por armazenagem)
export function decayQuality(shopItem, state) {
  const decay = Math.max(0, BALANCE.qualityDecayPerNight - (state.upgrades.armazenagem * 0.01));
  shopItem.quality = roundQuality(Math.max(BALANCE.qualityMin, shopItem.quality - decay));
  shopItem.daysHeld += 1;
}

// Preço da viagem Primo
export function primoPriceForDay(day, state) {
  const interval = Math.max(2, BALANCE.primoDays - (state.upgrades.conexoes ?? 0));
  const tripsSoFar = Math.floor((day - 1) / interval);
  return BALANCE.primoBasePrice + tripsSoFar * BALANCE.primoPriceSteep;
}

// Verifica se Primo aparece hoje
export function isPrimoDay(day, state) {
  const interval = Math.max(2, BALANCE.primoDays - (state.upgrades.conexoes ?? 0));
  return day % interval === 0 && day > 1;
}
