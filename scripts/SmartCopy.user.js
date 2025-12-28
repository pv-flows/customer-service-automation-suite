// ==UserScript==
// @name         SmartCopy Daemon 
// @namespace    https://gist.github.com/paulosereduc
// @version      1.6
// @description  Cópia automática Global. Protege edição manual, mas libera cópia em clique triplo (Planilhas). Global + Proteção Painel + Planilhas
// @author       Paulo Victor Freire da Silva
// @github       github.com/pv-flows
// @email        pv.flows@gmail.com
// @match        *://*/*
// @grant        none
// @updateURL    https://gist.githubusercontent.com/paulosereduc/acf114e931e83ca71048bc27723a7748/raw/SmartCopy.user.js
// @downloadURL  https://gist.githubusercontent.com/paulosereduc/acf114e931e83ca71048bc27723a7748/raw/SmartCopy.user.js
// ==/UserScript==

(function() {
    'use strict';

    // --- CONFIGURAÇÃO ---
    // Termos que, se selecionados, NÃO devem ser copiados automaticamente
    const EXCECOES = [
        "{{contact.name.split(' ')[0]}}",
        "{{agent.name.split(' ')[0]}}"
    ];

    /**
     * Função Central de Cópia
     */
    async function copiar(texto) {
        if (!texto) return;
        const textoLimpo = texto.trim();
        if (textoLimpo.length === 0) return;

        // Se estiver na lista de exceções, não copia
        if (EXCECOES.includes(textoLimpo)) return;

        try {
            await navigator.clipboard.writeText(textoLimpo);
            // Feedback discreto no console (F12)
            console.log(`SmartCopy: 📋 Capturado "${textoLimpo.substring(0, 15)}..."`);
        } catch (err) {
            try {
                document.execCommand('copy');
            } catch (e) {
                console.error('SmartCopy Error', e);
            }
        }
    }

    /**
     * DETETIVE DE ÁREAS RESTRITAS:
     * Retorna TRUE se o clique for dentro das ferramentas corporativas.
     * * @param {HTMLElement} target - O elemento clicado
     * @param {boolean} isTripleClick - Se foi um clique triplo
     */
    function ehAreaRestrita(target, isTripleClick = false) {
        if (!target) return false;
        if (!target.closest) return false;

        // 1. BLOQUEIO ABSOLUTO: Painel Financeiro e Bloco de Notas
        // Aqui nunca deve copiar, nem com 3 cliques.
        if (target.closest('#painel-financeiro')) return true;
        if (target.closest('#abrir-painel')) return true;
        if (target.closest('#bloco-notas')) return true;
        if (target.closest('#abrir-bloco')) return true;

        // 2. BLOQUEIO DE EDIÇÃO (INPUTS/TEXTAREA)
        // Se for um Input ou Editável:
        if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) {
            
            // SE for clique triplo (intuito de pegar a linha toda/planilha), PERMITE copiar (retorna false)
            if (isTripleClick) {
                return false; 
            }
            
            // SE for seleção manual (arrastar mouse para editar), BLOQUEIA (retorna true)
            return true;
        }

        return false;
    }

    // 1. MONITOR DE CLIQUE TRIPLO (Planilhas e Linhas Inteiras)
    document.addEventListener('click', (e) => {
        // No clique triplo, passamos 'true' para liberar a cópia em inputs de planilhas
        if (ehAreaRestrita(e.target, true)) return;

        if (e.detail === 3) {
            setTimeout(() => {
                let texto = window.getSelection().toString();

                // Fallback para Inputs de Planilha onde window.getSelection as vezes falha
                if (!texto) {
                    const activeEl = document.activeElement;
                    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
                        texto = activeEl.value;
                    }
                }

                if (texto) {
                    copiar(texto);
                }
            }, 50);
        }
    });

    // 2. MONITOR DE SELEÇÃO MANUAL (Mouse Drag)
    document.addEventListener('mouseup', (e) => {
        if (e.button !== 0) return;

        // Na seleção manual (arrastar), passamos 'false'. 
        // Isso mantem inputs bloqueados para você poder editar o texto sem copiar acidentalmente.
        if (ehAreaRestrita(e.target, false)) return;

        setTimeout(() => {
            // Verifica clique triplo para evitar duplicidade (o click event cuida do triplo)
            if (e.detail === 3) return; 

            const texto = window.getSelection().toString();
            if (texto && texto.trim().length > 0) {
                copiar(texto);
            }
        }, 10);
    });

})();
