import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmbeddingsModule } from './modules/embeddings/embeddings.module';
import { ToolsModule } from './modules/tools/tools.module';
import { LLMModule } from './modules/llm/llm.module';
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EmbeddingsModule,
    ToolsModule,
    LLMModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
