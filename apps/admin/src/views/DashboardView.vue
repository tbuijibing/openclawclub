<template>
  <div class="dashboard-view">
    <h2>{{ t('dashboard.title') }}</h2>

    <!-- KPI Stat Cards -->
    <el-row :gutter="16" style="margin-top: 20px">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover">
          <el-statistic :title="t('dashboard.activeUsers')" :value="stats.totalUsers" />
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover">
          <el-statistic :title="t('dashboard.totalOrders')" :value="stats.totalOrders" />
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover">
          <el-statistic :title="t('dashboard.revenue')" :value="Number(stats.totalRevenue)" prefix="$" />
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover">
          <el-statistic :title="t('dashboard.satisfaction')" :value="4.7" :precision="1" suffix="/ 5" />
        </el-card>
      </el-col>
    </el-row>

    <!-- Charts Row -->
    <el-row :gutter="16" style="margin-top: 20px">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover">
          <template #header>{{ t('dashboard.revenueTrend') }}</template>
          <div class="chart-placeholder">
            <div class="mock-line-chart">
              <div v-for="(h, i) in revenueBars" :key="i" class="mock-bar" :style="{ height: h + '%' }" />
            </div>
            <div class="chart-labels">
              <span v-for="m in revenueMonths" :key="m">{{ m }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="6">
        <el-card shadow="hover">
          <template #header>{{ t('dashboard.ordersByRegion') }}</template>
          <div class="chart-placeholder">
            <div v-for="region in stats.usersByRegion" :key="region.region" class="region-bar-row">
              <span class="region-label">{{ regionLabels[region.region] || region.region }}</span>
              <el-progress :percentage="Math.round(Number(region.count) / stats.totalUsers * 100)" :stroke-width="18" :format="() => region.count" />
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="6">
        <el-card shadow="hover">
          <template #header>{{ t('dashboard.serviceDistribution') }}</template>
          <div class="chart-placeholder pie-placeholder">
            <div v-for="s in serviceSlices" :key="s.label" class="pie-item">
              <el-tag :type="s.type" effect="dark" round>{{ s.pct }}%</el-tag>
              <span>{{ s.label }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Recent Activity -->
    <el-card shadow="hover" style="margin-top: 20px">
      <template #header>{{ t('dashboard.recentActivity') }}</template>
      <el-timeline>
        <el-timeline-item v-for="a in recentActivities" :key="a.id" :timestamp="a.time" placement="top">
          <el-tag :type="a.tagType" size="small" style="margin-right: 8px">{{ a.tag }}</el-tag>
          {{ a.desc }}
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { get } from '@/api/client';

const { t } = useI18n();

const stats = ref({ totalUsers: 0, totalOrders: 0, totalRevenue: 0, activeTickets: 0, activeSubs: 0, ordersByType: [] as any[], usersByRegion: [] as any[] });

onMounted(async () => {
  try {
    const data = await get<any>('/analytics/dashboard');
    if (data) Object.assign(stats.value, data);
  } catch (e) {
    console.error('Dashboard load error:', e);
  }
});

const revenueBars = [35, 42, 55, 48, 62, 70, 65, 78, 82, 75, 88, 92];
const revenueMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const regionLabels: Record<string, string> = { apac: 'APAC', na: 'NA', eu: 'EU' };

const serviceSlices = [
  { label: 'Standard', pct: 45, type: 'primary' as const },
  { label: 'Professional', pct: 35, type: 'success' as const },
  { label: 'Enterprise', pct: 20, type: 'warning' as const },
];

const recentActivities = [
  { id: 1, time: '2026-03-08 14:30', tag: 'Order', tagType: 'primary' as const, desc: '新企业安装订单 #OC-20260302-0002' },
  { id: 2, time: '2026-03-08 13:15', tag: 'User', tagType: 'success' as const, desc: '新企业用户注册: TechCorp GmbH' },
  { id: 3, time: '2026-03-08 12:00', tag: 'Ticket', tagType: 'warning' as const, desc: '优先工单 #TK-20260305-002 处理中' },
  { id: 4, time: '2026-03-08 10:45', tag: 'Partner', tagType: 'info' as const, desc: '合作伙伴收益已结算: ¥239.2' },
  { id: 5, time: '2026-03-08 09:20', tag: 'Service', tagType: 'danger' as const, desc: '安装订单已完成并验收' },
];
</script>

<style scoped>
.stat-trend { font-size: 13px; margin-top: 4px; }
.trend-up { color: var(--el-color-success); }
.chart-placeholder { min-height: 180px; }
.mock-line-chart { display: flex; align-items: flex-end; gap: 6px; height: 150px; }
.mock-bar { flex: 1; background: linear-gradient(180deg, var(--el-color-primary), var(--el-color-primary-light-5)); border-radius: 3px 3px 0 0; transition: height 0.3s; }
.chart-labels { display: flex; justify-content: space-between; font-size: 11px; color: var(--el-text-color-secondary); margin-top: 4px; }
.region-bar-row { margin-bottom: 12px; }
.region-label { font-size: 13px; font-weight: 600; display: block; margin-bottom: 4px; }
.pie-placeholder { display: flex; flex-direction: column; gap: 12px; padding-top: 10px; }
.pie-item { display: flex; align-items: center; gap: 8px; }
</style>
