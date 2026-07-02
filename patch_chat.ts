import fs from 'fs';
import path from 'path';

const CHAT_ROUTE = 'src/app/api/ai/chat/route.ts';
let content = fs.readFileSync(CHAT_ROUTE, 'utf-8');

// First add the import for dharamVeerRetriever
if (!content.includes('dharamVeerRetriever')) {
    content = content.replace("import { getInferenceProvider", "import { retrievePathshalaContext, dharamVeerRetriever } from '@/lib/ai/retrieval';\nimport { getInferenceProvider");
}

const customHandler = `
  const mode = (body as any).mode;
  const figureId = (body as any).figure_id;

  if (mode === 'dharam_veer_reflection') {
    if (!figureId) {
      return NextResponse.json({ error: 'figure_id is required' }, { status: 400 });
    }
    
    // Retrieve passages for the figure
    const result = await dharamVeerRetriever.retrieve({
        text: body.message,
        filters: { title: figureId },
        topK: 5
    });

    if (!result.documents || result.documents.length === 0) {
        // Fallback response when source coverage is insufficient
        const text = "I do not have enough approved source material yet to answer questions about this Dharm Veer safely. We are continuously expanding the Parampara Pathshala corpus with verified sources.";
        return new Response(textAsStream(text), {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'no-store',
            },
        });
    }

    const passages = result.documents.map(d => \`- [\${d.metadata?.sourceName || 'Source'} - \${d.metadata?.chunkId || 'N/A'}]: \${d.content}\`).join('\\n');
    
    const reflectionPrompt = \`
You are an AI assistant reflecting on the life of \${figureId}.
You MUST base your response ONLY on the following approved source passages.
Do not invent any biographies or unsupported claims.
Include short source/citation labels (e.g. [Source - 1.1]) in your answer.
End your response by noting this is an "AI reflection based on verified sources".

Source Passages:
\${passages}

User Question: \${body.message}
\`;

    // Override system prompt
    const sysPrompt = "You are a Dharmic trust reviewer and AI assistant. Adhere strictly to provided source text and forbid unsupported claims.";
    const userMessage = reflectionPrompt;
    
    try {
        const genResult = await generateWithProvider(
          { system: sysPrompt, user: userMessage, maxOutputTokens: 900 }
        );
        return new Response(textAsStream(genResult.text), {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-store',
          },
        });
    } catch(err) {
        return NextResponse.json({ error: 'AI service error' }, { status: 500 });
    }
  }

  const startTime = Date.now();
`;

// Insert customHandler before the startTime
content = content.replace("const startTime = Date.now();", customHandler);

fs.writeFileSync(CHAT_ROUTE, content, 'utf-8');
console.log('patched chat route');
