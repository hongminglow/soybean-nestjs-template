<script setup lang="tsx">
import { ref } from 'vue';
import type { Ref } from 'vue';
import { NButton, NPopconfirm, NTag } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { useAppStore } from '@/store/modules/app';
import { $t } from '@/locales';
import SmsOperateModal, { type OperateType, type SmsTemplateLocale } from './modules/sms-operate-modal.vue';

const appStore = useAppStore();

const { bool: visible, setTrue: openModal } = useBoolean();

const wrapperRef = ref<HTMLElement | null>(null);

// ===== Hardcoded SMS Template Locale Data =====
const loading = ref(false);

const data = ref<SmsTemplateLocale[]>([
  {
    id: 1,
    keyword: 'otp_verification',
    language: 'en',
    content:
      'Your OTP code is {{otp_code}}. It will expire in {{expiry_minutes}} minutes. Do not share this code with anyone.',
    variables: ['{{otp_code}}', '{{expiry_minutes}}'],
    status: 'ENABLED'
  },
  {
    id: 2,
    keyword: 'otp_verification',
    language: 'zh-CN',
    content: '您的验证码是 {{otp_code}}，有效期 {{expiry_minutes}} 分钟。请勿将此验证码分享给任何人。',
    variables: ['{{otp_code}}', '{{expiry_minutes}}'],
    status: 'ENABLED'
  },
  {
    id: 3,
    keyword: 'password_reset',
    language: 'en',
    content:
      'Hi {{user_name}}, use code {{otp_code}} to reset your {{brand_name}} password. This code expires in {{expiry_minutes}} minutes.',
    variables: ['{{user_name}}', '{{otp_code}}', '{{brand_name}}', '{{expiry_minutes}}'],
    status: 'ENABLED'
  },
  {
    id: 4,
    keyword: 'welcome_message',
    language: 'en',
    content:
      'Welcome to {{brand_name}}, {{user_name}}! Your account has been created successfully. Download our app: {{link}}',
    variables: ['{{brand_name}}', '{{user_name}}', '{{link}}'],
    status: 'ENABLED'
  },
  {
    id: 5,
    keyword: 'order_confirmation',
    language: 'ms',
    content:
      'Pesanan {{order_id}} anda berjumlah {{amount}} telah disahkan. Terima kasih kerana menggunakan {{brand_name}}!',
    variables: ['{{order_id}}', '{{amount}}', '{{brand_name}}'],
    status: 'DISABLED'
  },
  {
    id: 6,
    keyword: 'payment_reminder',
    language: 'en',
    content:
      'Hi {{user_name}}, your payment of {{amount}} for order {{order_id}} is due on {{date}}. Please complete your payment to avoid service interruption.',
    variables: ['{{user_name}}', '{{amount}}', '{{order_id}}', '{{date}}'],
    status: 'ENABLED'
  }
]);

// ===== Keyword label mapping =====
const keywordLabelMap: Record<string, string> = {
  otp_verification: 'OTP Verification',
  password_reset: 'Password Reset',
  welcome_message: 'Welcome Message',
  order_confirmation: 'Order Confirmation',
  payment_reminder: 'Payment Reminder',
  account_activation: 'Account Activation',
  delivery_update: 'Delivery Update',
  appointment_reminder: 'Appointment Reminder'
};

const languageLabelMap: Record<string, string> = {
  en: 'English',
  'zh-CN': '中文 (简)',
  'zh-TW': '中文 (繁)',
  ms: 'Malay',
  ta: 'Tamil',
  ja: '日本語',
  ko: '한국어',
  th: 'ไทย'
};

const keywordColorMap: Record<string, NaiveUI.ThemeColor> = {
  otp_verification: 'success',
  password_reset: 'warning',
  welcome_message: 'info',
  order_confirmation: 'primary',
  payment_reminder: 'error',
  account_activation: 'info',
  delivery_update: 'primary',
  appointment_reminder: 'warning'
};

