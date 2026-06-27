import { StateGraph, Annotation, MemorySaver } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import { BaseMessage, SystemMessage, HumanMessage } from "@langchain/core/messages";
import { z } from "zod";

export interface PlanScene {
  n?: number; title?: string; start?: number; end?: number;
  shot?: string; camera?: string; lighting?: string;
  action?: string; voiceover?: string; kind?: "image" | "video";
  prompt?: string; duration?: number;
}

export interface AgentPlan {
  title?: string; concept?: string; format?: string;
  aspect_ratio?: "9:16" | "16:9" | "1:1";
  characters?: Array<{ name?: string; description?: string }>;
  scenes?: PlanScene[];
}

export interface AgentMemory {
  sessionHistory: Array<{ goal: string; planSummary: string; created: string }>;
  stylePreferences?: string;
  frequentModels?: string[];
}

const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>(),
  goal: Annotation<string>(),
  projectId: Annotation<string>(),
  plan: Annotation<AgentPlan | null>(),
  iteration: Annotation<number>(),
  maxIterations: Annotation<number>(),
  critique: Annotation<string>(),
  jobs: Annotation<string[]>(),
  reply: Annotation<string>(),
  ready: Annotation<boolean>(),
  trace: Annotation<string[]>(),
});

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

function createLLM(temperature = 0.7) {
  return new ChatGroq({
    apiKey: GROQ_API_KEY,
    model: "meta-llama/llama-3.3-70b-versatile",
    temperature,
    maxTokens: 4000,
  });
}

const SYSTEM_PROMPT = `You are ClipFlow's AI creative director. You help users plan and generate video, image, and avatar content.

Guidelines:
- Be concise and creative. Ask clarifying questions when needed.
- Default to 9:16 vertical format for social content.
- For reels: 3-5 scenes. For movies: 10-14 scenes (~4-5s each).
- Each scene needs a specific visual prompt, shot type, lighting, and optional voiceover.
- Keep character descriptions consistent across scenes.
- When the user gives a goal, produce a structured plan with scenes.

Return a JSON object with: reply (string), plan (the production plan object), ready (boolean).`;

const REFINE_PROMPT = `You are refining a production plan to make it more cinematic and compelling.

Focus on improving:
1. Visual prompts — make them more vivid and specific
2. Lighting direction — golden hour, dramatic side-light, soft diffused
3. Camera movement — tracking, dolly, crane, handheld
4. Narrative flow — each scene should advance the story
5. Character expressions and actions
6. Voiceover quality — make it more natural and persuasive
7. Color grading and atmosphere

Return JSON: { reply: string, improvements: string, plan: object }`;

async function analyzeGoal(state: typeof AgentState.State) {
  const llm = createLLM();
  const { goal } = state;

  const msg = await llm.invoke([
    new SystemMessage(SYSTEM_PROMPT),
    new HumanMessage(`Goal: ${goal}\n\nCreate a detailed production plan.`),
  ]);

  let reply = "";
  let plan: AgentPlan | null = null;
  let ready = false;

  try {
    const parsed = JSON.parse(msg.content as string);
    reply = parsed.reply || "Here's the plan.";
    plan = parsed.plan || null;
    ready = !!parsed.ready;
  } catch {
    reply = (msg.content as string).slice(0, 500);
    ready = false;
  }

  return {
    reply,
    plan,
    ready,
    trace: [`analyzeGoal: ${reply.slice(0, 100)}`],
  };
}

async function refinePlan(state: typeof AgentState.State) {
  const llm = createLLM(0.8);
  const { plan, iteration, critique } = state;

  const critiques = [
    "Make the visuals more cinematic. Add specific lighting direction (golden hour, dramatic side-light, soft diffused). Improve camera movements — add tracking, dolly, or crane shots. Make prompts more vivid with sensory details.",
    "Strengthen the narrative arc. Ensure each scene advances the story. Make character expressions and actions more specific. Improve the voiceover to be more compelling and natural.",
    "Polish every prompt to perfection. Ensure color grading is specified (warm, cool, teal-and-orange). Add atmospheric details (weather, time of day, environment mood). Make transitions between scenes smoother.",
  ];

  const critiqueText = critique || critiques[Math.min(iteration, critiques.length - 1)];

  const msg = await llm.invoke([
    new SystemMessage(REFINE_PROMPT),
    new HumanMessage(`Refinement pass #${iteration + 1}.\n\nCurrent plan:\n${JSON.stringify(plan, null, 2)}\n\nCritique:\n${critiqueText}\n\nReturn JSON: { reply: string, improvements: string, plan: object }`),
  ]);

  let newPlan = plan;
  let improvements = "";
  let reply = "";

  try {
    const parsed = JSON.parse(msg.content as string);
    if (parsed.plan) newPlan = parsed.plan as AgentPlan;
    improvements = parsed.improvements || "";
    reply = parsed.reply || "Refined.";
  } catch {
    reply = "Refinement produced no changes.";
  }

  return {
    plan: newPlan,
    reply,
    critique: critiqueText,
    iteration: iteration + 1,
    trace: [`refinePlan_pass${iteration + 1}: ${improvements.slice(0, 100) || reply.slice(0, 100)}`],
  };
}

