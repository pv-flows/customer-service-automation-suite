// ==UserScript==
// @name         Bloco de Notas Corporativo + Macros (v4.2)
// @namespace    https://gist.github.com/pv-flows
// @version      4.2
// @description  Bloco de notas v4.2 com adição de Modo Escuro e Reset de Posição/Tamanho.
// @author       Paulo Victor Freire da Silva
// @github       github.com/pv-flows
// @email        pv.flows@gmail.com
// @match        *https://conversas.hyperflow.global/*
// @downloadURL  https://gist.githubusercontent.com/pv-flows/bc11b6e8107d4391e796ad2f8cd7b09a/raw/bloconotasflowkey.user.js
// @updateURL    https://gist.githubusercontent.com/pv-flows/bc11b6e8107d4391e796ad2f8cd7b09a/raw/bloconotasflowkey.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- CONFIGURAÇÃO ---
    const STORAGE_KEY_DATA = 'hyper_bloco_data_v2';
    const STORAGE_KEY_POS = 'hyper_bloco_pos';
    const STORAGE_KEY_MACROS = 'hyper_bloco_macros_v2';
    const STORAGE_KEY_THEME = 'hyper_bloco_theme'; // Nova chave para o tema
    const MAX_TABS = 5;

    // --- MACROS PADRÃO ---
    const defaultMacros = [
        { key: ";q1", val: "Qual opção de pagamento é mais viável para você?" },
        { key: ";q2", val: "Você tem interesse em alguma das condições ofertadas para pagamento?" },
        { key: ";r1", val: "Tudo certo com a efetivação do pagamento? Fico no aguardo do comprovante para dar baixa no sistema. ✅" },
        { key: ";r2", val: "Paulo por aqui. Notei que a baixa do pagamento ainda não caiu. Houve algum imprevisto? Preciso do seu retorno para evitar que o acordo seja cancelado e os juros voltem." },
        { key: ";pix", val: "Acordo formalizado com sucesso! ✅\nSegue abaixo o link para pagamento via PIX:\n\n" },
        { key: ";car", val: "Acordo formalizado com sucesso! ✅\nSegue abaixo o link para pagamento via cartão de crédito:\n\n" },
        { key: ";bol", val: "Acordo formalizado com sucesso! ✅\nSegue abaixo o boleto para pagamento:" },
        { key: ";lib", val: "Para liberarmos seu acesso ao Portal do Aluno, envie o comprovante assim que efetuar o pagamento. Isso agiliza a baixa no sistema." },
        { key: ";xau", val: "MACRO DINAMICA DE DESPEDIDA" }
    ];

    // --- ESTADO GLOBAL ---
    let appData = {
        activeTabId: 1,
        tabs: [
            { id: 1, title: 'Guia 1', content: '', history: [] }
        ]
    };

    let macrosList = [];
    let isDarkMode = localStorage.getItem(STORAGE_KEY_THEME) === 'true';

    // --- LÓGICA DE MACROS GLOBAL ---
    function applyMacroToInput(element, newValue) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        const nativeTextAreaSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
        const prototypeSetter = (element.tagName === 'INPUT') ? nativeInputValueSetter : nativeTextAreaSetter;

        if (prototypeSetter) {
            prototypeSetter.call(element, newValue);
        } else {
            element.value = newValue;
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function checkAndExpandMacros(element) {
        if (!element || (element.tagName !== 'TEXTAREA' && element.tagName !== 'INPUT')) return;
        if (element.type === 'password' || element.type === 'email') return;

        const cursorStart = element.selectionStart;
        const text = element.value;
        const textBeforeCursor = text.substring(0, cursorStart);

        let matchedMacro = null;
        for (let i = 0; i < macrosList.length; i++) {
            if (textBeforeCursor.endsWith(macrosList[i].key)) {
                matchedMacro = macrosList[i];
                break;
            }
        }

        if (matchedMacro) {
            let expandedText = matchedMacro.val;

            // --- LÓGICA DINÂMICA PARA ;xau ---
            if (matchedMacro.key === ';xau') {
                const h = new Date().getHours();
                let periodo = 'dia';
                let artigo = 'um';
                let adjetivo = 'ótimo';

                if (h >= 12 && h < 18) {
                    periodo = 'tarde';
                    artigo = 'uma';
                    adjetivo = 'ótima';
                } else if (h >= 18) {
                    periodo = 'noite';
                    artigo = 'uma';
                    adjetivo = 'ótima';
                }
                expandedText = `Qualquer dúvida estou por aqui. Obrigado e tenha ${artigo} ${adjetivo} ${periodo}! 😊`;
            }

            const textAfterCursor = text.substring(cursorStart);
            const textBeforeMacro = textBeforeCursor.slice(0, -matchedMacro.key.length);
            const newText = textBeforeMacro + expandedText + textAfterCursor;

            applyMacroToInput(element, newText);

            const newCursorPos = textBeforeMacro.length + expandedText.length;
            element.setSelectionRange(newCursorPos, newCursorPos);

            if (element.id === 'area-texto') {
                const currentTab = appData.tabs.find(t => t.id === appData.activeTabId);
                if (currentTab) {
                    currentTab.content = newText;
                    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(appData));
                }
            }
        }
    }

    document.addEventListener('input', (e) => {
        checkAndExpandMacros(e.target);
    });

    // --- GERENCIAMENTO DE DADOS ---
    function reordenarAbas() {
        appData.tabs.forEach((tab, index) => {
            if (/^(Guia( \d+| TEMP)?|Nova \d+|Geral)$/.test(tab.title)) {
                tab.title = `Guia ${index + 1}`;
            }
        });
        localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(appData));
    }

    function carregarDados() {
        // Notas
        const dadosNovos = localStorage.getItem(STORAGE_KEY_DATA);
        if (dadosNovos) {
            appData = JSON.parse(dadosNovos);
        } else {
            const textoAntigo = localStorage.getItem('hyper_bloco_texto');
            const histAntigo = JSON.parse(localStorage.getItem('hyper_bloco_hist') || '[]');
            if (textoAntigo || histAntigo.length > 0) {
                const novoHist = histAntigo.map(txt => ({
                    title: txt.substring(0, 25) + '...',
                    content: txt
                }));
                appData.tabs[0].content = textoAntigo || '';
                appData.tabs[0].history = novoHist;
            }
        }
        reordenarAbas();

        // Macros
        const macrosV2 = localStorage.getItem(STORAGE_KEY_MACROS);
        if (macrosV2) {
            macrosList = JSON.parse(macrosV2);

            // --- CORREÇÃO: VERIFICAÇÃO DE NOVAS MACROS ---
            let houveMudanca = false;

            // Fix ;bol
            if (!macrosList.find(m => m.key === ';bol')) {
                const indexCar = macrosList.findIndex(m => m.key === ';car');
                const macroBol = { key: ";bol", val: "Acordo formalizado com sucesso! ✅\nSegue abaixo o boleto para pagamento:\n" };
                if (indexCar !== -1) {
                    macrosList.splice(indexCar + 1, 0, macroBol);
                } else {
                    macrosList.push(macroBol);
                }
                houveMudanca = true;
            }

            // Fix ;cra (Adicionado)
            if (!macrosList.find(m => m.key === ';cra')) {
                macrosList.push({ key: ";cra", val: "CRA 📞 Fone: (81) 3413-4611 💬 Chat: https://altchat.sereduc.com/CRA/ChatAltitude.html" });
                houveMudanca = true;
            }

            // Fix ;ven (Adicionado)
            if (!macrosList.find(m => m.key === ';ven')) {
                macrosList.push({ key: ";ven", val: "Não consigo alterar o vencimento, pois é sistêmico. Porém, fechando o acordo agora, você trava o valor e impede novos juros. É a melhor estratégia para você economizar. Podemos seguir?" });
                houveMudanca = true;
            }

            // Fix ;xau
            if (!macrosList.find(m => m.key === ';xau')) {
                macrosList.push({ key: ";xau", val: "MACRO DINAMICA DE DESPEDIDA" });
                houveMudanca = true;
                // Remove macros antigas obsoletas se existirem
                macrosList = macrosList.filter(m => m.key !== ';dia' && m.key !== ';tar' && m.key !== ';noi');
            }

            if (houveMudanca) {
                salvarMacros();
            }

        } else {
            const macrosV1 = localStorage.getItem('hyper_bloco_macros_v1');
            if (macrosV1) {
                const objV1 = JSON.parse(macrosV1);
                macrosList = Object.keys(objV1).map(k => ({ key: k, val: objV1[k] }));
                localStorage.setItem(STORAGE_KEY_MACROS, JSON.stringify(macrosList));
            } else {
                macrosList = defaultMacros;
                localStorage.setItem(STORAGE_KEY_MACROS, JSON.stringify(macrosList));
            }
        }
    }

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    const salvarDados = debounce(() => {
        localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(appData));
    }, 500);

    const salvarMacros = () => {
        localStorage.setItem(STORAGE_KEY_MACROS, JSON.stringify(macrosList));
    };

    function injetarBloco() {
        if (document.getElementById('abrir-bloco')) return;

        // --- ESTILOS CSS COM VARIÁVEIS (MODERNIZAÇÃO) ---
        const styleId = 'estilo-bloco-notas-tabs-v11';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.innerHTML = `
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
                 
                :root {
                    /* Tema Claro (Padrão) */
                    --bn-bg: rgba(255, 255, 255, 0.75);
                    --bn-bg-solid: #ffffff;
                    --bn-bg-hover: #f7fafc;
                    --bn-text-main: #2d3748;
                    --bn-text-sec: #718096;
                    --bn-border: #e2e8f0;
                    --bn-shadow: rgba(0, 0, 0, 0.15);
                    --bn-input-bg: rgba(255,255,255,0.4);
                    --bn-hist-bg: rgba(247, 250, 252, 0.8);
                    --bn-accent: #dd6b20;
                    --bn-accent-hover: #c05621;
                    --bn-tab-bg: rgba(255,255,255,0.5);
                    --bn-tab-hover: rgba(255,255,255,0.8);
                    --bn-header-grad: linear-gradient(90deg, #dd6b20, #e05d23);
                }

                #bloco-notas.dark-mode {
                    /* Tema Escuro */
                    --bn-bg: rgba(30, 41, 59, 0.95);
                    --bn-bg-solid: #1e293b;
                    --bn-bg-hover: #334155;
                    --bn-text-main: #f1f5f9;
                    --bn-text-sec: #cbd5e1;
                    --bn-border: rgba(255,255,255,0.1);
                    --bn-shadow: rgba(0, 0, 0, 0.5);
                    --bn-input-bg: rgba(0,0,0,0.2);
                    --bn-hist-bg: rgba(15, 23, 42, 0.8);
                    --bn-accent: #f6ad55;
                    --bn-accent-hover: #ed8936;
                    --bn-tab-bg: rgba(0,0,0,0.3);
                    --bn-tab-hover: rgba(255,255,255,0.1);
                    /* Header mantém gradiente ou fica mais escuro, sua escolha. Mantive identidade laranja */
                }

                #bloco-notas * { box-sizing: border-box; font-family: 'Inter', sans-serif; }

                #bloco-notas {
                    position: fixed; top: 50px; left: 50px; width: 320px; height: 450px;
                    background: var(--bn-bg);
                    backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
                    border-radius: 12px; z-index: 999999;
                    box-shadow: 0 10px 25px var(--bn-shadow);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    display: none; flex-direction: column; overflow: hidden;
                    resize: both; min-width: 280px; min-height: 300px;
                    transition: opacity 0.2s, background 0.2s;
                    will-change: left, top;
                    color: var(--bn-text-main);
                }
                #bloco-notas.em-movimento {
                    backdrop-filter: none !important; -webkit-backdrop-filter: none !important;
                    background: var(--bn-bg-solid) !important; box-shadow: 0 4px 10px rgba(0,0,0,0.1) !important;
                    transition: none !important; cursor: grabbing !important;
                }

                #cabecalho-bloco {
                    background: var(--bn-header-grad);
                    color: white; padding: 8px 12px; cursor: move;
                    font-weight: 600; font-size: 13px; display: flex; justify-content: space-between; align-items: center;
                    user-select: none;
                }

                #tabs-container {
                    display: flex; background: rgba(0,0,0,0.05);
                    padding: 4px 4px 0 4px; overflow-x: auto;
                    border-bottom: 1px solid var(--bn-border);
                    align-items: flex-end;
                }
                #tabs-container::-webkit-scrollbar { height: 2px; }

                .tab-item {
                    padding: 6px 8px 6px 12px; font-size: 11px; font-weight: 600; color: var(--bn-text-sec);
                    background: var(--bn-tab-bg); margin-right: 2px;
                    border-radius: 6px 6px 0 0; cursor: pointer; user-select: none;
                    border: 1px solid transparent; border-bottom: none;
                    max-width: 110px; display: flex; align-items: center; gap: 6px;
                }
                .tab-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 80px; }
                .tab-item:hover { background: var(--bn-tab-hover); color: var(--bn-text-main); }
                .tab-item.active {
                    background: var(--bn-bg-solid); color: var(--bn-accent); border-color: var(--bn-border);
                    border-bottom: 2px solid var(--bn-bg-solid); margin-bottom: -1px; z-index: 2;
                }

                .tab-close {
                    font-size: 14px; line-height: 10px; color: var(--bn-text-sec); padding: 2px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center; height: 16px; width: 16px;
                }
                .tab-close:hover { background: #fed7d7; color: #e53e3e; }

                .tab-add {
                    padding: 4px 10px; font-weight: bold; cursor: pointer; color: var(--bn-text-sec); font-size: 16px;
                    display: flex; align-items: center; justify-content: center;
                }
                .tab-add:hover { color: var(--bn-accent); background: rgba(0,0,0,0.05); border-radius: 4px; }

                #corpo-bloco { display: flex; flex-direction: column; height: 100%; padding: 0; background: transparent; position: relative; }

                #toolbar-bloco {
                    padding: 6px 12px; display: flex; justify-content: space-between;
                    border-bottom: 1px solid var(--bn-border); background: var(--bn-bg-solid);
                }

                .btn-mini {
                    background: var(--bn-bg-solid); border: 1px solid var(--bn-border); padding: 3px 10px;
                    font-size: 10px; cursor: pointer; border-radius: 12px;
                    color: var(--bn-text-sec); font-weight: 600; transition: all 0.2s;
                }
                .btn-mini:hover { border-color: var(--bn-accent); color: var(--bn-accent); }

                #btn-macros { border-color: var(--bn-border); color: #3182ce; }
                #btn-macros:hover { background: rgba(49, 130, 206, 0.1); border-color: #3182ce; }

                #area-texto {
                    width: 100%; height: 45%; border: none; padding: 12px; resize: none; outline: none;
                    background: var(--bn-input-bg); font-size: 13px; color: var(--bn-text-main); line-height: 1.5;
                }
                #area-texto::placeholder { color: var(--bn-text-sec); font-style: italic; opacity: 0.7; }

                #historico-container {
                    flex: 1; overflow-y: auto; background: var(--bn-hist-bg);
                    border-top: 1px solid var(--bn-border);
                }
                #historico-container::-webkit-scrollbar { width: 5px; }
                #historico-container::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 10px; }

                #titulo-hist {
                    font-size: 9px; font-weight: 700; color: var(--bn-text-sec); text-transform: uppercase;
                    padding: 6px 12px; display: flex; justify-content: space-between; background: rgba(0,0,0,0.02);
                }

                .hist-item {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 8px 12px; border-bottom: 1px solid var(--bn-border);
                    font-size: 12px; color: var(--bn-text-main); cursor: pointer; transition: background 0.1s;
                }
                .hist-item:hover { background: var(--bn-bg-solid); }

                .hist-title-container { flex: 1; margin-right: 8px; overflow: hidden; }
                .hist-title { font-weight: 600; font-size: 11px; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #2b6cb0; }
                .hist-preview { font-size: 10px; color: var(--bn-text-sec); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .hist-actions { display: flex; gap: 6px; opacity: 0.6; }
                .hist-item:hover .hist-actions { opacity: 1; }
                .btn-icon { cursor: pointer; font-size: 13px; padding: 2px; border-radius: 4px; }
                .btn-icon:hover { background: rgba(0,0,0,0.1); transform: scale(1.1); }

                /* --- TELA DE MACROS --- */
                #screen-macros {
                    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                    background: var(--bn-bg-hover); z-index: 50; display: none; flex-direction: column;
                }
                #header-macros {
                    padding: 10px; border-bottom: 1px solid var(--bn-border); display: flex; justify-content: space-between; align-items: center; background: var(--bn-bg-solid);
                }
                .macros-title { font-weight: 700; color: var(--bn-text-main); font-size: 12px; }
                #list-macros { flex: 1; overflow-y: auto; padding: 10px; }
                .macro-item {
                    background: var(--bn-bg-solid); border: 1px solid var(--bn-border); border-radius: 6px; padding: 8px; margin-bottom: 8px;
                    display: flex; justify-content: space-between; align-items: center; transition: transform 0.1s;
                }
                .macro-info { display: flex; flex-direction: column; width: 75%; }
                .macro-key { font-weight: bold; color: #3182ce; font-size: 11px; margin-bottom: 2px; }
                .macro-val { font-size: 10px; color: var(--bn-text-sec); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

                .macro-actions-group { display: flex; align-items: center; gap: 4px; }
                .macro-btn { cursor: pointer; padding: 4px; font-size: 12px; color: var(--bn-text-sec); border-radius: 4px; display: flex; align-items: center; justify-content: center; }
                .macro-btn:hover { background: var(--bn-bg-hover); color: var(--bn-text-main); }
                .macro-btn.del:hover { background: #fed7d7; color: #e53e3e; }

                #add-macro-form {
                    padding: 10px; background: var(--bn-bg-solid); border-top: 1px solid var(--bn-border); display: flex; gap: 5px; flex-direction: column;
                }
                .input-macro {
                    border: 1px solid var(--bn-border); border-radius: 4px; padding: 5px; font-size: 11px; width: 100%;
                    font-family: 'Inter', sans-serif; background: var(--bn-input-bg); color: var(--bn-text-main);
                }
                #new-macro-val {
                    height: 50px; resize: vertical;
                }
                .btn-add-macro {
                    background: #3182ce; color: white; border: none; padding: 6px; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 11px;
                }
                .btn-add-macro:hover { background: #2b6cb0; }
                .btn-close-macros { cursor: pointer; font-size: 14px; color: var(--bn-text-sec); font-weight: bold; }

                /* --- MODAL --- */
                #modal-confirm {
                    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
                    z-index: 100; display: none;
                    flex-direction: column; align-items: center; justify-content: center;
                    animation: fadeIn 0.2s;
                }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

                .modal-content { text-align: center; padding: 20px; width: 85%; background: var(--bn-bg-solid); border-radius: 12px; }
                .modal-title { font-size: 14px; font-weight: 700; color: var(--bn-text-main); margin-bottom: 6px; }
                .modal-desc { font-size: 12px; color: var(--bn-text-sec); margin-bottom: 15px; line-height: 1.4; }
                .modal-input {
                    width: 100%; padding: 8px; margin-bottom: 15px;
                    border: 1px solid var(--bn-border); border-radius: 6px; background: var(--bn-input-bg); color: var(--bn-text-main);
                    font-family: 'Inter', sans-serif; font-size: 13px; outline: none;
                }
                .modal-input:focus { border-color: var(--bn-accent); box-shadow: 0 0 0 2px rgba(221, 107, 32, 0.2); }
                .modal-btns { display: flex; gap: 10px; justify-content: center; }
                .modal-btn {
                    padding: 6px 14px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; border: none; transition: 0.2s;
                }
                .btn-cancel { background: var(--bn-bg-hover); color: var(--bn-text-sec); border: 1px solid var(--bn-border); }
                .btn-cancel:hover { background: var(--bn-border); }
                .btn-danger { background: #e53e3e; color: white; box-shadow: 0 2px 5px rgba(229, 62, 62, 0.3); }
                .btn-danger:hover { background: #c53030; }
                .btn-action { background: var(--bn-accent); color: white; box-shadow: 0 2px 5px rgba(221, 107, 32, 0.3); }
                .btn-action:hover { background: #c05621; }

                #abrir-bloco {
                    position: fixed; bottom: 20px; left: 20px; z-index: 50;
                    background: var(--bn-accent); color: white; border-radius: 50%; width: 50px; height: 50px;
                    display: flex; align-items: center; justify-content: center; cursor: pointer;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); font-size: 22px;
                    transition: transform 0.2s, background 0.2s; user-select: none;
                }
                #abrir-bloco:hover { transform: scale(1.1); background: #c05621; }
            `;
            document.head.appendChild(style);
        }

        // --- HTML ---
        const container = document.createElement('div');
        container.id = 'bloco-notas';
        if (isDarkMode) container.classList.add('dark-mode'); // Aplica tema salvo

        // --- UPDATE: DEFINIÇÃO DE POSIÇÃO E TAMANHO PADRÃO ---
        // Tamanho mínimo definido no CSS: width 280, height 300
        // Cálculo de +25%:
        const minW = 280;
        const minH = 300;
        const defaultW = minW * 1.25; // 350px
        const defaultH = minH * 1.25; // 375px

        // Aplica sempre ao iniciar (ignora localStorage para posição)
        container.style.top = '10px';
        container.style.left = '10px';
        container.style.width = defaultW + 'px';
        container.style.height = defaultH + 'px';

        /*
        // Código antigo removido para garantir o reset da posição ao atualizar
        const savedPos = JSON.parse(localStorage.getItem(STORAGE_KEY_POS));
        if (savedPos) {
            container.style.top = savedPos.top; container.style.left = savedPos.left;
            container.style.width = savedPos.width || '320px'; container.style.height = savedPos.height || '450px';
        }
        */

        container.innerHTML = `
            <div id="cabecalho-bloco">
                <div style="display:flex; gap:10px; align-items:center;">
                    <span>📝 Notas & Rascunhos</span>
                    <span id="btn-theme" style="cursor:pointer; font-size:14px; opacity:0.8;" title="Alternar Tema">${isDarkMode ? '🌙' : '☀️'}</span>
                </div>
                <span id="fechar-bloco" style="cursor:pointer; opacity:0.8;">✕</span>
            </div>
            <div id="tabs-container"></div>
            <div id="corpo-bloco">
                <div id="screen-macros">
                    <div id="header-macros">
                        <span class="macros-title">⚡ Gerenciador de Macros</span>
                        <span class="btn-close-macros">✕</span>
                    </div>
                    <div id="list-macros"></div>
                    <div id="add-macro-form">
                        <input type="text" id="new-macro-key" class="input-macro" placeholder="Atalho (ex: ;oi)" autocomplete="off">
                        <textarea id="new-macro-val" class="input-macro" placeholder="Texto expandido (Shift+Enter para pular linha)" autocomplete="off"></textarea>
                        <button id="btn-add-macro" class="btn-add-macro">Adicionar Macro</button>
                    </div>
                </div>

                <div id="modal-confirm">
                    <div class="modal-content">
                        <div class="modal-title" id="modal-title-text">Título</div>
                        <div class="modal-desc" id="modal-desc-text">Descrição</div>
                        <input type="text" id="modal-input" class="modal-input" style="display:none;" autocomplete="off">
                        <div class="modal-btns">
                            <button class="modal-btn btn-cancel" id="modal-btn-no">Cancelar</button>
                            <button class="modal-btn btn-danger" id="modal-btn-yes">Confirmar</button>
                        </div>
                    </div>
                </div>

                <div id="toolbar-bloco">
                    <button id="btn-macros" class="btn-mini">⚡ Macros</button>
                    <button id="btn-copy-draft" class="btn-mini">Copiar Texto</button>
                </div>
                <textarea id="area-texto" spellcheck="false" placeholder="Digite aqui..."></textarea>
                <div id="historico-container">
                    <div id="titulo-hist">
                        Histórico Salvo
                        <span id="limpar-hist" style="cursor:pointer; color:#e53e3e; font-size:9px;">LIMPAR TUDO</span>
                    </div>
                    <div id="lista-hist"></div>
                </div>
            </div>
        `;
        document.body.appendChild(container);

        const btnAbrir = document.createElement('div');
        btnAbrir.id = 'abrir-bloco';
        btnAbrir.innerHTML = '📝';
        document.body.appendChild(btnAbrir);

        // --- REFERÊNCIAS ---
        const areaTexto = document.getElementById('area-texto');
        const listaHist = document.getElementById('lista-hist');
        const tabsContainer = document.getElementById('tabs-container');
        const modal = document.getElementById('modal-confirm');
        const modalTitle = document.getElementById('modal-title-text');
        const modalDesc = document.getElementById('modal-desc-text');
        const modalInput = document.getElementById('modal-input');
        const modalYes = document.getElementById('modal-btn-yes');
        const modalNo = document.getElementById('modal-btn-no');

        // Referencias Macro
        const screenMacros = document.getElementById('screen-macros');
        const btnMacros = document.getElementById('btn-macros');
        const btnCloseMacros = document.querySelector('.btn-close-macros');
        const listMacros = document.getElementById('list-macros');
        const inputMacroKey = document.getElementById('new-macro-key');
        const inputMacroVal = document.getElementById('new-macro-val');
        const btnAddMacro = document.getElementById('btn-add-macro');
        
        // Referencia Tema
        const btnTheme = document.getElementById('btn-theme');

        // --- LÓGICA DE TEMA ---
        btnTheme.onclick = (e) => {
            e.stopPropagation(); // Evita arrastar a janela ao clicar
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

        // --- MODAL LOGIC ---
        let modalCallback = null;

        function showConfirm(title, desc, callback) {
            modalTitle.innerText = title;
            modalDesc.innerText = desc;
            modalDesc.style.display = 'block';
            modalInput.style.display = 'none';
            modalYes.className = 'modal-btn btn-danger';
            modalYes.innerText = 'Excluir';
            modalCallback = callback;
            modal.style.display = 'flex';
        }

        function showPrompt(title, currentValue, callback) {
            modalTitle.innerText = title;
            modalDesc.style.display = 'none';
            modalInput.style.display = 'block';
            modalInput.value = currentValue;
            modalYes.className = 'modal-btn btn-action';
            modalYes.innerText = 'Salvar';
            modalCallback = callback;
            modal.style.display = 'flex';
            setTimeout(() => modalInput.focus(), 100);
        }

        function hideModal() {
            modal.style.display = 'none';
            modalCallback = null;
        }

        modalYes.onclick = () => {
            if (modalCallback) {
                if (modalInput.style.display !== 'none') {
                    modalCallback(modalInput.value);
                } else {
                    modalCallback();
                }
            }
            hideModal();
        };

        modalInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') modalYes.click();
        });

        modalNo.onclick = hideModal;

        // --- ABAS ---
        function getActiveTab() {
            return appData.tabs.find(t => t.id === appData.activeTabId) || appData.tabs[0];
        }

        function renderTabs() {
            tabsContainer.innerHTML = '';
            appData.tabs.forEach(tab => {
                const tabEl = document.createElement('div');
                tabEl.className = `tab-item ${tab.id === appData.activeTabId ? 'active' : ''}`;
                tabEl.title = "Clique duplo para renomear";
                tabEl.innerHTML = `<span class="tab-text">${tab.title}</span><span class="tab-close" title="Fechar Aba">×</span>`;

                tabEl.onclick = (e) => {
                    if (e.target.classList.contains('tab-close')) return;
                    if (appData.activeTabId !== tab.id) {
                        appData.activeTabId = tab.id;
                        salvarDados();
                        updateUI();
                    }
                };
                tabEl.ondblclick = () => {
                    showPrompt('Renomear Aba', tab.title, (newName) => {
                        if (newName && newName.trim()) {
                            tab.title = newName.trim();
                            salvarDados();
                            renderTabs();
                        }
                    });
                };
                const closeBtn = tabEl.querySelector('.tab-close');
                closeBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (appData.tabs.length <= 1) {
                        tabEl.style.backgroundColor = "#fed7d7";
                        setTimeout(() => tabEl.style.backgroundColor = "", 300);
                        return;
                    }
                    showConfirm('Excluir Aba?', `Deseja apagar "${tab.title}" e todo o histórico?`, () => {
                        appData.tabs = appData.tabs.filter(t => t.id !== tab.id);
                        if (appData.activeTabId === tab.id) {
                            appData.activeTabId = appData.tabs[0].id;
                        }
                        reordenarAbas();
                        updateUI();
                    });
                };
                tabsContainer.appendChild(tabEl);
            });
            if (appData.tabs.length < MAX_TABS) {
                const addBtn = document.createElement('div');
                addBtn.className = 'tab-add';
                addBtn.innerText = '+';
                addBtn.title = "Nova Aba";
                addBtn.onclick = () => {
                    const newId = Date.now();
                    appData.tabs.push({ id: newId, title: 'Guia TEMP', content: '', history: [] });
                    reordenarAbas();
                    appData.activeTabId = newId;
                    updateUI();
                };
                tabsContainer.appendChild(addBtn);
            }
        }

        // --- HISTÓRICO ---
        function renderHistory() {
            const currentTab = getActiveTab();
            listaHist.innerHTML = '';
            currentTab.history.forEach((itemObj, index) => {
                const item = document.createElement('div');
                item.className = 'hist-item';
                const titulo = itemObj.title || 'Sem título';
                const preview = itemObj.content.replace(/\n/g, ' ').substring(0, 30) + '...';
                item.innerHTML = `
                    <div class="hist-title-container">
                        <span class="hist-title">${titulo}</span>
                        <span class="hist-preview">${preview}</span>
                    </div>
                    <div class="hist-actions">
                        <span class="btn-icon btn-load" title="Carregar na Área de Texto">📂</span>
                        <span class="btn-icon btn-rename" title="Renomear Título">✏️</span>
                        <span class="btn-icon btn-del" title="Apagar">❌</span>
                    </div>
                `;
                item.onclick = async (e) => {
                    if (e.target.classList.contains('btn-icon')) return;
                    await navigator.clipboard.writeText(itemObj.content);
                    item.style.backgroundColor = '#c6f6d5';
                    setTimeout(() => item.style.backgroundColor = '', 300);
                };
                item.querySelector('.btn-load').onclick = (e) => {
                    e.stopPropagation();
                    areaTexto.value = itemObj.content;
                    currentTab.content = itemObj.content;
                    salvarDados();
                    areaTexto.focus();
                };
                item.querySelector('.btn-rename').onclick = (e) => {
                    e.stopPropagation();
                    showPrompt('Editar Título', itemObj.title, (newTitle) => {
                        if (newTitle) {
                            itemObj.title = newTitle;
                            salvarDados();
                            renderHistory();
                        }
                    });
                };
                item.querySelector('.btn-del').onclick = (e) => {
                    e.stopPropagation();
                    currentTab.history.splice(index, 1);
                    salvarDados();
                    renderHistory();
                };
                listaHist.appendChild(item);
            });
        }

        function updateUI() {
            const currentTab = getActiveTab();
            areaTexto.value = currentTab.content;
            renderTabs();
            renderHistory();
        }

        updateUI();

        // --- LÓGICA DE MACROS UI ---
        function renderMacrosList() {
            listMacros.innerHTML = '';

            if (macrosList.length === 0) {
                listMacros.innerHTML = '<div style="color:#a0aec0; text-align:center; padding:20px; font-size:11px;">Nenhuma macro criada.</div>';
                return;
            }

            macrosList.forEach((macro, index) => {
                const div = document.createElement('div');
                div.className = 'macro-item';
                div.innerHTML = `
                    <div class="macro-info">
                        <span class="macro-key">${macro.key}</span>
                        <span class="macro-val">${macro.val}</span>
                    </div>
                    <div class="macro-actions-group">
                        <span class="macro-btn up" title="Mover para Cima">↑</span>
                        <span class="macro-btn down" title="Mover para Baixo">↓</span>
                        <span class="macro-btn del" title="Excluir">🗑️</span>
                    </div>
                `;

                // Mover Cima
                div.querySelector('.up').onclick = (e) => {
                    e.stopPropagation();
                    if (index > 0) {
                        [macrosList[index], macrosList[index - 1]] = [macrosList[index - 1], macrosList[index]];
                        salvarMacros();
                        renderMacrosList();
                    }
                };

                // Mover Baixo
                div.querySelector('.down').onclick = (e) => {
                    e.stopPropagation();
                    if (index < macrosList.length - 1) {
                        [macrosList[index], macrosList[index + 1]] = [macrosList[index + 1], macrosList[index]];
                        salvarMacros();
                        renderMacrosList();
                    }
                };

                // Deletar
                div.querySelector('.del').onclick = (e) => {
                    e.stopPropagation();
                    showConfirm('Excluir Macro?', `Deseja remover o atalho "${macro.key}"?`, () => {
                        macrosList.splice(index, 1);
                        salvarMacros();
                        renderMacrosList();
                    });
                };

                // Preencher form
                div.onclick = (e) => {
                    if(!e.target.classList.contains('macro-btn')) {
                        inputMacroKey.value = macro.key;
                        inputMacroVal.value = macro.val;
                    }
                };
                listMacros.appendChild(div);
            });
        }

        btnMacros.onclick = () => {
            screenMacros.style.display = 'flex';
            tabsContainer.style.display = 'none'; // Oculta as guias ao abrir macros
            renderMacrosList();
        };

        btnCloseMacros.onclick = () => {
            screenMacros.style.display = 'none';
            tabsContainer.style.display = 'flex'; // Exibe as guias ao fechar macros
        };

        btnAddMacro.onclick = () => {
            const key = inputMacroKey.value.trim();
            const val = inputMacroVal.value.trim();
            if (key && val) {
                // Remove se já existir chave igual
                const existingIndex = macrosList.findIndex(m => m.key === key);
                if (existingIndex !== -1) {
                    macrosList[existingIndex].val = val;
                } else {
                    macrosList.push({ key, val });
                }
                salvarMacros();
                renderMacrosList();
                inputMacroKey.value = '';
                inputMacroVal.value = '';
                btnAddMacro.innerText = 'Salvo!';
                setTimeout(() => btnAddMacro.innerText = 'Adicionar Macro', 1000);
            }
        };

        // --- EVENTOS DE INTERFACE ---
        areaTexto.addEventListener('input', () => {
            const currentTab = getActiveTab();
            currentTab.content = areaTexto.value;
            salvarDados();
        });

        areaTexto.addEventListener('paste', (e) => {
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            if (pastedText && pastedText.trim().length > 0) {
                const currentTab = getActiveTab();
                if (currentTab.history.length === 0 || currentTab.history[0].content !== pastedText) {
                    const tituloAuto = pastedText.substring(0, 20).replace(/\n/g, ' ') + (pastedText.length > 20 ? '...' : '');
                    currentTab.history.unshift({ title: tituloAuto, content: pastedText });
                    if (currentTab.history.length > 20) currentTab.history.pop();
                    salvarDados();
                    renderHistory();
                }
            }
        });

        document.getElementById('btn-copy-draft').onclick = async () => {
            if (areaTexto.value) {
                await navigator.clipboard.writeText(areaTexto.value);
                const btn = document.getElementById('btn-copy-draft');
                const orig = btn.innerText;
                btn.innerText = "Copiado!";
                btn.style.color = "#38a169";
                btn.style.borderColor = "#38a169";
                setTimeout(() => { btn.innerText = orig; btn.style.color = ""; btn.style.borderColor = ""; }, 1000);
            }
        };

        document.getElementById('limpar-hist').onclick = () => {
            showConfirm('Limpar Histórico?', 'Todos os itens desta aba serão perdidos.', () => {
                const currentTab = getActiveTab();
                currentTab.history = [];
                salvarDados();
                renderHistory();
            });
        };

        // --- DRAG ---
        const setupDrag = (elem, targetElem, saveKey) => {
            let isDragging = false, startX, startY, startLeft, startTop;
            const onMove = (e) => {
                if (!isDragging) return;
                e.preventDefault();
                targetElem.style.left = `${startLeft + e.clientX - startX}px`;
                targetElem.style.top = `${startTop + e.clientY - startY}px`;
            };
            const onUp = () => {
                if (isDragging) {
                    isDragging = false; elem.style.cursor = 'move';
                    targetElem.classList.remove('em-movimento');
                    if (saveKey) localStorage.setItem(saveKey, JSON.stringify({ top: targetElem.style.top, left: targetElem.style.left, width: targetElem.style.width, height: targetElem.style.height }));
                }
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };
            elem.onmousedown = (e) => {
                if (e.target.id.includes('fechar') || e.target.id.includes('btn') || e.target.closest('.tab-item') || e.target.closest('.tab-add') || e.target.closest('#modal-confirm')) return;
                isDragging = true; targetElem.classList.add('em-movimento');
                startX = e.clientX; startY = e.clientY;
                startLeft = targetElem.offsetLeft; startTop = targetElem.offsetTop;
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            };
        };
        setupDrag(document.getElementById('cabecalho-bloco'), container, STORAGE_KEY_POS);

        // --- DRAG BTN ---
        let isDragBtn = false, bTimer, bStartX, bStartY, bStartLeft, bStartBottom;
        btnAbrir.onmousedown = (e) => {
            if(e.button !== 0) return;
            e.preventDefault(); isDragBtn = false;
            bStartX = e.clientX; bStartY = e.clientY;
            bStartLeft = btnAbrir.offsetLeft;
            bStartBottom = parseInt(window.getComputedStyle(btnAbrir).bottom, 10);
            const onMoveBtn = (ev) => {
                if (!isDragBtn) return;
                btnAbrir.style.left = `${bStartLeft + ev.clientX - bStartX}px`;
                btnAbrir.style.bottom = `${bStartBottom - (ev.clientY - bStartY)}px`;
                btnAbrir.style.top = 'auto';
            };
            const onUpBtn = () => {
                clearTimeout(bTimer);
                document.removeEventListener('mousemove', onMoveBtn);
                document.removeEventListener('mouseup', onUpBtn);
                if (isDragBtn) {
                    isDragBtn = false; btnAbrir.style.transform = 'scale(1)';
                } else {
                    const isHidden = container.style.display === 'none' || container.style.display === '';
                    container.style.display = isHidden ? 'flex' : 'none';
                    if (isHidden) setTimeout(() => areaTexto.focus(), 50);
                }
            };
            document.addEventListener('mousemove', onMoveBtn);
            document.addEventListener('mouseup', onUpBtn);
            bTimer = setTimeout(() => { isDragBtn = true; btnAbrir.style.transform = 'scale(1.2)'; }, 200);
        };

        document.getElementById('fechar-bloco').onclick = () => container.style.display = 'none';
    }

    carregarDados();
    setInterval(() => { if (!document.getElementById('abrir-bloco')) injetarBloco(); }, 2000);
    injetarBloco();
})();
