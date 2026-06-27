import { StateGraph, Annotation, MemorySaver } from "@langchain/langgraph";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

interface ChatScene {
  kind: "image" | "video";
  prompt: string;
  duration: number;
  voiceover: string;
}

interface ChatPlan {
  title: string;
  aspect_ratio: string;
  scenes: ChatScene[];
}

interface ChatState {
  messages: Array<{ role: string; content: string }>;
  plan: ChatPlan | null;
  reply: string;
  ready: boolean;
  options: string[];
  model?: string;
}

const ChatAnnotation = Annotation.Root({
  messages: Annotation<Array<{ role: string; content: string }>>({
    reducer: (a, b) => b,
  }),
  plan: Annotation<ChatPlan | null>({
    reducer: (a, b) => b,
  }),
  reply: Annotation<string>({
    reducer: (a, b) => b,
    default: () => "",
  }),
  ready: Annotation<boolean>({
    reducer: (a, b) => b,
    default: () => false,
  }),
  options: Annotation<string[]>({
    reducer: (a, b) => b,
    default: () => [],
  }),
  model: Annotation<string | undefined>({
    reducer: (a, b) => b,
    default: () => undefined,
  }),
});

const SYSTEM_PROMPT = `You are a video/ad creator. You MUST return a plan with real scenes every time.

CRITICAL: The "plan.scenes" array is MANDATORY. Include at least 2 scenes. Each scene MUST have a non-empty "prompt" field.

Return valid JSON only. Exact structure:
{
  "reply": "short message to user",
  "ready": true,
  "options": ["short option 1", "short option 2"],
  "plan": {
    "title": "project title",
    "aspect_ratio": "9:16",
    "scenes": [
      {
        "kind": "video",
        "prompt": "detailed visual scene description",
        "duration": 5,
        "voiceover": "dialogue or narration"
      }
    ]
  }
}

Rules:
- Make reasonable assumptions and create concrete scenes immediately.
- 3-5 scenes for a reel, 5-10 for a movie. Default 9:16, video format.
- Set ready=true after at most 1 question.`;

async function respond(state: typeof ChatAnnotation.State) {
  const model = state.model || "meta-llama/llama-4-scout-17b-16e-instruct";

  const history = state.messages.map((m) => ({ role: m.role, content: m.content }));
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
      temperature: 0.6,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    return { reply: "Sorry, I had an error processing that.", plan: null, ready: false, options: [] };
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim() || "{}";
  let parsed: Record<string, unknown> = {};
  try { parsed = JSON.parse(raw); } catch {}

  const plan = (parsed.plan as ChatPlan) || null;
  const scenes = plan?.scenes;

  if (!Array.isArray(scenes) || scenes.length < 2 || !scenes.some((s) => s.prompt)) {
    return {
      reply: "I need to create a plan with specific scenes first. What would you like to make?",
      plan: null,
      ready: false,
      options: [],
    };
  }

  return {
    reply: (parsed.reply as string) || "Here is the plan.",
    plan,
    ready: !!parsed.ready,
    options: Array.isArray(parsed.options) ? (parsed.options as string[]).slice(0, 4) : [],
  };
}

const workflow = new StateGraph(ChatAnnotation)
  .addNode("respond", respond)
  .addEdge("__start__", "respond")
  .addEdge("respond", "__end__");

const memory = new MemorySaver();
export const chatGraph = workflow.compile({ checkpointer: memory });

export interface ChatInput {
  messages: Array<{ role: string; content: string }>;
  thread_id: string;
  model?: string;
}

export interface ChatOutput {
  reply: string;
  plan: ChatPlan | null;
  ready: boolean;
  options: string[];
}

export async function runChat(input: ChatInput): Promise<ChatOutput> {
  const config = { configurable: { thread_id: input.thread_id } };

  const initialState = {
    messages: input.messages,
    plan: null,
    reply: "",
    ready: false,
    options: [],
    model: input.model,
  };

  const finalState = await chatGraph.invoke(initialState, config);

  return {
    reply: finalState.reply as string,
    plan: finalState.plan as ChatPlan | null,
    ready: !!finalState.ready,
    options: (finalState.options as string[]) || [],
  };
}
