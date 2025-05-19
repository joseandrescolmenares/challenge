// utils/markdown-utils.ts
import * as fs from 'fs';
import * as path from 'path';
import { NotFoundException } from '@nestjs/common';

export class MarkdownUtils {
  private static readonly DOCS_PATH = path.join(process.cwd(), 'data', 'docs');

  static getDocumentByName(fileName: string): string {
    try {
      const docName = fileName.endsWith('.md') ? fileName : `${fileName}.md`;
      const filePath = path.join(this.DOCS_PATH, docName);

      if (!fs.existsSync(filePath)) {
        throw new NotFoundException(`Documento ${docName} no encontrado`);
      }

      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new NotFoundException(
        `Error al leer el documento: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }

  static getAllDocuments(): string[] {
    try {
      return fs
        .readdirSync(this.DOCS_PATH)
        .filter((file) => file.endsWith('.md'));
    } catch (error) {
      console.error('Error al listar documentos:', error);
      return [];
    }
  }
}