function shouldContinue(state: typeof AgentState.State): "refinePlan" | "executePlan" | "__end__" {
  const { iteration, maxIterations, plan, ready } = state;

  if (ready && plan) {
    if (iteration < maxIterations) {
      return "refinePlan";
    }
    return "executePlan";
  }

  if (plan) {
    if (iteration < maxIterations) {
      return "refinePlan";
    }
    return "executePlan";
  }

  return "__end__";
}

async function executePlan(state: typeof AgentState.State) {
  const { plan, projectId } = state;
  const jobs: string[] = [];
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!plan?.scenes?.length) {
    return { reply: "No scenes to generate.", jobs, trace: ["executePlan: No scenes"] };
  }

  const scenes = plan.scenes.filter(s => (s.prompt || s.action || "").trim());

  for (const scene of scenes) {
    const isVideo = scene.kind === "video";
    const endpoint = isVideo ? `${origin}/api/generate-video` : `${origin}/api/generate-image`;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: scene.prompt || scene.action,
          model: isVideo ? "ltx-2.3" : "flux2",
          project_id: projectId,
          duration: scene.duration || 5,
          width: 448,
          height: 768,
        }),
      });
      const data = await res.json();
      if (data.job_id) jobs.push(data.job_id);
    } catch {
      // skip failed scene
    }
  }

  const reply = `Created ${jobs.length} job${jobs.length === 1 ? "" : "s"}. Results will appear on the canvas.`;

  return {
    jobs,
    reply,
    trace: [`executePlan: ${reply}`],
  };
}

const workflow = new StateGraph(AgentState)
  .addNode("analyzeGoal", analyzeGoal)
  .addNode("refinePlan", refinePlan)
  .addNode("executePlan", executePlan)
  .addEdge("__start__", "analyzeGoal")
  .addConditionalEdges("analyzeGoal", shouldContinue, {
    refinePlan: "refinePlan",
    executePlan: "executePlan",
    __end__: "__end__",
  })
  .addConditionalEdges("refinePlan", shouldContinue, {
    refinePlan: "refinePlan",
    executePlan: "executePlan",
    __end__: "__end__",
  })
  .addEdge("executePlan", "__end__");

const memory = new MemorySaver();
export const agentGraph = workflow.compile({ checkpointer: memory });

export interface LangGraphInput {
  goal: string;
  project_id: string;
  thread_id: string;
  max_iterations?: number;
}

export interface LangGraphOutput {
  reply: string;
  plan: AgentPlan | null;
  jobs: string[];
  ready: boolean;
  iteration: number;
  trace: string[];
}

export async function runAgent(input: LangGraphInput): Promise<LangGraphOutput> {
  const config = { configurable: { thread_id: input.thread_id } };

  const initialState = {
    goal: input.goal,
    projectId: input.project_id,
    maxIterations: input.max_iterations || 3,
    iteration: 0,
    plan: null,
    jobs: [],
    reply: "",
    ready: false,
    critique: "",
    trace: [],
    messages: [],
  };

  const finalState = await agentGraph.invoke(initialState, config);

  return {
    reply: (finalState as Record<string, unknown>).reply as string || "",
    plan: (finalState as Record<string, unknown>).plan as AgentPlan | null || null,
    jobs: (finalState as Record<string, unknown>).jobs as string[] || [],
    ready: !!((finalState as Record<string, unknown>).ready as boolean),
    iteration: ((finalState as Record<string, unknown>).iteration as number) || 0,
    trace: (finalState as Record<string, unknown>).trace as string[] || [],
  };
}
