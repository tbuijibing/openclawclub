<template>
  <div class="users-view">
    <h2>{{ t('sidebar.users') }}</h2>

    <!-- Search & Filter -->
    <el-row :gutter="12" style="margin: 16px 0">
      <el-col :span="8">
        <el-input v-model="search" :placeholder="t('users.searchPlaceholder')" clearable>
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
      </el-col>
      <el-col :span="4">
        <el-select v-model="roleFilter" :placeholder="t('users.filterRole')" clearable>
          <el-option v-for="r in roles" :key="r" :label="r" :value="r" />
        </el-select>
      </el-col>
      <el-col :span="4">
        <el-select v-model="statusFilter" :placeholder="t('users.filterStatus')" clearable>
          <el-option label="Active" value="active" />
          <el-option label="Inactive" value="inactive" />
          <el-option label="Suspended" value="suspended" />
        </el-select>
      </el-col>
    </el-row>

    <!-- User Table -->
    <el-table :data="filteredUsers" stripe border style="width: 100%">
      <el-table-column prop="name" :label="t('users.name')" min-width="140" />
      <el-table-column prop="email" :label="t('users.email')" min-width="200" />
      <el-table-column prop="type" :label="t('users.type')" width="120">
        <template #default="{ row }">
          <el-tag :type="row.type === 'enterprise' ? 'warning' : 'info'" size="small">{{ row.type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('users.roles')" min-width="180">
        <template #default="{ row }">
          <el-tag v-for="r in row.roles" :key="r" size="small" style="margin: 2px">{{ r }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" :label="t('common.status')" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : row.status === 'suspended' ? 'danger' : 'info'" size="small">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created" :label="t('users.created')" width="120" />
      <el-table-column :label="t('common.actions')" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openRoleDialog(row)">{{ t('users.assignRole') }}</el-button>
          <el-button size="small" type="danger" plain>{{ t('common.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination style="margin-top: 16px; justify-content: flex-end" layout="total, prev, pager, next" :total="total" :page-size="10" />

    <!-- Organization Section -->
    <h3 style="margin-top: 32px">{{ t('users.organizations') }}</h3>
    <el-table :data="allOrgs" stripe border style="width: 100%">
      <el-table-column prop="name" :label="t('users.orgName')" />
      <el-table-column prop="owner" :label="t('users.orgOwner')" />
      <el-table-column prop="members" :label="t('users.orgMembers')" width="100" />
      <el-table-column prop="created" :label="t('users.created')" width="120" />
    </el-table>

    <!-- Role Assignment Dialog -->
    <el-dialog v-model="roleDialogVisible" :title="t('users.assignRole')" width="480px">
      <p>{{ t('users.assignRoleFor') }}: <strong>{{ selectedUser?.name }}</strong></p>
      <el-checkbox-group v-model="selectedRoles" style="margin-top: 12px">
        <el-checkbox v-for="r in roles" :key="r" :label="r" :value="r" />
      </el-checkbox-group>
      <template #footer>
        <el-button @click="roleDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="roleDialogVisible = false">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Search } from '@element-plus/icons-vue';
import { get } from '@/api/client';

const { t } = useI18n();

const search = ref('');
const roleFilter = ref('');
const statusFilter = ref('');
const roleDialogVisible = ref(false);
const selectedUser = ref<any>(null);
const selectedRoles = ref<string[]>([]);
const allUsers = ref<any[]>([]);
const allOrgs = ref<any[]>([]);
const total = ref(0);

const roles = ['Admin', 'Support_Agent', 'Trainer', 'Certified_Engineer', 'Partner_Community', 'Partner_Regional', 'Enterprise_User', 'Individual_User'];

onMounted(async () => {
  try {
    const [userData, orgData] = await Promise.all([
      get<any>('/users'),
      get<any[]>('/users/organizations/list'),
    ]);
    const items = Array.isArray(userData) ? userData : userData?.items || [];
    allUsers.value = items.map((u: any) => ({
      id: u.id,
      name: u.displayName || u.logtoUserId,
      email: u.logtoUserId,
      type: u.accountType,
      roles: [u.accountType === 'enterprise' ? 'Enterprise_User' : 'Individual_User'],
      status: 'active',
      created: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '',
    }));
    total.value = userData?.total || items.length;
    allOrgs.value = (orgData || []).map((o: any) => ({
      name: o.name,
      owner: o.ownerUserId?.substring(0, 8) || '-',
      members: '-',
      created: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '',
    }));
  } catch (e) {
    console.error('Users load error:', e);
  }
});

const filteredUsers = computed(() => {
  return allUsers.value.filter(u => {
    const matchSearch = !search.value || u.name.toLowerCase().includes(search.value.toLowerCase()) || u.email.toLowerCase().includes(search.value.toLowerCase());
    const matchRole = !roleFilter.value || u.roles.includes(roleFilter.value);
    const matchStatus = !statusFilter.value || u.status === statusFilter.value;
    return matchSearch && matchRole && matchStatus;
  });
});

function openRoleDialog(user: any) {
  selectedUser.value = user;
  selectedRoles.value = [...user.roles];
  roleDialogVisible.value = true;
}
</script>
