import { OPENAI_API_KEY } from './config.js';

const AI_API_URL_OPENAI = 'https://api.openai.com/v1/chat/completions';

// Lista de "lentes" ou focos diferentes. 
const focusAngles = [
    "Foque em situações-problema e estudos de caso que exijam a aplicação de duas ou mais regras/leis ao mesmo tempo, simulando a complexidade real da prova.",
    "Concentre-se em exceções, súmulas recentes, detalhes técnicos minuciosos e jurisprudência controversa ou de alto impacto.",
    "Crie questões interdisciplinares ou que forçam o raciocínio lógico-quantitativo sobre a matéria. Proibido perguntas de memorização simples.",
    "Elabore itens baseados em erros conceituais e 'pegadinhas' avançadas que apenas candidatos com estudo aprofundado conseguiriam identificar.",
    "Dê prioridade máxima para tópicos que são frequentemente negligenciados ou que exigem um nível de detalhe (granularidade) altíssimo."
];

export async function generateFlashcards(deckName, course) {
    // Sorteia um ângulo de abordagem para esta execução específica
    const randomFocus = focusAngles[Math.floor(Math.random() * focusAngles.length)];
    const isDuel = deckName.toLowerCase().includes('duelo vs');

    // Define o sistema como uma banca examinadora rigorosa
    const systemInstruction = `Você é um membro sênior, altamente rigoroso e especializado de uma banca examinadora de elite. Sua tarefa é criar 10 itens de Múltipla Escolha (4 alternativas) para uma prova de nível de concurso/residência.

1.  **Dificuldade**: O nível de dificuldade deve ser "Difícil". O objetivo é eliminar candidatos fracos.
2.  **Formato**: Use linguagem formal, técnica e impessoal. As alternativas devem ser críveis.
3.  **Proibição**: Nunca crie perguntas de definição simples ou introdução.
4.  **Variedade**: As 10 questões devem abordar 10 sub-tópicos distintos dentro da área solicitada.`;


    // Constrói um prompt dinâmico e muito mais rigoroso
    const prompt = `Crie 10 questões de MÚLTIPLA ESCOLHA (4 opções) para o curso de "${course}". 
O deck se chama "${deckName}".

---
**DIRETRIZ DE ENFOQUE TEMÁTICO (RIGOR MÁXIMO):**
Siga estritamente este foco de prova para evitar repetição e garantir profundidade:
>>> ${randomFocus} <<<
---

**DIRETRIZES TÉCNICAS ESPECÍFICAS PARA A ÁREA:**
- **SERPRO (TI):** Crie questões sobre arquitetura de sistemas complexos, segurança aplicada (ex: vulnerabilidades e remediações específicas), e análise crítica de requisitos e código (Python/Java/Flutter).
- **PRF/Polícia:** Elabore questões que exijam **julgamento de legalidade** em cenários complexos (abordagens, uso da força, autuações baseadas em CTB e leis penais).
- **OAB:** Formule questões baseadas em súmulas do STF/STJ ou situações-problema com prazos e recursos processuais controversos.
- **ENEM:** Exija **raciocínio crítico e contextualização científica/social** profunda. Use gráficos, tabelas ou trechos de textos científicos complexos.
- **Medicina:** Apresente *Casos Clínicos* com múltiplas comorbidades ou apresentações atípicas. Peça o diagnóstico diferencial ou a conduta mais atualizada, seguindo guidelines estabelecidos.

**FORMATO DE SAÍDA (Obrigatoriamente JSON):**
Responda APENAS com um JSON válido. Não escreva nada antes ou depois.
Estrutura obrigatória:
{
  "questions": [
    {
      "question": "Texto completo do enunciado técnico...",
      "options": ["Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D"],
      "answer": "Texto idêntico a uma das opções acima que é a correta"
    }
  ]
}
`;

    try {
        const response = await fetch(AI_API_URL_OPENAI, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { "role": "system", "content": systemInstruction },
                    { "role": "user", "content": prompt }
                ],
                temperature: 0.85,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Erro na API OpenAI: ${errorData.error.message}`);
        }

        const data = await response.json();
        const jsonResponse = JSON.parse(data.choices[0].message.content);

        if (!jsonResponse.questions || jsonResponse.questions.length === 0) {
            throw new Error("A IA não retornou questões válidas no formato esperado.");
        }

        return jsonResponse.questions;

    } catch (error) {
        console.error("Erro detalhado ao gerar flashcards:", error);
        throw error;
    }
}

// CORRIGIDA: Análise de Desempenho por IA - Usando ChatGPT (GPT-4o) com Google Search Tool.
export async function analyzePerformance(historyData) {
    // Filtra apenas os dados relevantes para reduzir tokens
    const summary = historyData.map(d => ({
        curso: d.course,
        nota: d.score,
        nome_deck: d.name
    })).slice(-20);

    const prompt = `
    Você é um "Analista Curricular Sênior" e "Coach de Estudos" de nível GPT-4o.
    Analise o seguinte histórico de desempenho de um estudante em decks de flashcards:
    ${JSON.stringify(summary)}

    Com base nas notas obtidas, realize uma análise profunda:
    
    1.  **Inferência de Tópicos (MUITO DETALHADA):** Identifique 3 a 5 sub-tópicos ou áreas específicas (ex: "Regra de Três Composta", "Direito Administrativo - Licitações") onde o aluno está forte e 3 a 5 onde o aluno está fraco. **A resposta deve ser o TÓPICO, e não o nome do deck (ex: "Enem 1").**
    2.  **Recomendação de Estudo:** Para cada tópico fraco, crie uma sugestão acionável e relevante.
    
    3.  **Busca por Links Reais:** Para cada Tópico Fraco, use a ferramenta de busca para encontrar um **link de estudo real e de alta qualidade** (ex: videoaulas, artigos de sites educacionais renomados).
    
    4.  **Gráfico:** Crie um título e uma descrição para um gráfico de força.
    
    Retorne **APENAS** um objeto JSON no formato exato solicitado abaixo. Não inclua texto explicativo antes ou depois.
    
    Formato JSON Obrigatório:
    {
        "resumo_motivacional": "Um parágrafo curto e motivador sobre o progresso geral.",
        "pontos_fortes": [
            {"topico": "Tópico Forte 1", "curso": "Curso"},
            {"topico": "Tópico Forte 2", "curso": "Curso"}
        ],
        "pontos_fracos": [
            {"topico": "Tópico Fraco 1", "curso": "Curso"},
            {"topico": "Tópico Fraco 2", "curso": "Curso"}
        ],
        "sugestoes_estudo": [
            {"topico": "Tópico Fraco 1", "sugestao": "Recomendação específica.", "link_exemplo": "URL DE UM SITE REAL E CONFIÁVEL"},
            {"topico": "Tópico Fraco 2", "sugestao": "Recomendação específica.", "link_exemplo": "URL DE UM SITE REAL E CONFIÁVEL"}
        ],
        "dados_grafico": {
            "titulo": "Título Curto do Gráfico de Força",
            "descricao": "Breve descrição sobre o que o gráfico mostra."
        }
    }
    `;

    // Define a função Google Search para o modelo
    const tools = [{
        "type": "function",
        "function": {
            "name": "google_search",
            "description": "Busca informações atualizadas na web, como links de estudo, artigos ou videoaulas sobre um tópico específico.",
            "parameters": {
                "type": "object",
                "properties": {
                    "queries": {
                        "type": "array",
                        "items": { "type": "string" }, 
                        "description": "Lista de termos de busca. Mínimo 1, máximo 3."
                    }
                },
                "required": ["queries"]
            }
        }
    }];
    
    const messages = [
        { "role": "system", "content": "Você é um mentor analítico que fornece feedback estritamente em formato JSON. Você DEVE usar a função google_search para encontrar links de estudo reais para os tópicos fracos." },
        { "role": "user", "content": prompt }
    ];


    try {
        // Primeira chamada ao modelo para decidir se usa a ferramenta
        let response = await fetch(AI_API_URL_OPENAI, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: messages,
                tools: tools,
                tool_choice: "auto", 
                temperature: 0.7,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Erro na API OpenAI (1ª chamada): ${errorData.error.message}`);
        }

        let data = await response.json();
        
        // --- LÓGICA DE EXECUÇÃO DE FUNÇÕES (SIMULAÇÃO) ---
        if (data.choices[0].finish_reason === "tool_calls") {
            const toolCalls = data.choices[0].message.tool_calls;
            
            // 1. Executa todas as chamadas de função (Google Search)
            const toolOutputs = await Promise.all(toolCalls.map(async (toolCall) => {
                if (toolCall.function.name === "google_search") {
                    const args = JSON.parse(toolCall.function.arguments);
                    // Executa a busca real usando o Gemini Grounding (que deve ter a chave injetada)
                    const searchResult = await performGoogleSearch(args.queries);
                    
                    return {
                        tool_call_id: toolCall.id,
                        content: searchResult 
                    };
                }
                return null;
            }));
            
            // Filtra resultados nulos e monta as mensagens de retorno da tool
            const toolMessages = toolOutputs.filter(output => output !== null).map(output => ({
                role: "tool",
                tool_call_id: output.tool_call_id,
                content: output.content
            }));
            
            // Adiciona a mensagem do assistente que solicitou as ferramentas
            messages.push(data.choices[0].message); 
            // Adiciona as respostas das ferramentas
            messages.push(...toolMessages); 

            // Segunda chamada à API com o resultado da busca
            response = await fetch(AI_API_URL_OPENAI, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: messages,
                    temperature: 0.7,
                    response_format: { type: "json_object" }
                })
            });
            
            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(`Erro na API OpenAI (2ª chamada): ${errorData.error.message}`);
            }

            data = await response.json();
            const jsonText = data.choices[0].message.content;
            return JSON.parse(jsonText);
        }

        // Caso a IA decida não usar a ferramenta ou retorne o JSON diretamente
        const jsonText = data.choices[0].message.content;
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Erro na análise de desempenho (GPT-4o):", error);
        throw error;
    }
}

