/*
Company are just a group of workflows that have a fixed company ID
*/

import {
  type DataStreamWriter,
  smoothStream,
  streamObject,
  streamText,
} from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { updateDocumentPrompt } from '@/lib/ai/prompts';
import type { Session } from 'next-auth';
import type { Company } from '@/lib/db/schema';
import { saveCompany, saveDocument } from '@/lib/db/queries';
import {
  dagSchema,
  Workflow,
  workflowSchema,
  type DAG,
} from '@/lib/validators/schema';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { workflowDagPlannerAgent } from '@/lib/mastra/agents/workflow-agent';
import { z } from 'zod';
import { AnthropicProviderOptions } from '@ai-sdk/anthropic';
import { getLayoutedElements } from '@/lib/dag/utils';
export interface SaveCompanyProps {
  id: string;
  companyName: string;
  content: string;
  userId: string;
}

export const workflowHandler = createDocumentHandler<'workflow'>({
  kind: 'workflow',
  onCreateDocument: async ({ id, title, dataStream, session }) => {
    let draftContent = '';

    console.log('Creating workflow');

    // TODO: Add agent design here - create DAG of agents to create a company
    const {
      text: reasoningSummary,
      reasoning,
      reasoningDetails,
    } = streamText({
      model: myProvider.languageModel('workflow-model-thinking'),
      system: `
        You are an agentic workflow planner.
      `,
      prompt: `Create a workflow for ${title}`,
    });

    const { partialObjectStream } = await workflowDagPlannerAgent.stream(
      `Create a workflow for ${title}`,
      {
        output: dagSchema,
      },
    );

    for await (const partialObject of partialObjectStream) {
      draftContent = partialObject;
      console.log('partialObject', partialObject);

      // Ensure that the nodes all are filled and not send empty nodes
      const partialDag = partialObject as DAG;
      if (
        !partialDag.nodes ||
        !partialDag.edges
      ) {
        continue;
      }

      console.log('partialDag', partialDag);

      const cleanedDag = {
        nodes: partialDag.nodes.filter(
          (node) =>
            node.id &&
            node.data.label &&
            node.data.prompt &&
            node.data.tools &&
            node.position
        ),
        edges: partialDag.edges,
      };

      console.log('Writing data over');
      console.log('cleanedDag', cleanedDag);

      const layoutedDag = getLayoutedElements(cleanedDag.nodes, cleanedDag.edges, { direction: 'TB' });

      dataStream.writeData({
        type: 'workflow-delta',
        content: JSON.stringify(layoutedDag),
      });
    }

    console.log('I have sent the data to the frontend');

    // for await (const delta of partialObjectStream) {
    //   const { type } = delta;

    //   if (type === 'text-delta') {
    //     const { textDelta } = delta;

    //     draftContent += textDelta;

    //     dataStream.writeData({
    //       type: 'text-delta',
    //       content: textDelta,
    //     });
    //   }
    // }

    // TODO: Create agents

    // TODO: Incorporate agentic patterns for the tasks

    // Return the agentic graph, provide a network mode if we're not sure

    return JSON.stringify(draftContent);
  },
  onUpdateDocument: async ({ document, description, dataStream, session }) => {
    const draftContent = '';

    const { fullStream } = streamText({
      model: myProvider.languageModel('artifact-model'),
      system: updateDocumentPrompt(
        JSON.stringify(document.content),
        'workflow',
      ),
      experimental_transform: smoothStream({ chunking: 'word' }),
      prompt: description,
      experimental_providerMetadata: {
        openai: {
          prediction: {
            type: 'content',
            content: JSON.stringify(document.content),
          },
        },
      },
    });

    // for await (const delta of fullStream) {
    //   const { type } = delta;

    //   if (type === 'text-delta') {
    //     const { textDelta } = delta;

    //     draftContent += textDelta;
    //     dataStream.writeData({
    //       type: 'text-delta',
    //       content: textDelta,
    //     });
    //   }
    // }

    return draftContent;
  },
});
