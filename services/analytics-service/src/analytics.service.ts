import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  ReportPeriod,
  ExportFormat,
  AnalyticsRegion,
  DashboardMetric,
  FunnelStage,
  ANOMALY_DEVIATION_THRESHOLD,
  ANOMALY_ROLLING_WINDOW_DAYS,
  FUNNEL_STAGES,
} from '@openclaw-club/shared';
import {
  GetDashboardDto,
  GenerateReportDto,
  ExportReportDto,
  GetRegionalStatsDto,
  GetConversionFunnelDto,
  RecordMetricDto,
  CheckAnomaliesDto,
} from './dto/analytics.dto';

// ─── In-memory record types ───

export interface DashboardSnapshot {
  activeUsers: number;
  orders: number;
  revenue: number;
  satisfaction: number;
  region?: AnalyticsRegion;
  generatedAt: Date;
}

export interface Report {
  id: string;
  period: ReportPeriod;
  region?: AnalyticsRegion;
  startDate: string;
  endDate: string;
  data: DashboardSnapshot;
  createdAt: Date;
}

export interface ReportExport {
  reportId: string;
  format: ExportFormat;
  content: string;
  exportedAt: Date;
}

export interface RegionalStats {
  region: AnalyticsRegion;
  activeUsers: number;
  orders: number;
  revenue: number;
  satisfaction: number;
}

export interface FunnelData {
  stage: FunnelStage;
  count: number;
  conversionRate: number; // percentage from previous stage
}

export interface ConversionFunnel {
  stages: FunnelData[];
  region?: AnalyticsRegion;
  startDate?: string;
  endDate?: string;
}

export interface MetricRecord {
  id: string;
  metric: DashboardMetric;
  value: number;
  region?: AnalyticsRegion;
  date: string;
  recordedAt: Date;
}

export interface AnomalyAlert {
  id: string;
  metric: DashboardMetric;
  currentValue: number;
  averageValue: number;
  deviationPercent: number;
  region?: AnalyticsRegion;
  date: string;
  createdAt: Date;
}


@Injectable()
export class AnalyticsService {
  private reports = new Map<string, Report>();
  private metricRecords: MetricRecord[] = [];
  private anomalyAlerts: AnomalyAlert[] = [];
  private funnelCounts = new Map<string, number>(); // key: `${stage}:${region?}`

  // ─── Dashboard (Req 12.1) ───

  getDashboard(dto: GetDashboardDto): DashboardSnapshot {
    const metrics: DashboardMetric[] = ['active_users', 'orders', 'revenue', 'satisfaction'];
    const snapshot: Record<string, number> = {};

    for (const metric of metrics) {
      const records = this.metricRecords.filter(
        (r) => r.metric === metric && (!dto.region || r.region === dto.region),
      );
      snapshot[metric] = records.length > 0 ? records[records.length - 1].value : 0;
    }

    return {
      activeUsers: snapshot['active_users'],
      orders: snapshot['orders'],
      revenue: snapshot['revenue'],
      satisfaction: snapshot['satisfaction'],
      region: dto.region,
      generatedAt: new Date(),
    };
  }

  // ─── Reports (Req 12.2, 12.3) ───

  generateReport(dto: GenerateReportDto): Report {
    const validPeriods: ReportPeriod[] = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
    if (!validPeriods.includes(dto.period)) {
      throw new BadRequestException(`Invalid period: ${dto.period}`);
    }
    if (!dto.startDate) throw new BadRequestException('startDate is required');
    if (!dto.endDate) throw new BadRequestException('endDate is required');

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (isNaN(start.getTime())) throw new BadRequestException('Invalid startDate');
    if (isNaN(end.getTime())) throw new BadRequestException('Invalid endDate');
    if (start > end) throw new BadRequestException('startDate must be before endDate');

    const data = this.getDashboard({ region: dto.region });

    const report: Report = {
      id: crypto.randomUUID(),
      period: dto.period,
      region: dto.region,
      startDate: dto.startDate,
      endDate: dto.endDate,
      data,
      createdAt: new Date(),
    };

    this.reports.set(report.id, report);
    return report;
  }

  exportReport(dto: ExportReportDto): ReportExport {
    const validFormats: ExportFormat[] = ['csv', 'pdf'];
    if (!validFormats.includes(dto.format)) {
      throw new BadRequestException(`Invalid format: ${dto.format}. Supported: csv, pdf`);
    }

    const report = this.reports.get(dto.reportId);
    if (!report) throw new NotFoundException(`Report ${dto.reportId} not found`);

    let content: string;
    if (dto.format === 'csv') {
      content = this.generateCsvContent(report);
    } else {
      content = this.generatePdfPlaceholder(report);
    }

    return {
      reportId: dto.reportId,
      format: dto.format,
      content,
      exportedAt: new Date(),
    };
  }

  getReport(reportId: string): Report {
    const report = this.reports.get(reportId);
    if (!report) throw new NotFoundException(`Report ${reportId} not found`);
    return report;
  }

  // ─── Regional Stats (Req 12.4) ───

