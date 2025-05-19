import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from '../services/proccesMessage.service';
import { ChatRequestDto } from '../dto/chat-request.dto';
import { v4 as uuid } from 'uuid';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async sendMessage(@Body() chatRequest: ChatRequestDto): Promise<any> {
    const conversationId = chatRequest.conversationId || uuid();
    return await this.chatService.processMessage(
      conversationId,
      chatRequest.message || 'Hola, como funciona el hub?',
    );
  }
}
