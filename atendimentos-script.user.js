// ==UserScript==
// @name         A2 Copiar atendimentos INT6 - Luiz Toledo
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Copia quantidade + lista detalhada de atendimentos concluídos de Suporte Técnico nos últimos 3 meses para relatórios e clipboard do cliente
// @author       Luiz Toledo
// @match        *://integrator6.gegnet.com.br/*
// @match        *://integrator6.acessoline.net.br/*
// @grant        GM_setClipboard
// @icon         https://raw.githubusercontent.com/devluiztoledo/copiar-atendimentos-int6/main/icon.png
// @downloadURL  https://github.com/devluiztoledo/copiar-atendimentos-int6/raw/refs/heads/main/atendimentos-script.user.js
// @updateURL    https://github.com/devluiztoledo/copiar-atendimentos-int6/raw/refs/heads/main/atendimentos-script.user.js
// ==/UserScript==

(function () {
    'use strict';

    function adicionarBotao() {
        if (document.querySelector('#botao-copiar-atendimentos')) return;

        const botaoNovo = document.querySelector('li.icon-blue button.btn-acao');
        if (!botaoNovo) return;

        const botao = document.createElement('button');
        botao.id = 'botao-copiar-atendimentos';
        botao.innerText = 'Copiar atendimentos';
        botao.className = 'btn btn-success btn-acao';
        botao.style.marginLeft = '10px';

        botao.addEventListener('click', () => {

            const botoesFiltro = document.querySelectorAll('p-selectbutton > div > div');
            const botaoConcluidos = botoesFiltro[4];
            if (botaoConcluidos && !botaoConcluidos.classList.contains('ui-state-active')) {
                botaoConcluidos.click();
            }

            setTimeout(() => {
                const hoje = new Date();
                const tresMesesAtras = new Date();
                tresMesesAtras.setMonth(hoje.getMonth() - 3);

                const linhas = document.querySelectorAll('p-datatable table tbody tr');
                const atendimentos = [];

                linhas.forEach(linha => {
                    if (!linha.querySelector('.fa-flag.CONCLUID')) return;

                    const spans = linha.querySelectorAll('span.ui-cell-data');
                    let data = '', hora = '', protocolo = '', tipo = '';
                    let dataValida = false, ehSuporteTecnico = false;

                    spans.forEach(span => {
                        const texto = span.innerText.trim();

                        if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) data = texto;
                        if (/^\d{2}:\d{2}$/.test(texto)) hora = texto;
                        if (/^\d{6,7}$/.test(texto)) protocolo = texto;

                        if (/suporte técnico/i.test(texto) || /\bSUP[\s-]?RES\b/i.test(texto)) {
                            tipo = texto;
                            ehSuporteTecnico = true;
                        }
                    });

                    if (data && hora) {
                        const [dia, mes, ano] = data.split('/');
                        const dataHora = new Date(`${ano}-${mes}-${dia}T${hora}:00`);
                        dataValida = dataHora >= tresMesesAtras && dataHora <= hoje;
                    }

                    if (dataValida && ehSuporteTecnico && protocolo && tipo) {
                        atendimentos.push(`${data} ${hora} ${protocolo} ${tipo}`);
                    }
                });


                const resumo = `Cliente possui ${atendimentos.length} atendimentos nos últimos 3 meses`;
                const msg = resumo + '\n' + atendimentos.join('\n');

                if (typeof GM_setClipboard === 'function') {
                    GM_setClipboard(msg);
                } else {
                    navigator.clipboard.writeText(msg);
                }

                alert(`✅ ${atendimentos.length} atendimentos copiados com sucesso!`);
            }, 1000);
        });

        botaoNovo.parentElement.insertAdjacentElement('afterend', botao);
    }

    const observer = new MutationObserver(adicionarBotao);
    observer.observe(document.body, { childList: true, subtree: true });
})();
