import { Module } from '@nestjs/common';
import { ChatController } from './controllers/chat.controller';
import { ChatService } from './services/proccesMessage.service';
import { LLMModule } from '../llm/llm.module';
import { ToolsModule } from '../tools/tools.module';

@Module({
  imports: [LLMModule, ToolsModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class AgentModule {}
