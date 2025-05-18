import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChromaClient, Collection } from 'chromadb';
import { Document as LangchainDocument } from '@langchain/core/documents';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OpenAIEmbeddings } from '@langchain/openai';

// Definir tipo para el resultado de addDocuments
type AddDocumentsResult =
  | { success: boolean; error?: string; response?: Record<string, unknown> }
  | AddDocumentsResult[];

export interface SearchResult {
  pageContent: string;
  metadata: Record<string, unknown>;
}

export interface VectorStoreResult {
  ids: string[];
  documents: string[];
  metadatas: Record<string, unknown>[];
  embeddings?: number[][];
}

@Injectable()
export class VectorStoreService implements OnModuleInit {
  private client: ChromaClient;
  private collection: Collection | null = null;
  private isInitialized = false;
  private readonly COLLECTION_NAME = 'tech-support-assistant-openai';
  private embeddings: OpenAIEmbeddings;
  private vectorStore: Chroma;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    const embeddings = new OpenAIEmbeddings({
      modelName: 'text-embedding-3-small',
      openAIApiKey: apiKey,
    });

    this.vectorStore = new Chroma(embeddings, {
      collectionName: this.COLLECTION_NAME,
      collectionMetadata: {
        'hnsw:space': 'cosine',
      },
    });

    this.embeddings = embeddings;
  }

  onModuleInit(): void {
    this.isInitialized = true;
    console.log('Servicio de vectores inicializado correctamente');
  }

  initChroma(): void {
    if (!this.isInitialized) {
      this.isInitialized = true;
      console.log('Conexión con Chroma inicializada');
    }
  }

  async addDocuments(
    documents: string[],
    ids: string[],
    metadatas?: Record<string, unknown>[],
  ): Promise<AddDocumentsResult> {
    try {
      if (!Array.isArray(documents) || !Array.isArray(ids)) {
        throw new Error('Los documentos e IDs deben ser arrays');
      }

      if (documents.length !== ids.length) {
        throw new Error('La cantidad de documentos e IDs debe ser igual');
      }

      if (metadatas && metadatas.length !== documents.length) {
        throw new Error(
          'La cantidad de metadatas debe ser igual a la de documentos',
        );
      }

      const langchainDocs = documents.map((text, i) => {
        return new LangchainDocument({
          pageContent: text,
          metadata: metadatas ? metadatas[i] : {},
        });
      });

      await this.vectorStore.addDocuments(langchainDocs, { ids });

      console.log(
        `${documents.length} documentos añadidos a Chroma (colección: ${this.COLLECTION_NAME}) con embeddings de dimensión 1536`,
      );

      return {
        success: true,
        response: {
          count: documents.length,
          embeddingModel: 'text-embedding-3-small',
        },
      };
    } catch (error) {
      console.error('Error al agregar documentos a Chroma:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';

      return { success: false, error: errorMessage };
    }
  }

  async queryDocuments(
    query: string,
    nResults: number = 3,
  ): Promise<VectorStoreResult> {
    try {
      const results = await this.vectorStore.similaritySearch(query, nResults);

      return {
        ids: results.map(
          (doc: SearchResult) => (doc.metadata.id as string) || '',
        ),
        documents: results.map((doc: SearchResult) => doc.pageContent),
        metadatas: results.map((doc: SearchResult) => doc.metadata),
      };
    } catch (error) {
      console.error('Error al consultar documentos:', error);
      throw error;
    }
  }

  async getAllDocuments(): Promise<VectorStoreResult> {
    try {
      const results = await this.vectorStore.similaritySearch('', 1000);

      return {
        ids: results.map(
          (doc: SearchResult) => (doc.metadata.id as string) || '',
        ),
        documents: results.map((doc: SearchResult) => doc.pageContent),
        metadatas: results.map((doc: SearchResult) => doc.metadata),
        embeddings: [],
      };
    } catch (error) {
      console.error('Error obteniendo documentos de Chroma:', error);
      throw error;
    }
  }
}
