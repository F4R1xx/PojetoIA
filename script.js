// Substitua pela sua chave de API do Google AI Studio
const API_KEY = 'SUA_CHAVE_DE_API_AQUI';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

// Elementos do HTML
const tickerInput = document.getElementById('tickerInput');
const analiseRapidaBtn = document.getElementById('analiseRapidaBtn');
const loadingDiv = document.getElementById('loading');
const relatorioBreveDiv = document.getElementById('relatorioBreve');
const btnDetalhadoContainer = document.getElementById('btnDetalhadoContainer');
const analiseDetalhadaBtn = document.getElementById('analiseDetalhadaBtn');
const relatorioDetalhadoDiv = document.getElementById('relatorioDetalhado');

let ativoAtual = ''; // Para guardar o ticker que está sendo analisado

// Event Listeners
analiseRapidaBtn.addEventListener('click', gerarAnaliseRapida);
analiseDetalhadaBtn.addEventListener('click', gerarAnaliseDetalhada);

// Função para chamar a API
async function chamarGemini(prompt) {
    loadingDiv.style.display = 'block';
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                // Configuração para forçar resposta em JSON
                generationConfig: {
                    responseMimeType: "application/json",
                }
            })
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return JSON.parse(data.candidates[0].content.parts[0].text);
    } catch (error) {
        console.error("Erro na API:", error);
        return null;
    } finally {
        loadingDiv.style.display = 'none';
    }
}


async function gerarAnaliseRapida() {
    ativoAtual = tickerInput.value.trim().toUpperCase();
    if (!ativoAtual) {
        alert("Por favor, digite um ticker.");
        return;
    }

    // Esconde relatórios antigos
    relatorioBreveDiv.style.display = 'none';
    relatorioDetalhadoDiv.style.display = 'none';
    btnDetalhadoContainer.style.display = 'none';

    // Prompt para o relatório breve (pedindo JSON)
    const prompt = `
        Faça uma análise fundamentalista breve do ativo ${ativoAtual}. 
        Baseie-se em dados públicos e notícias recentes.
        Crie um resumo com os seguintes campos:
        - "balanco_geral": Uma frase curta (máximo 20 palavras) indicando se a perspectiva é positiva, mista ou de cautela.
        - "pontos_positivos": Um array com 3 a 4 pontos fortes em formato de string.
        - "pontos_negativos": Um array com 3 a 4 pontos de atenção ou riscos em formato de string.
        
        Responda APENAS com o objeto JSON.
    `;

    const resultado = await chamarGemini(prompt);

    if (resultado) {
        // Monta o HTML do relatório breve
        relatorioBreveDiv.innerHTML = `
            <h2>Análise Rápida: ${ativoAtual}</h2>
            <p><strong>Balanço Geral:</strong> ${resultado.balanco_geral}</p>
            <h3>✅ Pontos Positivos</h3>
            <ul>
                ${resultado.pontos_positivos.map(p => `<li>${p}</li>`).join('')}
            </ul>
            <h3>⚠️ Pontos de Atenção</h3>
            <ul>
                ${resultado.pontos_negativos.map(p => `<li>${p}</li>`).join('')}
            </ul>
            <p style="font-size: 0.8em; color: gray;">*Esta análise foi gerada por IA e não é uma recomendação de investimento.*</p>
        `;
        relatorioBreveDiv.style.display = 'block';
        btnDetalhadoContainer.style.display = 'block'; // Mostra o botão para o próximo passo
    } else {
        relatorioBreveDiv.innerHTML = `<p style="color: red;">Não foi possível gerar a análise para ${ativoAtual}. Tente novamente.</p>`;
        relatorioBreveDiv.style.display = 'block';
    }
}

async function gerarAnaliseDetalhada() {
    relatorioDetalhadoDiv.style.display = 'none';

    // Prompt para o relatório detalhado
    const prompt = `
        Crie um relatório detalhado sobre o ativo ${ativoAtual}.
        Aborde os seguintes tópicos em seções claras:
        1.  **Visão Geral:** O que a empresa/fundo faz.
        2.  **Desempenho Recente:** Análise dos últimos 12 meses (preço, dividendos, etc.).
        3.  **Principais Indicadores:** Liste e explique brevemente os principais indicadores (P/VP, Dividend Yield, ROE para ações; Vacância, Inadimplência para FIIs).
        4.  **Notícias e Fatos Relevantes:** Resuma as principais notícias recentes que impactaram o ativo.
        5.  **Análise de Riscos:** Quais são os principais riscos associados a este investimento?
        6.  **Perspectivas Futuras:** O que esperar do ativo com base em relatórios de mercado e planos da gestão.
        
        Responda APENAS com o objeto JSON contendo uma única chave "relatorio_html", onde o valor é uma string contendo todo o relatório formatado em HTML. Use tags como <h2> para títulos e <ul>/<li> para listas.
    `;

    const resultado = await chamarGemini(prompt);

    if (resultado && resultado.relatorio_html) {
        relatorioDetalhadoDiv.innerHTML = resultado.relatorio_html;
        relatorioDetalhadoDiv.innerHTML += `<p style="font-size: 0.8em; color: gray;">*Esta análise foi gerada por IA e não é uma recomendação de investimento.*</p>`;
        relatorioDetalhadoDiv.style.display = 'block';
    } else {
        relatorioDetalhadoDiv.innerHTML = `<p style="color: red;">Não foi possível gerar o relatório detalhado.</p>`;
        relatorioDetalhadoDiv.style.display = 'block';
    }
}