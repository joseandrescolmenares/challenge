import { Controller, Get } from '@nestjs/common';
import {
  DocumentLoaderService,
  VectorStoreDataResult,
} from '../services/document-loader.service';
import { Query } from '@nestjs/common';
import {
  VectorStoreService,
  VectorStoreResult,
} from '../services/vector-store.service';

@Controller('embeddings')
export class EmbeddingsController {
  constructor(
    private readonly documentLoaderService: DocumentLoaderService,
    private readonly vectorStoreService: VectorStoreService,
  ) {}

  @Get('data')
  async getVectorStoreData(): Promise<VectorStoreDataResult> {
    return await this.documentLoaderService.getVectorStoreData();
  }

  @Get('query')
  async queryDocuments(
    @Query('query') query: string,
  ): Promise<VectorStoreResult> {
    // Si no hay consulta, proporcionamos una predeterminada
    const searchQuery = query || '¿Qué es un SmartHome Hub?';
    return await this.vectorStoreService.queryDocuments(searchQuery);
  }
}
