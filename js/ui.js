// Interface em DOM: HUD, diálogo de negociação, exposição (lona), tela noturna, início e fim de jogo.
// Não guarda estado de jogo: recebe dados de main.js e devolve eventos por callbacks.

import { ITEMS, UPGRADES, BALANCE } from './data.js';
import { slotCount, upgradeCost, purchasePrice } from './economy.js';
import { calculatePrice, primoPriceForDay } from './shop.js';
import { t } from './i18n.js';

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};
const money = (v) => `₽${Math.round(v)}`;
const signedMoney = (v) => `${v < 0 ? '-' : '+'}${money(Math.abs(v))}`;

export function showToast(text, kind = 'info') {
  const t = $('toast');
  t.textContent = text;
  t.dataset.kind = kind;
  t.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => t.classList.remove('show'), 2200);
}

export function renderHUD(state) {
  const hud = $('hud');
  const bar = (v) => '■'.repeat(v) + '□'.repeat(BALANCE.maxNeed - v);
  hud.innerHTML = '';
  const items = [
    ['DIA', state.day],
    ['DINHEIRO', money(state.money)],
    ['VENDAS', state.stats.sales],
    ['FOME', bar(state.fome)],
    ['SOCIAL', bar(state.social)],
  ];
  for (const [label, value] of items) {
    const box = el('div', 'hud-item');
    box.append(el('span', 'hud-label', label), el('span', 'hud-value', String(value)));
    hud.append(box);
  }
}

export function setDayButton(enabled, label = 'PASSAR DIA') {
  const b = $('btn-dia');
  b.disabled = !enabled;
  b.textContent = label;
}

// ---------- Diálogo de negociação ----------
let dialogHandlers = null;

export function openDialog(c, state, handlers) {
  dialogHandlers = handlers;
  const box = $('dialog');
  box.innerHTML = '';
  box.classList.remove('hidden');

  const titles = { cliente: 'CLIENTE', primo: 'PRIMO', loja: 'FORNECEDOR' };
  const moodNames = { neutro: 'NEUTRO', apressado: 'APRESSADO', pechincheiro: 'PECHINCHEIRO' };
  box.append(el('div', 'dlg-title', titles[c.kind] ?? 'CLIENTE'));

  const max = c.kind === 'cliente' ? c.maxPatience : 1;
  const bar = el('div', 'patience');
  const fill = el('div', 'patience-fill');
  fill.style.width = `${Math.max(0, Math.min(100, (c.patience / max) * 100))}%`;
  bar.append(fill);

  if (c.kind === 'cliente') {
    const itemId = typeof c.item === 'string' ? c.item : c.item?.itemId;
    const item = ITEMS[itemId];
    const price = calculatePrice(c.item);
    const offer = c.offerPrice ?? c.suggestedPrice ?? price;
    const offerValue = el('div', 'dlg-offer-price', `VALOR DO PRODUTO: ${money(offer)}`);
    const sellButton = btn(`VENDER ${money(offer)}`, () => dialogHandlers.onSell('vender', c.offerPrice), c.budget < offer ? 'disabled' : '');
    box.append(
      el('div', 'dlg-line', `Humor: ${moodNames[c.mood]}`),
      el('div', 'dlg-line', `Quer: ${item.name}`),
      el('div', 'dlg-line dim', `Preço sugerido: ${money(c.suggestedPrice ?? price)} · Orçamento: ${money(c.budget)}`),
      offerValue,
      el('div', 'dlg-label', 'PACIÊNCIA'),
      bar,
    );
    const actions = el('div', 'dlg-actions');
    actions.append(
      btn('PEDIR MAIS', () => {
        const result = dialogHandlers.onAdjustOffer('more');
        if (result?.ok) {
          offerValue.textContent = `VALOR DO PRODUTO: ${money(result.price)}`;
          sellButton.textContent = `VENDER ${money(result.price)}`;
          sellButton.disabled = c.budget < result.price;
          fill.style.width = `${Math.max(0, Math.min(100, (c.patience / max) * 100))}%`;
        }
      }),
      btn('PEDIR MENOS', () => {
        const result = dialogHandlers.onAdjustOffer('less');
        if (result?.ok) {
          offerValue.textContent = `VALOR DO PRODUTO: ${money(result.price)}`;
          sellButton.textContent = `VENDER ${money(result.price)}`;
          sellButton.disabled = c.budget < result.price;
        }
      }),
      sellButton,
      btn('RECUSAR', () => dialogHandlers.onRefuse(), 'danger'),
    );
    box.append(actions);
  } else if (c.kind === 'primo') {
    const cost = primoPriceForDay(state.day, state);
    box.append(el('div', 'dlg-line', 'Viagem para o Paraguai: estoque raro e limitado.'), el('div', 'dlg-line dim', `Custo: ${money(cost)} · Dinheiro: ${money(state.money)}`));
    const actions = el('div', 'dlg-actions');
    actions.append(
      btn(`COMPRAR VIAGEM ${money(cost)}`, () => dialogHandlers.onPrimo(), state.money < cost ? 'disabled' : ''),
      btn('AGORA NÃO', () => dialogHandlers.onRefuse(), 'danger'),
    );
    box.append(actions);
  } else if (c.kind === 'loja') {
    box.append(el('div', 'dlg-line', 'Estoque por unidade. Escolha apenas o que cabe no seu caixa.'));
    const actions = el('div', 'dlg-actions');
    actions.append(
      btn('VER ESTOQUE', () => dialogHandlers.onShop()),
      btn('AGORA NÃO', () => dialogHandlers.onRefuse(), 'danger'),
    );
    box.append(actions);
  }
}

