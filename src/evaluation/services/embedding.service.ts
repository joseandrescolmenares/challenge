import { OpenAIEmbeddings } from '@langchain/openai';
import { CohereEmbeddings } from '@langchain/cohere';
import { Embeddings } from '@langchain/core/embeddings';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { Document as LangchainDocument } from '@langchain/core/documents';

export interface EmbeddingModel {
  name: string;
  modelName: string;
  dimensions: number;
  provider: string;
}

export class EmbeddingService {
  private vectorStores: Map<string, Chroma> = new Map();
  private embeddings: Map<string, Embeddings> = new Map();

  /**
   * Initializes an embedding model
   * @param model Model definition
   * @param apiKeys API keys for different services
   */
  async initializeModel(
    model: EmbeddingModel,
    apiKeys: Record<string, string>,
  ): Promise<Embeddings> {
    console.log(
      `Configuring model: ${model.name} (${model.dimensions} dimensions)`,
    );

    let embeddings: Embeddings;

    switch (model.provider) {
      case 'openai':
        if (!apiKeys.openai) {
          throw new Error('OpenAI API key not configured');
        }
        embeddings = new OpenAIEmbeddings({
          modelName: model.modelName,
          openAIApiKey: apiKeys.openai,
        });
        break;

      case 'cohere':
        if (!apiKeys.cohere) {
          throw new Error('Cohere API key not configured');
        }
        embeddings = new CohereEmbeddings({
          model: model.modelName,
          apiKey: apiKeys.cohere,
        });
        break;

      default:
        throw new Error(`Provider not supported: ${model.provider}`);
    }

    this.embeddings.set(model.name, embeddings);

    const collectionName = `eval_${model.name.replace(/\s+/g, '_').toLowerCase()}_${model.dimensions}`;

    const vectorStore = await Chroma.fromExistingCollection(embeddings, {
      collectionName: collectionName,
    });

    this.vectorStores.set(model.name, vectorStore);
    console.log(`✅ Model ${model.name} initialized successfully`);

    return embeddings;
  }

  getEmbeddings(modelName: string): Embeddings | undefined {
    return this.embeddings.get(modelName);
  }

  getVectorStore(modelName: string): Chroma | undefined {
    return this.vectorStores.get(modelName);
  }

  async addDocuments(
    modelName: string,
    documents: LangchainDocument[],
    options?: { ids?: string[] },
  ): Promise<void> {
    const vectorStore = this.vectorStores.get(modelName);
    if (!vectorStore) {
      throw new Error(`Vector store not found for model ${modelName}`);
    }

    await vectorStore.addDocuments(documents, options);
  }

  async similaritySearch(
    modelName: string,
    query: string,
    k = 3,
  ): Promise<LangchainDocument[]> {
    const vectorStore = this.vectorStores.get(modelName);
    if (!vectorStore) {
      throw new Error(`Vector store not found for model ${modelName}`);
    }

    return vectorStore.similaritySearch(query, k);
  }
}
