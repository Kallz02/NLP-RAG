import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";
import { ChatGroq } from "@langchain/groq";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import {
  RunnableSequence,
  RunnablePassthrough,
} from "@langchain/core/runnables";
import { formatDocumentsAsString } from "langchain/util/document";
import { RedisVectorStore } from "@langchain/redis";
import { createClient } from "redis";
/**
 * This handler initializes and calls a simple chain with a prompt,
 * chat model, and output parser. See the docs for more information:
 *
 * https://js.langchain.com/docs/guides/expression_language/cookbook#prompttemplate--llm--outputparser
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, history = [] } = body;
    // through an error if query param is not defined
    if (!question) {
      return new Response(JSON.stringify("Please provide query phrase"), {
        status: 403,
      });
    }

    const chain = await getRunnableSequence();
    console.log("LLM Invoked");
    const result = await chain.invoke({ question, history });
    console.log(result);
    return Response.json({ result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

async function getRunnableSequence() {
  // const model = new ChatOllama({
  //   baseUrl: "http://100.64.0.3:11434",
  //   model: "llama3",
  //   temperature: 0.1,
  // });

  // const model = new ChatOllama({
  //   // baseUrl: "http://100.64.0.3:11434",
  //   baseUrl: "http://localhost:11434",
  //   // model: "deepseek-coder:6.7b",
  //   model: "phi3",
  //   temperature: 0.1,
  // });

  const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    // model: "llama3-8b-8192",
    model: "llama3-70b-8192",
  });
  const condenseQuestionTemplate = `

    Chat History:
    {chat_history}
    Follow Up Input: {question}
    Standalone question:
  `;

  const CONDENSE_QUESTION_PROMPT = PromptTemplate.fromTemplate(
    condenseQuestionTemplate
  );

  const answerTemplate = `
    Answer the question based only on the given context

    Step 1. Find the relevant answer baed on the DOCUMENT

    Step 2. Format in a readable, user friendly markdown format.

    DOCUMENT:
    --------
    {context}

    Question: 
    ---------
    {question}
  `;

  const ANSWER_PROMPT = PromptTemplate.fromTemplate(answerTemplate);
  // const COLLECTION_NAME = "docs";

  const client = createClient({
    url: "redis://localhost:6379",
  });

  try {
    await client.connect();
    console.log("Connected to Redis");
  } catch (err) {
    console.error(
      "An error occurred while connecting to the Redis server.",
      err
    );
  }
  // Initialize OpenAI embeddings.
  const embeddings = new HuggingFaceTransformersEmbeddings({
    model: "Xenova/all-MiniLM-L6-v2",
  });
  const vectorStore = new RedisVectorStore(embeddings, {
    redisClient: client,
    indexName: "docs1",
  });
  // Create and return a new Chroma vector store with specified settings.
  console.log("Loading documents...");
  const retriever = vectorStore.asRetriever(3);

  const standaloneQuestionChain = RunnableSequence.from([
    {
      question: (input) => input.question,
      chat_history: (input) => formatChatHistory(input.history),
    },
    CONDENSE_QUESTION_PROMPT,
    model,
    new StringOutputParser(),
  ]);

  const answerChain = RunnableSequence.from([
    {
      context: retriever.pipe(formatDocumentsAsString),
      question: new RunnablePassthrough(),
    },
    ANSWER_PROMPT,
    model,
    new StringOutputParser(),
  ]);

  const chain = standaloneQuestionChain.pipe(answerChain);

  return chain;
}

function formatChatHistory(chatHistory: any) {
  const formattedDialogueTurns = chatHistory.map((message) => {
    return `${message.type}: ${message.content}`;
  });

  return formattedDialogueTurns.join("\n");
}
