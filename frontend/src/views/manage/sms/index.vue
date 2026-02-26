<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';

const senderId = ref('SOYBEAN');
const messageContent = ref(
  'Your OTP code is {{code}}. It will expire in {{expiry}} minutes. Please do not share this with anyone.'
);

const variables = [
  { label: $t('page.manage.sms.config.variables.otp'), value: '{{code}}' },
  { label: $t('page.manage.sms.config.variables.expiry'), value: '{{expiry}}' },
  { label: $t('page.manage.sms.config.variables.brand'), value: '{{brand}}' }
];

function insertVariable(variable: string) {
  messageContent.value += variable;
}

const charCount = computed(() => messageContent.value.length);
const smsSegments = computed(() => {
  if (charCount.value <= 160) return 1;
  return Math.ceil(charCount.value / 153); // Multipart SMS allows 153 chars per segment
});

const charCountLabel = computed(() => {
  const key = smsSegments.value > 1 ? 'page.manage.sms.config.charCount' : 'page.manage.sms.config.charCountSingle';
  return $t(key, { count: charCount.value, segments: smsSegments.value });
});

const previewMessage = computed(() => {
  return messageContent.value
    .replace(/\{\{code\}\}/g, '123456')
    .replace(/\{\{expiry\}\}/g, '5')
    .replace(/\{\{brand\}\}/g, 'Soybean Admin');
});

async function handleSave() {
  window.$message?.success($t('page.manage.sms.config.saveSuccess'));
}
</script>

<template>
  <div class="h-full p-16px">
    <NGrid :x-gap="16" :y-gap="16" item-responsive responsive="screen">
      <!-- Configuration Section -->
      <NGi span="24 m:14">
        <NCard :title="$t('page.manage.sms.config.title')" :bordered="false" class="rd-12px shadow-sm">
          <NSpace vertical size="large">
            <NAlert type="info" :show-icon="true">
              {{ $t('page.manage.sms.config.tip') }}
            </NAlert>

            <NFormItem :label="$t('page.manage.sms.config.senderId')">
              <NInput
                v-model:value="senderId"
                :placeholder="$t('page.manage.sms.config.senderIdPlaceholder')"
                maxlength="11"
              />
            </NFormItem>

            <NFormItem :label="$t('page.manage.sms.config.template')">
              <template #label>
                <NSpace align="center" justify="space-between" class="w-full">
                  <span>{{ $t('page.manage.sms.config.template') }}</span>
                  <NText depth="3" class="text-12px">
                    {{ charCountLabel }}
                  </NText>
                </NSpace>
              </template>
              <NInput
                v-model:value="messageContent"
                type="textarea"
                :placeholder="$t('page.manage.sms.config.templatePlaceholder')"
                :autosize="{ minRows: 4, maxRows: 8 }"
              />
            </NFormItem>

            <NFormItem :label="$t('page.manage.sms.config.quickInsert')">
              <NSpace>
                <NButton
                  v-for="v in variables"
                  :key="v.value"
                  secondary
                  round
                  size="small"
                  type="primary"
                  @click="insertVariable(v.value)"
                >
                  <template #icon>
                    <icon-ic-round-add />
                  </template>
                  {{ v.label }}
                </NButton>
              </NSpace>
            </NFormItem>

            <NSpace justify="end">
              <NButton type="primary" size="large" class="px-32px" @click="handleSave">
                {{ $t('page.manage.sms.config.saveConfig') }}
              </NButton>
            </NSpace>
          </NSpace>
        </NCard>
      </NGi>

      <!-- Preview Section -->
      <NGi span="24 m:10">
        <NCard
          :title="$t('page.manage.sms.config.phonePreview')"
          :bordered="false"
          class="h-full flex flex-col items-center rd-12px shadow-sm"
        >
          <div
            class="relative h-560px w-280px overflow-hidden border-8 border-gray-800 rd-36px bg-black p-12px shadow-2xl"
          >
            <!-- Screen -->
            <div class="h-full w-full flex flex-col overflow-hidden rd-24px bg-white dark:bg-[#121212]">
              <!-- Status Bar -->
              <div class="h-24px flex items-center justify-between bg-gray-100 px-16px text-10px dark:bg-[#1e1e1e]">
                <span class="dark:text-white/80">9:41</span>
                <div class="flex gap-4px dark:text-white/80">
                  <icon-material-symbols-signal-cellular-4-bar />
                  <icon-material-symbols-wifi />
                  <icon-material-symbols-battery-full />
                </div>
              </div>

              <!-- Message Header -->
              <div class="flex flex-col items-center border-b border-gray-200 p-12px dark:border-white/10">
                <div class="mb-4px h-40px w-40px flex items-center justify-center rd-full bg-gray-200 dark:bg-gray-700">
                  <icon-material-symbols-person class="text-24px text-gray-500 dark:text-gray-400" />
                </div>
                <span class="text-14px font-bold dark:text-white/90">
                  {{ senderId || $t('page.manage.sms.config.mock.sender') }}
                </span>
              </div>

              <!-- Chat Area -->
              <div class="flex-1 overflow-y-auto bg-gray-50 p-12px dark:bg-black">
                <div
                  class="mb-8px max-w-85% rd-16px bg-gray-200 p-12px text-13px leading-tight dark:bg-[#262626] dark:text-white/80"
                >
                  {{ previewMessage || $t('page.manage.sms.config.mock.placeholder') }}
                </div>
                <div class="text-center">
                  <span class="text-10px text-gray-400 dark:text-gray-500">
                    {{ $t('page.manage.sms.config.mock.time') }}
                  </span>
                </div>
              </div>

              <!-- Input Bar Mockup -->
              <div class="flex items-center gap-8px border-t border-gray-200 p-8px dark:border-white/10">
                <div class="h-32px flex flex-1 items-center rd-16px bg-gray-100 px-12px dark:bg-[#1a1a1a]">
                  <span class="text-12px text-gray-400 dark:text-gray-500">
                    {{ $t('page.manage.sms.config.mock.input') }}
                  </span>
                </div>
                <div class="h-32px w-32px flex items-center justify-center rd-full bg-blue-500">
                  <icon-material-symbols-arrow-upward class="text-16px text-white" />
                </div>
              </div>
            </div>

            <!-- Home Bar -->
            <div
              class="absolute bottom-16px left-1/2 h-4px w-80px rd-full bg-gray-100/50 -translate-x-1/2 dark:bg-white/20"
            ></div>
          </div>
        </NCard>
      </NGi>
    </NGrid>
  </div>
</template>

<style scoped>
:deep(.n-card__content) {
  height: 100%;
}
</style>
