<template>
  <div class="orders-view">
    <h2>{{ t('sidebar.orders') }}</h2>

    <!-- Status Filter Tabs -->
    <el-tabs v-model="activeTab" style="margin-top: 16px">
      <el-tab-pane :label="t('orders.all')" name="all" />
      <el-tab-pane :label="t('orders.pendingPayment')" name="pending_payment" />
      <el-tab-pane :label="t('orders.paid')" name="paid" />
      <el-tab-pane :label="t('orders.inProgress')" name="in_progress" />
      <el-tab-pane :label="t('orders.completed')" name="completed" />
      <el-tab-pane :label="t('orders.refunded')" name="refunded" />
    </el-tabs>

    <!-- Orders Table -->
    <el-table :data="filteredOrders" stripe border style="width: 100%">
      <el-table-column prop="orderNumber" :label="t('orders.orderNumber')" width="200" />
      <el-table-column prop="user" :label="t('orders.user')" width="140" />
      <el-table-column prop="type" :label="t('orders.type')" width="130">
        <template #default="{ row }">
          <el-tag size="small">{{ row.type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="amount" :label="t('orders.amount')" width="120">
        <template #default="{ row }">${{ row.amount.toLocaleString() }}</template>
      </el-table-column>
      <el-table-column prop="status" :label="t('common.status')" width="140">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="date" :label="t('orders.date')" width="120" />
      <el-table-column :label="t('common.actions')" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDetail(row)">{{ t('orders.detail') }}</el-button>
          <el-button v-if="row.status === 'paid'" size="small" type="warning" plain @click="openRefund(row)">{{ t('orders.refund') }}</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination style="margin-top: 16px; justify-content: flex-end" layout="total, prev, pager, next" :total="total" :page-size="10" />

    <!-- Settlement Summary -->
    <h3 style="margin-top: 32px">{{ t('orders.settlement') }}</h3>
    <el-row :gutter="16">
      <el-col :span="6">
        <el-card shadow="hover"><el-statistic :title="t('orders.totalRevenue')" :value="528900" prefix="$" /></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover"><el-statistic :title="t('orders.escrowFrozen')" :value="42300" prefix="$" /></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover"><el-statistic :title="t('orders.engineerPaid')" :value="389280" prefix="$" /></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover"><el-statistic :title="t('orders.platformShare')" :value="97320" prefix="$" /></el-card>
      </el-col>
    </el-row>

    <!-- Order Detail Dialog -->
    <el-dialog v-model="detailVisible" :title="t('orders.detail')" width="640px">
      <template v-if="selectedOrder">
        <el-descriptions :column="2" border>
          <el-descriptions-item :label="t('orders.orderNumber')">{{ selectedOrder.orderNumber }}</el-descriptions-item>
          <el-descriptions-item :label="t('orders.user')">{{ selectedOrder.user }}</el-descriptions-item>
          <el-descriptions-item :label="t('orders.type')">{{ selectedOrder.type }}</el-descriptions-item>
          <el-descriptions-item :label="t('orders.amount')">${{ selectedOrder.amount.toLocaleString() }}</el-descriptions-item>
          <el-descriptions-item :label="t('common.status')">
            <el-tag :type="statusTagType(selectedOrder.status)" size="small">{{ selectedOrder.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="t('orders.date')">{{ selectedOrder.date }}</el-descriptions-item>
          <el-descriptions-item :label="t('orders.paymentMethod')">{{ selectedOrder.payment }}</el-descriptions-item>
          <el-descriptions-item :label="t('orders.region')">{{ selectedOrder.region }}</el-descriptions-item>
        </el-descriptions>
      </template>
      <template #footer>
        <el-button @click="detailVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="warning" @click="detailVisible = false">{{ t('orders.refund') }}</el-button>
        <el-button type="primary" @click="detailVisible = false">{{ t('orders.settle') }}</el-button>
      </template>
    </el-dialog>

    <!-- Refund Dialog -->
    <el-dialog v-model="refundVisible" :title="t('orders.refund')" width="480px">
      <el-form label-width="100px">
        <el-form-item :label="t('orders.orderNumber')">{{ refundOrder?.orderNumber }}</el-form-item>
        <el-form-item :label="t('orders.refundReason')">
          <el-input v-model="refundReason" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="refundVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="danger" @click="refundVisible = false">{{ t('orders.confirmRefund') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { get } from '@/api/client';

const { t } = useI18n();

const activeTab = ref('all');
const detailVisible = ref(false);
const refundVisible = ref(false);
const selectedOrder = ref<any>(null);
const refundOrder = ref<any>(null);
const refundReason = ref('');
const allOrders = ref<any[]>([]);
const total = ref(0);

onMounted(async () => {
  try {
    const data = await get<any>('/orders');
    const items = Array.isArray(data) ? data : data?.items || [];
    allOrders.value = items.map((o: any) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      user: o.userId?.substring(0, 8) || '-',
      type: o.orderType,
      amount: Number(o.totalAmount),
      status: o.status,
      date: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '',
      payment: o.payment?.paymentMethod || '-',
      region: o.region?.toUpperCase() || '-',
    }));
    total.value = data?.total || items.length;
  } catch (e) {
    console.error('Orders load error:', e);
  }
});

const filteredOrders = computed(() => {
  if (activeTab.value === 'all') return allOrders.value;
  return allOrders.value.filter(o => o.status === activeTab.value);
});

function statusTagType(status: string) {
  const map: Record<string, string> = { pending_payment: 'info', paid: 'primary', paid_pending_dispatch: 'primary', in_progress: 'warning', completed: 'success', shipped: 'success', refunded: 'danger' };
  return (map[status] || 'info') as any;
}

function openDetail(order: any) { selectedOrder.value = order; detailVisible.value = true; }
function openRefund(order: any) { refundOrder.value = order; refundReason.value = ''; refundVisible.value = true; }
</script>
