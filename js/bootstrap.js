// Preserve a visible, accessible start screen while the game modules load, and
// explain module/bootstrap failures instead of leaving an empty overlay.
function showBootError(error) {
  console.error('Não foi possível iniciar o Perigoso:', error);

  const start = document.getElementById('start');
  start.innerHTML = '';

  const panel = document.createElement('div');
  panel.className = 'panel start-panel';

  const title = document.createElement('h1');
  title.id = 'start-title';
  title.className = 'title';
  title.textContent = 'PERIGOSO';

  const message = document.createElement('p');
  message.className = 'dim';
  message.setAttribute('role', 'status');
  message.textContent = 'Não foi possível iniciar. Sirva o jogo por HTTP (npm start) e recarregue a página.';

  panel.append(title, message);
  start.append(panel);
}

export const gameReady = import('./main.js').catch(showBootError);
