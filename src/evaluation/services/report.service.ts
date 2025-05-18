import * as fs from 'fs';
import * as path from 'path';
import { EvaluationResponse } from '../schema';
import { EmbeddingModel } from './embedding.service';

// Structure for evaluation results
export interface EvaluationResult {
  query: string;
  results: {
    modelName: string;
    dimensions: number;
    evaluation: EvaluationResponse;
  }[];
  timestamp: string;
}

/**
 * Service for managing results and generating reports
 */
export class ReportService {
  private results: EvaluationResult[] = [];
  private models: EmbeddingModel[] = [];

  constructor(models: EmbeddingModel[]) {
    this.models = models;
  }

  /**
   * Adds an evaluation result
   */
  addResult(result: EvaluationResult): void {
    this.results.push(result);
  }

  /**
   * Saves the results to JSON and generates a report
   */
  saveResults(): { jsonPath: string; reportPath: string } {
    const resultsPath = path.join(
      process.cwd(),
      'src',
      'evaluation',
      'results',
    );

    // Create directory if it doesn't exist
    if (!fs.existsSync(resultsPath)) {
      fs.mkdirSync(resultsPath, { recursive: true });
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonFilePath = path.join(
      resultsPath,
      `embedding-evaluation-${timestamp}.json`,
    );

    // Save results to JSON
    fs.writeFileSync(jsonFilePath, JSON.stringify(this.results, null, 2));
    console.log(`Results saved to: ${jsonFilePath}`);

    // Generate Markdown report
    const reportFilePath = this.generateMarkdownReport(jsonFilePath);

    return {
      jsonPath: jsonFilePath,
      reportPath: reportFilePath,
    };
  }

  /**
   * Generates a Markdown report
   */
  private generateMarkdownReport(jsonFilePath: string): string {
    // Calculate average scores by model
    const modelScores: Record<
      string,
      {
        total: number;
        count: number;
        relevanceAnalysis: number[][];
      }
    > = {};

    // Collect statistics
    for (const result of this.results) {
      for (const modelResult of result.results) {
        const { modelName, evaluation } = modelResult;

        if (!modelScores[modelName]) {
          modelScores[modelName] = {
            total: 0,
            count: 0,
            relevanceAnalysis: [],
          };
        }

        // Accumulate general score
        modelScores[modelName].total += evaluation.score;
        modelScores[modelName].count += 1;

        // Save relevance analysis
        modelScores[modelName].relevanceAnalysis.push(
          evaluation.relevanceAnalysis.map((a) => a.relevanceScore),
        );
      }
    }

    // Generate report content
    let report = '# Embedding Models Evaluation\n\n';
    report += `Date: ${new Date().toLocaleDateString()}\n\n`;

    // Summary of evaluated models
    report += '## Evaluated Models\n\n';
    report += '| Model | Dimensions | Provider |\n';
    report += '|--------|-------------|----------|\n';

    for (const model of this.models) {
      report += `| ${model.name} | ${model.dimensions} | ${model.provider} |\n`;
    }

    // Score summary
    report += '\n## Score Summary\n\n';
    report += '| Model | Dimensions | Average Score | # Queries |\n';
    report += '|--------|-------------|-----------------|------------|\n';

    for (const model of this.models) {
      const scores = modelScores[model.name] || { total: 0, count: 0 };
      const avgScore =
        scores.count > 0 ? (scores.total / scores.count).toFixed(2) : 'N/A';

      report += `| ${model.name} | ${model.dimensions} | ${avgScore} | ${scores.count} |\n`;
    }

    // Details by query
    report += '\n## Details by Query\n\n';

    for (const result of this.results) {
      report += `### Query: "${result.query}"\n\n`;

      for (const modelResult of result.results) {
        const model = this.models.find((m) => m.name === modelResult.modelName);
        if (!model) continue;

        report += `#### ${modelResult.modelName} (${model.dimensions} dimensions)\n\n`;
        report += `**Score**: ${modelResult.evaluation.score}/10\n\n`;
        report += `**Explanation**:\n${modelResult.evaluation.reasoning}\n\n`;

        // Show relevance analysis by result
        report += '**Result Analysis**:\n\n';
        report += '| # | Relevance | Comment |\n';
        report += '|---|------------|------------|\n';

        for (const analysis of modelResult.evaluation.relevanceAnalysis) {
          report += `| ${analysis.resultIndex + 1} | ${analysis.relevanceScore}/10 | ${analysis.comments.substring(0, 100)}... |\n`;
        }

        report += '\n---\n\n';
      }
    }

    report += `\nComplete results file: ${path.basename(jsonFilePath)}\n`;

    // Save report
    const reportPath = path.join(
      path.dirname(jsonFilePath),
      `embedding-evaluation-report-${path.basename(jsonFilePath, '.json')}.md`,
    );
    fs.writeFileSync(reportPath, report);
    console.log(`Detailed report saved to: ${reportPath}`);

    return reportPath;
  }
}