// ===== Table Columns =====
const columns = [
  {
    type: 'selection' as const,
    align: 'center' as const,
    width: 48
  },
  {
    key: 'id',
    title: 'ID',
    align: 'center' as const,
    width: 60
  },
  {
    key: 'keyword',
    title: $t('page.manage.sms.keyword'),
    align: 'center' as const,
    minWidth: 150,
    render: (row: SmsTemplateLocale) => {
      const label = keywordLabelMap[row.keyword] || row.keyword;
      const tagType = keywordColorMap[row.keyword] || 'default';
      return (
        <NTag type={tagType} round size="small">
          {label}
        </NTag>
      );
    }
  },
  {
    key: 'language',
    title: $t('page.manage.sms.language'),
    align: 'center' as const,
    width: 120,
    render: (row: SmsTemplateLocale) => {
      const label = languageLabelMap[row.language] || row.language;
      return (
        <NTag type="info" round size="small">
          {label}
        </NTag>
      );
    }
  },
  {
    key: 'content',
    title: $t('page.manage.sms.content'),
    align: 'left' as const,
    minWidth: 280,
    ellipsis: { tooltip: true },
    render: (row: SmsTemplateLocale) => <span class="text-13px">{row.content}</span>
  },
  {
    key: 'variables',
    title: $t('page.manage.sms.variables'),
    align: 'center' as const,
    width: 100,
    render: (row: SmsTemplateLocale) => (
      <NTag type="primary" round size="small">
        {row.variables.length} vars
      </NTag>
    )
  },
  {
    key: 'status',
    title: $t('page.manage.sms.status'),
    align: 'center' as const,
    width: 100,
    render: (row: SmsTemplateLocale) => {
      const tagMap: Record<string, NaiveUI.ThemeColor> = {
        ENABLED: 'success',
        DISABLED: 'warning'
      };
      const label =
        row.status === 'ENABLED' ? $t('page.manage.common.status.enable') : $t('page.manage.common.status.disable');
      return <NTag type={tagMap[row.status]}>{label}</NTag>;
    }
  },
  {
    key: 'operate',
    title: $t('common.operate'),
    align: 'center' as const,
    width: 160,
    render: (row: SmsTemplateLocale) => (
      <div class="flex-center gap-8px">
        <NButton type="primary" ghost size="small" onClick={() => handleEdit(row)}>
          {$t('common.edit')}
        </NButton>
        <NPopconfirm onPositiveClick={() => handleDelete(row.id)}>
          {{
            default: () => $t('common.confirmDelete'),
            trigger: () => (
              <NButton type="error" ghost size="small">
                {$t('common.delete')}
              </NButton>
            )
          }}
        </NPopconfirm>
      </div>
    )
  }
];

// ===== Table Operations =====
const checkedRowKeys = ref<number[]>([]);
const operateType = ref<OperateType>('add');
const editingData: Ref<SmsTemplateLocale | null> = ref(null);

function handleAdd() {
  operateType.value = 'add';
  editingData.value = null;
  openModal();
}

function handleEdit(row: SmsTemplateLocale) {
  operateType.value = 'edit';
  editingData.value = { ...row };
  openModal();
}

async function handleDelete(id: number) {
  data.value = data.value.filter(item => item.id !== id);
  window.$message?.success($t('common.deleteSuccess'));
}

async function handleBatchDelete() {
  data.value = data.value.filter(item => !checkedRowKeys.value.includes(item.id));
  checkedRowKeys.value = [];
  window.$message?.success($t('common.deleteSuccess'));
}

function getData() {
  // In real implementation, this would call the API
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
  }, 300);
}

function handleSubmitted() {
  getData();
}

// simple columnChecks for TableHeaderOperation compatibility
const columnChecks = ref(
  columns
    .filter((col): col is (typeof columns)[number] & { key: string } => 'key' in col)
    .map(col => ({
      key: col.key,
      title: col.title || col.key,
      checked: true
    }))
);
</script>

<template>
  <div ref="wrapperRef" class="flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :title="$t('page.manage.sms.title')" :bordered="false" size="small" class="sm:flex-1-hidden card-wrapper">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          @add="handleAdd"
          @delete="handleBatchDelete"
          @refresh="getData"
        />
      </template>
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        size="small"
        :flex-height="!appStore.isMobile"
        :scroll-x="1088"
        :loading="loading"
        :row-key="(row: SmsTemplateLocale) => row.id"
        remote
        class="sm:h-full"
      />
      <SmsOperateModal
        v-model:visible="visible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="handleSubmitted"
      />
    </NCard>
  </div>
</template>

<style scoped></style>
