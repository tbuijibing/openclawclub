<template>
  <div class="services-view">
    <h2>{{ t('sidebar.services') }}</h2>

    <!-- Dispatch Monitoring -->
    <h3 style="margin-top: 16px">{{ t('services.dispatchMonitor') }}</h3>
    <el-table :data="activeOrders" stripe border style="width: 100%" v-loading="loading">
      <el-table-column prop="orderId" :label="t('orders.orderNumber')" width="200">
        <template #default="{ row }">{{ row.order?.orderNumber || row.orderId?.substring(0, 8) }}</template>
      </el-table-column>
      <el-table-column :label="t('orders.user')" width="130">
        <template #default="{ row }">{{ row.order?.userId?.substring(0, 8) || '—' }}</template>
      </el-table-column>
      <el-table-column prop="serviceTier" :label="t('services.tier')" width="120">
        <template #default="{ row }">
          <el-tag :type="tierType(row.serviceTier)" size="small">{{ row.serviceTier }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="installStatus" :label="t('common.status')" width="150">
        <template #default="{ row }">
          <el-tag :type="installStatusType(row.installStatus)" size="small">{{ row.installStatus }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('services.engineer')" width="140">
        <template #default="{ row }">{{ row.engineerId?.substring(0, 8) || '—' }}</template>
      </el-table-column>
      <el-table-column prop="dispatchedAt" :label="t('services.dispatchedAt')" width="160">
        <template #default="{ row }">{{ row.dispatchedAt ? new Date(row.dispatchedAt).toLocaleString() : '—' }}</template>
      </el-table-column>
      <el-table-column :label="t('common.actions')" width="140" fixed="right">
        <template #default="{ row }">
          <el-button v-if="!row.engineerId" size="small" type="primary" plain>{{ t('services.assign') }}</el-button>
          <el-button v-else size="small">{{ t('orders.detail') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Engineer Management -->
    <h3 style="margin-top: 32px">{{ t('services.engineerManagement') }}</h3>
    <el-table :data="engineers" stripe border style="width: 100%" v-loading="loadingEngineers">
      <el-table-column prop="displayName" :label="t('users.name')" width="140" />
      <el-table-column :label="t('services.skillLevel')" width="120">
        <template #default="{ row }">
          <el-tag size="small">{{ row.role }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="region" :label="t('orders.region')" width="100" />
      <el-table-column prop="createdAt" :label="t('common.status')" width="160">
        <template #default="{ row }">
          <el-tag type="success" size="small">active</el-tag>
        </template>
      </el-table-column>
    </el-table>

    <!-- Service Quality Metrics -->
    <h3 style="margin-top: 32px">{{ t('services.qualityMetrics') }}</h3>
    <el-row :gutter="16">
      <el-col :span="6">
        <el-card shadow="hover"><el-statistic :title="t('services.avgCompletionTime')" :value="metrics.avgCompletionTime" /></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover"><el-statistic :title="t('services.firstTimeSuccess')" :value="metrics.firstTimeSuccess" /></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover"><el-statistic :title="t('services.warrantyRepairRate')" :value="metrics.warrantyRepairRate" /></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover"><el-statistic :title="t('services.avgSatisfaction')" :value="metrics.avgSatisfaction" /></el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { get } from '@/api/client';

const { t } = useI18n();
const loading = ref(false);
const loadingEngineers = ref(false);
const activeOrders = ref<any[]>([]);
const engineers = ref<any[]>([]);
const metrics = reactive({ avgCompletionTime: '—', firstTimeSuccess: '—', warrantyRepairRate: '—', avgSatisfaction: '—' });

onMounted(async () => {
  loading.value = true;
  loadingEngineers.value = true;
  try {
    const [installs, usersData] = await Promise.all([
      get<any[]>('/installations'),
      get<any>('/users'),
    ]);
    activeOrders.value = installs || [];
    // Filter engineers (certified_engineer role)
    const allUsers = usersData?.items || usersData || [];
    engineers.value = allUsers.filter((u: any) => u.role === 'certified_engineer');

    // Compute metrics from real data
    const completed = (installs || []).filter((i: any) => i.completedAt);
    if (completed.length > 0) {
      const avgMs = completed.reduce((s: number, i: any) => {
        const start = new Date(i.dispatchedAt || i.order?.createdAt).getTime();
        const end = new Date(i.completedAt).getTime();
        return s + (end - start);
      }, 0) / completed.length;
      metrics.avgCompletionTime = (avgMs / 3600000).toFixed(1) + 'h';
    }
    const total = (installs || []).length;
    const warrantyRepairs = (installs || []).filter((i: any) => i.warrantyRepairCount > 0).length;
    metrics.warrantyRepairRate = total ? ((warrantyRepairs / total) * 100).toFixed(1) + '%' : '0%';
    metrics.firstTimeSuccess = total ? (((total - warrantyRepairs) / total) * 100).toFixed(1) + '%' : '—';
    metrics.avgSatisfaction = '—';
  } catch (e) {
    console.error('ServicesView load error:', e);
  } finally {
    loading.value = false;
    loadingEngineers.value = false;
  }
});

function tierType(tier: string) {
  const map: Record<string, string> = { standard: 'info', professional: 'primary', enterprise: 'warning' };
  return (map[tier] || 'info') as any;
}

function installStatusType(status: string) {
  const map: Record<string, string> = { pending_dispatch: 'info', accepted: 'primary', assessing: 'primary', installing: 'warning', configuring: 'warning', testing: '', pending_acceptance: 'success', completed: 'success' };
  return (map[status] || '') as any;
}
</script>
