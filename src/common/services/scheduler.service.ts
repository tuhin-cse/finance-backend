import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Process automatic goal contributions
   * Runs daily at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async processAutoContributions() {
    this.logger.log('Starting automatic goal contributions processing...');

    try {
      const now = new Date();
      const goals = await this.prisma.goal.findMany({
        where: {
          autoContribute: true,
          isActive: true,
          status: { not: 'COMPLETED' },
        },
      });

      let processedCount = 0;
      let errorCount = 0;

      for (const goal of goals) {
        try {
          const daysSinceLastContribution = goal.lastContributionDate
            ? Math.floor(
                (now.getTime() - goal.lastContributionDate.getTime()) /
                  (1000 * 60 * 60 * 24),
              )
            : 999;

          let shouldContribute = false;

          switch (goal.contributionFrequency) {
            case 'DAILY':
              shouldContribute = daysSinceLastContribution >= 1;
              break;
            case 'WEEKLY':
              shouldContribute = daysSinceLastContribution >= 7;
              break;
            case 'BI_WEEKLY':
              shouldContribute = daysSinceLastContribution >= 14;
              break;
            case 'MONTHLY':
              shouldContribute = daysSinceLastContribution >= 30;
              break;
            default:
              shouldContribute = false;
          }

          if (shouldContribute && goal.contributionAmount) {
            // Add contribution
            await this.prisma.goalContribution.create({
              data: {
                goalId: goal.id,
                userId: goal.userId,
                amount: goal.contributionAmount,
                note: 'Automatic contribution',
                xpEarned: 10,
                streakBonus: false,
              },
            });

            // Update goal
            const newCurrentAmount = goal.currentAmount + goal.contributionAmount;
            const newProgress = (newCurrentAmount / goal.targetAmount) * 100;

            await this.prisma.goal.update({
              where: { id: goal.id },
              data: {
                currentAmount: newCurrentAmount,
                progress: Math.min(newProgress, 100),
                status: newProgress >= 100 ? 'COMPLETED' : goal.status,
                completedAt: newProgress >= 100 ? new Date() : null,
                lastContributionDate: new Date(),
                xpPoints: { increment: 10 },
              },
            });

            processedCount++;
          }
        } catch (error) {
          errorCount++;
          this.logger.error(
            `Failed to process auto-contribution for goal ${goal.id}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Automatic contributions processing completed. Processed: ${processedCount}, Errors: ${errorCount}`,
      );
    } catch (error) {
      this.logger.error(
        `Error in automatic contributions cron job: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Process automatic savings rules
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processSavingsRules() {
    this.logger.log('Processing scheduled savings rules...');

    try {
      const rules = await this.prisma.savingsRule.findMany({
        where: {
          isActive: true,
          frequency: 'DAILY',
        },
      });

      let processedCount = 0;
      let errorCount = 0;

      for (const rule of rules) {
        try {
          const config = rule.config as any;
          let savingsAmount = 0;

          if (rule.ruleType === 'FIXED_AMOUNT') {
            savingsAmount = config.amount || 0;
          }

          if (savingsAmount > 0 && rule.goalId) {
            // Add contribution
            await this.prisma.goalContribution.create({
              data: {
                goalId: rule.goalId,
                userId: rule.userId,
                amount: savingsAmount,
                note: `Automatic savings from rule: ${rule.name}`,
                xpEarned: 5,
                streakBonus: false,
              },
            });

            // Update goal
            const goal = await this.prisma.goal.findUnique({
              where: { id: rule.goalId },
            });

            if (goal) {
              const newCurrentAmount = goal.currentAmount + savingsAmount;
              const newProgress = (newCurrentAmount / goal.targetAmount) * 100;

              await this.prisma.goal.update({
                where: { id: rule.goalId },
                data: {
                  currentAmount: newCurrentAmount,
                  progress: Math.min(newProgress, 100),
                  status: newProgress >= 100 ? 'COMPLETED' : goal.status,
                  completedAt: newProgress >= 100 ? new Date() : null,
                  lastContributionDate: new Date(),
                  xpPoints: { increment: 5 },
                },
              });
            }

            // Update rule stats
            await this.prisma.savingsRule.update({
              where: { id: rule.id },
              data: {
                totalSaved: { increment: savingsAmount },
                timesTriggered: { increment: 1 },
                lastExecuted: new Date(),
              },
            });

            processedCount++;
          }
        } catch (error) {
          errorCount++;
          this.logger.error(
            `Failed to process savings rule ${rule.id}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Savings rules processing completed. Processed: ${processedCount}, Errors: ${errorCount}`,
      );
    } catch (error) {
      this.logger.error(
        `Error in savings rules cron job: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Process budget rollovers
   * Runs on the 1st day of each month at 1 AM
   */
  @Cron('0 1 1 * *')
  async processBudgetRollovers() {
    this.logger.log('Processing budget rollovers...');

    try {
      const budgets = await this.prisma.budget.findMany({
        where: {
          isActive: true,
          rolloverUnused: true,
        },
      });

      let processedCount = 0;
      let errorCount = 0;

      for (const budget of budgets) {
        try {
          const currentAmount = budget.remaining || 0;

          if (currentAmount > 0) {
            // Create new budget for next period with rollover
            await this.prisma.budget.create({
              data: {
                userId: budget.userId,
                name: budget.name,
                categoryId: budget.categoryId,
                type: budget.type,
                budgetingMethod: budget.budgetingMethod,
                amount: budget.amount + currentAmount,
                rolloverAmount: currentAmount,
                period: budget.period,
                startDate: new Date(),
                endDate: new Date(
                  new Date().setMonth(new Date().getMonth() + 1),
                ),
                alertThreshold: budget.alertThreshold,
              },
            });

            // Archive old budget
            await this.prisma.budget.update({
              where: { id: budget.id },
              data: { isActive: false },
            });

            processedCount++;
          }
        } catch (error) {
          errorCount++;
          this.logger.error(
            `Failed to rollover budget ${budget.id}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Budget rollovers completed. Processed: ${processedCount}, Errors: ${errorCount}`,
      );
    } catch (error) {
      this.logger.error(
        `Error in budget rollover cron job: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Update goal streaks
   * Runs daily at 3 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async updateGoalStreaks() {
    this.logger.log('Updating goal streaks...');

    try {
      const goals = await this.prisma.goal.findMany({
        where: {
          isActive: true,
          status: { not: 'COMPLETED' },
          currentStreak: { gt: 0 },
        },
      });

      let updatedCount = 0;

      for (const goal of goals) {
        try {
          if (goal.lastContributionDate) {
            const daysSinceContribution = Math.floor(
              (new Date().getTime() - goal.lastContributionDate.getTime()) /
                (1000 * 60 * 60 * 24),
            );

            // Reset streak if no contribution in last 7 days
            if (daysSinceContribution > 7) {
              await this.prisma.goal.update({
                where: { id: goal.id },
                data: { currentStreak: 0 },
              });
              updatedCount++;
            }
          }
        } catch (error) {
          this.logger.error(
            `Failed to update streak for goal ${goal.id}: ${error.message}`,
          );
        }
      }

      this.logger.log(`Goal streaks updated. Count: ${updatedCount}`);
    } catch (error) {
      this.logger.error(
        `Error in streak update cron job: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Generate weekly AI recommendations
   * Runs every Monday at 8 AM
   */
  @Cron('0 8 * * 1')
  async generateWeeklyRecommendations() {
    this.logger.log('Generating weekly AI recommendations...');

    try {
      // Get active users with goals
      const users = await this.prisma.user.findMany({
        where: {
          isActive: true,
          goals: { some: { isActive: true } },
        },
        select: { id: true },
      });

      this.logger.log(
        `Generating recommendations for ${users.length} active users`,
      );

      // This would trigger AI recommendation generation
      // Implementation would call AIGoalService and AIBudgetService
      // for each user to generate personalized recommendations
    } catch (error) {
      this.logger.error(
        `Error in weekly recommendations cron job: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Clean up old AI recommendations
   * Runs daily at 4 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async cleanupOldRecommendations() {
    this.logger.log('Cleaning up old AI recommendations...');

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.prisma.aIRecommendation.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo },
          isViewed: true,
        },
      });

      this.logger.log(
        `Cleaned up ${result.count} old AI recommendations`,
      );
    } catch (error) {
      this.logger.error(
        `Error in cleanup cron job: ${error.message}`,
        error.stack,
      );
    }
  }
}
