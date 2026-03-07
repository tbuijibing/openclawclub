import { Injectable, Logger } from '@nestjs/common';

/**
 * Audit log entry — records API call metadata ONLY.
 * Per requirement 15.10: never stores conversation content.
 */
export interface AuditLogEntry {
  id: string;
  userId: string;
  model: string;
  provider: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  /** Whether the user used their own API key (direct mode) */
  directMode: boolean;
  /** ISO 8601 UTC timestamp */
  timestamp: string;
  /** Duration of the API call in milliseconds */
  durationMs: number;
  /** HTTP status or 'stream' for streaming calls */
  responseType: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  // In-memory store (replace with DB/Elasticsearch in production)
  private logs: AuditLogEntry[] = [];
  private idCounter = 0;

  /**
   * Log an API call's metadata. Never stores message content.
   */
  logApiCall(params: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: `audit-${++this.idCounter}`,
      timestamp: new Date().toISOString(),
      ...params,
    };
    this.logs.push(entry);
    this.logger.debug(
      `Audit: user=${entry.userId} model=${entry.model} tokens=${entry.totalTokens} direct=${entry.directMode}`,
    );
    return entry;
  }

  /**
   * Query audit logs for a user within a date range.
   */
  getAuditLogs(
    userId: string,
    startDate?: string,
    endDate?: string,
  ): AuditLogEntry[] {
    let results = this.logs.filter((l) => l.userId === userId);
    if (startDate) {
      const start = new Date(startDate);
      results = results.filter((l) => new Date(l.timestamp) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      results = results.filter((l) => new Date(l.timestamp) <= end);
    }
    return results;
  }

  /** Exposed for testing */
  getAllLogs(): AuditLogEntry[] {
    return [...this.logs];
  }

  /** Clear logs (for testing) */
  clear(): void {
    this.logs = [];
    this.idCounter = 0;
  }
}
