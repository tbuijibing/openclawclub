<template>
  <div class="training-view">
    <h2>{{ t('sidebar.training') }}</h2>

    <el-tabs v-model="activeTab" style="margin-top: 16px">
      <el-tab-pane :label="t('training.courses')" name="courses" />
      <el-tab-pane :label="t('training.certificates')" name="certificates" />
    </el-tabs>

    <!-- Course Management (static for now - no course entity in DB) -->
    <template v-if="activeTab === 'courses'">
      <el-empty :description="t('training.courses') + ' - Coming soon'" />
    </template>

    <!-- Certificate Management -->
    <template v-if="activeTab === 'certificates'">
      <el-table :data="certificates" stripe border style="width: 100%" v-loading="loading">
        <el-table-column prop="certNumber" :label="t('training.certNumber')" width="200" />
        <el-table-column prop="userId" :label="t('training.holder')" width="180">
          <template #default="{ row }">{{ userMap[row.userId] || row.userId?.substring(0, 8) }}</template>
        </el-table-column>
        <el-table-column prop="certType" :label="t('training.certType')" width="120">
          <template #default="{ row }">
            <el-tag size="small" type="warning">{{ row.certType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="issuedAt" :label="t('training.issuedAt')" width="140">
          <template #default="{ row }">{{ new Date(row.issuedAt).toLocaleDateString() }}</template>
        </el-table-column>
        <el-table-column prop="expiresAt" :label="t('training.expiresAt')" width="140">
          <template #default="{ row }">{{ new Date(row.expiresAt).toLocaleDateString() }}</template>
        </el-table-column>
        <el-table-column prop="status" :label="t('common.status')" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : row.status === 'expired' ? 'danger' : 'info'" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.actions')" width="180" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'active'" size="small" type="danger" plain>{{ t('training.revoke') }}</el-button>
            <el-button v-if="row.status === 'expired'" size="small" type="primary" plain>{{ t('training.reissue') }}</el-button>
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
const activeTab = ref('certificates');
const loading = ref(false);
const certificates = ref<any[]>([]);
const userMap = ref<Record<string, string>>({});

onMounted(async () => {
  loading.value = true;
  try {
    const [certs, usersData] = await Promise.all([
      get<any[]>('/certifications'),
      get<any>('/users'),
    ]);
    certificates.value = certs || [];
    const users = usersData?.items || usersData || [];
    for (const u of users) {
      userMap.value[u.id] = u.displayName || u.id.substring(0, 8);
    }
  } catch (e) {
    console.error('TrainingView load error:', e);
  } finally {
    loading.value = false;
  }
});
</script>
