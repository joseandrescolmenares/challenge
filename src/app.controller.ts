import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';
import {
  formatDocumentTitle,
  renderDocumentPage,
  renderDocumentsList,
} from './utils/html-renderer.utils';
import { MarkdownUtils } from './utils/markdown-utils';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get(':fileName')
  @Header('Content-Type', 'text/html')
  getDocument(@Param('fileName') fileName: string, @Res() res: Response): void {
    try {
      const content = MarkdownUtils.getDocumentByName(fileName);
      const title = formatDocumentTitle(fileName);
      const html = renderDocumentPage(title, content);

      res.send(html);
    } catch {
      throw new NotFoundException('Documento no encontrado');
    }
  }

  @Get()
  @Header('Content-Type', 'text/html')
  listDocuments(@Res() res: Response): void {
    const documents = MarkdownUtils.getAllDocuments();

    const html = renderDocumentsList(documents);

    res.send(html);
  }
}
