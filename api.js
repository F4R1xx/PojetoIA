import { OPENAI_API_KEY } from './config.js';

const AI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function generateFlashcards(deckName, course) {
    const prompt = `Aja como uma banca examinadora de concursos (como CESPE/Cebraspe, FGV) e vestibulares.
Sua tarefa é criar 10 questões DESAFIADORAS e TÉCNICAS para a prova de "${course}". As questões devem simular fielmente o estilo e a dificuldade de questões de provas reais. NÃO crie perguntas triviais sobre a instituição (ex: "Qual a sigla..."). O foco é testar o conhecimento do candidato nas matérias relevantes para PASSAR na prova.

Para o curso selecionado ("${course}"), foque nos seguintes tópicos e estilos:
- Se for "SERPRO": Crie questões complexas sobre Análise de Requisitos, Desenvolvimento de Sistemas (ex: apresentando um trecho de código em Flutter, Java ou Python e pedindo para julgar uma afirmativa), Segurança da Informação, Redes ou Banco de Dados. O estilo deve ser técnico, similar a provas da área de TI.
- Se for "PRF": Elabore questões situacionais sobre Legislação de Trânsito (CTB), Direito Penal, Processual Penal e Direitos Humanos.
- Se for "ENEM": Crie questões interdisciplinares que exijam interpretação de texto, gráficos e raciocínio lógico, cobrindo Ciências da Natureza, Matemática e Ciências Humanas.
- Se for "OAB": Formule questões baseadas em situações-problema sobre Ética Profissional, Direito Constitucional, Civil e Penal.
- Se for "Medicina" (Residência Médica): Apresente casos clínicos e peça o diagnóstico mais provável, conduta ou tratamento, cobrindo Clínica Médica, Cirurgia, Pediatria e Ginecologia.

O nome do deck é "${deckName}".

IMPORTANTE: Cada vez que este comando for executado, gere um conjunto de questões completamente NOVO e DIFERENTE. Evite tópicos e perguntas que já foram abordados em solicitações anteriores para o mesmo concurso. A variedade é essencial.

Formato da Resposta:
Responda APENAS com um objeto JSON válido. Não inclua texto explicativo antes ou depois do JSON.
O JSON deve ter a chave "questions", contendo um array de 10 objetos.
Cada objeto deve ter as chaves: "question" (string com a pergunta/enunciado técnico), "options" (array com 4 strings de alternativas) e "answer" (a string da resposta correta, que deve ser uma das opções).`;

    const response = await fetch(AI_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ "role": "user", "content": prompt }],
            temperature: 0.9,
            response_format: { type: "json_object" }
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.error.message}`);
    }

    const data = await response.json();
    const jsonResponse = JSON.parse(data.choices[0].message.content);

    if (!jsonResponse.questions || jsonResponse.questions.length === 0) {
        throw new Error("A IA não retornou questões no formato esperado.");
    }

    return jsonResponse.questions;
}

