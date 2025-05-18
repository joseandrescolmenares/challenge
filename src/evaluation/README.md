# Embedding Dimensions Evaluation

This directory contains the tools and results from our embedding model evaluation process. We tested two different embedding models with different dimensions:

- **OpenAI text-embedding-3-small**: 1536 dimensions
- **Cohere embed-multilingual-v3.0**: 768 dimensions

## Results Summary

After evaluating both models with the same set of test queries, we found that:

- Both models performed well in retrieving relevant results
- The Cohere model (768 dimensions) achieved an average score of 7.00/10
- The OpenAI model (1536 dimensions) achieved an average score of 4.60/10

Despite having fewer dimensions, the Cohere model consistently produced better results across most queries, particularly for questions about device connectivity and network requirements.

## Conclusion

We chose the Cohere model with 768 dimensions as our preferred embedding model because:

1. It provided better semantic understanding of queries
2. It uses less storage space (768 vs 1536 dimensions)
3. It demonstrated higher accuracy in retrieving relevant support documentation

This evaluation demonstrates that higher dimensionality does not always translate to better performance. The quality of the underlying model and how well it matches the specific use case are more important factors.

## Running the Evaluation

To run the evaluation yourself:

```bash
npx ts-node src/evaluation/scripts/evaluate-embeddings.ts
```

Results will be saved in the `src/evaluation/results` directory. 