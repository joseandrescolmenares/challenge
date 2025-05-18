import { Module } from '@nestjs/common';
import { VectorStoreService } from './services/vector-store.service';
import { DocumentLoaderService } from './services/document-loader.service';
import { EmbeddingsController } from './controllers/embeddings.controller';

@Module({
  controllers: [EmbeddingsController],
  providers: [VectorStoreService, DocumentLoaderService],
  exports: [VectorStoreService],
})
export class EmbeddingsModule {}
