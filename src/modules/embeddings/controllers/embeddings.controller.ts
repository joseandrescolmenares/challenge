import { Controller, Get } from '@nestjs/common';
import { DocumentLoaderService } from '../services/document-loader.service';
import { Query } from '@nestjs/common';
import { VectorStoreService } from '../services/vector-store.service';
import { QueryResult } from '../interfaces/embedding.interfaces';

@Controller('embeddings')
export class EmbeddingsController {
  constructor(
    private readonly documentLoaderService: DocumentLoaderService,
    private readonly vectorStoreService: VectorStoreService,
  ) {}

  @Get('query')
  async queryDocuments(@Query('query') query: string): Promise<QueryResult> {
    const searchQuery = query || 'Como lo instalo?';
    return await this.vectorStoreService.queryDocuments(searchQuery);
  }
}
