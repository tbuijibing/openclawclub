<template>
  <div class="tickets-view">
    <h2>{{ t('sidebar.tickets') }}</h2>

    <!-- Priority Filter -->
    <el-row :gutter="12" style="margin: 16px 0">
      <el-col :span="6">
        <el-select v-model="priorityFilter" :placeholder="t('tickets.filterPriority')" clearable>
          <el-option label="Standard" value="standard" />
          <el-option label="Priority" value="priority" />
          <el-option label="Urgent" value="urgent" />
        </el-select>
      </el-col>
      <el-col :span="6">
        <el-select v-model="statusFilter" :placeholder="t('users.filterStatus')" clearable>
          <el-option label="Open" value="open" />
          <el-option label="In Progress" value="in_progress" />
          <el-option label="Resolved" value="resolved" />
          <el-option label="Closed" value="closed" />
        </el-select>
      </el-col>
    </el-row>

    <!-- Tickets Table -->
    <el-table :data="filteredTickets" stripe border style="width: 100%">
      <el-table-column prop="ticketNumber" :label="t('tickets.ticketNumber')" width="180" />
      <el-table-column prop="user" :label="t('orders.user')" width="130" />
      <el-table-column prop="subject" :label="t('tickets.subject')" min-width="200" />
      <el-table-column prop="priority" :label="t('tickets.priority')" width="110">
        <template #default="{ row }">
          <el-tag :type="priorityType(row.priority)" size="small">{{ row.priority }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" :label="t('common.status')" width="120">
        <template #default="{ row }">
          <el-tag :type="ticketStatusType(row.status)" size="small">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('tickets.slaDeadline')" width="170">
        <template #default="{ row }">
          <span :style="{ color: row.slaBreached ? 'var(--el-color-danger)' : '' }">
            {{ row.slaDeadline }}
            <el-tag v-if="row.slaBreached" type="danger" size="small" style="margin-left: 4px">{{ t('tickets.overdue') }}</el-tag>
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="agent" :label="t('tickets.agent')" width="130">
        <template #default="{ row }">{{ row.agent || '—' }}</template>
      </el-table-column>
      <el-table-column :label="t('common.actions')" width="180" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openAssignDialog(row)">{{ t('tickets.assign') }}</el-button>
          <el-button size="small" type="primary" plain>{{ t('tickets.handle') }}</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination style="margin-top: 16px; justify-content: flex-end" layout="total, prev, pager, next" :total="total" :page-size="10" />

    <!-- SLA Monitoring -->
    <h3 style="margin-top: 32px">{{ t('tickets.slaMonitor') }}</h3>
    <el-row :gutter="16">
      <el-col :span="6">
        <el-card shadow="hover"><el-statistic :title="t('tickets.openTickets')" :value="18" /></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic :title="t('tickets.overdueTickets')" :value="3" />
          <div style="color: var(--el-color-danger); font-size: 12px; margin-top: 4px">{{ t('tickets.requiresAttention') }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover"><el-statistic :title="t('tickets.avgResponseTime')" value="2.1h" /></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover"><el-statistic :title="t('tickets.resolutionRate')" value="92.5%" /></el-card>
      </el-col>
    </el-row>

    <!-- Assign Agent Dialog -->
    <el-dialog v-model="assignVisible" :title="t('tickets.assign')" width="420px">
      <p>{{ t('tickets.ticketNumber') }}: <strong>{{ assignTicket?.ticketNumber }}</strong></p>
      <el-select v-model="assignAgent" :placeholder="t('tickets.selectAgent')" style="width: 100%; margin-top: 12px">
        <el-option v-for="a in agents" :key="a" :label="a" :value="a" />
      </el-select>
      <template #footer>
        <el-button @click="assignVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="assignVisible = false">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { get } from '@/api/client';

const { t } = useI18n();

const priorityFilter = ref('');
const statusFilter = ref('');
const assignVisible = ref(false);
const assignTicket = ref<any>(null);
const assignAgent = ref('');
const allTickets = ref<any[]>([]);
const total = ref(0);

const agents = ['客服小陈', 'Support Bot'];

onMounted(async () => {
  try {
    const data = await get<any>('/tickets');
    const items = Array.isArray(data) ? data : data?.items || [];
    allTickets.value = items.map((tk: any) => ({
      id: tk.id,
      ticketNumber: tk.ticketNumber,
      user: tk.userId?.substring(0, 8) || '-',
      subject: tk.subject,
      priority: tk.priority,
      status: tk.status,
      slaDeadline: tk.slaResponseDeadline ? new Date(tk.slaResponseDeadline).toLocaleString() : '-',
      slaBreached: tk.slaResponseDeadline && !tk.firstRespondedAt && new Date(tk.slaResponseDeadline) < new Date(),
      agent: tk.assignedAgentId ? tk.assignedAgentId.substring(0, 8) : null,
    }));
    total.value = data?.total || items.length;
  } catch (e) {
    console.error('Tickets load error:', e);
  }
});

const filteredTickets = computed(() => {
  return allTickets.value.filter(t => {
    const matchPriority = !priorityFilter.value || t.priority === priorityFilter.value;
    const matchStatus = !statusFilter.value || t.status === statusFilter.value;
    return matchPriority && matchStatus;
  });
});

function priorityType(p: string) {
  const map: Record<string, string> = { standard: 'info', priority: 'warning', urgent: 'danger', enterprise: 'danger' };
  return (map[p] || 'info') as any;
}

function ticketStatusType(s: string) {
  const map: Record<string, string> = { open: 'primary', in_progress: 'warning', resolved: 'success', closed: 'info' };
  return (map[s] || 'info') as any;
}

function openAssignDialog(ticket: any) {
  assignTicket.value = ticket;
  assignAgent.value = ticket.agent || '';
  assignVisible.value = true;
}
</script>
