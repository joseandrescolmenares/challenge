import { Module } from '@nestjs/common';
import { ChatController } from './controllers/chat.controller';
import { ChatService } from './services/proccesMessage.service';
import { LLMModule } from '../llm/llm.module';
import { ToolsModule } from '../tools/tools.module';
import { VectorStoreService } from '../embeddings/services/vector-store.service';
@Module({
  imports: [LLMModule, ToolsModule],
  controllers: [ChatController],
  providers: [ChatService, VectorStoreService],
})
export class AgentModule {}
