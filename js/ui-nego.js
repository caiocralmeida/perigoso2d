// Negociação com caixa de valor ajustável

import { BALANCE } from './data.js';
import { calculatePrice } from './shop.js';

const money = (v) => `₽${Math.round(v)}`;

export function createNegotiationPanel(customer, item, state, onSell) {
  const basePrice = calculatePrice(item);
  let suggestedPrice = basePrice;
  
  const container = document.createElement('div');
  container.className = 'negotiation-panel';
  
  const display = document.createElement('div');
  display.className = 'nego-display';
  
  const label = document.createElement('div');
  label.textContent = `${item.name} (qualidade: ${Math.round(item.quality * 100)}%)`;
  display.appendChild(label);
  
  const priceBox = document.createElement('div');
  priceBox.className = 'nego-price';
  priceBox.textContent = money(suggestedPrice);
  display.appendChild(priceBox);
  
  const buttons = document.createElement('div');
  buttons.className = 'nego-buttons';
  
  const btnMais = document.createElement('button');
  btnMais.className = 'btn';
  btnMais.textContent = 'PEDIR MAIS +';
  btnMais.onclick = () => {
    suggestedPrice = Math.min(suggestedPrice + 10, basePrice * 1.3);
    customer.patience -= 10;
    priceBox.textContent = money(suggestedPrice);
  };
  
  const btnMenos = document.createElement('button');
  btnMenos.className = 'btn';
  btnMenos.textContent = '- PEDIR MENOS';
  btnMenos.onclick = () => {
    suggestedPrice = Math.max(suggestedPrice - 10, Math.round(basePrice * 0.5));
    priceBox.textContent = money(suggestedPrice);
  };
  
  const btnVender = document.createElement('button');
  btnVender.className = 'btn big';
  btnVender.textContent = `VENDER ${money(suggestedPrice)}`;
  btnVender.onclick = () => onSell('vender', suggestedPrice);
  
  const btnNao = document.createElement('button');
  btnNao.className = 'btn danger';
  btnNao.textContent = 'NÃO VENDER';
  btnNao.onclick = () => onSell('refuse');
  
  buttons.appendChild(btnMais);
  buttons.appendChild(btnMenos);
  buttons.appendChild(btnVender);
  buttons.appendChild(btnNao);
  
  container.appendChild(display);
  container.appendChild(buttons);
  
  return container;
}
