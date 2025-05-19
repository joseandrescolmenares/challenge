import * as fs from 'fs';
import * as path from 'path';
import {
  EmbeddingModel,
  EvaluationResult,
} from '../../modules/embeddings/interfaces/embedding.interfaces';

export class ReportService {
  private results: EvaluationResult[] = [];
  private models: EmbeddingModel[] = [];

  constructor(models: EmbeddingModel[]) {
    this.models = models;
  }

  addResult(result: EvaluationResult): void {
    this.results.push(result);
  }

  saveResults(): void {
    const resultsPath = path.join(
      process.cwd(),
      'src',
      'evaluation',
      'results',
    );
    if (!fs.existsSync(resultsPath)) {
      fs.mkdirSync(resultsPath, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonFilePath = path.join(
      resultsPath,
      `embedding-evaluation-${timestamp}.json`,
    );

    fs.writeFileSync(jsonFilePath, JSON.stringify(this.results, null, 2));
    console.log(`Results saved to: ${jsonFilePath}`);
  }
}
