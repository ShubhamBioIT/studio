'use server';
/**
 * @fileOverview A powerful AI agent for LabTrack AI.
 * - runAgent - The main function to interact with the agent.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { createProject, CreateProjectServiceSchema } from '@/services/projectService';
import { createSample, CreateSampleServiceSchema } from '@/services/sampleService';

// Zod schema for user details passed to the flow
const UserSchema = z.object({
    uid: z.string(),
    displayName: z.string().nullable(),
    email: z.string().nullable(),
});
export type AgentUser = z.infer<typeof UserSchema>;


// --- Tool Schemas with User Context ---
const CreateProjectToolSchema = CreateProjectServiceSchema.extend({
    user: UserSchema.describe("The user performing the action."),
});

const CreateSampleToolSchema = CreateSampleServiceSchema.extend({
    user: UserSchema.describe("The user performing the action."),
});

// --- Top-level Tool and Prompt Definitions ---

const createProjectTool = ai.defineTool({
    name: 'createProject',
    description: 'Creates a new research project. You must include the user object in the input.',
    inputSchema: CreateProjectToolSchema,
    outputSchema: z.string().describe("A confirmation message including the new Project ID."),
    fn: async ({ user, ...projectData }) => {
        const newProjectId = await createProject(projectData, { uid: user.uid, name: user.displayName });
        return `Successfully created new project "${projectData.name}" with ID: ${newProjectId}.`;
    },
});

const createSampleTool = ai.defineTool({
    name: 'createSample',
    description: 'Creates a new lab sample. You must include the user object in the input.',
    inputSchema: CreateSampleToolSchema,
    outputSchema: z.string().describe("A confirmation message for the created sample."),
    fn: async ({ user, ...sampleData }) => {
        const newSampleId = await createSample(sampleData, { uid: user.uid, name: user.displayName }, user.displayName || 'AI Agent');
        return `Successfully created new sample "${sampleData.sample_id}" in project "${sampleData.project_name}".`;
    },
});


const suggestProjectIdeasTool = ai.defineTool({
    name: 'suggestProjectIdeas',
    description: 'Generates creative and relevant project ideas based on a given topic or field of study.',
    inputSchema: z.object({
        topic: z.string().describe('The topic or field to generate project ideas for, e.g., "cancer genomics" or "CRISPR technology".')
    }),
    outputSchema: z.any()
}, async ({ topic }) => {
    const llmResponse = await ai.generate({
        model: 'googleai/gemini-2.0-flash',
        prompt: `You are a creative and experienced bioinformatics researcher. Generate 3-5 innovative project ideas based on the provided topic: "${topic}". For each idea, provide a name, a short description, and a suitable omics type. Format the output as a bulleted list.`
    });
    return llmResponse.text;
});

const suggestWorkflowIdeasTool = ai.defineTool({
    name: 'suggestWorkflowIdeas',
    description: 'Generates workflow ideas for a given project type or research area.',
    inputSchema: z.object({
        topic: z.string().describe('The project type or research area, e.g., "RNA-seq analysis" or "CRISPR library screening".')
    }),
    outputSchema: z.any()
}, async ({ topic }) => {
    const llmResponse = await ai.generate({
        model: 'googleai/gemini-2.0-flash',
        prompt: `You are an expert in creating scientific data analysis pipelines. Generate 3-5 workflow ideas based on the provided topic: "${topic}". For each idea, provide a name, a short description, and a suitable pipeline type. Format the output as a bulleted list.`
    });
    return llmResponse.text;
});

// The main agent flow
const agentFlow = ai.defineFlow(
  {
    name: 'agentFlow',
    inputSchema: z.object({
        query: z.string(),
        user: UserSchema,
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    const { query, user } = input;
    
    const llmResponse = await ai.generate({
      prompt: query,
      model: 'googleai/gemini-2.0-flash',
      tools: [
        createProjectTool,
        createSampleTool,
        suggestProjectIdeasTool,
        suggestWorkflowIdeasTool
      ],
      system: `You are LabBot, a friendly and highly intelligent AI assistant for the LabTrack AI application.
      - Your goal is to help researchers manage their work efficiently.
      - Be conversational and proactive.
      - When asked to create something (like a project or sample), you MUST use the provided tools.
      - When using a tool that requires a 'user' parameter, you MUST pass the entire user object provided below into that parameter.
      - Before using a tool, ensure you have all the required information from the user. If not, ask clarifying questions to get the necessary details (e.g., "What should I name the project?", "What omics type is it?").
      - When asked for ideas for projects or workflows, use the 'suggestProjectIdeas' or 'suggestWorkflowIdeas' tools respectively.
      - After a tool is successfully used, confirm the action with the user using the tool's output.
      - If you can't fulfill a request, explain why in a helpful way.
      - The current user is ${JSON.stringify(user)}. Assume they are the project lead unless they specify otherwise.`
    });

    return llmResponse.text;
  }
);

// The exported function that is called from the client
export async function runAgent(query: string, user: AgentUser | null): Promise<string> {
    if (!user) {
        return "Please sign in to use the AI assistant.";
    }
    return agentFlow({ query, user });
}
