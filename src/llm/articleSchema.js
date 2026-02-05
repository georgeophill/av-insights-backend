export const articleAnalysisSchema = {
  name: "article_analysis",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      av_relevance: { type: "boolean" },
      relevance_score: { type: "number", minimum: 0, maximum: 1 },

      summary: {
        type: "array",
        minItems: 3,
        maxItems: 5,
        items: { type: "string" }
      },

      companies: {
        type: "array",
        maxItems: 25,
        items: { type: "string" }
      },

      category: {
        type: "string",
        enum: ["safety","regulation","hardware","software","partnerships","incidents","business","stocks","markets","other"]
      },

      sentiment: { type: "string", enum: ["positive","neutral","negative"] },
      impact: { type: "string", enum: ["low","medium","high"] },
      regulatory_relevance: { type: "boolean" },

      themes: {
        type: "array",
        maxItems: 10,
        items: { type: "string" }
      }
    },
    required: [
      "av_relevance",
      "relevance_score",
      "summary",
      "companies",
      "category",
      "sentiment",
      "impact",
      "regulatory_relevance",
      "themes"
    ]
  },
  strict: true
};