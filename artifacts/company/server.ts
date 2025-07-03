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
import { dagSchema, type DAG } from '@/lib/validators/schema';
import { z } from 'zod';
import { dagPlannerAgent } from '@/lib/mastra/agents';

export interface SaveCompanyProps {
  id: string;
  companyName: string;
  content: string;
  userId: string;
}

export interface CreateCompanyCallbackProps {
  id: string;
  companyName: string;
  businessDescription: string;
  dataStream: DataStreamWriter;
  session: Session;
}

export interface UpdateCompanyCallbackProps {
  company: Company;
  companyName: string;
  businessDescription: string;
  dataStream: DataStreamWriter;
  session: Session;
}

export const companyHandler = {
  kind: 'company',
  onCreateCompany: async ({
    id,
    companyName,
    businessDescription,
    dataStream,
    session,
  }: CreateCompanyCallbackProps) => {
    // let draftContent: DAG = {
    //   nodes: [],
    //   edges: [],
    // };

    // // TODO: Add agent design here - create DAG of agents to create a company
    // const dag = await dagPlannerAgent.generate(businessDescription, {
    //   output: dagSchema,
    // });

    // dataStream.writeData({
    //   type: 'dag',
    //   content: JSON.stringify(dag),
    // });

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

    // TODO: Create agents (agent builder)

    // TODO: Incorporate agentic patterns for the tasks

    // Return the agentic graph, provide a network mode if we're not sure

    // if (session?.user?.id) {
    //   await saveCompany({
    //     id: id,
    //     companyName: companyName,
    //     businessDescription: businessDescription,
    //     content: draftContent,
    //     userId: session.user.id,
    //   });

    //   await saveDocument({
    //     id: id,
    //     title: companyName,
    //     kind: 'workflow',
    //     content: JSON.stringify(draftContent),
    //     userId: session.user.id,
    //   });
    // }

    return;
  },
  onUpdateCompany: async ({
    company,
    companyName,
    businessDescription,
    dataStream,
    session,
  }: UpdateCompanyCallbackProps) => {
    // let draftContent: DAG = {
    //   nodes: [],
    //   edges: [],
    // };

    // const { fullStream } = streamText({
    //   model: myProvider.languageModel('artifact-model'),
    //   system: updateDocumentPrompt(JSON.stringify(company.content), 'company'),
    //   experimental_transform: smoothStream({ chunking: 'word' }),
    //   prompt: businessDescription,
    //   experimental_providerMetadata: {
    //     openai: {
    //       prediction: {
    //         type: 'content',
    //         content: JSON.stringify(company.content),
    //       },
    //     },
    //   },
    // });

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

    // if (session?.user?.id) {
    //   await saveCompany({
    //     id: company.id,
    //     companyName,
    //     businessDescription,
    //     content: draftContent,
    //     userId: session.user.id,
    //   });

    //   await saveDocument({
    //     id: company.id,
    //     title: companyName,
    //     kind: 'company',
    //     content: JSON.stringify(draftContent),
    //     userId: session.user.id,
    //   });
    // }

    return;
  },
};
