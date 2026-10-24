// Dados de balanceamento e conteúdo. Nenhuma lógica de jogo aqui.

export const ITEMS = {
  perfume: { id: 'perfume', name: 'PERFUME', basePrice: 140, cost: 80, start: 2, unlockDay: 1, color: '#b7ff3c', rarity: 'common' },
  dvd: { id: 'dvd', name: 'DVD PARÓDIA', basePrice: 60, cost: 25, start: 2, unlockDay: 1, color: '#ff5578', rarity: 'common' },
  relogio: { id: 'relogio', name: 'RELÓGIO', basePrice: 220, cost: 130, start: 0, unlockDay: 3, color: '#f5c542', rarity: 'common' },
  jogo: { id: 'jogo', name: 'JOGO', basePrice: 95, cost: 50, start: 1, unlockDay: 1, color: '#6b5ff1', rarity: 'common' },
  camisapolo: { id: 'camisapolo', name: 'CAMISA POLO', basePrice: 85, cost: 45, start: 0, unlockDay: 2, color: '#4db8ff', rarity: 'common' },
  oculossol: { id: 'oculossol', name: 'ÓCULOS SOL', basePrice: 110, cost: 55, start: 0, unlockDay: 2, color: '#ffb84d', rarity: 'common' },
  tenis: { id: 'tenis', name: 'TÊNIS', basePrice: 150, cost: 75, start: 0, unlockDay: 2, color: '#ff6b9d', rarity: 'common' },
  bone: { id: 'bone', name: 'BONÉ', basePrice: 65, cost: 30, start: 1, unlockDay: 1, color: '#52c41a', rarity: 'common' },
  camisatime: { id: 'camisatime', name: 'CAMISA TIME', basePrice: 120, cost: 60, start: 0, unlockDay: 3, color: '#faad14', rarity: 'common' },
  fone: { id: 'fone', name: 'FONE OUVIDO', basePrice: 180, cost: 90, start: 0, unlockDay: 3, color: '#13c2c2', rarity: 'common' },
  celular: { id: 'celular', name: 'CELULAR', basePrice: 280, cost: 140, start: 0, unlockDay: 4, color: '#722ed1', rarity: 'common' },
  camera: { id: 'camera', name: 'CÂMERA DIGITAL', basePrice: 320, cost: 165, start: 0, unlockDay: 5, color: '#9b7b5b', rarity: 'common' },
  jaqueta: { id: 'jaqueta', name: 'JAQUETA', basePrice: 210, cost: 105, start: 0, unlockDay: 4, color: '#347c63', rarity: 'common' },
  bolsa: { id: 'bolsa', name: 'BOLSA', basePrice: 175, cost: 90, start: 0, unlockDay: 3, color: '#a85375', rarity: 'common' },
  caixa_som: { id: 'caixa_som', name: 'CAIXA DE SOM', basePrice: 260, cost: 135, start: 0, unlockDay: 4, color: '#5a6b8c', rarity: 'common' },
  corrente: { id: 'corrente', name: 'CORRENTE', basePrice: 195, cost: 100, start: 0, unlockDay: 3, color: '#d4b75b', rarity: 'common' },
  skate: { id: 'skate', name: 'SKATE', basePrice: 230, cost: 115, start: 0, unlockDay: 5, color: '#c85e4c', rarity: 'common' },
  tablet: { id: 'tablet', name: 'TABLET', basePrice: 390, cost: 200, start: 0, unlockDay: 6, color: '#6c7783', rarity: 'common' },
};

export const UPGRADES = {
  armazenagem: { name: 'ARMAZENAGEM', max: 2, base: 100, desc: 'Reduz a perda de qualidade dos itens comprados; no nível 2 ela para.' },
  negociador: { name: 'NEGOCIADOR', max: 4, base: 100, desc: '+5% no preço inicial da oferta por nível.' },
  conexoes: { name: 'CONEXÕES', max: 2, base: 140, desc: 'Faz o Primo visitar a cada 3 dias no nível 1 e a cada 2 dias no nível 2.' },
  vitrininista: { name: 'VITRININISTA', max: 3, base: 110, desc: '+15% de chance de atrair clientes com orçamento maior por nível.' },
  distribuidor: { name: 'DISTRIBUIDOR', max: 3, base: 130, desc: '+1 unidade disponível na loja diária por nível.' },
  qualidade: { name: 'QUALIDADE', max: 3, base: 120, desc: '+5% de qualidade nos itens comprados por nível.' },
  fidelidade: { name: 'FIDELIDADE', max: 3, base: 150, desc: '+10% de chance de um cliente satisfeito voltar em outro dia por nível.' },
  slots: { name: 'SLOTS', max: 3, base: 180, desc: '+1 espaço individual de exposição por nível.' },
};

export const BALANCE = {
  startSavings: 250,
  startFome: 5,
  startSocial: 5,
  maxNeed: 5,
  baseSlots: 2,
  maxSlots: 5,
  rent: 50,
  food: 30,
  foodNeedGain: 2,
  primoDays: 4,
  primoBasePrice: 100,
  primoPriceSteep: 10, // aumenta 10 por dia
  offerStepRatio: 0.05,
  offerMorePatienceCost: 8,
  rapaChancePerMinute: 0.25,
  rapaMaxChance: 0.95,
  rapaFineBase: 50,
  rapaCaptureDurationMs: 120000,
  qualityDecayPerNight: 0.02, // 2% por noite
  qualityMin: 0.30, // qualidade mínima é 30%
  qualityMax: 0.95, // qualidade máxima é 95%
  rich: { chancePerLevel: 0.15, boost: 0.35 },
  shopCommonCount: 4, // itens comuns na loja
  shopCommonCountPerDistributor: 1,
  shopRareCount: 2, // itens raros na loja primo
  rareItemBonus: 50, // +50 ao preço base de itens raros
};

// Humor define paciência e quanto o cliente está disposto a gastar (fator sobre o preço).
export const MOODS = {
  neutro: { patience: [70, 100], budget: [0.9, 1.2] },
  apressado: { patience: [45, 65], budget: [1.0, 1.3] },
  pechincheiro: { patience: [60, 90], budget: [0.7, 1.0] },
};

export const PATIENCE_DRAIN_PER_SEC = 3;
export const ORDER_DELAY = { base: 1.2, perLevel: 0.4, min: 0.4 };
