// =================================================================
//              SELETORES DE ELEMENTOS DO HTML
// =================================================================

// Mapeia os elementos da página para variáveis no JavaScript
const tickerInput = document.getElementById('tickerInput');
const analiseRapidaBtn = document.getElementById('analiseRapidaBtn');
const loadingDiv = document.getElementById('loading');
const relatorioBreveDiv = document.getElementById('relatorioBreve');
const btnDetalhadoContainer = document.getElementById('btnDetalhadoContainer');
const analiseDetalhadaBtn = document.getElementById('analiseDetalhadaBtn');
const relatorioDetalhadoDiv = document.getElementById('relatorioDetalhado');

// Variável global para armazenar o ticker sendo analisado
let ativoAtual = '';


// =================================================================
//                  CONFIGURAÇÃO DOS EVENTOS
// =================================================================

// Diz ao JavaScript o que fazer quando os botões forem clicados
analiseRapidaBtn.addEventListener('click', gerarAnaliseRapida);
analiseDetalhadaBtn.addEventListener('click', gerarAnaliseDetalhada);


// =================================================================
//          FUNÇÃO PRINCIPAL DE COMUNICAÇÃO COM A IA
// =================================================================

/**
 * Envia um prompt para a API da OpenAI e retorna a resposta.
 * @param {string} prompt - O texto/comando a ser enviado para a IA.
 * @returns {Promise<object|null>} - O objeto JSON da resposta ou null em caso de erro.
 */
async function chamarOpenAI(prompt) {
    loadingDiv.style.display = 'block'; // Mostra o indicador "Analisando..."
    const API_URL = 'https://api.openai.com/v1/chat/completions';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}` // Autenticação
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo', // Modelo de IA a ser usado
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: "json_object" } // Pede para a IA retornar um JSON
            })
        });

        if (!response.ok) {
            console.error("Erro da API OpenAI:", await response.json());
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // A resposta de texto da IA (que é um JSON) é extraída e convertida para um objeto JavaScript
        return JSON.parse(data.choices[0].message.content);

    } catch (error) {
        console.error("Erro ao chamar a API da OpenAI:", error);
        return null; // Retorna null se algo der errado
    } finally {
        loadingDiv.style.display = 'none'; // Esconde o indicador "Analisando..."
    }
}


// =================================================================
//        FUNÇÕES PARA GERAR OS RELATÓRIOS DE ANÁLISE
// =================================================================

/**
 * Gera o relatório rápido do ativo solicitado.
 */
async function gerarAnaliseRapida() {
    ativoAtual = tickerInput.value.trim().toUpperCase();
    if (!ativoAtual) {
        alert("Por favor, digite um ticker.");
        return;
    }

    // Desabilita o botão para evitar múltiplos cliques
    analiseRapidaBtn.disabled = true;
    analiseRapidaBtn.textContent = 'Analisando...';

    // Limpa os relatórios antigos
    relatorioBreveDiv.style.display = 'none';
    relatorioDetalhadoDiv.style.display = 'none';
    btnDetalhadoContainer.style.display = 'none';

    // Comando enviado para a IA
    const prompt = `
        Faça uma análise fundamentalista breve do ativo ${ativoAtual}. 
        Baseie-se em dados públicos e notícias recentes.
        Crie um resumo com os seguintes campos:
        - "balanco_geral": Uma frase curta (máximo 20 palavras) indicando se a perspectiva é positiva, mista ou de cautela.
        - "pontos_positivos": Um array com 3 a 4 pontos fortes em formato de string.
        - "pontos_negativos": Um array com 3 a 4 pontos de atenção ou riscos em formato de string.
        Responda APENAS com um objeto JSON válido.
    `;

    try {
        const resultado = await chamarOpenAI(prompt);

        if (resultado) {
            // Constrói o HTML do relatório e o exibe na tela
            relatorioBreveDiv.innerHTML = `
                <h2>Análise Rápida: ${ativoAtual}</h2>
                <p><strong>Balanço Geral:</strong> ${resultado.balanco_geral}</p>
                <h3>✅ Pontos Positivos</h3>
                <ul>${resultado.pontos_positivos.map(p => `<li>${p}</li>`).join('')}</ul>
                <h3>⚠️ Pontos de Atenção</h3>
                <ul>${resultado.pontos_negativos.map(p => `<li>${p}</li>`).join('')}</ul>
                <p style="font-size: 0.8em; color: gray;">*Análise gerada via API da OpenAI. Não é uma recomendação de investimento.*</p>
            `;
            relatorioBreveDiv.style.display = 'block';
            btnDetalhadoContainer.style.display = 'block';
        } else {
            relatorioBreveDiv.innerHTML = `<p style="color: red;">Não foi possível gerar a análise para ${ativoAtual}. Verifique o console para mais detalhes.</p>`;
            relatorioBreveDiv.style.display = 'block';
        }
    } finally {
        // Reabilita o botão, independentemente do resultado
        analiseRapidaBtn.disabled = false;
        analiseRapidaBtn.textContent = 'Análise Rápida';
    }
}

/**
 * Gera o relatório detalhado do ativo que já foi analisado.
 */
async function gerarAnaliseDetalhada() {
    // Desabilita o botão para evitar múltiplos cliques
    analiseDetalhadaBtn.disabled = true;
    analiseDetalhadaBtn.textContent = 'Gerando...';

    relatorioDetalhadoDiv.style.display = 'none';

    const prompt = `
        Crie um relatório detalhado sobre o ativo ${ativoAtual}.
        Aborde os seguintes tópicos: "Visão Geral", "Desempenho Recente", "Principais Indicadores", "Notícias Relevantes", "Análise de Riscos" e "Perspectivas Futuras".
        Responda APENAS com um objeto JSON válido contendo uma única chave "relatorio_html", onde o valor é uma string contendo todo o relatório formatado em HTML. Use tags como <h2> para títulos e <ul>/<li> para listas.
    `;

    try {
        const resultado = await chamarOpenAI(prompt);

        if (resultado && resultado.relatorio_html) {
            relatorioDetalhadoDiv.innerHTML = resultado.relatorio_html;
            relatorioDetalhadoDiv.innerHTML += `<p style="font-size: 0.8em; color: gray;">*Análise gerada via API da OpenAI. Não é uma recomendação de investimento.*</p>`;
            relatorioDetalhadoDiv.style.display = 'block';
        } else {
            relatorioDetalhadoDiv.innerHTML = `<p style="color: red;">Não foi possível gerar o relatório detalhado. Verifique o console para mais detalhes.</p>`;
            relatorioDetalhadoDiv.style.display = 'block';
        }
    } finally {
        // Reabilita o botão, independentemente do resultado
        analiseDetalhadaBtn.disabled = false;
        analiseDetalhadaBtn.textContent = 'Gerar Relatório Detalhado';
    }
}