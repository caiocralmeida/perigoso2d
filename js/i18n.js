// Sistema de internacionalização simples: PT/ENG

const STRINGS = {
  pt: {
    // HUD
    'hud.day': 'DIA',
    'hud.money': '₽',
    'hud.hunger': 'FOME',
    'hud.social': 'SOCIAL',
    'hud.slots': 'ESPAÇOS',

    // Toast
    'toast.day_start': 'DIA {day}: clique na lona para expor itens.',
    'toast.stock_open': 'Clique em itens para expor/guardar. Feche com ESC.',
    'toast.sold': 'Vendido!',
    'toast.haggle': 'Negociação...',
    'toast.refused': 'Cliente recusou.',
    'toast.customer_left': 'Cliente saiu.',
    'police.caught': 'VOCÊ FOI PEGO',
    'police.loss': 'A polícia levou {count} item(ns).',
    'police.fine': 'Multa aplicada: ₽{amount}.',
    'police.night': 'Gerenciamento noturno em {time}.',

    // Dialog
    'dialog.customer_order': 'Quer comprar por {price}₽?',
    'dialog.haggle_offer': 'Posso fazer por {price}₽?',
    'dialog.haggle_counter': 'Mínimo {price}₽. Topa?',
    'dialog.yes': 'SIM',
    'dialog.no': 'NÃO',
    'dialog.haggle': 'NEGOCIAR',
    'dialog.accept': 'ACEITAR',
    'dialog.refuse': 'RECUSAR',

    // Stock
    'stock.title': 'EXPOSIÇÃO (máx: {slots})',
    'stock.in_lona': 'NA LONA',
    'stock.in_stock': 'GUARDADO',
    'stock.close': 'ESC para fechar',

    // Night
    'night.title': 'NOITE',
    'night.summary': 'Vendas: {sales}₽\nGasto: {spent}₽\nLucro: {profit}₽',
    'night.hunger': 'Fome: {hunger}',
    'night.social': 'Social: {social}',
    'night.paid_rent': 'Aluguel pago: -50₽',
    'night.paid_food': 'Comida paga: -30₽',
    'night.skipped_food': 'Comida pulada (FOME +1)',
    'night.primo': 'PRIMO visitou: +100₽',
    'night.rapa': 'RAPA visitou: -{amount}₽',
    'night.game_over': 'GAME OVER',
    'night.game_over_hunger': 'Morreu de fome.',
    'night.game_over_social': 'Perdeu a vontade de viver.',
    'night.next_day': 'Próximo Dia',

    // Expenses selection
    'expenses.title': 'ESCOLHA AS DESPESAS',
    'expenses.money': 'Dinheiro: {money}₽',
    'expenses.pay_rent': 'Pagar Aluguel (-50₽)',
    'expenses.pay_food': 'Pagar Comida (-30₽)',
    'expenses.skip_food': 'Pular Comida (Fome -1)',
    'expenses.confirm': 'CONFIRMAR',

    // Upgrades
    'upgrades.title': 'MELHORIAS',
    'upgrades.price': '{price}₽',
    'upgrades.owned': 'Você tem {count}',

    // Items
    'item.perfume': 'PERFUME',
    'item.dvd': 'DVD PARÓDIA',
    'item.relogio': 'RELÓGIO',

    // Start screen
    'start.title': 'PERIGOSO',
    'start.new': 'NOVA CARREIRA',
    'start.continue': 'CONTINUAR',
    'start.has_save': 'Save disponível',
  },

  eng: {
    // HUD
    'hud.day': 'DAY',
    'hud.money': '₽',
    'hud.hunger': 'HUNGER',
    'hud.social': 'SOCIAL',
    'hud.slots': 'SLOTS',

    // Toast
    'toast.day_start': 'DAY {day}: click on the counter to organize items.',
    'toast.stock_open': 'Click items to display/store. Close with ESC.',
    'toast.sold': 'Sold!',
    'toast.haggle': 'Haggling...',
    'toast.refused': 'Customer refused.',
    'toast.customer_left': 'Customer left.',
    'police.caught': 'YOU WERE CAUGHT',
    'police.loss': 'The police took {count} item(s).',
    'police.fine': 'Fine applied: ₽{amount}.',
    'police.night': 'Night management in {time}.',

    // Dialog
    'dialog.customer_order': 'Buy for {price}₽?',
    'dialog.haggle_offer': 'How about {price}₽?',
    'dialog.haggle_counter': 'Minimum {price}₽. Deal?',
    'dialog.yes': 'YES',
    'dialog.no': 'NO',
    'dialog.haggle': 'HAGGLE',
    'dialog.accept': 'ACCEPT',
    'dialog.refuse': 'REFUSE',

    // Stock
    'stock.title': 'DISPLAY (max: {slots})',
    'stock.in_lona': 'ON COUNTER',
    'stock.in_stock': 'STORED',
    'stock.close': 'ESC to close',

    // Night
    'night.title': 'NIGHT',
    'night.summary': 'Sales: {sales}₽\nSpent: {spent}₽\nProfit: {profit}₽',
    'night.hunger': 'Hunger: {hunger}',
    'night.social': 'Social: {social}',
    'night.paid_rent': 'Paid rent: -50₽',
    'night.paid_food': 'Paid food: -30₽',
    'night.skipped_food': 'Skipped food (HUNGER +1)',
    'night.primo': 'COUSIN visited: +100₽',
    'night.rapa': 'RAPA visited: -{amount}₽',
    'night.game_over': 'GAME OVER',
    'night.game_over_hunger': 'Starved.',
    'night.game_over_social': 'Lost the will to live.',
    'night.next_day': 'Next Day',

    // Expenses selection
    'expenses.title': 'CHOOSE EXPENSES',
    'expenses.money': 'Money: {money}₽',
    'expenses.pay_rent': 'Pay Rent (-50₽)',
    'expenses.pay_food': 'Pay Food (-30₽)',
    'expenses.skip_food': 'Skip Food (HUNGER -1)',
    'expenses.confirm': 'CONFIRM',

    // Upgrades
    'upgrades.title': 'UPGRADES',
    'upgrades.price': '{price}₽',
    'upgrades.owned': 'You have {count}',

    // Items
    'item.perfume': 'PERFUME',
    'item.dvd': 'DVD PARODY',
    'item.relogio': 'WATCH',

    // Start screen
    'start.title': 'PERIGOSO',
    'start.new': 'NEW GAME',
    'start.continue': 'CONTINUE',
    'start.has_save': 'Save available',
  },
};

let language = readLanguage();

function readLanguage() {
  try {
    const stored = localStorage.getItem('perigoso2d.lang');
    return STRINGS[stored] ? stored : 'pt';
  } catch (err) {
    console.warn('Não foi possível carregar o idioma salvo:', err);
    return 'pt';
  }
}

export function setLanguage(lang) {
  if (!STRINGS[lang]) return;
  language = lang;
  try {
    localStorage.setItem('perigoso2d.lang', lang);
    window.location.reload();
  } catch (err) {
    console.warn('Não foi possível salvar o idioma:', err);
  }
}

export function t(key, vars = {}) {
  let str = STRINGS[language]?.[key] || STRINGS['pt'][key] || key;

  // Substituir variáveis: {var} → value
  Object.entries(vars).forEach(([k, v]) => {
    str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  });

  return str;
}

export function getCurrentLanguage() {
  return language;
}
