# Perigoso 2D

Jogo 2D de loja em Canvas 2D: exposição de itens individuais, clientes que caminham até a loja, negociação de preços, saldo único, upgrades e gerenciamento noturno.

## Como executar

Não há build nem dependências de runtime. Sirva a pasta com qualquer servidor estático (módulos ES exigem HTTP, não `file://`):

    npm start            # python3 -m http.server 8080
    # abra http://localhost:8080

Testes da economia (Node 18+):

    npm test

## Como jogar

- Clique na **lona** para abrir a exposição. Escolha um espaço e depois um item. Clique num espaço ocupado e depois em "retirar" ou escolha outro item para trocar.
- Clientes caminham até a loja. O pedido só aparece depois que o cliente para, e sempre é um item que está exposto.
- Em cada pedido, ajuste o preço com **PEDIR MAIS/MENOS** (pedir mais consome paciência) e venda pelo valor exibido, ou recuse.
- A carreira começa com seis unidades. O preço de venda é o valor base único do item multiplicado pela qualidade.
- **PASSAR DIA** fica disponível durante todo o dia. Ao usá-lo, o dia fecha, há o evento do rapa e a tela noturna abre.
- O botão continua acessível com a exposição aberta; pedidos pendentes são encerrados sem concluir vendas involuntárias.
- A loja visita diariamente com itens novos e qualidades diferentes das da visita anterior; o Primo aparece a cada quatro dias e oferece viagem paga para comprar itens raros.
- À noite, alterne os checkboxes de aluguel e comida no resumo. Pular mantém o dinheiro, mas reduz social ou fome. Compre melhorias e durma para o próximo dia.
- O progresso é salvo no navegador (localStorage) ao iniciar o dia, após cada venda, mudança de exposição e na noite.

## Arquitetura

    index.html          Estrutura: HUD, canvas, diálogo, overlays
    css/style.css       Estilo (paleta em :root, layout responsivo)
    js/data.js          Balanceamento e conteúdo (itens, melhorias, humores)
    js/economy.js       Lógica pura: estado, exposição, pedidos, vendas, noite, upgrades
    js/save.js          Salvamento em localStorage com proteção contra falhas
    js/main.js          Laço principal e ligação entre os módulos
    js/scene.js         Cenário diurno, bancada/lona, partículas e textos flutuantes
    js/perigoso.js      Perigoso: máquina de estados (idle, work, talk, happy, sad)
    js/customers.js     Clientes como entidades: walk_in -> stand -> order -> happy/angry -> walk_out
    js/sprites.js       Desenho de pessoas, itens, balões e rótulos
    js/ui.js            Interface DOM: HUD, negociação, exposição, noite, início, fim
    tests/economy.test.js  31 testes da economia

Fonte única de verdade: o objeto `state` em `economy.js`. A UI e a cena leem esse estado e não guardam cópias de dinheiro, estoque ou exposição.

## Mecânicas preservadas do projeto original

- Dinheiro inicial, aluguel e comida por noite, fome e social.
- Primo a cada quatro dias (ajustável por Conexões), oferecendo viagem para uma loja rara limitada.
- Após o último cliente, o timer da polícia começa e novos clientes continuam chegando. A chance aumenta 25 pontos percentuais por minuto; uma captura leva metade do estoque e pode aplicar multa. A tela fica preta com as consequências, e a noite de gerenciamento abre automaticamente após dois minutos.
- O total financeiro é um único saldo assinado. Saves antigos convertem dinheiro menos dívida para esse saldo.
- Oito upgrades afetam negociação, frequência do Primo, estoque diário, qualidade, fidelidade e espaços de exposição.
- Itens individuais: perfume, DVD paródia, jogos, roupas, acessórios e relógios (liberados progressivamente).

## Limitações conhecidas

- O bundle original era React minificado, sem código-fonte. Esta versão foi reescrita. Os recursos gráficos originais (imagens webp embutidas) não foram reaproveitados; o desenho é feito por código.
- As imagens de referência citadas no prompt não foram recebidas. A identidade visual foi criada do zero.
- Sem áudio.
- As melhorias são compradas à noite; estoque só é comprado durante a visita da loja ou do Primo.
- As fontes VT323 e Courier são usadas se instaladas; caso contrário, cai para monoespaçada do sistema. Nada é carregado de CDN.
- Animações são quadros gerados por código (não spritesheets).

## Verificação

- `npm test`: 39 testes de economia, rapa, negociação, visitas, upgrades e migração de saves, todos passando.
- Sintaxe validada para todos os módulos JavaScript; módulos centrais importados com sucesso.
- O servidor estático respondeu em `http://localhost:8080`. Não há Playwright configurado neste workspace, portanto a validação visual automatizada não foi executada nesta revisão.
