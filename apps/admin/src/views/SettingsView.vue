<template>
  <div class="settings-view">
    <h2>{{ t('sidebar.settings') }}</h2>

    <el-tabs v-model="activeTab" style="margin-top: 16px">
      <el-tab-pane :label="t('settings.ocsas')" name="ocsas" />
      <el-tab-pane :label="t('settings.payment')" name="payment" />
      <el-tab-pane :label="t('settings.notifications')" name="notifications" />
    </el-tabs>

    <!-- OCSAS Standard Management -->
    <template v-if="activeTab === 'ocsas'">
      <el-row :gutter="16" v-loading="loadingOcsas">
        <el-col v-for="level in ocsasLevels" :key="level.level" :span="8">
          <el-card shadow="hover">
            <template #header>
              <div style="display: flex; justify-content: space-between; align-items: center">
                <span>OCSAS Level {{ level.level }}</span>
                <el-tag :type="level.tagType" size="small">{{ level.label }}</el-tag>
              </div>
            </template>
            <ul style="padding-left: 16px; margin: 0; line-height: 2">
              <li v-for="item in level.items" :key="item">{{ item }}</li>
            </ul>
          </el-card>
        </el-col>
      </el-row>
    </template>

    <!-- Payment Configuration -->
    <template v-if="activeTab === 'payment'">
      <el-form label-width="160px" style="max-width: 640px">
        <h4>{{ t('settings.stripeConfig') }}</h4>
        <el-form-item :label="t('settings.apiKey')">
          <el-input v-model="paymentConfig.stripeKey" type="password" show-password placeholder="sk_live_..." />
        </el-form-item>
        <el-form-item :label="t('settings.webhookSecret')">
          <el-input v-model="paymentConfig.stripeWebhook" type="password" show-password placeholder="whsec_..." />
        </el-form-item>
        <el-divider />
        <h4>{{ t('settings.alipayConfig') }}</h4>
        <el-form-item :label="t('settings.appId')">
          <el-input v-model="paymentConfig.alipayAppId" placeholder="App ID" />
        </el-form-item>
        <el-divider />
        <h4>{{ t('settings.wechatConfig') }}</h4>
        <el-form-item :label="t('settings.merchantId')">
          <el-input v-model="paymentConfig.wechatMerchantId" placeholder="Merchant ID" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary">{{ t('common.save') }}</el-button>
        </el-form-item>
      </el-form>
    </template>

    <!-- Notification Templates -->
    <template v-if="activeTab === 'notifications'">
      <el-empty description="Notification templates - Coming soon" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { get } from '@/api/client';

const { t } = useI18n();
const activeTab = ref('ocsas');
const loadingOcsas = ref(false);

const ocsasLevels = ref([
  { level: 1, label: 'Personal', tagType: 'info' as const, items: ['Firewall configuration', 'Basic access control', 'Access logging'] },
  { level: 2, label: 'Team', tagType: 'warning' as const, items: ['Level 1 +', 'Encrypted data transmission', 'Multi-factor authentication', 'Security audit logs'] },
  { level: 3, label: 'Enterprise', tagType: 'danger' as const, items: ['Level 2 +', 'Private network isolation', 'GDPR/SOC2 compliance', 'Intrusion detection'] },
]);

const paymentConfig = reactive({
  stripeKey: '', stripeWebhook: '',
  alipayAppId: '', wechatMerchantId: '',
});

onMounted(async () => {
  loadingOcsas.value = true;
  try {
    const packs = await get<any[]>('/subscriptions/packs');
    if (packs && packs.length > 0) {
      // OCSAS levels derived from config packs if available
      ocsasLevels.value = packs.slice(0, 3).map((p: any, i: number) => ({
        level: i + 1,
        label: p.name || `Level ${i + 1}`,
        tagType: (['info', 'warning', 'danger'] as const)[i],
        items: p.features || ocsasLevels.value[i]?.items || [],
      }));
    }
  } catch { /* keep defaults */ } finally {
    loadingOcsas.value = false;
  }
});
</script>
