<template>
  <div class="partners-view">
    <h2>{{ t('sidebar.partners') }}</h2>

    <el-tabs v-model="activeTab" style="margin-top: 16px">
      <el-tab-pane :label="t('partners.applications')" name="applications" />
      <el-tab-pane :label="t('partners.settlement')" name="settlement" />
      <el-tab-pane :label="t('partners.vendors')" name="vendors" />
    </el-tabs>

    <!-- Application Review -->
    <template v-if="activeTab === 'applications'">
      <el-table :data="applications" stripe border style="width: 100%">
        <el-table-column prop="name" :label="t('users.name')" width="150" />
        <el-table-column prop="type" :label="t('partners.partnerType')" width="160">
          <template #default="{ row }">
            <el-tag size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="company" :label="t('partners.company')" width="180" />
        <el-table-column prop="region" :label="t('orders.region')" width="100" />
        <el-table-column prop="appliedAt" :label="t('partners.appliedAt')" width="120" />
        <el-table-column prop="status" :label="t('common.status')" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'pending' ? 'warning' : row.status === 'approved' ? 'success' : 'danger'" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.actions')" width="200" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <el-button size="small" type="success" plain>{{ t('partners.approve') }}</el-button>
              <el-button size="small" type="danger" plain>{{ t('partners.reject') }}</el-button>
            </template>
            <el-button v-else size="small">{{ t('orders.detail') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <!-- Revenue Settlement -->
    <template v-if="activeTab === 'settlement'">
      <el-row :gutter="16" style="margin-bottom: 16px">
        <el-col :span="8"><el-card shadow="hover"><el-statistic :title="t('partners.totalPending')" :value="totalPending" prefix="$" /></el-card></el-col>
        <el-col :span="8"><el-card shadow="hover"><el-statistic :title="t('partners.totalSettled')" :value="totalSettled" prefix="$" /></el-card></el-col>
        <el-col :span="8"><el-card shadow="hover"><el-statistic :title="t('partners.nextSettlement')" value="2025-08-15" /></el-card></el-col>
      </el-row>
      <el-table :data="settlements" stripe border style="width: 100%">
        <el-table-column prop="partner" :label="t('partners.partner')" width="150" />
        <el-table-column prop="type" :label="t('partners.partnerType')" width="160" />
        <el-table-column prop="grossAmount" :label="t('partners.grossAmount')" width="130">
          <template #default="{ row }">${{ row.grossAmount.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="sharePercent" :label="t('partners.sharePercent')" width="100">
          <template #default="{ row }">{{ row.sharePercent }}%</template>
        </el-table-column>
        <el-table-column prop="netAmount" :label="t('partners.netAmount')" width="130">
          <template #default="{ row }">${{ row.netAmount.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="month" :label="t('partners.month')" width="100" />
        <el-table-column prop="status" :label="t('common.status')" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'paid' ? 'success' : 'warning'" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <!-- External Vendor Profiles -->
    <template v-if="activeTab === 'vendors'">
      <el-table :data="vendors" stripe border style="width: 100%">
        <el-table-column prop="name" :label="t('partners.vendorName')" width="180" />
        <el-table-column prop="platform" :label="t('partners.platform')" width="120" />
        <el-table-column prop="rating" :label="t('services.rating')" width="100">
          <template #default="{ row }">⭐ {{ row.rating }}</template>
        </el-table-column>
        <el-table-column prop="completionRate" :label="t('partners.completionRate')" width="130">
          <template #default="{ row }">
            <el-progress :percentage="row.completionRate" :stroke-width="12" />
          </template>
        </el-table-column>
        <el-table-column prop="ordersCompleted" :label="t('services.completedOrders')" width="130" />
        <el-table-column prop="feedback" :label="t('partners.feedback')" min-width="200" />
        <el-table-column :label="t('common.actions')" width="160" fixed="right">
          <template #default>
            <el-button size="small">{{ t('orders.detail') }}</el-button>
            <el-button size="small" type="primary" plain>{{ t('partners.convertEngineer') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { get } from '@/api/client';

const { t } = useI18n();
const activeTab = ref('settlement');

const applications = ref<any[]>([]);
const settlements = ref<any[]>([]);
const vendors = ref<any[]>([]);
const totalPending = ref(0);
const totalSettled = ref(0);

onMounted(async () => {
  try {
    const earnings = await get<any[]>('/partners/earnings');
    settlements.value = (earnings || []).map((e: any) => ({
      partner: e.partnerId?.substring(0, 8) || 'N/A',
      type: e.partnerType || '',
      grossAmount: Number(e.grossAmount) || 0,
      sharePercent: Number(e.sharePercentage) || 0,
      netAmount: Number(e.netAmount) || 0,
      month: e.settlementMonth || '',
      status: e.status === 'settled' ? 'paid' : 'pending',
    }));
    totalSettled.value = settlements.value.filter(s => s.status === 'paid').reduce((sum, s) => sum + s.netAmount, 0);
    totalPending.value = settlements.value.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.netAmount, 0);
  } catch (e) { console.error('Failed to load partner data', e); }
});
</script>