  getRegionalStats(dto: GetRegionalStatsDto): RegionalStats {
    const validRegions: AnalyticsRegion[] = ['apac', 'na', 'eu'];
    if (!validRegions.includes(dto.region)) {
      throw new BadRequestException(`Invalid region: ${dto.region}. Supported: apac, na, eu`);
    }

    const snapshot = this.getDashboard({ region: dto.region });

    return {
      region: dto.region,
      activeUsers: snapshot.activeUsers,
      orders: snapshot.orders,
      revenue: snapshot.revenue,
      satisfaction: snapshot.satisfaction,
    };
  }

  getAllRegionalStats(): RegionalStats[] {
    const regions: AnalyticsRegion[] = ['apac', 'na', 'eu'];
    return regions.map((region) => this.getRegionalStats({ region }));
  }

  // ─── Conversion Funnel (Req 12.5) ───

  setFunnelCount(stage: FunnelStage, count: number, region?: AnalyticsRegion): void {
    if (!FUNNEL_STAGES.includes(stage)) {
      throw new BadRequestException(`Invalid funnel stage: ${stage}`);
    }
    if (count < 0) throw new BadRequestException('count must be non-negative');

    const key = region ? `${stage}:${region}` : stage;
    this.funnelCounts.set(key, count);
  }

  getConversionFunnel(dto: GetConversionFunnelDto): ConversionFunnel {
    const stages: FunnelData[] = [];
    let previousCount: number | null = null;

    for (const stage of FUNNEL_STAGES) {
      const key = dto.region ? `${stage}:${dto.region}` : stage;
      const count = this.funnelCounts.get(key) ?? 0;

      const conversionRate =
        previousCount !== null && previousCount > 0
          ? parseFloat(((count / previousCount) * 100).toFixed(2))
          : 100;

      stages.push({ stage, count, conversionRate });
      previousCount = count;
    }

    return {
      stages,
      region: dto.region,
      startDate: dto.startDate,
      endDate: dto.endDate,
    };
  }

  // ─── Metric Recording & Anomaly Detection (Req 12.6) ───

  recordMetric(dto: RecordMetricDto): MetricRecord {
    const validMetrics: DashboardMetric[] = ['active_users', 'orders', 'revenue', 'satisfaction'];
    if (!validMetrics.includes(dto.metric)) {
      throw new BadRequestException(`Invalid metric: ${dto.metric}`);
    }
    if (dto.value < 0) throw new BadRequestException('value must be non-negative');
    if (!dto.date) throw new BadRequestException('date is required');

    const record: MetricRecord = {
      id: crypto.randomUUID(),
      metric: dto.metric,
      value: dto.value,
      region: dto.region,
      date: dto.date,
      recordedAt: new Date(),
    };

    this.metricRecords.push(record);
    return record;
  }

  checkAnomalies(dto: CheckAnomaliesDto): AnomalyAlert[] {
    if (!dto.date) throw new BadRequestException('date is required');

    const targetDate = new Date(dto.date);
    if (isNaN(targetDate.getTime())) throw new BadRequestException('Invalid date');

    const alerts: AnomalyAlert[] = [];
    const metrics: DashboardMetric[] = ['active_users', 'orders', 'revenue', 'satisfaction'];

    for (const metric of metrics) {
      const todayRecords = this.metricRecords.filter(
        (r) => r.metric === metric && r.date === dto.date,
      );
      if (todayRecords.length === 0) continue;

      const currentValue = todayRecords[todayRecords.length - 1].value;
      const avg = this.calculateRollingAverage(metric, dto.date);
      if (avg === null || avg === 0) continue;

      const deviation = Math.abs(currentValue - avg) / avg;
      if (deviation > ANOMALY_DEVIATION_THRESHOLD) {
        const alert: AnomalyAlert = {
          id: crypto.randomUUID(),
          metric,
          currentValue,
          averageValue: parseFloat(avg.toFixed(2)),
          deviationPercent: parseFloat((deviation * 100).toFixed(2)),
          date: dto.date,
          createdAt: new Date(),
        };
        this.anomalyAlerts.push(alert);
        alerts.push(alert);
      }
    }

    return alerts;
  }

  getAnomalyAlerts(): AnomalyAlert[] {
    return [...this.anomalyAlerts];
  }

  // ─── Helpers ───

  private calculateRollingAverage(metric: DashboardMetric, dateStr: string): number | null {
    const targetDate = new Date(dateStr);
    const windowStart = new Date(targetDate);
    windowStart.setDate(windowStart.getDate() - ANOMALY_ROLLING_WINDOW_DAYS);

    const windowRecords = this.metricRecords.filter((r) => {
      if (r.metric !== metric) return false;
      const d = new Date(r.date);
      return d >= windowStart && d < targetDate;
    });

    if (windowRecords.length === 0) return null;

    const sum = windowRecords.reduce((acc, r) => acc + r.value, 0);
    return sum / windowRecords.length;
  }

  private generateCsvContent(report: Report): string {
    const header = 'metric,value';
    const rows = [
      `active_users,${report.data.activeUsers}`,
      `orders,${report.data.orders}`,
      `revenue,${report.data.revenue}`,
      `satisfaction,${report.data.satisfaction}`,
    ];
    return [header, ...rows].join('\n');
  }

  private generatePdfPlaceholder(report: Report): string {
    return `[PDF] Report ${report.id} | Period: ${report.period} | ${report.startDate} to ${report.endDate}`;
  }
}
