<template>
  <div class="hardware-view">
    <h2>{{ t('sidebar.hardware') }}</h2>

    <el-tabs v-model="activeTab" style="margin-top: 16px">
      <el-tab-pane :label="t('hardware.products')" name="products" />
      <el-tab-pane :label="t('hardware.inventory')" name="inventory" />
      <el-tab-pane :label="t('hardware.logistics')" name="logistics" />
      <el-tab-pane :label="t('hardware.afterSales')" name="afterSales" />
    </el-tabs>

    <!-- Product Management -->
    <template v-if="activeTab === 'products'">
      <el-button type="primary" style="margin-bottom: 12px">{{ t('hardware.addProduct') }}</el-button>
      <el-table :data="products" stripe border style="width: 100%">
        <el-table-column prop="name" :label="t('hardware.productName')" min-width="180" />
        <el-table-column prop="category" :label="t('hardware.category')" width="150">
          <template #default="{ row }">
            <el-tag size="small">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="price" :label="t('orders.amount')" width="120">
          <template #default="{ row }">${{ row.price.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="totalStock" :label="t('hardware.totalStock')" width="100" />
        <el-table-column prop="status" :label="t('common.status')" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.actions')" width="160" fixed="right">
          <template #default>
            <el-button size="small">{{ t('common.edit') }}</el-button>
            <el-button size="small" type="danger" plain>{{ t('common.delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <!-- Stock by Region -->
    <template v-if="activeTab === 'inventory'">
      <el-table :data="inventory" stripe border style="width: 100%">
        <el-table-column prop="name" :label="t('hardware.productName')" min-width="180" />
        <el-table-column :label="t('hardware.stockAPAC')" width="120">
          <template #default="{ row }">
            <el-tag :type="row.apac < 10 ? 'danger' : 'success'" size="small">{{ row.apac }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('hardware.stockNA')" width="120">
          <template #default="{ row }">
            <el-tag :type="row.na < 10 ? 'danger' : 'success'" size="small">{{ row.na }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('hardware.stockEU')" width="120">
          <template #default="{ row }">
            <el-tag :type="row.eu < 10 ? 'danger' : 'success'" size="small">{{ row.eu }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.total')" width="100">
          <template #default="{ row }">{{ row.apac + row.na + row.eu }}</template>
        </el-table-column>
      </el-table>
    </template>

    <!-- Logistics Management -->
    <template v-if="activeTab === 'logistics'">
      <el-table :data="shipments" stripe border style="width: 100%">
        <el-table-column prop="orderNumber" :label="t('orders.orderNumber')" width="200" />
        <el-table-column prop="product" :label="t('hardware.productName')" width="160" />
        <el-table-column prop="destination" :label="t('hardware.destination')" width="140" />
        <el-table-column prop="carrier" :label="t('hardware.carrier')" width="120" />
        <el-table-column prop="trackingNumber" :label="t('hardware.trackingNumber')" width="180" />
        <el-table-column prop="status" :label="t('common.status')" width="130">
          <template #default="{ row }">
            <el-tag :type="shippingStatusType(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="estimatedDelivery" :label="t('hardware.estimatedDelivery')" width="140" />
      </el-table>
    </template>

    <!-- After-Sales -->
    <template v-if="activeTab === 'afterSales'">
      <el-table :data="afterSalesTickets" stripe border style="width: 100%">
        <el-table-column prop="ticketNumber" :label="t('tickets.ticketNumber')" width="180" />
        <el-table-column prop="user" :label="t('orders.user')" width="130" />
        <el-table-column prop="product" :label="t('hardware.productName')" width="160" />
        <el-table-column prop="type" :label="t('hardware.issueType')" width="130">
          <template #default="{ row }">
            <el-tag :type="row.type === 'warranty_repair' ? 'warning' : row.type === 'return' ? 'danger' : 'info'" size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" :label="t('hardware.description')" min-width="200" />
        <el-table-column prop="status" :label="t('common.status')" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'resolved' ? 'success' : 'warning'" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.actions')" width="120" fixed="right">
          <template #default>
            <el-button size="small">{{ t('tickets.handle') }}</el-button>
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
const activeTab = ref('products');

const products = ref<any[]>([]);
const inventory = ref<any[]>([]);

onMounted(async () => {
  try {
    const data = await get<any[]>('/hardware/products');
    const items = data || [];
    products.value = items.map((p: any) => {
      const nameStr = typeof p.name === 'object' ? (p.name.zh || p.name.en || '') : p.name;
      const stock = p.stockByRegion || {};
      const totalStock = Object.values(stock).reduce((s: number, v: any) => s + Number(v || 0), 0);
      return { id: p.id, name: nameStr, category: p.category, price: Number(p.price), totalStock, status: p.isActive ? 'active' : 'inactive' };
    });
    inventory.value = items.map((p: any) => {
      const nameStr = typeof p.name === 'object' ? (p.name.zh || p.name.en || '') : p.name;
      const stock = p.stockByRegion || {};
      return { name: nameStr, apac: stock.apac || 0, na: stock.na || 0, eu: stock.eu || 0 };
    });
  } catch (e) {
    console.error('Hardware load error:', e);
  }
});

const shipments = ref<any[]>([]);
const afterSalesTickets = ref<any[]>([]);

function shippingStatusType(s: string) {
  const map: Record<string, string> = { processing: 'info', in_transit: 'warning', delivered: 'success' };
  return (map[s] || 'info') as any;
}
</script>