// FUNÇÃO AUXILIAR: Usa Gemini Grounding para obter URLs reais e retorna em formato de texto.
async function performGoogleSearch(queries) {
    // URL da API do Google/Gemini
    const searchUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=`;

    // PROMPT MELHORADO para buscar conteúdo brasileiro
    const searchPrompt = `Encontre o link de estudo mais relevante, real e de alta qualidade (priorizando sites brasileiros, como site:.br, ou em Português) para cada um dos seguintes tópicos: ${queries.join(', ')}. Para cada tópico, retorne o Título da página e a URL.`;
    
    const payload = {
        contents: [{ parts: [{ text: searchPrompt }] }],
        tools: [{ "google_search": {} }], 
    };

    try {
        const response = await fetch(searchUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // Se o erro for 403, significa que a chave não foi injetada corretamente.
        if (response.status === 403) {
             throw new Error("Erro de autenticação 403. A chave da API do Google não foi injetada corretamente no ambiente.");
        }

        const result = await response.json();
        const candidate = result.candidates?.[0];
        
        let resultText = "Resultados da Busca:\n";

        // Coleta todos os links de todas as fontes encontradas
        if (candidate && candidate.groundingMetadata && candidate.groundingMetadata.groundingAttributions) {
            candidate.groundingMetadata.groundingAttributions.forEach((attr, index) => {
                if (attr.web?.uri && attr.web?.title) {
                    // Retornamos os resultados em um formato de texto que o GPT entenderá
                    resultText += `Tópico ${index + 1}: [${attr.web.title}] URL: ${attr.web.uri}\n`;
                }
            });
        }
        
        // Se encontrar links, retorna-os; caso contrário, retorna a mensagem padrão.
        return resultText.trim() || "Nenhum link de apoio real encontrado.";

    } catch (e) {
        // Em caso de erro na busca, a IA será informada
        return `Erro técnico na busca de links: ${e.message}. O coach usará conhecimento interno para sugerir links gerais.`;
    }
}