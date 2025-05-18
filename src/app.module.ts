import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmbeddingsModule } from './modules/embeddings/embeddings.module';
import { ToolsModule } from './modules/tools/tools.module';
import { LLMModule } from './modules/llm/llm.module';
import { AgentModule } from './modules/agent/agent.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EmbeddingsModule,
    ToolsModule,
    LLMModule,
    AgentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
