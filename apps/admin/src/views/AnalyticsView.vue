<template>
  <div class="analytics-view">
    <h2>{{ t('sidebar.analytics') }}</h2>

    <!-- Period & Region Selectors -->
    <el-row :gutter="12" style="margin: 16px 0" align="middle">
      <el-col :span="6">
        <el-select v-model="period" :placeholder="t('analytics.period')">
          <el-option :label="t('analytics.day')" value="day" />
          <el-option :label="t('analytics.week')" value="week" />
          <el-option :label="t('analytics.month')" value="month" />
          <el-option :label="t('analytics.quarter')" value="quarter" />
          <el-option :label="t('analytics.year')" value="year" />
        </el-select>
      </el-col>
      <el-col :span="6">
        <el-select v-model="region" :placeholder="t('analytics.region')">
          <el-option :label="t('analytics.allRegions')" value="all" />
          <el-option label="APAC" value="apac" />
          <el-option label="NA" value="na" />
          <el-option label="EU" value="eu" />
        </el-select>
      </el-col>
      <el-col :span="12" style="text-align: right">
        <el-button>{{ t('analytics.exportCSV') }}</el-button>
        <el-button>{{ t('analytics.exportPDF') }}</el-button>
      </el-col>
    </el-row>

    <!-- KPI Cards -->
    <el-row :gutter="16">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover"><el-statistic :title="t('dashboard.activeUsers')" :value="stats.totalUsers" /><div class="stat-trend trend-up">↑ 12.5%</div></el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover"><el-statistic :title="t('dashboard.totalOrders')" :value="stats.totalOrders" /><div class="stat-trend trend-up">↑ 8.3%</div></el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover"><el-statistic :title="t('dashboard.revenue')" :value="stats.totalRevenue" prefix="$" /><div class="stat-trend trend-up">↑ 15.2%</div></el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover"><el-statistic :title="t('analytics.tokenRevenue')" :value="189400" prefix="$" /><div class="stat-trend trend-up">↑ 22.1%</div></el-card>
      </el-col>
    </el-row>

    <!-- Regional Breakdown -->
    <el-card shadow="hover" style="margin-top: 20px">
      <template #header>{{ t('analytics.regionalBreakdown') }}</template>
      <el-table :data="regionBreakdown" stripe border>
        <el-table-column prop="region" :label="t('analytics.region')" width="120" />
        <el-table-column prop="users" :label="t('dashboard.activeUsers')" width="130" />
        <el-table-column prop="orders" :label="t('dashboard.totalOrders')" width="130" />
        <el-table-column prop="revenue" :label="t('dashboard.revenue')" width="140">
          <template #default="{ row }">${{ row.revenue.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="satisfaction" :label="t('dashboard.satisfaction')" width="120">
          <template #default="{ row }">⭐ {{ row.satisfaction }}</template>
        </el-table-column>
        <el-table-column :label="t('analytics.revenueShare')" min-width="200">
          <template #default="{ row }">
            <el-progress :percentage="row.share" :stroke-width="18" :format="() => `${row.share}%`" />
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Conversion Funnel -->
    <el-card shadow="hover" style="margin-top: 20px">
      <template #header>{{ t('analytics.conversionFunnel') }}</template>
      <div class="funnel-container">
        <div v-for="(step, i) in funnelSteps" :key="step.label" class="funnel-step">
          <div class="funnel-bar" :style="{ width: step.pct + '%' }">
            <span class="funnel-label">{{ step.label }}</span>
            <span class="funnel-value">{{ step.count.toLocaleString() }} ({{ step.pct }}%)</span>
          </div>
          <div v-if="i < funnelSteps.length - 1" class="funnel-arrow">
            ↓ {{ step.conversionRate }}%
          </div>
        </div>
      </div>
    </el-card>

    <!-- Anomaly Alerts -->
    <el-card shadow="hover" style="margin-top: 20px">
      <template #header>
        {{ t('analytics.anomalyAlerts') }}
        <el-tag type="danger" size="small" style="margin-left: 8px">{{ anomalies.length }}</el-tag>
      </template>
      <el-table :data="anomalies" stripe border>
        <el-table-column prop="metric" :label="t('analytics.metric')" width="200" />
        <el-table-column prop="current" :label="t('analytics.currentValue')" width="140" />
        <el-table-column prop="average" :label="t('analytics.sevenDayAvg')" width="140" />
        <el-table-column prop="deviation" :label="t('analytics.deviation')" width="120">
          <template #default="{ row }">
            <el-tag :type="row.deviation > 0 ? 'danger' : 'warning'" size="small">
              {{ row.deviation > 0 ? '+' : '' }}{{ row.deviation }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="detectedAt" :label="t('analytics.detectedAt')" width="160" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { get } from '@/api/client';

const { t } = useI18n();

const period = ref('month');
const region = ref('all');

const stats = ref({ totalUsers: 0, totalOrders: 0, totalRevenue: 0 });
const regionBreakdown = ref<any[]>([]);

onMounted(async () => {
  try {
    const data = await get<any>('/analytics/dashboard');
    if (data) {
      stats.value.totalUsers = data.totalUsers || 0;
      stats.value.totalOrders = data.totalOrders || 0;
      stats.value.totalRevenue = Number(data.totalRevenue) || 0;
      regionBreakdown.value = (data.usersByRegion || []).map((r: any) => ({
        region: (r.region || '').toUpperCase(),
        users: Number(r.count) || 0,
        orders: 0,
        revenue: 0,
        satisfaction: 4.7,
        share: data.totalUsers ? Math.round(Number(r.count) / data.totalUsers * 100) : 0,
      }));
    }
  } catch (e) { console.error('Analytics load error', e); }
});

const funnelSteps = [
  { label: 'Registration', count: 28400, pct: 100, conversionRate: 44 },
  { label: 'Trial', count: 12480, pct: 44, conversionRate: 26 },
  { label: 'Paid', count: 3256, pct: 11, conversionRate: 72 },
  { label: 'Renewal', count: 2344, pct: 8 },
];

const anomalies = [
  { metric: 'Ticket Volume', current: '48', average: '32', deviation: 50, detectedAt: '2025-07-10 08:00' },
  { metric: 'Refund Rate', current: '4.2%', average: '2.8%', deviation: 50, detectedAt: '2025-07-10 06:00' },
];
</script>

<style scoped>
.stat-trend { font-size: 13px; margin-top: 4px; }
.trend-up { color: var(--el-color-success); }
.funnel-container { padding: 12px 0; }
.funnel-step { margin-bottom: 4px; }
.funnel-bar {
  background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-3));
  border-radius: 4px;
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  color: #fff;
  font-size: 14px;
  min-width: 200px;
}
.funnel-label { font-weight: 600; }
.funnel-arrow { text-align: center; font-size: 12px; color: var(--el-text-color-secondary); padding: 2px 0; }
</style>
