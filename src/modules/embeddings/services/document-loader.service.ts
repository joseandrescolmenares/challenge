import { Injectable, OnModuleInit } from '@nestjs/common';
import { VectorStoreService } from './vector-store.service';
import * as fs from 'fs';
import * as path from 'path';
import { MarkdownTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/document';

interface DocMetadata {
  documentType: string;
  fileName: string;
  source: string;
  loc?: {
    index?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Interfaz para los datos devueltos por la función getVectorStoreData
 */
export interface VectorStoreDataResult {
  success: boolean;
  count?: number;
  data?: {
    ids: string[];
    documents: (string | null)[];
    metadatas: Record<string, any>[];
    hasEmbeddings: boolean;
  };
  error?: string;
  details?: string;
}

@Injectable()
export class DocumentLoaderService implements OnModuleInit {
  private readonly DOCS_PATH = path.join(process.cwd(), 'data', 'docs');
  private readonly markdownSplitter = new MarkdownTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  constructor(private readonly vectorStoreService: VectorStoreService) {}

  async onModuleInit() {
    try {
      await this.loadDocuments();
      console.log('Documentos técnicos cargados correctamente');
    } catch (error) {
      console.error('Error cargando documentos:', error);
    }
  }

  async loadDocuments() {
    // Comprobar si el directorio existe
    if (!fs.existsSync(this.DOCS_PATH)) {
      console.warn(`El directorio de documentos ${this.DOCS_PATH} no existe`);
      return;
    }

    // Leer los archivos Markdown
    const files = fs
      .readdirSync(this.DOCS_PATH)
      .filter((file) => file.endsWith('.md'));

    if (files.length === 0) {
      console.warn('No se encontraron archivos Markdown en el directorio');
      return;
    }

    // Procesar cada archivo
    for (const file of files) {
      const filePath = path.join(this.DOCS_PATH, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const documentType = path.basename(file, '.md');

      console.log(`Procesando documento ${documentType}`);

      try {
        // Crear documento de LangChain con metadatos
        const document = new Document({
          pageContent: content,
          metadata: {
            documentType,
            fileName: file,
            source: 'SmartHome Hub X1000 Documentation',
          } as DocMetadata,
        });

        // Dividir el documento usando el splitter adecuado según el tipo
        let splitDocs: Document<DocMetadata>[] = [];
        if (file.endsWith('.md')) {
          splitDocs = (await this.markdownSplitter.splitDocuments([
            document,
          ])) as Document<DocMetadata>[];
          console.log(
            `Generados ${splitDocs.length} chunks para ${file} usando MarkdownTextSplitter`,
          );
        }

        // Extraer los textos, generar IDs y metadatos para cada chunk
        const chunks = splitDocs.map((doc) => doc.pageContent);
        const ids = splitDocs.map(
          (_, i) => `${documentType}-${i}-${Date.now()}`,
        );
        const metadatas = splitDocs.map((doc) => {
          const metadata = doc.metadata;
          const index =
            typeof metadata.loc?.index === 'number' ? metadata.loc.index : 0;
          return {
            ...metadata,
            chunkIndex: index,
            chunkTotal: splitDocs.length,
            strategy: 'markdown-splitter',
          };
        });

        // Guardar en la base de vectores
        console.log(`Guardando ${chunks.length} chunks en Chroma`);
        await this.vectorStoreService.addDocuments(chunks, ids, metadatas);
        console.log(`Documento ${file} procesado y guardado correctamente`);
      } catch (error) {
        console.error(`Error procesando documento ${file}:`, error);
        console.log(`Usando método de fallback para procesar ${file}`);

        try {
          // Método alternativo de procesamiento
          const chunks = this.splitIntoChunksSimple(content, 1000);
          console.log(
            `Generados ${chunks.length} chunks usando método simple de fallback`,
          );

          // Generar IDs únicos con timestamp para evitar colisiones
          const timestamp = Date.now();
          const ids = chunks.map(
            (_, index) => `${documentType}-fallback-${index}-${timestamp}`,
          );

          const metadatas = chunks.map((_, index) => ({
            documentType,
            fileName: file,
            chunkIndex: index,
            chunkTotal: chunks.length,
            source: 'SmartHome Hub X1000 Documentation',
            strategy: 'fallback-simple',
          }));

          // Intentar guardar en lotes más pequeños
          console.log(
            `Guardando ${chunks.length} chunks de fallback en Chroma`,
          );
          await this.vectorStoreService.addDocuments(chunks, ids, metadatas);
          console.log(
            `Documento ${file} procesado con método fallback y guardado correctamente`,
          );
        } catch (fallbackError) {
          console.error(
            `Error crítico procesando documento ${file} incluso con fallback:`,
            fallbackError,
          );
        }
      }
    }
  }

  /**
   * Método simple de fallback por si falla el splitter principal
   */
  private splitIntoChunksSimple(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];

    // División simple basada en encabezados (##)
    const sections = text.split(/(?=##\s)/);

    for (const section of sections) {
      if (section.length <= chunkSize) {
        chunks.push(section);
      } else {
        // Si la sección es muy grande, dividirla en párrafos
        const paragraphs = section.split(/\n\n/);
        let currentChunk = '';

        for (const paragraph of paragraphs) {
          if (currentChunk.length + paragraph.length + 2 <= chunkSize) {
            currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
          } else {
            if (currentChunk) {
              chunks.push(currentChunk);
              currentChunk = paragraph;
            } else {
              // El párrafo es demasiado grande, dividirlo por la fuerza
              chunks.push(paragraph.substring(0, chunkSize));
              currentChunk = paragraph.substring(chunkSize);
            }
          }
        }

        if (currentChunk) {
          chunks.push(currentChunk);
        }
      }
    }

    return chunks;
  }

  /**
   * Obtiene todos los datos almacenados en la colección de vectores
   */
  async getVectorStoreData(): Promise<VectorStoreDataResult> {
    try {
      const data = await this.vectorStoreService.getAllDocuments();

      // Verificar que los datos tengan la estructura esperada
      if (!data || !data.ids) {
        return {
          success: false,
          error: 'No se pudieron obtener datos del vector store',
        };
      }

      // Filtrar valores nulos y convertir a la estructura esperada
      const documents = Array.isArray(data.documents) ? data.documents : [];
      const metadatas = Array.isArray(data.metadatas)
        ? (data.metadatas.map((m) => m || {}) as Record<string, any>[])
        : [];

      return {
        success: true,
        count: data.ids.length,
        data: {
          ids: data.ids,
          documents: documents,
          metadatas: metadatas,
          hasEmbeddings:
            Array.isArray(data.embeddings) && data.embeddings.length > 0,
        },
      };
    } catch (error: any) {
      console.error('Error obteniendo datos del vector store:', error);
      return {
        success: false,
        error: 'Error al obtener datos',
        details: (error as Error)?.message || 'Error desconocido',
      };
    }
  }
}
