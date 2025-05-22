import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChromaClient, Collection } from 'chromadb';
import { Document as LangchainDocument } from '@langchain/core/documents';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OpenAIEmbeddings } from '@langchain/openai';
import { QueryResult } from '../interfaces/embedding.interfaces';

type AddDocumentsResult =
  | { success: boolean; error?: string; response?: Record<string, unknown> }
  | AddDocumentsResult[];

@Injectable()
export class VectorStoreService implements OnModuleInit {
  private client: ChromaClient;
  private collection: Collection | null = null;
  private isInitialized = false;
  private readonly COLLECTION_NAME = 'tech-support-assistant';
  private embeddings: OpenAIEmbeddings;
  private vectorStore: Chroma;

  constructor(private configService: ConfigService) {
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    const embeddings = new OpenAIEmbeddings({
      modelName: 'text-embedding-3-small',
      apiKey: openaiApiKey,
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
    ids?: string[],
    metadatas?: Record<string, unknown>[],
  ): Promise<AddDocumentsResult> {
    try {
      const langchainDocs = documents.map((text, i) => {
        return new LangchainDocument({
          pageContent: text,
          metadata: metadatas ? metadatas[i] : {},
        });
      });

      await this.vectorStore.addDocuments(langchainDocs, { ids });

      console.log(
        `${documents.length} documentos añadidos a Chroma (colección: ${this.COLLECTION_NAME}) con embeddings de dimensión`,
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
  ): Promise<QueryResult> {
    try {
      const results = await this.vectorStore.similaritySearch(query, nResults);

      return {
        ids: results.map((doc) => (doc.metadata.id as string) || ''),
        documents: results.map((doc) => doc.pageContent),
        metadatas: results.map((doc) => doc.metadata),
        urls: results.map(
          (doc) =>
            `${this.configService.get('URL_DOCS')}/${doc.metadata.fileName}`,
        ),
      };
    } catch (error) {
      console.error('Error al consultar documentos:', error);
      throw error;
    }
  }

  async getAllDocuments(): Promise<QueryResult> {
    try {
      const results = await this.vectorStore.similaritySearch('', 1000);

      return {
        ids: results.map((doc) => (doc.metadata.id as string) || ''),
        documents: results.map((doc) => doc.pageContent),
        metadatas: results.map((doc) => doc.metadata),
        urls: results.map(
          (doc) =>
            `${this.configService.get('URL_DOCS')}/${doc.metadata.fileName}`,
        ),
      };
    } catch (error) {
      console.error('Error obteniendo documentos de Chroma:', error);
      throw error;
    }
  }
}
