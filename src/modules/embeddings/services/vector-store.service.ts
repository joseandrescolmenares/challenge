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

// Definir interfaces para los resultados de búsqueda para evitar 'any'
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

    // Inicializar OpenAI Embeddings con el modelo correcto
    const embeddings = new OpenAIEmbeddings({
      modelName: 'text-embedding-3-small',
      openAIApiKey: apiKey,
    });

    // Configurar Chroma de LangChain
    this.vectorStore = new Chroma(embeddings, {
      collectionName: this.COLLECTION_NAME,
      url: 'http://localhost:8000',
      collectionMetadata: {
        'hnsw:space': 'cosine',
      },
    });

    this.embeddings = embeddings;
  }

  onModuleInit(): void {
    // Completamos la inicialización al arrancar
    this.isInitialized = true;
    console.log('Servicio de vectores inicializado correctamente');
  }

  /**
   * Inicializa la conexión con Chroma y la colección si es necesario
   */
  initChroma(): void {
    // Ya inicializamos en el constructor, marcamos como inicializado
    if (!this.isInitialized) {
      this.isInitialized = true;
      console.log('Conexión con Chroma inicializada');
    }
  }

  /**
   * Añade documentos al almacén de vectores
   * Compatible con el método usado en DocumentLoaderService
   */
  async addDocuments(
    documents: string[],
    ids: string[],
    metadatas?: Record<string, unknown>[],
  ): Promise<AddDocumentsResult> {
    try {
      // Validaciones básicas
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

      // Convertir strings a documentos de LangChain
      const langchainDocs = documents.map((text, i) => {
        return new LangchainDocument({
          pageContent: text,
          metadata: metadatas ? metadatas[i] : {},
        });
      });

      // Añadir documentos usando la API de LangChain Chroma
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

  /**
   * Consulta documentos similares en el almacén de vectores
   * Renombrado para mantener compatibilidad con la interfaz anterior
   */
  async queryDocuments(
    query: string,
    nResults: number = 3,
  ): Promise<VectorStoreResult> {
    try {
      const results = await this.vectorStore.similaritySearch(query, nResults);

      // Transformar resultados al formato esperado por los servicios existentes
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

  /**
   * Obtiene todos los documentos en el almacén de vectores
   * Necesario para la función getVectorStoreData en DocumentLoaderService
   */
  async getAllDocuments(): Promise<VectorStoreResult> {
    try {
      // Obtener todos los documentos usando una búsqueda vacía con límite alto
      const results = await this.vectorStore.similaritySearch('', 1000);

      return {
        ids: results.map(
          (doc: SearchResult) => (doc.metadata.id as string) || '',
        ),
        documents: results.map((doc: SearchResult) => doc.pageContent),
        metadatas: results.map((doc: SearchResult) => doc.metadata),
        embeddings: [], // No podemos obtener embeddings directamente con LangChain
      };
    } catch (error) {
      console.error('Error obteniendo documentos de Chroma:', error);
      throw error;
    }
  }
}
