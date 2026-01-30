import { Injectable, Logger } from '@nestjs/common';
import { GoogleCloudService } from './google-cloud.service';
import { PrismaService } from '../../prisma/prisma.service';

export interface SpendingPattern {
  category: string;
  averageMonthly: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  variance: number;
  seasonality?: string;
}

export interface BudgetRecommendation {
  category: string;
  currentBudget?: number;
  recommendedBudget: number;
  reasoning: string;
  confidence: number;
  potentialSavings?: number;
}

export interface BudgetAnalysis {
  spendingPatterns: SpendingPattern[];
  recommendations: BudgetRecommendation[];
  insights: string[];
  overallHealth: number; // 0-100
}

export interface WhatIfScenario {
  name: string;
  assumptions: Record<string, any>;
  projectedSpent: number;
  projectedSavings: number;
  analysis: string;
  recommendations: string[];
}

@Injectable()
export class AIBudgetService {
  private readonly logger = new Logger(AIBudgetService.name);

  constructor(
    private readonly googleCloud: GoogleCloudService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Analyze user's spending patterns using AI
   */
  async analyzeSpendingPatterns(
    userId: string,
    months: number = 6,
  ): Promise<BudgetAnalysis> {
    try {
      // Get historical transaction data
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const transactions = await this.prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: startDate },
          type: 'EXPENSE',
        },
        include: {
          category: true,
        },
        orderBy: { date: 'desc' },
      });

      // Aggregate spending by category
      const categorySpending = transactions.reduce(
        (acc, tx) => {
          const categoryName = tx.category?.name || 'Uncategorized';
          if (!acc[categoryName]) {
            acc[categoryName] = [];
          }
          acc[categoryName].push({
            amount: tx.amount,
            date: tx.date,
          });
          return acc;
        },
        {} as Record<string, Array<{ amount: number; date: Date }>>,
      );

      // Prepare data for AI analysis
      const spendingData = Object.entries(categorySpending).map(
        ([category, txs]) => {
          const total = txs.reduce((sum, tx) => sum + tx.amount, 0);
          const avg = total / months;
          return {
            category,
            total,
            average: avg,
            transactionCount: txs.length,
            transactions: txs.map((tx) => ({
              amount: tx.amount,
              month: tx.date.toISOString().substring(0, 7),
            })),
          };
        },
      );

      // Get current budgets
      const budgets = await this.prisma.budget.findMany({
        where: { userId, isActive: true },
        include: { category: true },
      });

      // Build AI prompt
      const prompt = `You are a financial advisor analyzing spending patterns and budgets.

Historical Spending Data (last ${months} months):
${JSON.stringify(spendingData, null, 2)}

Current Budgets:
${JSON.stringify(
  budgets.map((b) => ({
    category: b.category?.name || 'Unknown',
    amount: b.amount,
    spent: b.spent,
    utilization: ((b.spent / b.amount) * 100).toFixed(1) + '%',
  })),
  null,
  2,
)}

Analyze this data and provide:
1. Spending patterns for each category (trend: increasing/decreasing/stable, variance, seasonality)
2. Budget recommendations for each category with reasoning
3. Key insights about spending behavior
4. Overall financial health score (0-100)

Format response as JSON:
{
  "spendingPatterns": [
    {
      "category": "string",
      "averageMonthly": number,
      "trend": "increasing|decreasing|stable",
      "variance": number,
      "seasonality": "string or null"
    }
  ],
  "recommendations": [
    {
      "category": "string",
      "currentBudget": number or null,
      "recommendedBudget": number,
      "reasoning": "string",
      "confidence": number (0-1),
      "potentialSavings": number or null
    }
  ],
  "insights": ["string"],
  "overallHealth": number (0-100)
}`;

      const response = await this.googleCloud.generateText(prompt);

      // Parse AI response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      const analysis: BudgetAnalysis = JSON.parse(
        jsonMatch[0],
      ) as BudgetAnalysis;

      this.logger.log(`Generated budget analysis for user ${userId}`);
      return analysis;
    } catch (error: any) {
      this.logger.error(
        `Error analyzing spending patterns: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Generate AI-powered budget recommendations
   */
  async generateBudgetRecommendations(
    userId: string,
  ): Promise<BudgetRecommendation[]> {
    try {
      const analysis = await this.analyzeSpendingPatterns(userId);

      // Store recommendations in database
      for (const rec of analysis.recommendations) {
        await this.prisma.aIRecommendation.create({
          data: {
            userId,
            type: 'BUDGET_OPTIMIZATION',
            title: `Optimize ${rec.category} budget`,
            description: rec.reasoning,
            currentValue: rec.currentBudget,
            recommendedValue: rec.recommendedBudget,
            potentialSavings: rec.potentialSavings,
            confidence: rec.confidence,
            model: 'gemini-1.5-pro',
            reasoning: rec.reasoning,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        });
      }

      return analysis.recommendations;
    } catch (error) {
      this.logger.error(
        `Error generating budget recommendations: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Analyze what-if budget scenarios
   */
  async analyzeWhatIfScenario(
    userId: string,
    budgetId: string,
    assumptions: Record<string, any>,
  ): Promise<WhatIfScenario> {
    try {
      // Get budget details
      const budget = await this.prisma.budget.findUnique({
        where: { id: budgetId },
        include: { category: true },
      });

      if (!budget) {
        throw new Error('Budget not found');
      }

      // Get historical data
      const analysis = await this.analyzeSpendingPatterns(userId, 3);

      // Build AI prompt
      const prompt = `You are a financial advisor analyzing a what-if budget scenario.

Current Budget:
- Category: ${budget.category?.name || 'Multiple'}
- Amount: $${budget.amount}
- Current Spent: $${budget.spent}
- Method: ${budget.budgetingMethod}

Historical Patterns:
${JSON.stringify(analysis.spendingPatterns, null, 2)}

What-If Assumptions:
${JSON.stringify(assumptions, null, 2)}

Analyze this scenario and provide:
1. Projected spending based on assumptions
2. Projected savings
3. Detailed analysis of the scenario
4. Recommendations for success

Format response as JSON:
{
  "projectedSpent": number,
  "projectedSavings": number,
  "analysis": "detailed analysis string",
  "recommendations": ["string"]
}`;

      const response = await this.googleCloud.generateText(prompt);

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      const scenarioResult = JSON.parse(jsonMatch[0]);

      // Store scenario in database
      await this.prisma.budgetScenario.create({
        data: {
          budgetId,
          userId,
          name: assumptions.name || 'What-If Scenario',
          description: assumptions.description,
          scenarioType: assumptions.type || 'WHAT_IF',
          assumptions,
          projectedSpent: scenarioResult.projectedSpent,
          projectedSavings: scenarioResult.projectedSavings,
          analysis: scenarioResult,
        },
      });

      return {
        name: assumptions.name || 'What-If Scenario',
        assumptions,
        ...scenarioResult,
      };
    } catch (error) {
      this.logger.error(
        `Error analyzing what-if scenario: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Identify cost reduction opportunities using AI
   */
  async identifyCostReductions(userId: string): Promise<any[]> {
    try {
      const analysis = await this.analyzeSpendingPatterns(userId, 6);

      const prompt = `You are a financial advisor identifying cost reduction opportunities.

Spending Analysis:
${JSON.stringify(analysis, null, 2)}

Identify specific, actionable cost reduction opportunities. For each opportunity provide:
1. Category affected
2. Current monthly spending
3. Potential monthly savings
4. Specific actions to take
5. Difficulty level (easy/medium/hard)
6. Impact level (low/medium/high)

Format response as JSON array:
[
  {
    "category": "string",
    "currentSpending": number,
    "potentialSavings": number,
    "actions": ["string"],
    "difficulty": "easy|medium|hard",
    "impact": "low|medium|high",
    "reasoning": "string"
  }
]`;

      const response = await this.googleCloud.generateText(prompt);

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      const opportunities = JSON.parse(jsonMatch[0]);

      // Store as recommendations
      for (const opp of opportunities) {
        await this.prisma.aIRecommendation.create({
          data: {
            userId,
            type: 'COST_REDUCTION',
            title: `Reduce ${opp.category} spending`,
            description: opp.reasoning,
            currentValue: opp.currentSpending,
            recommendedValue: opp.currentSpending - opp.potentialSavings,
            potentialSavings: opp.potentialSavings,
            confidence:
              opp.impact === 'high' ? 0.8 : opp.impact === 'medium' ? 0.6 : 0.4,
            model: 'gemini-1.5-pro',
            reasoning: opp.reasoning,
            actionItems: { actions: opp.actions, difficulty: opp.difficulty },
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }

      return opportunities;
    } catch (error) {
      this.logger.error(
        `Error identifying cost reductions: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Forecast expenses using AI
   */
  async forecastExpenses(
    userId: string,
    days: number = 30,
  ): Promise<{
    totalForecast: number;
    categoryForecasts: Array<{ category: string; forecast: number }>;
    confidence: number;
  }> {
    try {
      const analysis = await this.analyzeSpendingPatterns(userId, 6);

      const prompt = `You are a financial forecasting expert.

Historical Spending Patterns:
${JSON.stringify(analysis.spendingPatterns, null, 2)}

Forecast expenses for the next ${days} days. Consider:
1. Historical trends
2. Seasonality
3. Current patterns

Format response as JSON:
{
  "totalForecast": number,
  "categoryForecasts": [
    {
      "category": "string",
      "forecast": number
    }
  ],
  "confidence": number (0-1)
}`;

      const response = await this.googleCloud.generateText(prompt);

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      this.logger.error(
        `Error forecasting expenses: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Detect budget anomalies using AI
   */
  async detectAnomalies(userId: string): Promise<any[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // Last 7 days

      const recentTransactions = await this.prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: startDate },
          type: 'EXPENSE',
        },
        include: { category: true },
        orderBy: { date: 'desc' },
      });

      const analysis = await this.analyzeSpendingPatterns(userId, 6);

      const prompt = `You are a fraud detection and anomaly detection expert.

Normal Spending Patterns:
${JSON.stringify(analysis.spendingPatterns, null, 2)}

Recent Transactions (last 7 days):
${JSON.stringify(
  recentTransactions.map((tx) => ({
    amount: tx.amount,
    category: tx.category?.name,
    merchant: tx.merchantName,
    date: tx.date,
  })),
  null,
  2,
)}

Identify anomalies or unusual spending. For each anomaly provide:
1. Transaction details
2. Why it's unusual
3. Severity (low/medium/high)
4. Recommended action

Format response as JSON array:
[
  {
    "transactionAmount": number,
    "category": "string",
    "merchant": "string",
    "reason": "string",
    "severity": "low|medium|high",
    "recommendedAction": "string"
  }
]`;

      const response = await this.googleCloud.generateText(prompt);

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return []; // No anomalies detected
      }

      const anomalies = JSON.parse(jsonMatch[0]);

      // Store high severity anomalies as recommendations
      for (const anomaly of anomalies) {
        if (anomaly.severity === 'high') {
          await this.prisma.aIRecommendation.create({
            data: {
              userId,
              type: 'SPENDING_ALERT',
              title: `Unusual spending detected: ${anomaly.category}`,
              description: anomaly.reason,
              currentValue: anomaly.transactionAmount,
              confidence: 0.9,
              model: 'gemini-1.5-pro',
              reasoning: anomaly.reason,
              actionItems: { action: anomaly.recommendedAction },
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          });
        }
      }

      return anomalies;
    } catch (error) {
      this.logger.error(
        `Error detecting anomalies: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
