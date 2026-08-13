import { describe, expect, it } from "vitest";

import type { SqlDatabase } from "../../src/data/database-contract";
import type { ReminderDraft } from "../../src/domain/models";
import { LocalReminderRepository } from "../../src/repositories/local-repositories";

const draft: ReminderDraft = { id: "reminder-1", vehicleId: "vehicle-1", title: "Annual inspection", dueOn: "2026-10-01", dueOdometerKm: null, recurrence: "yearly", notificationId: null, notificationLeadDays: 7, note: null, completedAt: null, snoozedUntil: null };

class FakeReminderDatabase implements SqlDatabase {
  runCalls: Array<{ source: string; parameters: unknown[] }> = [];
  duplicateId: string | null = null;
  shouldFailWrites = false;
  transactionCount = 0;
  async execAsync(): Promise<void> {}
  async runAsync(source: string, ...parameters: unknown[]) { if (this.shouldFailWrites) throw new Error("storage unavailable"); this.runCalls.push({ source, parameters }); return { lastInsertRowId: this.runCalls.length, changes: 1 }; }
  async getFirstAsync<T>(source: string): Promise<T | null> {
    if (source.includes("current_odometer_km")) return { current_odometer_km: 45000 } as T;
    if (source.includes("SELECT id FROM reminders")) return this.duplicateId ? { id: this.duplicateId } as T : null;
    return null;
  }
  async getAllAsync<T>(): Promise<T[]> { return []; }
  async withTransactionAsync<T>(task: () => Promise<T>): Promise<T> { this.transactionCount += 1; return task(); }
}

describe("Phase 7 local reminder repository", () => {
  it("rejects a date-and-mileage-less reminder before a transaction starts", async () => {
    const database = new FakeReminderDatabase();
    await expect(new LocalReminderRepository(database).create({ ...draft, dueOn: null, dueOdometerKm: null })).rejects.toMatchObject({ code: "write-failed" });
    expect(database.transactionCount).toBe(0);
    expect(database.runCalls).toHaveLength(0);
  });

  it("rejects a duplicate open reminder without creating a second notification record", async () => {
    const database = new FakeReminderDatabase(); database.duplicateId = "reminder-existing";
    await expect(new LocalReminderRepository(database).create(draft)).rejects.toMatchObject({ code: "write-failed" });
    expect(database.transactionCount).toBe(1);
    expect(database.runCalls).toHaveLength(0);
  });

  it("persists valid local reminders transactionally and wraps storage write failures", async () => {
    const working = new FakeReminderDatabase();
    const saved = await new LocalReminderRepository(working).create(draft);
    expect(saved.id).toBe(draft.id);
    expect(saved.notificationLeadDays).toBe(7);
    expect(working.transactionCount).toBe(1);
    expect(working.runCalls[0].source).toContain("INSERT INTO reminders");

    const failing = new FakeReminderDatabase(); failing.shouldFailWrites = true;
    await expect(new LocalReminderRepository(failing).create(draft)).rejects.toMatchObject({ code: "write-failed" });
  });
});
