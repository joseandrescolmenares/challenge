import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(process.env.PORT ?? 8080);

  console.log(
    `Aplicación disponible en: http://localhost:${process.env.PORT || 8080}`,
  );
}
bootstrap();
