import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { GithubRepoLoader } from "langchain/document_loaders/web/github";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { RedisVectorStore } from "@langchain/redis";
import { createClient } from "redis";

async function getDocuments() {
  try {
    const loader = new GithubRepoLoader(
      "https://github.com/langchain-ai/langchainjs",
      {
        branch: "main",
        recursive: false,
        unknown: "warn",
        maxConcurrency: 5, // Defaults to 2
      }
    );
    const docs = await loader.load();
    console.log("Loaded", docs.length, "documents");
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 3000,
      chunkOverlap: 200,
    });

    return textSplitter.splitDocuments(docs);
  } catch (e) {
    console.error("Error in getDocuments: ", e);
    throw e;
  }
}

async function createVectorStore() {
  // Define the collection name for the documents.

  const client = createClient({
    url: "redis://localhost:6379",
  });

  try {
    await client.connect();
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
    indexName: "docs",
  });
  return vectorStore;
}
export default async function built() {
  try {
    const vectorStore = await createVectorStore();
    console.log("Created vector store");
    const docs = await getDocuments();

    console.log("Loaded documents");

    await vectorStore.addDocuments(docs);

    console.log("Added documents to vector store");
  } catch (e) {
    console.error("Error in built function: ", e);
    throw e;
  }
}

built()
  .then(() => console.log("built"))
  .catch((e) => console.error(e));
// Run the build function.
