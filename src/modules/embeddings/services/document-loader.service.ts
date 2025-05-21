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

@Injectable()
export class DocumentLoaderService implements OnModuleInit {
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

  async onModuleInit() {
    try {
      this.logger.log('Starting document loading process...');
      await this.loadDocuments();
      this.logger.log('Documents loaded successfully');
    } catch (error) {
      this.logger.error('Error loading documents:', error);
    }
  }

  async loadDocuments(): Promise<void> {
    if (!this.checkDocsDirectory()) {
      return;
    }

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

  private checkDocsDirectory(): boolean {
    if (!fs.existsSync(this.DOCS_PATH)) {
      this.logger.warn(`Documents directory not found: ${this.DOCS_PATH}`);
      return false;
    }
    return true;
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

      const chunks = await this.generateContextualChunks(splitDocs, document);
      await this.storeDocumentChunks(chunks, splitDocs, documentType);

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
    splitDocs: Document<DocMetadata>[],
    document: Document<DocMetadata>,
  ): Promise<string[]> {
    const chunks: string[] = [];
    const totalChunks = splitDocs.length;

    this.logger.log(
      `Generating contextual chunks in batches of ${this.config.batchSize}...`,
    );

    for (let i = 0; i < totalChunks; i += this.config.batchSize) {
      const batchNumber = Math.floor(i / this.config.batchSize) + 1;
      const totalBatches = Math.ceil(totalChunks / this.config.batchSize);
      this.logger.log(`Processing batch ${batchNumber}/${totalBatches}`);

      const batch = splitDocs.slice(i, i + this.config.batchSize);
      const batchResults = await this.processBatch(batch, document);

      chunks.push(...batchResults);

      if (i + this.config.batchSize < totalChunks) {
        this.logger.log(
          `Waiting ${this.config.delayBetweenBatches}ms before next batch...`,
        );
        await this.delay(this.config.delayBetweenBatches);
      }
    }

    return chunks;
  }

  private async processBatch(
    batch: Document<DocMetadata>[],
    document: Document<DocMetadata>,
  ): Promise<string[]> {
    return Promise.all(
      batch.map((doc) => this.processChunkWithRetry(doc, document)),
    );
  }

  private async processChunkWithRetry(
    doc: Document<DocMetadata>,
    document: Document<DocMetadata>,
  ): Promise<string> {
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const context = this.extractRelevantContext(
          document.pageContent,
          doc.pageContent,
        );
        const aiMsg = await this.model.invoke([
          {
            role: 'system',
            content: this.getContextGenerationPrompt(context, doc.pageContent),
          },
          { role: 'user', content: 'Generate context for this chunk' },
        ]);

        return typeof aiMsg.content === 'string'
          ? aiMsg.content
          : JSON.stringify(aiMsg.content);
      } catch (error) {
        this.logger.warn(
          `Attempt ${attempt + 1}/${this.config.maxRetries} failed: ${error || error}`,
        );

        if (attempt === this.config.maxRetries - 1) {
          this.logger.warn(
            'All retries failed, generating basic context without LLM',
          );
          return this.generateBasicContext(doc.pageContent);
        }

        await this.delay(1000 * Math.pow(2, attempt));
      }
    }

    return '';
  }

  private extractRelevantContext(
    fullContent: string,
    chunkContent: string,
  ): string {
    const chunkStartPos = fullContent.indexOf(chunkContent);

    if (chunkStartPos === -1) {
      return fullContent.slice(0, 200) + '...';
    }

    const contextWindow = 250;
    const start = Math.max(0, chunkStartPos - contextWindow);
    const end = Math.min(
      fullContent.length,
      chunkStartPos + chunkContent.length + contextWindow,
    );

    return (
      (start > 0 ? '...' : '') +
      fullContent.slice(start, end) +
      (end < fullContent.length ? '...' : '')
    );
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

  private generateBasicContext(content: string): string {
    const firstLine = content.split('\n')[0] || '';
    const words = content.split(/\s+/).slice(0, 12).join(' ');
    return `Section about ${firstLine || words}...`;
  }

  private async storeDocumentChunks(
    chunks: string[],
    splitDocs: Document<DocMetadata>[],
    documentType: string,
  ): Promise<void> {
    const ids = splitDocs.map((_, i) => `${documentType}-${i}-${Date.now()}`);

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

    this.logger.log(`Storing ${chunks.length} chunks in vector database`);
    await this.vectorStoreService.addDocuments(chunks, ids, metadatas);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
