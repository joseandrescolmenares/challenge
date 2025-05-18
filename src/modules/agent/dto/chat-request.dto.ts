import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ChatRequestDto {
  @IsString()
  @IsNotEmpty()
  message: string;
  
  @IsString()
  @IsOptional()
  conversationId?: string;
} 