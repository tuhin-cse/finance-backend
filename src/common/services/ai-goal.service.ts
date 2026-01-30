import { Injectable, Logger } from '@nestjs/common';
import { GoogleCloudService } from './google-cloud.service';
import { PrismaService } from '../../prisma/prisma.service';

export interface GoalRecommendation {
  goalType: string;
  targetAmount: number;
  suggestedMonthlyContribution: number;
  estimatedTimeToComplete: number; // months
  reasoning: string;
  priority: number;
  confidence: number;
}

export interface DebtPayoffStrategy {
  strategy: 'SNOWBALL' | 'AVALANCHE' | 'CUSTOM';
  payoffOrder: Array<{
    goalId: string;
    goalName: string;
    balance: number;
    interestRate?: number;
    minimumPayment: number;
    order: number;
  }>;
  totalInterestSaved: number;
  timeToDebtFree: number; // months
  reasoning: string;
}

export interface GoalProbability {
  achievementProbability: number; // 0-1
  predictedCompletionDate: Date;
  confidence: number;
  factors: Array<{
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  }>;
  recommendations: string[];
}

@Injectable()
export class AIGoalService {
  private readonly logger = new Logger(AIGoalService.name);

  constructor(
    private readonly googleCloud: GoogleCloudService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Generate personalized goal recommendations using AI
   */
  async generateGoalRecommendations(
    userId: string,
  ): Promise<GoalRecommendation[]> {
    try {
      // Get user's financial profile
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          transactions: {
            where: {
              date: {
                gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
              },
            },
            orderBy: { date: 'desc' },
          },
          goals: {
            where: { isActive: true },
          },
          budgets: {
            where: { isActive: true },
          },
          accounts: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Calculate financial metrics
      const income = user.transactions
        .filter((tx) => tx.type === 'INCOME')
        .reduce((sum, tx) => sum + tx.amount, 0);

      const expenses = user.transactions
        .filter((tx) => tx.type === 'EXPENSE')
        .reduce((sum, tx) => sum + tx.amount, 0);

      const monthlyIncome = income / 3;
      const monthlyExpenses = expenses / 3;
      const monthlySurplus = monthlyIncome - monthlyExpenses;

      const totalAssets = user.accounts.reduce(
        (sum, acc) => sum + acc.currentBalance,
        0,
      );

      const existingGoals = user.goals.map((g) => ({
        type: g.type,
        target: g.targetAmount,
        current: g.currentAmount,
        monthlyContribution: g.contributionAmount,
      }));

      // Build AI prompt
      const prompt = `You are a financial planning expert helping a user set financial goals.

User's Financial Profile:
- Monthly Income: $${monthlyIncome.toFixed(2)}
- Monthly Expenses: $${monthlyExpenses.toFixed(2)}
- Monthly Surplus: $${monthlySurplus.toFixed(2)}
- Total Assets: $${totalAssets.toFixed(2)}
- Existing Goals: ${JSON.stringify(existingGoals)}

Based on this profile, recommend 3-5 personalized financial goals. Consider:
1. Emergency fund (3-6 months expenses)
2. Debt payoff goals
3. Retirement savings
4. Major purchases (home, car, education)
5. Investment goals

For each recommended goal, provide:
- Goal type
- Target amount
- Suggested monthly contribution
- Estimated time to complete (months)
- Reasoning
- Priority (1-5, higher is more important)
- Confidence (0-1)

Format response as JSON array:
[
  {
    "goalType": "SAVINGS|DEBT_PAYOFF|INVESTMENT|EMERGENCY_FUND|RETIREMENT|CUSTOM",
    "targetAmount": number,
    "suggestedMonthlyContribution": number,
    "estimatedTimeToComplete": number,
    "reasoning": "string",
    "priority": number (1-5),
    "confidence": number (0-1)
  }
]`;

      const response = await this.googleCloud.generateText(prompt);
      
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      const recommendations: GoalRecommendation[] = JSON.parse(jsonMatch[0]);

      // Store recommendations in database
      for (const rec of recommendations) {
        await this.prisma.aIRecommendation.create({
          data: {
            userId,
            type: 'GOAL_STRATEGY',
            title: `Create ${rec.goalType.toLowerCase()} goal`,
            description: rec.reasoning,
            recommendedValue: rec.targetAmount,
            confidence: rec.confidence,
            model: 'gemini-1.5-pro',
            reasoning: rec.reasoning,
            actionItems: {
              monthlyContribution: rec.suggestedMonthlyContribution,
              timeframe: rec.estimatedTimeToComplete,
              priority: rec.priority,
            },
            expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
          },
        });
      }

      this.logger.log(`Generated ${recommendations.length} goal recommendations for user ${userId}`);
      return recommendations;
    } catch (error) {
      this.logger.error(
        `Error generating goal recommendations: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Calculate goal achievement probability using AI
   */
  async calculateAchievementProbability(
    userId: string,
    goalId: string,
  ): Promise<GoalProbability> {
    try {
      const goal = await this.prisma.goal.findUnique({
        where: { id: goalId },
        include: {
          contributions: {
            orderBy: { date: 'desc' },
            take: 20,
          },
        },
      });

      if (!goal) {
        throw new Error('Goal not found');
      }

      // Get user's financial data
      const recentTransactions = await this.prisma.transaction.findMany({
        where: {
          userId,
          date: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { date: 'desc' },
      });

      const income = recentTransactions
        .filter((tx) => tx.type === 'INCOME')
        .reduce((sum, tx) => sum + tx.amount, 0);

      const expenses = recentTransactions
        .filter((tx) => tx.type === 'EXPENSE')
        .reduce((sum, tx) => sum + tx.amount, 0);

      const monthlyIncome = income / 3;
      const monthlyExpenses = expenses / 3;

      // Calculate contribution consistency
      const contributions = goal.contributions;
      const contributionConsistency =
        contributions.length > 0
          ? contributions.filter(
              (c) =>
                new Date().getTime() - c.date.getTime() <
                35 * 24 * 60 * 60 * 1000,
            ).length / Math.min(contributions.length, 3)
          : 0;

      // Build AI prompt
      const prompt = `You are a financial analyst calculating goal achievement probability.

Goal Details:
- Type: ${goal.type}
- Target: $${goal.targetAmount}
- Current: $${goal.currentAmount}
- Progress: ${goal.progress}%
- Target Date: ${goal.targetDate ? goal.targetDate.toISOString().split('T')[0] : 'None'}
- Monthly Contribution: $${goal.contributionAmount || 0}
- Auto-contribute: ${goal.autoContribute}

User Financial Context:
- Monthly Income: $${monthlyIncome.toFixed(2)}
- Monthly Expenses: $${monthlyExpenses.toFixed(2)}
- Contribution Consistency: ${(contributionConsistency * 100).toFixed(0)}%
- Recent Contributions: ${contributions.length}

Analyze and provide:
1. Achievement probability (0-1)
2. Predicted completion date
3. Confidence in prediction (0-1)
4. Factors affecting achievement (positive/negative)
5. Recommendations to improve probability

Format response as JSON:
{
  "achievementProbability": number (0-1),
  "predictedCompletionDate": "YYYY-MM-DD",
  "confidence": number (0-1),
  "factors": [
    {
      "factor": "string",
      "impact": "positive|negative|neutral",
      "description": "string"
    }
  ],
  "recommendations": ["string"]
}`;

      const response = await this.googleCloud.generateText(prompt);
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      const prediction = JSON.parse(jsonMatch[0]);

      // Update goal with predictions
      await this.prisma.goal.update({
        where: { id: goalId },
        data: {
          predictedCompletionDate: new Date(prediction.predictedCompletionDate),
          achievementProbability: prediction.achievementProbability,
        },
      });

      this.logger.log(`Calculated achievement probability for goal ${goalId}`);
      return {
        ...prediction,
        predictedCompletionDate: new Date(prediction.predictedCompletionDate),
      };
    } catch (error) {
      this.logger.error(
        `Error calculating achievement probability: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Generate optimal debt payoff strategy using AI
   */
  async generateDebtPayoffStrategy(
    userId: string,
  ): Promise<DebtPayoffStrategy> {
    try {
      // Get all debt payoff goals
      const debtGoals = await this.prisma.goal.findMany({
        where: {
          userId,
          type: 'DEBT_PAYOFF',
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (debtGoals.length === 0) {
        throw new Error('No debt payoff goals found');
      }

      // Get user's financial capacity
      const recentTransactions = await this.prisma.transaction.findMany({
        where: {
          userId,
          date: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          },
        },
      });

      const income = recentTransactions
        .filter((tx) => tx.type === 'INCOME')
        .reduce((sum, tx) => sum + tx.amount, 0);

      const expenses = recentTransactions
        .filter((tx) => tx.type === 'EXPENSE')
        .reduce((sum, tx) => sum + tx.amount, 0);

      const monthlyIncome = income / 3;
      const monthlyExpenses = expenses / 3;
      const availableForDebt = monthlyIncome - monthlyExpenses;

      // Build AI prompt
      const prompt = `You are a debt payoff strategist. Analyze these debts and create an optimal payoff plan.

Debts:
${JSON.stringify(
  debtGoals.map((g) => ({
    id: g.id,
    name: g.name,
    balance: g.targetAmount - g.currentAmount,
    interestRate: g.interestRate,
    monthlyPayment: g.contributionAmount || 0,
  })),
  null,
  2,
)}

Available Monthly Amount: $${availableForDebt.toFixed(2)}

Analyze and recommend the best strategy:
1. Snowball (smallest balance first) vs Avalanche (highest interest first)
2. Payoff order for all debts
3. Total interest saved vs minimum payments
4. Time to debt-free

Format response as JSON:
{
  "strategy": "SNOWBALL|AVALANCHE|CUSTOM",
  "payoffOrder": [
    {
      "goalId": "string",
      "goalName": "string",
      "balance": number,
      "interestRate": number,
      "minimumPayment": number,
      "order": number
    }
  ],
  "totalInterestSaved": number,
  "timeToDebtFree": number,
  "reasoning": "string"
}`;

      const response = await this.googleCloud.generateText(prompt);
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      const strategy: DebtPayoffStrategy = JSON.parse(jsonMatch[0]);

      // Update goals with recommended strategy and priority
      for (const debt of strategy.payoffOrder) {
        await this.prisma.goal.update({
          where: { id: debt.goalId },
          data: {
            debtStrategy: strategy.strategy,
            priority: debt.order,
          },
        });
      }

      // Store as recommendation
      await this.prisma.aIRecommendation.create({
        data: {
          userId,
          type: 'DEBT_PAYOFF',
          title: `Optimal debt payoff strategy: ${strategy.strategy}`,
          description: strategy.reasoning,
          potentialSavings: strategy.totalInterestSaved,
          confidence: 0.85,
          model: 'gemini-1.5-pro',
          reasoning: strategy.reasoning,
          actionItems: { strategy: strategy.payoffOrder },
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      });

      this.logger.log(`Generated debt payoff strategy for user ${userId}`);
      return strategy;
    } catch (error) {
      this.logger.error(
        `Error generating debt payoff strategy: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Suggest optimal savings rules for a goal
   */
  async suggestSavingsRules(
    userId: string,
    goalId: string,
  ): Promise<any[]> {
    try {
      const goal = await this.prisma.goal.findUnique({
        where: { id: goalId },
      });

      if (!goal) {
        throw new Error('Goal not found');
      }

      // Get spending patterns
      const transactions = await this.prisma.transaction.findMany({
        where: {
          userId,
          type: 'EXPENSE',
          date: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { date: 'desc' },
      });

      const avgDailyTransactions = transactions.length / 30;
      const avgTransactionAmount =
        transactions.reduce((sum, tx) => sum + tx.amount, 0) /
        transactions.length;

      // Build AI prompt
      const prompt = `You are a savings automation expert. Suggest automated savings rules for this goal.

Goal:
- Type: ${goal.type}
- Target: $${goal.targetAmount}
- Current: $${goal.currentAmount}
- Needed: $${goal.targetAmount - goal.currentAmount}

User Spending:
- Avg Daily Transactions: ${avgDailyTransactions.toFixed(1)}
- Avg Transaction Amount: $${avgTransactionAmount.toFixed(2)}

Suggest 3-5 automated savings rules that would help reach this goal. Consider:
1. Round-up rules (round transactions to nearest dollar/5/10)
2. Percentage rules (save % of income)
3. Fixed amount rules (save fixed amount daily/weekly/monthly)
4. Conditional rules (save when certain conditions met)

For each rule provide:
- Rule type
- Description
- Configuration
- Estimated monthly savings
- Difficulty (easy/medium/hard)
- Impact (low/medium/high)

Format response as JSON array:
[
  {
    "ruleType": "ROUND_UP|PERCENTAGE|FIXED_AMOUNT|CONDITIONAL",
    "name": "string",
    "description": "string",
    "config": {},
    "estimatedMonthlySavings": number,
    "difficulty": "easy|medium|hard",
    "impact": "low|medium|high"
  }
]`;

      const response = await this.googleCloud.generateText(prompt);
      
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      const rules = JSON.parse(jsonMatch[0]);

      // Store as recommendations
      for (const rule of rules) {
        await this.prisma.aIRecommendation.create({
          data: {
            userId,
            goalId,
            type: 'SAVINGS_OPPORTUNITY',
            title: rule.name,
            description: rule.description,
            recommendedValue: rule.estimatedMonthlySavings,
            confidence: rule.impact === 'high' ? 0.8 : rule.impact === 'medium' ? 0.6 : 0.4,
            model: 'gemini-1.5-pro',
            reasoning: rule.description,
            actionItems: { ruleConfig: rule.config, ruleType: rule.ruleType },
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }

      this.logger.log(`Suggested ${rules.length} savings rules for goal ${goalId}`);
      return rules;
    } catch (error) {
      this.logger.error(
        `Error suggesting savings rules: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Calculate gamification rewards for goal progress
   */
  async calculateGamificationRewards(
    goalId: string,
    contributionAmount: number,
  ): Promise<{
    xpEarned: number;
    streakBonus: boolean;
    badgesEarned: string[];
    levelUp: boolean;
    newLevel?: number;
  }> {
    try {
      const goal = await this.prisma.goal.findUnique({
        where: { id: goalId },
        include: {
          contributions: {
            orderBy: { date: 'desc' },
            take: 10,
          },
        },
      });

      if (!goal) {
        throw new Error('Goal not found');
      }

      // Calculate base XP (1 XP per $1 contributed)
      let xpEarned = Math.floor(contributionAmount);

      // Check for streak
      const lastContribution = goal.lastContributionDate;
      const daysSinceLastContribution = lastContribution
        ? Math.floor(
            (Date.now() - lastContribution.getTime()) / (1000 * 60 * 60 * 24),
          )
        : 999;

      const streakBonus = daysSinceLastContribution <= 1;
      if (streakBonus) {
        xpEarned = Math.floor(xpEarned * 1.5); // 50% bonus for streak
      }

      // Check for badges
      const badgesEarned: string[] = [];
      const newProgress = goal.progress + (contributionAmount / goal.targetAmount) * 100;

      if (newProgress >= 25 && goal.progress < 25) {
        badgesEarned.push('QUARTER_WAY');
      }
      if (newProgress >= 50 && goal.progress < 50) {
        badgesEarned.push('HALFWAY_HERO');
      }
      if (newProgress >= 75 && goal.progress < 75) {
        badgesEarned.push('ALMOST_THERE');
      }
      if (newProgress >= 100) {
        badgesEarned.push('GOAL_CRUSHER');
      }

      if (goal.currentStreak >= 7 && (goal.currentStreak + 1) % 7 === 0) {
        badgesEarned.push('WEEK_WARRIOR');
      }
      if (goal.currentStreak >= 30 && (goal.currentStreak + 1) % 30 === 0) {
        badgesEarned.push('MONTH_MASTER');
      }

      // Check for level up
      const newXP = goal.xpPoints + xpEarned;
      const currentLevel = goal.level;
      const newLevel = Math.floor(newXP / 100) + 1; // 100 XP per level
      const levelUp = newLevel > currentLevel;

      return {
        xpEarned,
        streakBonus,
        badgesEarned,
        levelUp,
        newLevel: levelUp ? newLevel : undefined,
      };
    } catch (error) {
      this.logger.error(
        `Error calculating gamification rewards: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