export function setDialogPatience(c) {
  const fill = document.querySelector('.patience-fill');
  if (!fill) return;
  const max = c.maxPatience || 1;
  fill.style.width = `${Math.max(0, Math.min(100, (c.patience / max) * 100))}%`;
}

export function closeDialog() {
  dialogHandlers = null;
  const box = $('dialog');
  box.classList.add('hidden');
  box.innerHTML = '';
}

export function dialogOpen() {
  return !$('dialog').classList.contains('hidden');
}

function btn(label, onClick, cls = '') {
  const b = el('button', `btn ${cls}`.trim(), label);
  if (cls.includes('disabled')) b.disabled = true;
  b.addEventListener('click', onClick);
  return b;
}

// ---------- Exposição (lona) ----------
let stockState = { selected: null };

export function openStock(state, handlers) {
  stockState = { selected: null };
  $('stock').classList.remove('hidden');
  renderStock(state, handlers);
}

export function closeStock() {
  $('stock').classList.add('hidden');
}

export function stockOpen() {
  return !$('stock').classList.contains('hidden');
}

export function renderStock(state, handlers) {
  const box = $('stock');
  box.innerHTML = '';
  const panel = el('div', 'panel stock-panel');
  panel.append(el('div', 'panel-title', 'BOLSA'));
  panel.append(el('div', 'dim small', 'Selecione uma unidade da bolsa para expor. Clique duas vezes em um espaço ocupado para retirar o item.'));

  const grid = el('div', 'slots');
  for (let i = 0; i < slotCount(state); i++) {
    const id = state.exposure[i];
    const s = el('button', 'slot' + (stockState.selected === i ? ' selected' : '') + (id ? ' filled' : ''));
    s.textContent = id ? ITEMS[id.itemId].name : `ESPAÇO ${i + 1}`;
    s.addEventListener('click', () => {
      if (id && stockState.selected === i) {
        handlers.onRemove(i);
        stockState.selected = null;
      } else {
        stockState.selected = i;
      }
      renderStock(state, handlers);
    });
    grid.append(s);
  }
  panel.append(grid);

  const list = el('div', 'stock-list');
  for (const [itemId, units] of Object.entries(state.inventory)) {
    for (const unit of units) {
      const definition = ITEMS[itemId];
      const exposed = state.exposure.includes(unit);
      const row = el('button', `row${exposed ? ' disabled' : ''}`);
      row.disabled = exposed;
      const rarity = unit.rarity === 'rare' ? 'raro' : 'comum';
      row.append(
        el('span', null, `${unit.name ?? definition.name} - ${rarity}- ${Math.round((unit.quality ?? 1) * 100)}% ${money(definition.cost)}`),
        el('span', 'dim', exposed ? 'NA LONA' : ''),
      );
      row.addEventListener('click', () => {
        const slot = stockState.selected ?? state.exposure.findIndex((x) => !x);
        handlers.onPlace(slot, itemId, unit.unitId);
      });
      list.append(row);
    }
  }
  panel.append(list);

  const actions = el('div', 'dlg-actions');
  actions.append(btn('CONFIRMAR', () => handlers.onClose()));
  panel.append(actions);
  box.append(panel);
}

