'use server';
/**
 * @fileOverview A powerful AI agent for LabTrack AI.
 * - runAgent - The main function to interact with the agent.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { createProject, CreateProjectServiceSchema } from '@/services/projectService';
import { createSample, CreateSampleServiceSchema } from '@/services/sampleService';
import { auth } from '@/lib/firebase';

// Tool to create a new project
const createProjectTool = ai.defineTool(
  {
    name: 'createProject',
    description: 'Creates a new research project. Ask for any missing required fields before calling.',
    inputSchema: CreateProjectServiceSchema,
    outputSchema: z.string().describe("A confirmation message including the new Project ID."),
  },
  async (input) => {
    const user = auth.currentUser;
    if (!user) {
        return "Error: User must be signed in to create a project.";
    }
    const newProjectId = await createProject(input, { uid: user.uid, name: user.displayName });
    return `Successfully created new project "${input.name}" with ID: ${newProjectId}.`;
  }
);

// Tool to create a new sample
const createSampleTool = ai.defineTool(
  {
    name: 'createSample',
    description: 'Creates a new lab sample. Ask for any missing required fields before calling.',
    inputSchema: CreateSampleServiceSchema,
    outputSchema: z.string().describe("A confirmation message for the created sample."),
  },
  async (input) => {
    const user = auth.currentUser;
    if (!user) {
        return "Error: User must be signed in to create a sample.";
    }
    const newSampleId = await createSample(input, { uid: user.uid, name: user.displayName }, user.displayName || 'AI Agent');
    return `Successfully created new sample "${input.sample_id}" in project "${input.project_name}".`;
  }
);

// Tool for brainstorming project ideas
const suggestProjectIdeasTool = ai.defineTool({
    name: 'suggestProjectIdeas',
    description: 'Generates creative and relevant project ideas based on a given topic or field of study.',
    inputSchema: z.object({
        topic: z.string().describe('The topic or field to generate project ideas for, e.g., "cancer genomics" or "CRISPR technology".')
    }),
    outputSchema: z.any()
}, async ({ topic }) => {
    const ideaPrompt = ai.definePrompt({
        name: 'projectIdeaPrompt',
        system: `You are a creative and experienced bioinformatics researcher. Generate 3-5 innovative project ideas based on the provided topic. For each idea, provide a name, a short description, and a suitable omics type. Format the output as a bulleted list.`,
        input: { schema: z.object({ topic: z.string() }) },
    });
    
    const { text } = await ideaPrompt({ topic });
    return text;
});

// Tool for brainstorming workflow ideas
const suggestWorkflowIdeasTool = ai.defineTool({
    name: 'suggestWorkflowIdeas',
    description: 'Generates workflow ideas for a given project type or research area.',
    inputSchema: z.object({
        topic: z.string().describe('The project type or research area, e.g., "RNA-seq analysis" or "CRISPR library screening".')
    }),
    outputSchema: z.any()
}, async ({ topic }) => {
    const ideaPrompt = ai.definePrompt({
        name: 'workflowIdeaPrompt',
        system: `You are an expert in creating scientific data analysis pipelines. Generate 3-5 workflow ideas based on the provided topic. For each idea, provide a name, a short description, and a suitable pipeline type. Format the output as a bulleted list.`,
        input: { schema: z.object({ topic: z.string() }) },
    });
    
    const { text } = await ideaPrompt({ topic });
    return text;
});


// The main agent flow
const agentFlow = ai.defineFlow({
    name: 'agentFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (query) => {
    const user = auth.currentUser;
    if (!user) {
        return "Please sign in to use the AI assistant.";
    }

    const llmResponse = await ai.generate({
      prompt: query,
      model: 'googleai/gemini-2.0-flash',
      tools: [createProjectTool, createSampleTool, suggestProjectIdeasTool, suggestWorkflowIdeasTool],
      system: `You are LabBot, a friendly and highly intelligent AI assistant for the LabTrack AI application.
      - Your goal is to help researchers manage their work efficiently.
      - Be conversational and proactive.
      - When asked to create something (like a project or sample), you MUST use the provided tools.
      - Before using a tool, ensure you have all the required information from the user. If not, ask clarifying questions to get the necessary details (e.g., "What should I name the project?", "What omics type is it?").
      - When asked for ideas for projects or workflows, use the 'suggestProjectIdeas' or 'suggestWorkflowIdeas' tools respectively.
      - After a tool is successfully used, confirm the action with the user using the tool's output.
      - If you can't fulfill a request, explain why in a helpful way.
      - The current user is ${user.displayName} (${user.email}). Assume they are the project lead unless they specify otherwise.`
    });

    return llmResponse.text;
  }
);

export async function runAgent(query: string): Promise<string> {
    return agentFlow(query);
}
