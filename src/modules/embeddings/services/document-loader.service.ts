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
export interface VectorStoreDataResult {
  success: boolean;
  data?: {
    documents: (string | null)[];
    metadatas: Record<string, any>[];
  };
  error?: string;
  details?: string;
}

@Injectable()
export class DocumentLoaderService {
  private readonly DOCS_PATH = path.join(process.cwd(), 'data', 'docs');
  private readonly markdownSplitter = new MarkdownTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
  });
  constructor(private readonly vectorStoreService: VectorStoreService) {}

  // async onModuleInit() {
  //   try {
  //     await this.loadDocuments();
  //     console.log('Documentos técnicos cargados correctamente');
  //   } catch (error) {
  //     console.error('Error cargando documentos:', error);
  //   }
  // }

  async loadDocuments() {
    if (!fs.existsSync(this.DOCS_PATH)) {
      console.warn(`El directorio de documentos ${this.DOCS_PATH} no existe`);
      return;
    }

    const files = fs
      .readdirSync(this.DOCS_PATH)
      .filter((file) => file.endsWith('.md'));

    if (files.length === 0) {
      console.warn('No se encontraron archivos Markdown en el directorio');
      return;
    }

    for (const file of files) {
      const filePath = path.join(this.DOCS_PATH, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const documentType = path.basename(file, '.md');

      console.log(`Procesando documento ${documentType}`);

      try {
        const document = new Document({
          pageContent: content,
          metadata: {
            documentType,
            fileName: file,
            source: 'SmartHome Hub X1000 Documentation',
          } as DocMetadata,
        });

        let splitDocs: Document<DocMetadata>[] = [];
        if (file.endsWith('.md')) {
          splitDocs = (await this.markdownSplitter.splitDocuments([
            document,
          ])) as Document<DocMetadata>[];
          console.log(
            `Generados ${splitDocs.length} chunks para ${file} usando MarkdownTextSplitter`,
          );
        }

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

        console.log(`Guardando ${chunks.length} chunks en Chroma`);
        await this.vectorStoreService.addDocuments(chunks, ids, metadatas);
        console.log(`Documento ${file} procesado y guardado correctamente`);
      } catch (error) {
        console.error(`Error procesando documento ${file}:`, error);
      }
    }
  }

  async getVectorStoreData(): Promise<VectorStoreDataResult> {
    try {
      const data = await this.vectorStoreService.getAllDocuments();

      if (!data || !data.ids) {
        return {
          success: false,
          error: 'No se pudieron obtener datos del vector store',
        };
      }

      const documents = Array.isArray(data.documents) ? data.documents : [];
      const metadatas = Array.isArray(data.metadatas)
        ? (data.metadatas.map((m) => m || {}) as Record<string, any>[])
        : [];

      return {
        success: true,
        data: {
          documents: documents,
          metadatas: metadatas,
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
