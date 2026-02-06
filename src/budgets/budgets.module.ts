import { Module } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { BudgetsController } from './budgets.controller';
import { RecurringTransactionsService } from './recurring-transactions.service';
import { RecurringTransactionsController } from './recurring-transactions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AIBudgetService } from '../common/services/ai-budget.service';

@Module({
  imports: [PrismaModule],
  controllers: [BudgetsController, RecurringTransactionsController],
  providers: [BudgetsService, RecurringTransactionsService, AIBudgetService],
  exports: [BudgetsService, RecurringTransactionsService],
})
export class BudgetsModule { }
