// ==UserScript==
// @name         Gerador de Propostas Financeiras (v3.2)
// @namespace    https://gist.github.com/paulosereduc
// @version      3.2
// @description  Correção de layout + Feriados Nacionais (2025/2026/2027).
// @author       Paulo Victor Freire da Silva
// @github       github.com/pv-flows
// @email        pv.flows@gmail.com
// @match        https://conversas.hyperflow.global/*
// @match        https://web.whatsapp.com/*
// @grant        none
// @updateURL    https://gist.githubusercontent.com/paulosereduc/7e8590926811fd2d07af47bbb82ddc5f/raw/GeradorPropostas.user.js
// @downloadURL  https://gist.githubusercontent.com/paulosereduc/7e8590926811fd2d07af47bbb82ddc5f/raw/GeradorPropostas.user.js
// ==/UserScript==

(function() {
    'use strict';

    // --- CONFIGURAÇÃO ---
    const STORAGE_KEY_THEME = 'fin_painel_theme';
    let isDarkMode = localStorage.getItem(STORAGE_KEY_THEME) === 'true';

    // --- FUNÇÃO DE DATA (3 DIAS ÚTEIS COM FERIADOS 2026/2027) ---
    function getVencimento3DiasUteis() {
        let data = new Date();
        let diasAdicionados = 0;

        // Lista de Feriados Nacionais (DD/MM/AAAA)
        // Cobre o fim de 2025 e os anos completos de 2026 e 2027
        const feriados = [
            // Fim de 2025
            '01/01/2025', '21/04/2025', '01/05/2025', '07/09/2025', '12/10/2025', 
            '02/11/2025', '15/11/2025', '20/11/2025', '25/12/2025',

            // --- 2026 ---
            '01/01/2026', // Confraternização Universal
            '16/02/2026', // Carnaval (Segunda)
            '17/02/2026', // Carnaval (Terça)
            '03/04/2026', // Paixão de Cristo (Sexta)
            '21/04/2026', // Tiradentes
            '01/05/2026', // Dia do Trabalho
            '04/06/2026', // Corpus Christi
            '07/09/2026', // Independência
            '12/10/2026', // N. Sra. Aparecida
            '02/11/2026', // Finados
            '15/11/2026', // Proclamação da República
            '20/11/2026', // Consciência Negra
            '25/12/2026', // Natal

            // --- 2027 ---
            '01/01/2027', // Confraternização Universal
            '08/02/2027', // Carnaval (Segunda)
            '09/02/2027', // Carnaval (Terça)
            '26/03/2027', // Paixão de Cristo (Sexta)
            '21/04/2027', // Tiradentes
            '01/05/2027', // Dia do Trabalho
            '27/05/2027', // Corpus Christi
            '07/09/2027', // Independência
            '12/10/2027', // N. Sra. Aparecida
            '02/11/2027', // Finados
            '15/11/2027', // Proclamação da República
            '20/11/2027', // Consciência Negra
            '25/12/2027'  // Natal
        ];

        while (diasAdicionados < 3) {
            data.setDate(data.getDate() + 1);
            
            let diaSemana = data.getDay(); // 0 = Domingo, 6 = Sábado
            
            // Monta a string da data atual do loop para verificar na lista
            let dia = String(data.getDate()).padStart(2, '0');
            let mes = String(data.getMonth() + 1).padStart(2, '0');
            let ano = data.getFullYear();
            let dataFormatada = `${dia}/${mes}/${ano}`;

            // Só conta se NÃO for Sábado, NÃO for Domingo e NÃO for Feriado
            if (diaSemana !== 0 && diaSemana !== 6 && !feriados.includes(dataFormatada)) {
                diasAdicionados++;
            }
        }
        return data.toLocaleDateString('pt-BR');
    }

    function injetarFerramenta() {
        if (document.getElementById('abrir-painel')) return;

        // --- ESTILOS CSS REFINADOS COM VARIÁVEIS ---
        const styleId = 'estilo-painel-final-v7-8';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.innerHTML = `
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Roboto:wght@400;500&display=swap');

                :root {
                    /* Tema Claro (Padrão) */
                    --fin-bg: #ffffff;
                    --fin-text: #1a202c;
                    --fin-label: #718096;
                    --fin-border: #e2e8f0;
                    --fin-input-bg: #f7fafc;
                    --fin-input-border: #cbd5e0;
                    --fin-input-focus: #6b46c1;
                    --fin-primary: #6b46c1;
                    --fin-header-text: white;
                    --fin-badge-bg: #f3ebff;
                    --fin-badge-text: #553c9a;
                    --fin-box-border: #b794f4;
                    --fin-btn-limpar-bg: #edf2f7;
                    --fin-btn-limpar-text: #4a5568;
                    --fin-shadow: rgba(0,0,0,0.15);
                }

                #painel-financeiro.dark-mode {
                    /* Tema Escuro - Ajustado para Legibilidade */
                    --fin-bg: #1a202c;
                    --fin-text: #ffffff;
                    --fin-label: #a0aec0;
                    --fin-border: #2d3748;
                    --fin-input-bg: #2d3748;
                    --fin-input-border: #4a5568;
                    --fin-input-focus: #9f7aea;
                    --fin-primary: #553c9a;
                    --fin-header-text: #e2e8f0;
                    --fin-badge-bg: #44337a;
                    --fin-badge-text: #d6bcfa;
                    --fin-box-border: #553c9a;
                    --fin-btn-limpar-bg: #2d3748;
                    --fin-btn-limpar-text: #cbd5e0;
                    --fin-shadow: rgba(0,0,0,0.5);
                }

                #painel-financeiro * { box-sizing: border-box; font-family: 'Inter', 'Roboto', sans-serif; line-height: 1.3; }

                #painel-financeiro {
                    position: fixed; top: 10px; right: 10px;

                    /* CORREÇÃO: Removemos scale() e ajustamos width para evitar blur */
                    width: 250px;

                    background: var(--fin-bg);
                    backdrop-filter: none;
                    border-radius: 12px;
                    z-index: 1000000;
                    box-shadow: 0 5px 20px var(--fin-shadow);
                    border: 1px solid var(--fin-border);
                    display: none; flex-direction: column; overflow: hidden;
                    animation: fadeIn 0.2s ease-out;

                    /* Melhora a renderização de texto */
                    -webkit-font-smoothing: subpixel-antialiased;
                    backface-visibility: hidden;

                    color: var(--fin-text);
                    transition: background 0.2s, border 0.2s;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                #cabecalho-fin {
                    background: var(--fin-primary); color: var(--fin-header-text); padding: 10px 15px;
                    cursor: move; font-weight: 700; display: flex; justify-content: space-between; align-items: center; font-size: 13px;
                    border-bottom: 1px solid rgba(0,0,0,0.1);
                    user-select: none;
                }

                .corpo-fin { padding: 12px; background: var(--fin-bg); transition: background 0.2s; }

                .campo-fin { margin-bottom: 8px; }
                .campo-fin label {
                    font-size: 10px; color: var(--fin-label); font-weight: 700;
                    text-transform: uppercase; display: block; margin-bottom: 3px;
                }

                .campo-fin input {
                    width: 100%; padding: 7px 8px;
                    border: 1px solid var(--fin-input-border); border-radius: 5px;
                    font-size: 13px;
                    color: var(--fin-text);
                    background-color: var(--fin-input-bg);
                    outline: none; transition: 0.2s;
                    font-weight: 600;
                }
                .campo-fin input:focus {
                    border-color: var(--fin-input-focus);
                    background: var(--fin-bg);
                    box-shadow: 0 0 0 1px var(--fin-input-focus);
                }
                .campo-fin input::placeholder {
                    opacity: 0.5;
                    color: var(--fin-text);
                }

                .linha-dupla { display: grid; grid-template-columns: 1.5fr 1fr; gap: 8px; }

                /* CSS ATUALIZADO: Caixa removida para visual mais clean */
                .box-op3 {
                    margin-bottom: 8px;
                }

                .badge-op {
                    background: var(--fin-badge-bg); color: var(--fin-badge-text); padding: 2px 6px;
                    border-radius: 4px; font-size: 9px; margin-bottom: 4px;
                    display: inline-block; font-weight: 800; letter-spacing: 0.5px;
                }

                .botoes-container {
                    display: flex; width: 100%;
                    border-top: 1px solid var(--fin-border);
                    align-items: center;
                }

                #btn-limpar-fin, #btn-copiar-fin {
                    border: none; cursor: pointer; font-weight: bold; transition: 0.2s;
                    height: 42px; display: flex; align-items: center; justify-content: center; padding: 0;
                }

                #btn-limpar-fin {
                    width: 30%;
                    background: var(--fin-btn-limpar-bg); color: var(--fin-btn-limpar-text);
                    font-size: 11px;
                    border-right: 1px solid var(--fin-border);
                }
                #btn-limpar-fin:hover { filter: brightness(0.95); }

                #btn-copiar-fin {
                    width: 70%;
                    background: #6b46c1; color: white;
                    font-size: 12px;
                }
                #btn-copiar-fin:hover { background: #553c9a; }

                #abrir-painel {
                    position: fixed; bottom: 25px; right: 25px; z-index: 1000001;
                    background: #6b46c1; color: white; border-radius: 50%; width: 50px; height: 50px;
                    display: flex; align-items: center; justify-content: center; cursor: pointer;
                    box-shadow: 0 4px 15px rgba(107, 70, 193, 0.4); font-size: 24px;
                    transition: transform 0.2s, background 0.2s; user-select: none;
                }
                #abrir-painel:hover { transform: scale(1.1); background: #553c9a; }
                #abrir-painel:active { transform: scale(0.95); }
            `;
            document.head.appendChild(style);
        }

        const container = document.createElement('div');
        container.id = 'painel-financeiro';
        if (isDarkMode) container.classList.add('dark-mode');

        container.innerHTML = `
            <div id="cabecalho-fin">
                <div style="display:flex; align-items:center; gap:8px;">
                    🟣 NEGOCIAÇÃO
                    <span id="btn-theme-fin" style="cursor:pointer; font-size:16px; margin-left:5px;" title="Alternar Tema">${isDarkMode ? '☀️' : '☀️'}</span>
                </div>
                <span id="fechar-fin" style="cursor:pointer">✕</span>
            </div>
            <div class="corpo-fin">
                <div class="campo-fin"><label>Valor Total Pendente (R$)</label><input type="text" id="fin-total" placeholder="0,00" style="font-weight:bold;"></div>

                <div class="badge-op">OPÇÃO 1 (PIX)</div>
                <div class="campo-fin"><input type="text" id="fin-pix"></div>

                <div class="badge-op">OPÇÃO 2 (CARTÃO)</div>
                <div class="linha-dupla">
                    <div class="campo-fin"><label>Total ou Parc (R$)</label><input type="text" id="fin-cartao-val"></div>
                    <div class="campo-fin"><label>Qtd Parc ➗</label><input type="number" id="fin-cartao-qtd" min="0"></div>
                </div>

                <div class="badge-op">OPÇÃO 3 (BOLETO)</div>
                <div class="box-op3">
                    <div class="campo-fin"><label>Entrada ou À Vista (R$)</label><input type="text" id="fin-bol-ent"></div>
                    <div class="linha-dupla">
                        <div class="campo-fin"><label>Valor Parc (R$) </label><input type="text" id="fin-bol-parc"></div>
                        <div class="campo-fin"><label>Qtd Parc ➗</label><input type="number" id="fin-bol-qtd" min="0"></div>
                    </div>
                </div>

                <div class="campo-fin"><label>📅 Vencimento (3 dias úteis)</label><input type="text" id="fin-data" style="font-weight:bold;"></div>
            </div>

            <div class="botoes-container">
                <button id="btn-limpar-fin">LIMPAR</button>
                <button id="btn-copiar-fin">GERAR PROPOSTA</button>
            </div>
        `;
        document.body.appendChild(container);

        // --- DATA INICIAL ---
        document.getElementById('fin-data').value = getVencimento3DiasUteis();

        const btnAbrir = document.createElement('div');
        btnAbrir.id = 'abrir-painel';
        btnAbrir.innerHTML = '💰';
        document.body.appendChild(btnAbrir);

        // --- LÓGICA DE TEMA ---
        const btnTheme = document.getElementById('btn-theme-fin');
        btnTheme.onclick = (e) => {
            e.stopPropagation();
            isDarkMode = !isDarkMode;
            localStorage.setItem(STORAGE_KEY_THEME, isDarkMode);

            if (isDarkMode) {
                container.classList.add('dark-mode');
                btnTheme.innerText = '🌙';
            } else {
                container.classList.remove('dark-mode');
                btnTheme.innerText = '☀️';
            }
        };

        // --- LÓGICA DO BOTÃO FLUTUANTE (DRAG) ---
        let dragTimer;
        let isDraggingBtn = false;
        let startX, startY, startRight, startBottom;

        const onMouseMoveBtn = (e) => {
            if (!isDraggingBtn) return;
            e.preventDefault();
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            btnAbrir.style.right = (startRight - dx) + 'px';
            btnAbrir.style.bottom = (startBottom - dy) + 'px';
            btnAbrir.style.left = 'auto';
            btnAbrir.style.top = 'auto';
        };

        const onMouseUpBtn = (e) => {
            clearTimeout(dragTimer);
            document.removeEventListener('mousemove', onMouseMoveBtn);
            document.removeEventListener('mouseup', onMouseUpBtn);

            if (isDraggingBtn) {
                isDraggingBtn = false;
                btnAbrir.style.cursor = "pointer";
                btnAbrir.style.transform = "scale(1)";
            } else {
                const isHidden = container.style.display === 'none' || container.style.display === '';
                container.style.display = isHidden ? 'flex' : 'none';
                if (isHidden) setTimeout(() => document.getElementById('fin-total').focus(), 50);
            }
        };

        btnAbrir.addEventListener('mousedown', (e) => {
            e.preventDefault(); isDraggingBtn = false;
            startX = e.clientX;
            startY = e.clientY;
            const style = window.getComputedStyle(btnAbrir);
            startRight = parseInt(style.right, 10);
            startBottom = parseInt(style.bottom, 10);

            document.addEventListener('mousemove', onMouseMoveBtn);
            document.addEventListener('mouseup', onMouseUpBtn);
            dragTimer = setTimeout(() => {
                isDraggingBtn = true; btnAbrir.style.cursor = "move"; btnAbrir.style.transform = "scale(1.2)";
            }, 200);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && container.style.display === 'flex') container.style.display = 'none';
        });

        // --- LÓGICA DE INPUTS E GERAÇÃO ---
        const inputs = container.querySelectorAll('input');
        inputs.forEach((input) => {
            input.setAttribute('autocomplete', 'off');
            input.setAttribute('spellcheck', 'false');
            input.addEventListener('focus', function() { this.select(); });

            if (input.type !== 'number' && input.id !== 'fin-data') {
                input.addEventListener('input', (e) => {
                    // Remove qualquer caractere que NÃO seja número, vírgula ou ponto
                    e.target.value = e.target.value.replace(/[^\d,.]/g, "");
                });
            }
            input.addEventListener('keydown', (e) => {
                if(e.key === 'Enter') document.getElementById('btn-copiar-fin').click();
            });
        });

        // Limpeza inteligente
        document.getElementById('fin-cartao-val').addEventListener('input', (e) => {
            if(e.target.value === '') document.getElementById('fin-cartao-qtd').value = '';
        });
        document.getElementById('fin-bol-ent').addEventListener('input', (e) => {
            if(e.target.value === '') {
                document.getElementById('fin-bol-parc').value = '';
                document.getElementById('fin-bol-qtd').value = '';
            }
        });
        document.getElementById('fin-bol-parc').addEventListener('input', (e) => {
            if(e.target.value === '') document.getElementById('fin-bol-qtd').value = '';
        });

        document.getElementById('btn-limpar-fin').onclick = () => {
            inputs.forEach(input => { if (input.id !== 'fin-data') input.value = ''; });
            document.getElementById('fin-total').focus();
        };

        document.getElementById('fechar-fin').onclick = () => { container.style.display = 'none'; };

        document.getElementById('btn-copiar-fin').onclick = async () => {
            const d = (id) => document.getElementById(id).value.trim();
            const has = (id) => d(id) !== "";

            if (!has('fin-total')) {
                const inputTotal = document.getElementById('fin-total');
                inputTotal.focus();
                inputTotal.style.borderColor = "red";
                setTimeout(() => inputTotal.style.borderColor = isDarkMode ? "#4a5568" : "#cbd5e0", 1000);
                return;
            }

            let msg = `Consta uma pendência financeira em sua matrícula no valor total de *R$ ${d('fin-total')}*. Temos uma oportunidade de negociação para regularizar hoje, conforme as condições abaixo:\n\n`;

            if (has('fin-pix')) msg += `✅ *Opção 1 - PIX:* Por R$ ${d('fin-pix')} (com desconto extra). Vencimento em 24h.\n\n`;

            if (has('fin-cartao-val')) {
                let qtdC = d('fin-cartao-qtd');
                if (qtdC === "" || qtdC === "0") qtdC = "1";
                msg += `💳 *Opção 2 - Cartão de Crédito:* ${qtdC}x de R$ ${d('fin-cartao-val')}.\n\n`;
            }

            if (has('fin-bol-ent')) {
                let entB = d('fin-bol-ent');
                let parcB = d('fin-bol-parc');
                let qtdB = d('fin-bol-qtd');

                if (!has('fin-bol-parc') && (!has('fin-bol-qtd') || qtdB === "0")) {
                    msg += `📄 *Opção 3 - Boleto à Vista:* Por R$ ${entB}.\n\n`;
                } else {
                    if (qtdB === "0") qtdB = "1";
                    let labelB = qtdB === "1" ? "parcela" : "parcelas";
                    msg += `📄 *Opção 3 - Boleto Parcelado:* Entrada de R$ ${entB} + ${qtdB} ${labelB} de R$ ${parcB}.\n\n`;
                }
            }

            msg += `Vencimento das propostas: *${d('fin-data')}*`;

            await navigator.clipboard.writeText(msg);
            const btn = document.getElementById('btn-copiar-fin');
            const originalText = btn.innerText;
            btn.innerText = "COPIADO! ✅"; btn.style.background = "#48bb78";
            setTimeout(() => { btn.innerText = originalText; btn.style.background = "#6b46c1"; container.style.display = 'none'; }, 1200);
        };

        // --- ARRASTE DO PAINEL ---
        const header = document.getElementById('cabecalho-fin');
        let isDragging = false, hStartX, hStartY, hInitialLeft, hInitialTop;

        const onMouseMovePanel = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            container.style.left = `${hInitialLeft + (e.clientX - hStartX)}px`;
            container.style.top = `${hInitialTop + (e.clientY - hStartY)}px`;
        };
        const onMouseUpPanel = () => {
            isDragging = false; header.style.cursor = 'move';
            document.removeEventListener('mousemove', onMouseMovePanel);
            document.removeEventListener('mouseup', onMouseUpPanel);
        };
        header.onmousedown = (e) => {
            if (e.target.id === 'btn-theme-fin' || e.target.id === 'fechar-fin') return;
            isDragging = true; hStartX = e.clientX; hStartY = e.clientY;
            hInitialLeft = container.offsetLeft; hInitialTop = container.offsetTop;
            header.style.cursor = 'grabbing';
            document.addEventListener('mousemove', onMouseMovePanel);
            document.addEventListener('mouseup', onMouseUpPanel);
        };
    }

    setInterval(() => { if (!document.getElementById('abrir-painel')) injetarFerramenta(); }, 2000);
    injetarFerramenta();
})();
