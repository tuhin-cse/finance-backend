import { Global, Module } from '@nestjs/common';
import { GoogleCloudService } from './services/google-cloud.service';
import { AIBudgetService } from './services/ai-budget.service';
import { AIGoalService } from './services/ai-goal.service';

@Global()
@Module({
  providers: [GoogleCloudService, AIBudgetService, AIGoalService],
  exports: [GoogleCloudService, AIBudgetService, AIGoalService],
})
export class CommonModule {}