// ---------- Tela noturna ----------
export function openNight(state, summary, handlers) {
  const box = $('night');
  box.innerHTML = '';
  box.classList.remove('hidden');
  const wrap = el('div', 'night-wrap');

  const fin = el('div', 'panel night-panel');
  fin.append(el('div', 'night-title', `NOITE DO DIA ${summary?.day ?? state.day}`));
  const rows = [
    ['VENDAS', summary?.sales ?? state.stats.sales, ''],
    ['RECEITAS', money(summary?.revenue ?? state.stats.revenue), 'pos'],
    ['GASTOS', money(summary?.costs ?? 0), 'neg'],
    ['LUCRO', money(summary?.profit ?? 0), (summary?.profit ?? 0) >= 0 ? 'pos' : 'neg'],
  ];
  for (const [label, value, cls] of rows) {
    const r = el('div', 'night-row');
    r.append(el('span', 'dim', label), el('span', cls, String(value)));
    fin.append(r);
  }
  const s = state.stats;
  fin.append(el('div', 'night-sub', 'GASTOS DETALHADOS'));
  for (const [label, key, amount] of [['ALUGUEL', 'payRent', BALANCE.rent], ['COMIDA', 'payFood', BALANCE.food]]) {
    const r = el('div', 'night-row small');
    const description = el('label', 'expense-inline');
    const checkbox = el('input');
    checkbox.type = 'checkbox';
    checkbox.checked = Boolean(state.nightChoices[key]);
    checkbox.disabled = state.nightBase.money < amount || (key === 'payFood' && state.nightChoices.payRent && state.nightBase.money - BALANCE.rent < BALANCE.food);
    checkbox.addEventListener('change', () => handlers.onExpensesSelected({ ...state.nightChoices, [key]: checkbox.checked }));
    description.append(checkbox, el('span', 'dim', label));
    const paid = Boolean(state.nightChoices[key]);
    const balance = paid ? `-${money(amount)}` : `+${money(amount)} poupados`;
    r.append(description, el('span', paid ? 'neg' : 'pos', balance));
    fin.append(r);
  }
  const fixedExpenses = [
    ['VIAGEM AO PARAGUAI', s.trip], ['RAPA / MULTA', s.rapa],
    ['ESTOQUE', s.restock], ['MELHORIAS', s.upgrades],
  ];
  for (const [label, amount] of fixedExpenses) {
    const r = el('div', 'night-row small');
    r.append(el('span', 'dim', label), el('span', amount ? 'neg' : 'dim', amount ? `-${money(amount)}` : '—'));
    fin.append(r);
  }
  const totalRow = el('div', 'night-row night-total');
  totalRow.append(el('span', null, 'TOTAL'), el('span', state.money < 0 ? 'neg' : 'pos', signedMoney(state.money)));
  fin.append(totalRow);

  fin.append(el('div', 'night-sub', 'CONDIÇÃO'));
  for (const [label, v] of [['FOME', state.fome], ['SOCIAL', state.social]]) {
    const r = el('div', 'night-row small');
    const bar = '■'.repeat(v) + '□'.repeat(BALANCE.maxNeed - v);
    r.append(el('span', 'dim', label), el('span', v <= 1 ? 'neg' : '', bar));
    fin.append(r);
  }

  fin.append(el('div', 'night-sub', 'EVENTOS'));
  if ((summary?.events ?? []).length === 0) fin.append(el('div', 'dim small', 'Nada de estranho esta noite.'));
  for (const e of summary?.events ?? []) fin.append(el('div', 'small', `· ${e}`));

  const right = el('div', 'panel night-panel');
  right.append(el('div', 'night-sub', 'MELHORIAS'));
  for (const key of Object.keys(UPGRADES)) {
    const def = UPGRADES[key];
    const lvl = state.upgrades[key];
    const row = el('div', 'up-row');
    const text = el('div', 'up-text');
    text.append(el('div', null, `${def.name}  ${lvl}/${def.max}`), el('div', 'dim small', def.desc));
    const cost = lvl >= def.max ? 'MÁX' : money(upgradeCost(state, key));
    const b = btn(cost, () => handlers.onUpgrade(key), lvl >= def.max || state.money < upgradeCost(state, key) ? 'disabled' : '');
    row.append(text, b);
    right.append(row);
  }
  const next = btn(state.fome <= 0 && state.social <= 0 ? 'VER RESULTADO' : `DORMIR E ABRIR O DIA ${state.day + 1}`, () => handlers.onNextDay());
  next.classList.add('big');
  right.append(next);

  wrap.append(fin, right);
  box.append(wrap);
}

