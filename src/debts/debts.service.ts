import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Debt } from '@prisma/client';
import {
  CreateDebtDto,
  UpdateDebtDto,
  CalculatePayoffDto,
  PayoffCalculationResult,
  MonthlyPayment,
  DebtPayoffSchedule,
  PayoffSummary,
  RefinanceComparisonDto,
  RefinanceComparisonResult,
  LoanDetails,
  RefinanceComparison,
  ConsolidationPlanDto,
  ConsolidationPlanResult,
  DebtSummary,
  ConsolidatedLoanDetails,
  ConsolidationComparison,
  CreditUtilizationResult,
  CardUtilization,
  UpdateCreditLimitDto,
  ExtraPaymentImpactDto,
  ExtraPaymentImpactResult,
  BulkExtraPaymentDto,
  BulkExtraPaymentResult,
} from './dto';
import { PayoffStrategy } from '@prisma/client';
import { createPaginatedResponse } from '../common/utils/pagination.util';

@Injectable()
export class DebtsService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // CRUD Operations
  // ============================================

  async create(userId: string, createDebtDto: CreateDebtDto) {
    return this.prisma.debt.create({
      data: {
        ...createDebtDto,
        userId,
        startDate: new Date(createDebtDto.startDate),
      },
    });
  }

  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 10,
    isActive?: boolean,
  ) {
    const where: { userId: string; isActive?: boolean } = { userId };
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.debt.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.debt.count({ where }),
    ]);

    return createPaginatedResponse(data, total, page, limit);
  }

  async findOne(id: string, userId: string) {
    const debt = await this.prisma.debt.findFirst({
      where: { id, userId },
    });

    if (!debt) {
      throw new NotFoundException(`Debt with ID ${id} not found`);
    }

    return debt;
  }

  async update(id: string, userId: string, updateDebtDto: UpdateDebtDto) {
    await this.findOne(id, userId);

    return this.prisma.debt.update({
      where: { id },
      data: {
        ...updateDebtDto,
        startDate: updateDebtDto.startDate
          ? new Date(updateDebtDto.startDate)
          : undefined,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.debt.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ============================================
  // Snowball/Avalanche Calculator
  // ============================================

  async calculatePayoffStrategy(
    userId: string,
    calculateDto: CalculatePayoffDto,
  ): Promise<PayoffCalculationResult> {
    // Get debts to calculate
    const where: { userId: string; isActive: boolean; id?: { in: string[] } } = {
      userId,
      isActive: true,
    };
    if (calculateDto.debtIds && calculateDto.debtIds.length > 0) {
      where.id = { in: calculateDto.debtIds };
    }

    const debts = await this.prisma.debt.findMany({ where });

    if (debts.length === 0) {
      throw new BadRequestException('No active debts found');
    }

    // Sort debts based on strategy
    const sortedDebts = this.sortDebtsByStrategy(debts, calculateDto.strategy);

    // Calculate total monthly payment
    const totalMinimumPayment = debts.reduce(
      (sum, debt) => sum + debt.minimumPayment,
      0,
    );
    const totalAvailablePayment =
      totalMinimumPayment + calculateDto.extraMonthlyPayment;

    // Calculate payoff schedule
    const remainingDebts = [...sortedDebts];
    let currentMonth = 0;
    let totalInterestPaid = 0;
    const allMonthlyPayments: MonthlyPayment[] = [];

    while (remainingDebts.length > 0) {
      currentMonth++;
      let monthlyPayment = totalAvailablePayment;
      let monthlyPrincipal = 0;
      let monthlyInterest = 0;

      // Pay minimum on all debts except the target
      for (let i = 1; i < remainingDebts.length; i++) {
        const debt = remainingDebts[i];
        const interest = (debt.currentBalance * debt.interestRate) / 100 / 12;
        const principal = Math.min(
          debt.minimumPayment - interest,
          debt.currentBalance,
        );

        debt.currentBalance -= principal;
        monthlyPayment -= debt.minimumPayment;
        monthlyInterest += interest;
        monthlyPrincipal += principal;
      }

      // Apply remaining payment to target debt
      const targetDebt = remainingDebts[0];
      const targetInterest =
        (targetDebt.currentBalance * targetDebt.interestRate) / 100 / 12;
      const targetPrincipal = Math.min(
        monthlyPayment - targetInterest,
        targetDebt.currentBalance,
      );

      targetDebt.currentBalance -= targetPrincipal;
      monthlyInterest += targetInterest;
      monthlyPrincipal += targetPrincipal;
      totalInterestPaid += monthlyInterest;

      // Track monthly payment
      allMonthlyPayments.push({
        month: currentMonth,
        totalPayment: monthlyPrincipal + monthlyInterest,
        principalPaid: monthlyPrincipal,
        interestPaid: monthlyInterest,
        remainingBalance: remainingDebts.reduce(
          (sum, d) => sum + d.currentBalance,
          0,
        ),
      });

      // Check if target debt is paid off
      if (targetDebt.currentBalance <= 0) {
        remainingDebts.shift();
      }

      // Safety check to prevent infinite loops
      if (currentMonth > 600) {
        // 50 years
        throw new BadRequestException(
          'Payoff calculation exceeded maximum term',
        );
      }
    }

    // Build detailed payoff schedules
    const detailedSchedules = sortedDebts.map((debt, index) => {
      const schedule = this.calculateIndividualDebtSchedule(
        debt,
        index === 0 ? calculateDto.extraMonthlyPayment : 0,
      );
      return {
        debtId: debt.id,
        debtName: debt.name,
        originalBalance: debt.currentBalance,
        interestRate: debt.interestRate,
        minimumPayment: debt.minimumPayment,
        totalPaid: schedule.totalPaid,
        totalInterestPaid: schedule.totalInterestPaid,
        monthsToPayoff: schedule.monthsToPayoff,
        payoffOrder: index + 1,
        monthlyPayments: schedule.monthlyPayments,
      };
    });

    // Calculate summary
    const totalStartingBalance = sortedDebts.reduce(
      (sum, debt) => sum + debt.currentBalance,
      0,
    );
    const totalPaid = totalStartingBalance + totalInterestPaid;

    // Compare with other strategies to find best one
    const recommendedStrategy = await this.findBestStrategy(
      userId,
      calculateDto,
    );

    const summary: PayoffSummary = {
      totalDebts: debts.length,
      totalStartingBalance,
      totalInterestSaved: 0, // Would need to calculate baseline
      monthsSaved: 0, // Would need to calculate baseline
      recommendedStrategy,
    };

    return {
      strategy: calculateDto.strategy,
      totalMonths: currentMonth,
      totalInterestPaid,
      totalPaid,
      monthlyBreakdown: allMonthlyPayments,
      payoffSchedule: detailedSchedules,
      summary,
    };
  }

  private sortDebtsByStrategy(debts: Debt[], strategy: PayoffStrategy): Debt[] {
    const debtsCopy = debts.map((d) => ({ ...d }));

    switch (strategy) {
      case PayoffStrategy.SNOWBALL:
        // Sort by balance (lowest first)
        return debtsCopy.sort((a, b) => a.currentBalance - b.currentBalance);

      case PayoffStrategy.AVALANCHE:
        // Sort by interest rate (highest first)
        return debtsCopy.sort((a, b) => b.interestRate - a.interestRate);

      case PayoffStrategy.HIGHEST_RATE:
        // Same as avalanche
        return debtsCopy.sort((a, b) => b.interestRate - a.interestRate);

      default:
        return debtsCopy;
    }
  }

  private calculateIndividualDebtSchedule(debt: Debt, extraPayment: number) {
    let balance = debt.currentBalance;
    const monthlyPayment = debt.minimumPayment + extraPayment;
    const monthlyRate = debt.interestRate / 100 / 12;

    const monthlyPayments: MonthlyPayment[] = [];
    let month = 0;
    let totalInterest = 0;

    while (balance > 0 && month < 600) {
      month++;
      const interest = balance * monthlyRate;
      const principal = Math.min(monthlyPayment - interest, balance);
      balance -= principal;
      totalInterest += interest;

      monthlyPayments.push({
        month,
        totalPayment: principal + interest,
        principalPaid: principal,
        interestPaid: interest,
        remainingBalance: Math.max(balance, 0),
      });

      if (balance <= 0) break;
    }

    return {
      monthlyPayments,
      monthsToPayoff: month,
      totalInterestPaid: totalInterest,
      totalPaid: debt.currentBalance + totalInterest,
    };
  }

  private async findBestStrategy(
    userId: string,
    calculateDto: CalculatePayoffDto,
  ): Promise<PayoffStrategy> {
    // Calculate total interest for each strategy
    const strategies = [
      PayoffStrategy.SNOWBALL,
      PayoffStrategy.AVALANCHE,
      PayoffStrategy.HIGHEST_RATE,
    ];

    let bestStrategy: PayoffStrategy = PayoffStrategy.AVALANCHE;
    let lowestInterest = Infinity;

    for (const strategy of strategies) {
      try {
        const result = await this.calculatePayoffStrategy(userId, {
          ...calculateDto,
          strategy,
        });

        if (result.totalInterestPaid < lowestInterest) {
          lowestInterest = result.totalInterestPaid;
          bestStrategy = strategy;
        }
      } catch {
        // Skip if error
      }
    }

    return bestStrategy;
  }

  // ============================================
  // Refinancing Comparison
  // ============================================

  async compareRefinancing(
    userId: string,
    refinanceDto: RefinanceComparisonDto,
  ): Promise<RefinanceComparisonResult> {
    const debt = await this.findOne(refinanceDto.debtId, userId);

    // Calculate current loan details
    const currentLoan = this.calculateLoanDetails(
      debt.currentBalance,
      debt.interestRate,
      debt.minimumPayment,
    );

    // Calculate new term if not provided
    const newTermMonths =
      refinanceDto.newTermMonths ||
      this.calculateRemainingTerm(
        debt.currentBalance,
        debt.minimumPayment,
        debt.interestRate,
      );

    // Calculate refinanced loan details
    const newMonthlyPayment = this.calculateMonthlyPayment(
      debt.currentBalance,
      refinanceDto.newInterestRate,
      newTermMonths,
    );

    const refinancedLoan = this.calculateLoanDetails(
      debt.currentBalance,
      refinanceDto.newInterestRate,
      newMonthlyPayment,
      newTermMonths,
    );

    // Add refinancing fees to total cost
    const fees = refinanceDto.refinancingFees || 0;
    refinancedLoan.totalPaid += fees;

    // Calculate comparison
    const monthlyPaymentDifference =
      currentLoan.monthlyPayment - refinancedLoan.monthlyPayment;
    const totalInterestSavings =
      currentLoan.totalInterestPaid - refinancedLoan.totalInterestPaid;
    const totalSavings = currentLoan.totalPaid - refinancedLoan.totalPaid;

    // Calculate break-even point
    const breakEvenMonth =
      fees > 0 ? Math.ceil(fees / monthlyPaymentDifference) : 0;

    const comparison: RefinanceComparison = {
      monthlyPaymentDifference,
      totalInterestSavings,
      totalSavings,
      isWorthIt: totalSavings > 0 && totalInterestSavings > fees,
    };

    let recommendation = '';
    if (comparison.isWorthIt) {
      recommendation = `Refinancing is recommended! You'll save $${totalSavings.toFixed(2)} over the life of the loan and reduce your monthly payment by $${monthlyPaymentDifference.toFixed(2)}. Break-even point: ${breakEvenMonth} months.`;
    } else {
      recommendation = `Refinancing is not recommended. The fees and interest rate difference don't result in significant savings.`;
    }

    return {
      currentLoan,
      refinancedLoan,
      comparison,
      breakEvenMonth,
      recommendation,
    };
  }

  private calculateLoanDetails(
    balance: number,
    interestRate: number,
    monthlyPayment: number,
    termMonths?: number,
  ): LoanDetails {
    const monthlyRate = interestRate / 100 / 12;
    let remainingBalance = balance;
    let totalInterest = 0;
    let months = 0;

    // If term is provided, use it; otherwise calculate
    const maxMonths = termMonths || 600;

    while (remainingBalance > 0 && months < maxMonths) {
      months++;
      const interest = remainingBalance * monthlyRate;
      const principal = Math.min(monthlyPayment - interest, remainingBalance);
      remainingBalance -= principal;
      totalInterest += interest;

      if (remainingBalance <= 0) break;
    }

    return {
      balance,
      interestRate,
      monthlyPayment,
      termMonths: months,
      totalInterestPaid: totalInterest,
      totalPaid: balance + totalInterest,
    };
  }

  private calculateMonthlyPayment(
    principal: number,
    annualRate: number,
    months: number,
  ): number {
    const monthlyRate = annualRate / 100 / 12;
    if (monthlyRate === 0) return principal / months;

    return (
      (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1)
    );
  }

  private calculateRemainingTerm(
    balance: number,
    monthlyPayment: number,
    annualRate: number,
  ): number {
    const monthlyRate = annualRate / 100 / 12;
    if (monthlyRate === 0) return Math.ceil(balance / monthlyPayment);

    return Math.ceil(
      Math.log(monthlyPayment / (monthlyPayment - balance * monthlyRate)) /
        Math.log(1 + monthlyRate),
    );
  }

  // ============================================
  // Consolidation Planner
  // ============================================

  async planConsolidation(
    userId: string,
    consolidationDto: ConsolidationPlanDto,
  ): Promise<ConsolidationPlanResult> {
    // Get all debts to consolidate
    const debts = await this.prisma.debt.findMany({
      where: {
        id: { in: consolidationDto.debtIds },
        userId,
        isActive: true,
      },
    });

    if (debts.length === 0) {
      throw new BadRequestException('No debts found for consolidation');
    }

    // Calculate current situation
    const currentDebts: DebtSummary[] = debts.map((debt) => ({
      id: debt.id,
      name: debt.name,
      balance: debt.currentBalance,
      interestRate: debt.interestRate,
      monthlyPayment: debt.minimumPayment,
    }));

    const totalBalance = debts.reduce(
      (sum, debt) => sum + debt.currentBalance,
      0,
    );
    const currentTotalMonthlyPayment = debts.reduce(
      (sum, debt) => sum + debt.minimumPayment,
      0,
    );

    // Calculate current total interest
    let currentTotalInterest = 0;
    for (const debt of debts) {
      const details = this.calculateLoanDetails(
        debt.currentBalance,
        debt.interestRate,
        debt.minimumPayment,
      );
      currentTotalInterest += details.totalInterestPaid;
    }

    // Calculate consolidated loan
    const consolidatedMonthlyPayment = this.calculateMonthlyPayment(
      totalBalance,
      consolidationDto.consolidatedInterestRate,
      consolidationDto.consolidatedTermMonths,
    );

    const consolidatedDetails = this.calculateLoanDetails(
      totalBalance,
      consolidationDto.consolidatedInterestRate,
      consolidatedMonthlyPayment,
      consolidationDto.consolidatedTermMonths,
    );

    const fees = consolidationDto.consolidationFees || 0;

    const consolidatedLoan: ConsolidatedLoanDetails = {
      totalBalance,
      interestRate: consolidationDto.consolidatedInterestRate,
      monthlyPayment: consolidatedMonthlyPayment,
      termMonths: consolidationDto.consolidatedTermMonths,
      totalInterestPaid: consolidatedDetails.totalInterestPaid,
      totalPaid: consolidatedDetails.totalPaid + fees,
      fees,
    };

    // Calculate comparison
    const monthlyPaymentDifference =
      currentTotalMonthlyPayment - consolidatedMonthlyPayment;
    const totalInterestSavings =
      currentTotalInterest - consolidatedDetails.totalInterestPaid;

    const comparison: ConsolidationComparison = {
      currentTotalMonthlyPayment,
      consolidatedMonthlyPayment,
      monthlyPaymentDifference,
      currentTotalInterest,
      consolidatedTotalInterest: consolidatedDetails.totalInterestPaid,
      totalInterestSavings,
      isWorthIt: totalInterestSavings > fees && monthlyPaymentDifference > 0,
    };

    let recommendation = '';
    if (comparison.isWorthIt) {
      recommendation = `Consolidation is recommended! You'll save $${totalInterestSavings.toFixed(2)} in interest and reduce your monthly payment by $${monthlyPaymentDifference.toFixed(2)}. Total savings: $${(totalInterestSavings - fees).toFixed(2)}.`;
    } else if (monthlyPaymentDifference > 0 && totalInterestSavings < fees) {
      recommendation = `Consolidation will lower your monthly payment by $${monthlyPaymentDifference.toFixed(2)}, but the fees ($${fees.toFixed(2)}) exceed the interest savings ($${totalInterestSavings.toFixed(2)}).`;
    } else {
      recommendation = `Consolidation is not recommended. You're better off keeping your current debts and paying them individually.`;
    }

    return {
      currentDebts,
      consolidatedLoan,
      comparison,
      recommendation,
    };
  }

  // ============================================
  // Credit Utilization Tracking
  // ============================================

  async calculateCreditUtilization(
    userId: string,
  ): Promise<CreditUtilizationResult> {
    // Get all credit card debts
    const creditCards = await this.prisma.debt.findMany({
      where: {
        userId,
        type: 'CREDIT_CARD',
        isActive: true,
      },
    });

    if (creditCards.length === 0) {
      throw new BadRequestException('No credit cards found');
    }

    // Note: Credit limits should be stored. For now, we'll estimate based on original amount
    // In a real implementation, add a creditLimit field to the Debt model
    const cardUtilizations: CardUtilization[] = creditCards.map((card) => {
      // Estimate credit limit as 1.5x original amount if not available
      const estimatedLimit = card.originalAmount * 1.5;
      const utilization = (card.currentBalance / estimatedLimit) * 100;

      let recommendation = '';
      if (utilization > 30) {
        recommendation = `High utilization (${utilization.toFixed(1)}%). Pay down to below 30% to improve credit score.`;
      } else if (utilization > 10) {
        recommendation = `Moderate utilization (${utilization.toFixed(1)}%). Consider paying down for optimal credit score.`;
      } else {
        recommendation = `Excellent utilization (${utilization.toFixed(1)}%)!`;
      }

      return {
        debtId: card.id,
        cardName: card.name,
        creditLimit: estimatedLimit,
        currentBalance: card.currentBalance,
        utilization,
        recommendation,
      };
    });

    const totalCreditLimit = cardUtilizations.reduce(
      (sum, card) => sum + card.creditLimit,
      0,
    );
    const totalUsedCredit = cardUtilizations.reduce(
      (sum, card) => sum + card.currentBalance,
      0,
    );
    const utilizationPercentage = (totalUsedCredit / totalCreditLimit) * 100;

    let overallRecommendation = '';
    let impactOnCreditScore = '';

    if (utilizationPercentage > 30) {
      overallRecommendation = `Your overall credit utilization is ${utilizationPercentage.toFixed(1)}%, which is considered high. Aim to keep it below 30% to improve your credit score.`;
      impactOnCreditScore = 'Negative impact - likely reducing your credit score';
    } else if (utilizationPercentage > 10) {
      overallRecommendation = `Your overall credit utilization is ${utilizationPercentage.toFixed(1)}%, which is moderate. For optimal credit score, try to keep it below 10%.`;
      impactOnCreditScore = 'Moderate impact - some effect on credit score';
    } else {
      overallRecommendation = `Excellent! Your credit utilization is ${utilizationPercentage.toFixed(1)}%, which is optimal for your credit score.`;
      impactOnCreditScore = 'Positive impact - helping your credit score';
    }

    return {
      totalCreditLimit,
      totalUsedCredit,
      utilizationPercentage,
      utilizationByCard: cardUtilizations,
      recommendation: overallRecommendation,
      impactOnCreditScore,
    };
  }

  async updateCreditLimit(
    debtId: string,
    userId: string,
    updateDto: UpdateCreditLimitDto,
  ) {
    const debt = await this.findOne(debtId, userId);

    if (debt.type !== 'CREDIT_CARD') {
      throw new BadRequestException('This debt is not a credit card');
    }

    // For now, store credit limit in the originalAmount field
    // In production, add a proper creditLimit field
    return this.prisma.debt.update({
      where: { id: debtId },
      data: { originalAmount: updateDto.creditLimit },
    });
  }

  // ============================================
  // Extra Payment Impact Analysis
  // ============================================

  async analyzeExtraPaymentImpact(
    userId: string,
    impactDto: ExtraPaymentImpactDto,
  ): Promise<ExtraPaymentImpactResult> {
    const debt = await this.findOne(impactDto.debtId, userId);

    // Calculate without extra payment
    const withoutExtra = this.calculateLoanDetails(
      debt.currentBalance,
      debt.interestRate,
      debt.minimumPayment,
    );

    // Calculate with extra payment
    let newMonthlyPayment = debt.minimumPayment;

    if (impactDto.numberOfPayments) {
      // Recurring extra payments
      newMonthlyPayment += impactDto.extraPaymentAmount;
    } else {
      // One-time extra payment
      // Apply to principal immediately
      const newBalance = debt.currentBalance - impactDto.extraPaymentAmount;
      const withExtra = this.calculateLoanDetails(
        newBalance,
        debt.interestRate,
        debt.minimumPayment,
      );

      const monthsSaved = withoutExtra.termMonths - withExtra.termMonths;
      const interestSaved =
        withoutExtra.totalInterestPaid - withExtra.totalInterestPaid;
      const totalSaved = interestSaved; // One-time payment already paid

      const payoffDateWithout = new Date();
      payoffDateWithout.setMonth(
        payoffDateWithout.getMonth() + withoutExtra.termMonths,
      );

      const payoffDateWith = new Date();
      payoffDateWith.setMonth(payoffDateWith.getMonth() + withExtra.termMonths);

      let recommendation = '';
      if (monthsSaved > 0) {
        recommendation = `Making a one-time payment of $${impactDto.extraPaymentAmount.toFixed(2)} will save you ${monthsSaved} months and $${interestSaved.toFixed(2)} in interest!`;
      } else {
        recommendation = `This extra payment will have minimal impact. Consider increasing the amount or making recurring payments.`;
      }

      return {
        debtName: debt.name,
        currentBalance: debt.currentBalance,
        interestRate: debt.interestRate,
        withoutExtraPayment: {
          monthlyPayment: debt.minimumPayment,
          monthsToPayoff: withoutExtra.termMonths,
          totalInterestPaid: withoutExtra.totalInterestPaid,
          totalPaid: withoutExtra.totalPaid,
          payoffDate: payoffDateWithout.toISOString().split('T')[0],
        },
        withExtraPayment: {
          monthlyPayment: debt.minimumPayment,
          monthsToPayoff: withExtra.termMonths,
          totalInterestPaid: withExtra.totalInterestPaid,
          totalPaid: withExtra.totalPaid + impactDto.extraPaymentAmount,
          payoffDate: payoffDateWith.toISOString().split('T')[0],
        },
        impact: {
          monthsSaved,
          interestSaved,
          totalSaved,
          percentageFaster: (monthsSaved / withoutExtra.termMonths) * 100,
          newPayoffDate: payoffDateWith.toISOString().split('T')[0],
        },
        recommendation,
      };
    }

    // Recurring extra payments
    const withExtra = this.calculateLoanDetails(
      debt.currentBalance,
      debt.interestRate,
      newMonthlyPayment,
    );

    const monthsSaved = withoutExtra.termMonths - withExtra.termMonths;
    const interestSaved =
      withoutExtra.totalInterestPaid - withExtra.totalInterestPaid;
    const totalSaved = interestSaved;

    const payoffDateWithout = new Date();
    payoffDateWithout.setMonth(
      payoffDateWithout.getMonth() + withoutExtra.termMonths,
    );

    const payoffDateWith = new Date();
    payoffDateWith.setMonth(payoffDateWith.getMonth() + withExtra.termMonths);

    let recommendation = '';
    if (monthsSaved > 0) {
      recommendation = `Adding $${impactDto.extraPaymentAmount.toFixed(2)} to your monthly payment will save you ${monthsSaved} months and $${interestSaved.toFixed(2)} in interest! Your new payoff date: ${payoffDateWith.toISOString().split('T')[0]}`;
    } else {
      recommendation = `Consider increasing your extra payment amount for more significant impact.`;
    }

    return {
      debtName: debt.name,
      currentBalance: debt.currentBalance,
      interestRate: debt.interestRate,
      withoutExtraPayment: {
        monthlyPayment: debt.minimumPayment,
        monthsToPayoff: withoutExtra.termMonths,
        totalInterestPaid: withoutExtra.totalInterestPaid,
        totalPaid: withoutExtra.totalPaid,
        payoffDate: payoffDateWithout.toISOString().split('T')[0],
      },
      withExtraPayment: {
        monthlyPayment: newMonthlyPayment,
        monthsToPayoff: withExtra.termMonths,
        totalInterestPaid: withExtra.totalInterestPaid,
        totalPaid: withExtra.totalPaid,
        payoffDate: payoffDateWith.toISOString().split('T')[0],
      },
      impact: {
        monthsSaved,
        interestSaved,
        totalSaved,
        percentageFaster: (monthsSaved / withoutExtra.termMonths) * 100,
        newPayoffDate: payoffDateWith.toISOString().split('T')[0],
      },
      recommendation,
    };
  }

  async analyzeBulkExtraPayment(
    userId: string,
    bulkDto: BulkExtraPaymentDto,
  ): Promise<BulkExtraPaymentResult> {
    // Get debts to apply payment to
    const where: { userId: string; isActive: boolean; id?: { in: string[] } } = {
      userId,
      isActive: true,
    };
    if (bulkDto.debtIds && bulkDto.debtIds.length > 0) {
      where.id = { in: bulkDto.debtIds };
    }

    const debts = await this.prisma.debt.findMany({ where });

    if (debts.length === 0) {
      throw new BadRequestException('No debts found');
    }

    // Apply extra payment proportionally or to highest interest first
    const sortedDebts = debts.sort((a, b) => b.interestRate - a.interestRate);

    const impacts: ExtraPaymentImpactResult[] = [];
    let totalMonthsSaved = 0;
    let totalInterestSaved = 0;

    // For simplicity, apply entire extra payment to highest interest debt
    const targetDebt = sortedDebts[0];
    const impact = await this.analyzeExtraPaymentImpact(userId, {
      debtId: targetDebt.id,
      extraPaymentAmount: bulkDto.extraPaymentAmount,
    });

    impacts.push(impact);
    totalMonthsSaved = impact.impact.monthsSaved;
    totalInterestSaved = impact.impact.interestSaved;

    let recommendation = '';
    if (totalInterestSaved > 0) {
      recommendation = `Apply the $${bulkDto.extraPaymentAmount.toFixed(2)} extra payment to ${targetDebt.name} (highest interest rate: ${targetDebt.interestRate}%). This will save you ${totalMonthsSaved} months and $${totalInterestSaved.toFixed(2)} in interest!`;
    } else {
      recommendation = `Consider distributing the payment differently or increasing the amount.`;
    }

    return {
      totalExtraPayment: bulkDto.extraPaymentAmount,
      debtsImpacted: impacts.length,
      debtImpacts: impacts,
      totalMonthsSaved,
      totalInterestSaved,
      recommendation,
    };
  }

  // ============================================
  // Statistics & Dashboard
  // ============================================

  async getDebtStatistics(userId: string) {
    const debts = await this.prisma.debt.findMany({
      where: { userId, isActive: true },
    });

    const totalDebt = debts.reduce((sum, debt) => sum + debt.currentBalance, 0);
    const totalMinimumPayment = debts.reduce(
      (sum, debt) => sum + debt.minimumPayment,
      0,
    );
    const weightedInterestRate =
      debts.reduce(
        (sum, debt) => sum + debt.interestRate * debt.currentBalance,
        0,
      ) / totalDebt || 0;

    return {
      totalDebts: debts.length,
      totalDebt,
      totalMinimumPayment,
      averageInterestRate: weightedInterestRate,
      highestInterestRate: Math.max(...debts.map((d) => d.interestRate), 0),
      debtByType: this.groupDebtsByType(debts),
    };
  }

  private groupDebtsByType(debts: Debt[]) {
    const grouped = debts.reduce(
      (acc, debt) => {
        if (!acc[debt.type]) {
          acc[debt.type] = {
            count: 0,
            totalBalance: 0,
            totalMinimumPayment: 0,
          };
        }
        acc[debt.type].count++;
        acc[debt.type].totalBalance += debt.currentBalance;
        acc[debt.type].totalMinimumPayment += debt.minimumPayment;
        return acc;
      },
      {} as Record<
        string,
        { count: number; totalBalance: number; totalMinimumPayment: number }
      >,
    );

    return grouped;
  }
}
