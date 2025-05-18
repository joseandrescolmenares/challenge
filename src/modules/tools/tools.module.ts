import { Module } from '@nestjs/common';
import { ToolsExecutorService } from './services/tools-executor.service';
import { ToolsRegistryService } from './services/tools-registry.service';
import { EmbeddingsModule } from '../embeddings/embeddings.module';

@Module({
  imports: [EmbeddingsModule],
  providers: [ToolsExecutorService, ToolsRegistryService],
  exports: [ToolsExecutorService, ToolsRegistryService],
})
export class ToolsModule {}