export function closeNight() {
  $('night').classList.add('hidden');
  $('night').innerHTML = '';
}

export function nightOpen() {
  return !$('night').classList.contains('hidden');
}

// ---------- Início e fim ----------
export function showStart(hasSave, handlers) {
  const box = $('start');
  box.innerHTML = '';
  box.classList.remove('hidden');
  const panel = el('div', 'panel start-panel');
  const title = el('h1', 'title', 'PERIGOSO');
  title.id = 'start-title';
  panel.append(title);
  panel.append(el('div', 'dim', 'Venda item por item. Sobreviva à noite.'));
  panel.append(btn('COMEÇAR CARREIRA', handlers.onNew));
  if (hasSave) panel.append(btn('CONTINUAR', handlers.onContinue));
  box.append(panel);
}

export function hideStart() {
  $('start').classList.add('hidden');
}

export function showGameOver(state, handlers) {
  const box = $('night');
  box.innerHTML = '';
  box.classList.remove('hidden');
  const panel = el('div', 'panel night-panel gameover');
  panel.append(el('div', 'night-title', 'FIM DE JOGO'));
  panel.append(el('div', 'dim', `Você sobreviveu ${state.day} dia(s). Vendas: ${state.history.reduce((a, h) => a + h.sales, 0)}.`));
  panel.append(btn('NOVA CARREIRA', handlers.onNew));
  box.append(panel);
}

export function setFade(on) {
  $('fade').classList.toggle('on', on);
}

export function setCursor(pointer) {
  $('scene').style.cursor = pointer ? 'pointer' : 'default';
}

// ---------- Painel de Loja ----------
export function openShopPanel(state, shopItems, onBuy, onClose = () => {}) {
  const box = document.getElementById('dialog');
  box.innerHTML = '';
  box.classList.remove('hidden');
  
  const title = document.createElement('div');
  title.className = 'dlg-title';
  title.textContent = 'LOJA - COMPRE ITENS';
  box.appendChild(title);
  
  const list = document.createElement('div');
  list.className = 'shop-list';
  
  const available = shopItems.filter((item) => isUnlocked(state, item.itemId));
  if (available.length === 0) list.appendChild(el('div', 'dim small', 'Sem unidades disponíveis hoje.'));
  available.forEach(item => {
    const row = document.createElement('button');
    row.className = 'row';
    const price = purchasePrice(item);
    row.disabled = state.money < price;
    if (row.disabled) row.classList.add('disabled');
    row.innerHTML = `
      <span>${item.name} (${Math.round(item.quality * 100)}%)</span>
      <span class="dim">${price}₽</span>
    `;
    row.onclick = () => {
      if (onBuy(item)) row.disabled = true;
    };
    list.appendChild(row);
  });
  
  box.appendChild(list);
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn';
  closeBtn.textContent = 'FECHAR';
  closeBtn.onclick = () => {
    closeDialog();
    onClose();
  };
  box.appendChild(closeBtn);
}
