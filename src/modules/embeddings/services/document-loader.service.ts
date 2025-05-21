import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { VectorStoreService } from './vector-store.service';
import * as fs from 'fs';
import * as path from 'path';
import { MarkdownTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/document';
import {
  DocMetadata,
  DocumentProcessingConfig,
} from '../interfaces/embedding.interfaces';
import { ChatOpenAI } from '@langchain/openai';
import { ConfigService } from '@nestjs/config';
import { AIRole } from '../../llm/enum/roles.enum';
@Injectable()
export class DocumentLoaderService {
  private readonly logger = new Logger(DocumentLoaderService.name);
  private readonly DOCS_PATH: string;
  private readonly markdownSplitter: MarkdownTextSplitter;
  private readonly model: ChatOpenAI;
  private readonly config: DocumentProcessingConfig;

  constructor(
    private readonly vectorStoreService: VectorStoreService,
    private readonly configService: ConfigService,
  ) {
    this.config = {
      chunkSize: parseInt(this.configService.get('CHUNK_SIZE', '1000')),
      chunkOverlap: parseInt(this.configService.get('CHUNK_OVERLAP', '200')),
      batchSize: parseInt(this.configService.get('BATCH_SIZE', '5')),
      delayBetweenBatches: parseInt(
        this.configService.get('DELAY_BETWEEN_BATCHES', '5000'),
      ),
      maxRetries: parseInt(this.configService.get('MAX_RETRIES', '3')),
      modelName: this.configService.get('EMBEDDING_MODEL', 'gpt-4o-mini'),
    };

    this.DOCS_PATH = path.join(process.cwd(), 'data', 'docs');

    this.markdownSplitter = new MarkdownTextSplitter({
      chunkSize: this.config.chunkSize,
      chunkOverlap: this.config.chunkOverlap,
    });

    this.model = new ChatOpenAI({
      model: this.config.modelName,
      temperature: 0,
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });

    this.logger.log(
      `Initialized with chunk size: ${this.config.chunkSize}, overlap: ${this.config.chunkOverlap}`,
    );
    this.logger.log(`Using model: ${this.config.modelName}`);
  }

  // async onModuleInit() {
  //   try {
  //     this.logger.log('Starting document loading process...');
  //     await this.loadDocuments();
  //     this.logger.log('Documents loaded successfully');
  //   } catch (error) {
  //     this.logger.error('Error loading documents:', error);
  //   }
  // }

  async loadDocuments(): Promise<void> {
    const files = this.getMarkdownFiles();
    if (files.length === 0) {
      this.logger.log('No markdown files found in the docs directory');
      return;
    }

    this.logger.log(`Found ${files.length} markdown files to process`);

    for (const file of files) {
      await this.processFile(file);
    }
  }

  private getMarkdownFiles(): string[] {
    return fs
      .readdirSync(this.DOCS_PATH)
      .filter((file) => file.endsWith('.md'));
  }

  private async processFile(file: string): Promise<void> {
    const filePath = path.join(this.DOCS_PATH, file);
    const documentType = path.basename(file, '.md');

    this.logger.log(`Processing document: ${file}`);

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const document = this.createDocument(content, file, documentType);
      const splitDocs = await this.splitDocument(document, file);

      if (splitDocs.length === 0) {
        this.logger.warn(`No chunks generated for ${file}, skipping`);
        return;
      }

      const contextualizedContents: string[] = [];
      const metadatas: DocMetadata[] = [];
      const ids: string[] = [];

      for (let i = 0; i < splitDocs.length; i++) {
        const doc = splitDocs[i];

        const contextualizedContent = await this.generateContextualChunks(
          content,
          doc.pageContent,
        );
        contextualizedContents.push(contextualizedContent);

        metadatas.push({
          ...doc.metadata,
          chunkIndex: i,
          totalChunks: splitDocs.length,
        });
        ids.push(`doc-${file}-${i}-${Date.now()}`);
      }

      await this.vectorStoreService.addDocuments(
        contextualizedContents,
        ids,
        metadatas,
      );

      this.logger.log(`Document ${file} processed and stored successfully`);
    } catch (error) {
      this.logger.error(`Error processing document ${file}:`, error);
    }
  }

  private createDocument(
    content: string,
    filename: string,
    documentType: string,
  ): Document<DocMetadata> {
    return new Document({
      pageContent: content,
      metadata: {
        documentType,
        fileName: filename,
        source: 'SmartHome Hub X1000 Documentation',
        url: `http://localhost:8080/${filename}`,
      } as DocMetadata,
    });
  }

  private async splitDocument(
    document: Document<DocMetadata>,
    filename: string,
  ): Promise<Document<DocMetadata>[]> {
    const splitDocs = (await this.markdownSplitter.splitDocuments([
      document,
    ])) as Document<DocMetadata>[];

    this.logger.log(
      `Generated ${splitDocs.length} chunks for ${filename} using MarkdownTextSplitter`,
    );

    return splitDocs;
  }

  private async generateContextualChunks(
    document: string,
    doc: string,
  ): Promise<string> {
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const aiMsg = await this.model.invoke([
          {
            role: AIRole.SYSTEM,
            content: this.getContextGenerationPrompt(document, doc),
          },
          { role: AIRole.USER, content: 'Generate context for this chunk' },
        ]);

        return typeof aiMsg.content === 'string'
          ? aiMsg.content
          : JSON.stringify(aiMsg.content);
      } catch (error) {
        this.logger.warn(
          `Attempt ${attempt + 1}/${this.config.maxRetries} failed: ${error || error}`,
        );

        await this.delay(1000 * Math.pow(2, attempt));
      }
    }

    return '';
  }

  private getContextGenerationPrompt(
    documentContext: string,
    chunkContent: string,
  ): string {
    return `<document_context> 
${documentContext}
</document_context> 
<chunk> 
${chunkContent} 
</chunk> 
Provide a brief contextual description (40-50 words) of where this chunk fits within the overall document to improve search retrieval. Focus on the main topic and purpose of this section. Answer with just the context description, nothing else.`;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
