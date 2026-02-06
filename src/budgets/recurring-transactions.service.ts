import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreateRecurringTransactionDto,
    UpdateRecurringTransactionDto,
    RecurrenceFrequency,
} from './dto/recurring-transaction.dto';
import { createPaginatedResponse } from '../common/utils/pagination.util';

@Injectable()
export class RecurringTransactionsService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, dto: CreateRecurringTransactionDto) {
        const nextDueDate = this.calculateNextDueDate(
            dto.startDate,
            dto.frequency,
            dto.interval || 1,
            dto.dayOfWeek,
            dto.dayOfMonth,
            dto.monthOfYear,
            dto.skipWeekends || false,
        );

        return this.prisma.recurringTransaction.create({
            data: {
                userId,
                name: dto.name,
                description: dto.description,
                amount: dto.amount,
                type: dto.type,
                frequency: dto.frequency,
                interval: dto.interval || 1,
                dayOfWeek: dto.dayOfWeek,
                dayOfMonth: dto.dayOfMonth,
                monthOfYear: dto.monthOfYear,
                startDate: dto.startDate,
                endDate: dto.endDate,
                nextDueDate,
                accountId: dto.accountId,
                categoryId: dto.categoryId,
                budgetId: dto.budgetId,
                autoProcess: dto.autoProcess || false,
                reminderDays: dto.reminderDays || 3,
                skipWeekends: dto.skipWeekends || false,
            },
        });
    }

    async findAll(
        userId: string,
        isActive?: boolean,
        page: number = 1,
        limit: number = 10,
    ) {
        const where: any = { userId };
        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        const [docs, totalDocs] = await Promise.all([
            this.prisma.recurringTransaction.findMany({
                where,
                orderBy: { nextDueDate: 'asc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.recurringTransaction.count({ where }),
        ]);

        return createPaginatedResponse(docs, totalDocs, page, limit);
    }

    async findOne(id: string, userId: string) {
        const recurring = await this.prisma.recurringTransaction.findFirst({
            where: { id, userId },
        });

        if (!recurring) {
            throw new NotFoundException('Recurring transaction not found');
        }

        return recurring;
    }

    async update(id: string, userId: string, dto: UpdateRecurringTransactionDto) {
        await this.findOne(id, userId);

        const data: any = { ...dto };

        // Recalculate next due date if frequency-related fields changed
        if (dto.frequency || dto.interval || dto.dayOfWeek || dto.dayOfMonth) {
            const current = await this.findOne(id, userId);
            data.nextDueDate = this.calculateNextDueDate(
                current.startDate,
                dto.frequency || current.frequency,
                dto.interval || current.interval,
                dto.dayOfWeek !== undefined ? dto.dayOfWeek : current.dayOfWeek,
                dto.dayOfMonth !== undefined ? dto.dayOfMonth : current.dayOfMonth,
                current.monthOfYear,
                dto.skipWeekends !== undefined ? dto.skipWeekends : current.skipWeekends,
            );
        }

        return this.prisma.recurringTransaction.update({
            where: { id },
            data,
        });
    }

    async remove(id: string, userId: string) {
        await this.findOne(id, userId);

        return this.prisma.recurringTransaction.delete({
            where: { id },
        });
    }

    async getUpcoming(userId: string, days: number = 7) {
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        return this.prisma.recurringTransaction.findMany({
            where: {
                userId,
                isActive: true,
                nextDueDate: {
                    gte: now,
                    lte: futureDate,
                },
            },
            orderBy: { nextDueDate: 'asc' },
        });
    }

    async skipNextOccurrence(id: string, userId: string) {
        const recurring = await this.findOne(id, userId);

        const nextDueDate = this.calculateNextDueDateFromCurrent(
            recurring.nextDueDate,
            recurring.frequency as RecurrenceFrequency,
            recurring.interval,
            recurring.skipWeekends,
        );

        return this.prisma.recurringTransaction.update({
            where: { id },
            data: { nextDueDate },
        });
    }

    async pause(id: string, userId: string) {
        await this.findOne(id, userId);

        return this.prisma.recurringTransaction.update({
            where: { id },
            data: { isActive: false },
        });
    }

    async resume(id: string, userId: string) {
        const recurring = await this.findOne(id, userId);

        // Recalculate next due date from now
        const now = new Date();
        const nextDueDate = this.calculateNextDueDate(
            now,
            recurring.frequency as RecurrenceFrequency,
            recurring.interval,
            recurring.dayOfWeek,
            recurring.dayOfMonth,
            recurring.monthOfYear,
            recurring.skipWeekends,
        );

        return this.prisma.recurringTransaction.update({
            where: { id },
            data: {
                isActive: true,
                nextDueDate,
            },
        });
    }

    /**
     * Process all due recurring transactions
     * This should be called by a cron job
     */
    async processDueTransactions() {
        const now = new Date();

        const dueTransactions = await this.prisma.recurringTransaction.findMany({
            where: {
                isActive: true,
                autoProcess: true,
                nextDueDate: {
                    lte: now,
                },
                OR: [{ endDate: null }, { endDate: { gte: now } }],
            },
        });

        const processed: any[] = [];

        for (const recurring of dueTransactions) {
            try {
                // Create the actual transaction
                const transaction = await this.prisma.transaction.create({
                    data: {
                        userId: recurring.userId,
                        accountId: recurring.accountId!,
                        date: recurring.nextDueDate,
                        description: recurring.name,
                        amount: recurring.amount,
                        type: recurring.type,
                        categoryId: recurring.categoryId,
                        isRecurring: true,
                        recurringId: recurring.id,
                    },
                });

                // Calculate next due date
                const nextDueDate = this.calculateNextDueDateFromCurrent(
                    recurring.nextDueDate,
                    recurring.frequency as RecurrenceFrequency,
                    recurring.interval,
                    recurring.skipWeekends,
                );

                // Update recurring transaction
                await this.prisma.recurringTransaction.update({
                    where: { id: recurring.id },
                    data: {
                        lastProcessedDate: now,
                        nextDueDate,
                        occurrencesCount: { increment: 1 },
                        totalAmountProcessed: { increment: recurring.amount },
                    },
                });

                processed.push({ recurringId: recurring.id, transactionId: transaction.id });
            } catch (error) {
                console.error(`Failed to process recurring transaction ${recurring.id}:`, error);
            }
        }

        return processed;
    }

    /**
     * Get transactions that need reminders
     */
    async getTransactionsNeedingReminders(userId?: string) {
        const now = new Date();

        const recurring = await this.prisma.recurringTransaction.findMany({
            where: {
                isActive: true,
                autoProcess: false, // Only non-auto transactions need reminders
                ...(userId && { userId }),
            },
        });

        const needsReminder: any[] = [];

        for (const r of recurring) {
            const reminderDate = new Date(r.nextDueDate);
            reminderDate.setDate(reminderDate.getDate() - r.reminderDays);

            if (now >= reminderDate && now < r.nextDueDate) {
                needsReminder.push({
                    id: r.id,
                    name: r.name,
                    amount: r.amount,
                    nextDueDate: r.nextDueDate,
                    daysUntilDue: Math.ceil(
                        (r.nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
                    ),
                });
            }
        }

        return needsReminder;
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private calculateNextDueDate(
        startDate: Date,
        frequency: RecurrenceFrequency | string,
        interval: number,
        dayOfWeek?: number | null,
        dayOfMonth?: number | null,
        monthOfYear?: number | null,
        skipWeekends: boolean = false,
    ): Date {
        const date = new Date(startDate);
        const now = new Date();

        // If start date is in the future, use that
        if (date > now) {
            return this.adjustForWeekends(date, skipWeekends);
        }

        // Calculate next occurrence from now
        let nextDate = new Date(now);

        switch (frequency) {
            case RecurrenceFrequency.DAILY:
                nextDate.setDate(nextDate.getDate() + interval);
                break;

            case RecurrenceFrequency.WEEKLY:
                if (dayOfWeek !== null && dayOfWeek !== undefined) {
                    const currentDay = nextDate.getDay();
                    let daysToAdd = dayOfWeek - currentDay;
                    if (daysToAdd <= 0) daysToAdd += 7;
                    nextDate.setDate(nextDate.getDate() + daysToAdd);
                } else {
                    nextDate.setDate(nextDate.getDate() + 7 * interval);
                }
                break;

            case RecurrenceFrequency.BI_WEEKLY:
                nextDate.setDate(nextDate.getDate() + 14 * interval);
                break;

            case RecurrenceFrequency.MONTHLY:
                if (dayOfMonth !== null && dayOfMonth !== undefined) {
                    nextDate.setDate(dayOfMonth);
                    if (nextDate <= now) {
                        nextDate.setMonth(nextDate.getMonth() + interval);
                    }
                } else {
                    nextDate.setMonth(nextDate.getMonth() + interval);
                }
                break;

            case RecurrenceFrequency.QUARTERLY:
                nextDate.setMonth(nextDate.getMonth() + 3 * interval);
                if (dayOfMonth !== null && dayOfMonth !== undefined) {
                    nextDate.setDate(dayOfMonth);
                }
                break;

            case RecurrenceFrequency.ANNUALLY:
                if (
                    monthOfYear !== null &&
                    monthOfYear !== undefined &&
                    dayOfMonth !== null &&
                    dayOfMonth !== undefined
                ) {
                    nextDate.setMonth(monthOfYear - 1);
                    nextDate.setDate(dayOfMonth);
                    if (nextDate <= now) {
                        nextDate.setFullYear(nextDate.getFullYear() + interval);
                    }
                } else {
                    nextDate.setFullYear(nextDate.getFullYear() + interval);
                }
                break;
        }

        return this.adjustForWeekends(nextDate, skipWeekends);
    }

    private calculateNextDueDateFromCurrent(
        currentDueDate: Date,
        frequency: RecurrenceFrequency | string,
        interval: number,
        skipWeekends: boolean,
    ): Date {
        const date = new Date(currentDueDate);

        switch (frequency) {
            case RecurrenceFrequency.DAILY:
                date.setDate(date.getDate() + interval);
                break;
            case RecurrenceFrequency.WEEKLY:
                date.setDate(date.getDate() + 7 * interval);
                break;
            case RecurrenceFrequency.BI_WEEKLY:
                date.setDate(date.getDate() + 14 * interval);
                break;
            case RecurrenceFrequency.MONTHLY:
                date.setMonth(date.getMonth() + interval);
                break;
            case RecurrenceFrequency.QUARTERLY:
                date.setMonth(date.getMonth() + 3 * interval);
                break;
            case RecurrenceFrequency.ANNUALLY:
                date.setFullYear(date.getFullYear() + interval);
                break;
        }

        return this.adjustForWeekends(date, skipWeekends);
    }

    private adjustForWeekends(date: Date, skipWeekends: boolean): Date {
        if (!skipWeekends) return date;

        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0) {
            // Sunday -> Monday
            date.setDate(date.getDate() + 1);
        } else if (dayOfWeek === 6) {
            // Saturday -> Monday
            date.setDate(date.getDate() + 2);
        }

        return date;
    }
}
