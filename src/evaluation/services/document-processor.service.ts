import { MarkdownTextSplitter } from 'langchain/text_splitter';
import { Document as LangchainDocument } from '@langchain/core/documents';
import * as fs from 'fs';
import * as path from 'path';

export class DocumentProcessorService {
  private splitter: MarkdownTextSplitter;

  constructor(chunkSize = 500, chunkOverlap = 100) {
    this.splitter = new MarkdownTextSplitter({
      chunkSize,
      chunkOverlap,
    });
  }

  /**
   * Loads documents from a folder
   * @param docsPath Path to the documents folder
   * @returns Array of objects {file, content}
   */
  loadDocumentsFromFolder(
    docsPath: string,
  ): Array<{ file: string; content: string; documentType: string }> {
    const files = fs
      .readdirSync(docsPath)
      .filter((file) => file.endsWith('.md'));

    if (files.length === 0) {
      throw new Error('No Markdown documents found to load');
    }

    return files.map((file) => {
      const filePath = path.join(docsPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const documentType = path.basename(file, '.md');

      return {
        file,
        content,
        documentType,
      };
    });
  }

  /**
   * Splits a document into chunks using LangChain
   * @param content Document content
   * @param metadata Additional metadata
   * @returns Array of LangChain Documents
   */
  async splitDocumentIntoChunks(
    content: string,
    metadata: Record<string, any>,
  ): Promise<LangchainDocument[]> {
    const textChunks = await this.splitter.splitText(content);
    return textChunks.map((text, i) => {
      return new LangchainDocument({
        pageContent: text,
        metadata: {
          ...metadata,
          chunkIndex: i,
          chunkTotal: textChunks.length,
        },
      });
    });
  }
}
