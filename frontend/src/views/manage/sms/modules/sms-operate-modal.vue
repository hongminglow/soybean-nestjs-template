<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'SmsOperateModal'
});

export type OperateType = NaiveUI.TableOperateType;

interface Props {
  operateType: OperateType;
  rowData?: SmsTemplateLocale | null;
}

export interface SmsTemplateLocale {
  id: number;
  keyword: string;
  language: string;
  content: string;
  variables: string[];
  status: string;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', {
  default: false
});

const { formRef, validate, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

const title = computed(() => {
  const titles: Record<OperateType, string> = {
    add: $t('page.manage.sms.addTemplate'),
    edit: $t('page.manage.sms.editTemplate')
  };
  return titles[props.operateType];
});

// ===== Predefined Data =====

const predefinedKeywords = [
  { label: 'OTP Verification', value: 'otp_verification' },
  { label: 'Password Reset', value: 'password_reset' },
  { label: 'Welcome Message', value: 'welcome_message' },
  { label: 'Order Confirmation', value: 'order_confirmation' },
  { label: 'Payment Reminder', value: 'payment_reminder' },
  { label: 'Account Activation', value: 'account_activation' },
  { label: 'Delivery Update', value: 'delivery_update' },
  { label: 'Appointment Reminder', value: 'appointment_reminder' }
];

const predefinedLanguages = [
  { label: 'English', value: 'en' },
  { label: 'Chinese (Simplified)', value: 'zh-CN' },
  { label: 'Chinese (Traditional)', value: 'zh-TW' },
  { label: 'Malay', value: 'ms' },
  { label: 'Tamil', value: 'ta' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
  { label: 'Thai', value: 'th' }
];

const predefinedVariables = [
  { label: 'OTP Code', value: '{{otp_code}}', color: '#18a058' },
  { label: 'Expiry Minutes', value: '{{expiry_minutes}}', color: '#2080f0' },
  { label: 'User Name', value: '{{user_name}}', color: '#f0a020' },
  { label: 'Brand Name', value: '{{brand_name}}', color: '#d03050' },
  { label: 'Order ID', value: '{{order_id}}', color: '#8b5cf6' },
  { label: 'Amount', value: '{{amount}}', color: '#0ea5e9' },
  { label: 'Date', value: '{{date}}', color: '#10b981' },
  { label: 'Link', value: '{{link}}', color: '#ec4899' },
  { label: 'App Name', value: '{{app_name}}', color: '#6366f1' },
  { label: 'Support Phone', value: '{{support_phone}}', color: '#14b8a6' }
];

// ===== Model =====

interface Model {
  keyword: string;
  language: string;
  content: string;
  variables: string[];
}

const model: Model = reactive(createDefaultModel());

function createDefaultModel(): Model {
  return {
    keyword: '',
    language: '',
    content: '',
    variables: []
  };
}

type RuleKey = Extract<keyof Model, 'keyword' | 'language' | 'content'>;

const rules: Record<RuleKey, App.Global.FormRule> = {
  keyword: defaultRequiredRule,
  language: defaultRequiredRule,
  content: defaultRequiredRule
};

// ===== Variable Tags =====

const contentRef = ref<any>(null);

/** Clean up extra whitespace after removing a variable from content */
function cleanContent(text: string): string {
  return text.replace(/  +/g, ' ').trim();
}

function addVariable(variable: string) {
  if (!model.variables.includes(variable)) {
    model.variables.push(variable);
  }
  // Only append to content if not already present
  if (!model.content.includes(variable)) {
    const separator = model.content.length > 0 && !model.content.endsWith(' ') ? ' ' : '';
    model.content += `${separator}${variable}`;
  }
}

function removeVariable(variable: string) {
  const index = model.variables.indexOf(variable);
  if (index > -1) {
    model.variables.splice(index, 1);
  }
  // Also strip all occurrences from the content
  if (model.content.includes(variable)) {
    model.content = cleanContent(model.content.replaceAll(variable, ''));
  }
}

function toggleVariable(variable: string) {
  if (model.variables.includes(variable)) {
    removeVariable(variable);
  } else {
    addVariable(variable);
  }
}

function getVariableColor(value: string) {
  const found = predefinedVariables.find(v => v.value === value);
  return found?.color || '#666';
}

function getVariableLabel(value: string) {
  const found = predefinedVariables.find(v => v.value === value);
  return found?.label || value;
}

// ===== Drag & Drop for variable reorder =====
const dragIndex = ref<number | null>(null);

function onDragStart(index: number) {
  dragIndex.value = index;
}

function onDragOver(e: DragEvent, _index: number) {
  e.preventDefault();
}

function onDrop(e: DragEvent, index: number) {
  e.preventDefault();
  if (dragIndex.value === null || dragIndex.value === index) return;
  const items = [...model.variables];
  const [moved] = items.splice(dragIndex.value, 1);
  items.splice(index, 0, moved);
  model.variables = items;
  dragIndex.value = null;
}

function onDragEnd() {
  dragIndex.value = null;
}

// ===== Preview =====

const sampleValues: Record<string, string> = {
  '{{otp_code}}': '583921',
  '{{expiry_minutes}}': '5',
  '{{user_name}}': 'John',
  '{{brand_name}}': 'Soybean',
  '{{order_id}}': 'ORD-20260302',
  '{{amount}}': 'RM 128.00',
  '{{date}}': '2 Mar 2026',
  '{{link}}': 'https://soybean.app/v',
  '{{app_name}}': 'Soybean Admin',
  '{{support_phone}}': '+60-12345678'
};

const previewMessage = computed(() => {
  let msg = model.content || 'Your message preview will appear here...';
  for (const [key, val] of Object.entries(sampleValues)) {
    msg = msg.replaceAll(key, val);
  }
  return msg;
});

const charCount = computed(() => previewMessage.value.length);
const smsSegments = computed(() => {
  if (charCount.value <= 160) return 1;
  return Math.ceil(charCount.value / 153);
});

const keywordLabel = computed(() => {
  const found = predefinedKeywords.find(k => k.value === model.keyword);
  return found?.label || 'SMS';
});

// ===== Init / Submit =====

function handleInitModel() {
  Object.assign(model, createDefaultModel());
  if (!props.rowData) return;
  if (props.operateType === 'edit') {
    const { id: _id, status: _status, ...rest } = props.rowData;
    Object.assign(model, rest);
  }
}

function closeModal() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();

  if (props.operateType === 'add') {
    window.$message?.success($t('common.addSuccess'));
  } else {
    window.$message?.success($t('common.updateSuccess'));
  }

  closeModal();
  emit('submitted');
}

watch(visible, () => {
  if (visible.value) {
    handleInitModel();
    restoreValidation();
  }
});
</script>

<template>
  <NModal v-model:show="visible" :title="title" preset="card" class="sms-modal w-1100px">
    <NScrollbar class="h-520px pr-20px">
      <NGrid :x-gap="20" :cols="24">
        <!-- Left: Form Section -->
        <NGi :span="14">
          <NForm ref="formRef" :model="model" :rules="rules" label-placement="left" :label-width="110">
            <NGrid responsive="screen" item-responsive>
              <!-- Template Keyword -->
              <NFormItemGi span="24" :label="$t('page.manage.sms.keyword')" path="keyword">
                <NSelect
                  v-model:value="model.keyword"
                  :options="predefinedKeywords"
                  :placeholder="$t('page.manage.sms.form.keyword')"
                  filterable
                />
              </NFormItemGi>

              <!-- Language -->
              <NFormItemGi span="24" :label="$t('page.manage.sms.language')" path="language">
                <NSelect
                  v-model:value="model.language"
                  :options="predefinedLanguages"
                  :placeholder="$t('page.manage.sms.form.language')"
                  filterable
                />
              </NFormItemGi>

              <!-- Message Content -->
              <NFormItemGi span="24" :label="$t('page.manage.sms.content')" path="content">
                <template #label>
                  <NSpace align="center" justify="space-between" class="w-full">
                    <span>{{ $t('page.manage.sms.content') }}</span>
                    <NText depth="3" class="text-11px">
                      {{ charCount }} chars · {{ smsSegments }} segment{{ smsSegments > 1 ? 's' : '' }}
                    </NText>
                  </NSpace>
                </template>
                <NInput
                  ref="contentRef"
                  v-model:value="model.content"
                  type="textarea"
                  :placeholder="$t('page.manage.sms.form.content')"
                  :autosize="{ minRows: 4, maxRows: 6 }"
                />
              </NFormItemGi>

              <!-- Template Variables -->
              <NFormItemGi span="24" :label="$t('page.manage.sms.availableVars')">
                <div class="w-full">
                  <div class="flex flex-wrap gap-6px">
                    <NButton
                      v-for="v in predefinedVariables"
                      :key="v.value"
                      secondary
                      round
                      size="tiny"
                      :type="model.variables.includes(v.value) ? 'primary' : 'default'"
                      :style="{
                        borderColor: model.variables.includes(v.value) ? v.color : undefined,
                        color: model.variables.includes(v.value) ? v.color : undefined
                      }"
                      @mousedown.prevent
                      @click="toggleVariable(v.value)"
                    >
                      <template #icon>
                        <icon-ic-round-add v-if="!model.variables.includes(v.value)" class="text-12px" />
                        <icon-ic-round-check v-else class="text-12px" />
                      </template>
                      {{ v.label }}
                    </NButton>
                  </div>
                </div>
              </NFormItemGi>

              <!-- Selected Variables (Draggable Tags) -->
              <NFormItemGi v-if="model.variables.length > 0" span="24" :label="$t('page.manage.sms.selectedVars')">
                <div class="w-full">
                  <NText depth="3" class="mb-6px block text-11px">
                    {{ $t('page.manage.sms.dragToReorder') }}
                  </NText>
                  <div class="flex flex-wrap gap-6px">
                    <NTag
                      v-for="(variable, index) in model.variables"
                      :key="variable"
                      closable
                      round
                      size="medium"
                      :bordered="true"
                      :style="{
                        cursor: 'grab',
                        borderColor: getVariableColor(variable),
                        '--n-close-icon-color': getVariableColor(variable),
                        '--n-close-icon-color-hover': getVariableColor(variable)
                      }"
                      draggable="true"
                      @dragstart="onDragStart(index)"
                      @dragover="(e: DragEvent) => onDragOver(e, index)"
                      @drop="(e: DragEvent) => onDrop(e, index)"
                      @dragend="onDragEnd"
                      @close="removeVariable(variable)"
                    >
                      <template #icon>
                        <icon-ic-round-drag-indicator
                          class="text-12px"
                          :style="{ color: getVariableColor(variable) }"
                        />
                      </template>
                      <span :style="{ color: getVariableColor(variable) }">{{ getVariableLabel(variable) }}</span>
                    </NTag>
                  </div>
                </div>
              </NFormItemGi>
            </NGrid>
          </NForm>
        </NGi>

        <!-- Right: Phone Preview -->
        <NGi :span="10">
          <div class="flex flex-col items-center pt-8px">
            <NText class="mb-8px text-13px font-medium op-70">
              {{ $t('page.manage.sms.phonePreview') }}
            </NText>
            <!-- Phone Frame -->
            <div
              class="phone-frame relative h-480px w-240px overflow-hidden border-6 border-gray-800 rd-32px bg-black p-8px shadow-2xl dark:border-gray-600"
            >
              <!-- Screen -->
              <div class="h-full w-full flex flex-col overflow-hidden rd-24px bg-white dark:bg-[#121212]">
                <!-- Status Bar -->
                <div class="h-22px flex items-center justify-between bg-gray-100 px-12px text-9px dark:bg-[#1e1e1e]">
                  <span class="font-medium dark:text-white/80">9:41</span>
                  <div class="flex gap-3px dark:text-white/80">
                    <icon-material-symbols-signal-cellular-4-bar class="text-10px" />
                    <icon-material-symbols-wifi class="text-10px" />
                    <icon-material-symbols-battery-full class="text-10px" />
                  </div>
                </div>

                <!-- Message Header -->
                <div class="flex flex-col items-center border-b border-gray-200 p-10px dark:border-white/10">
                  <div
                    class="mb-3px h-32px w-32px flex items-center justify-center rd-full bg-gradient-to-br from-blue-400 to-indigo-500"
                  >
                    <icon-material-symbols-sms class="text-16px text-white" />
                  </div>
                  <span class="text-12px font-bold dark:text-white/90">
                    {{ keywordLabel }}
                  </span>
                  <span class="text-9px text-gray-400">SMS Template</span>
                </div>

                <!-- Chat Area -->
                <div class="flex-1 overflow-y-auto bg-gray-50 p-10px dark:bg-black">
                  <div
                    class="sms-bubble mb-6px max-w-90% rd-12px bg-gray-200 p-10px text-11px leading-relaxed dark:bg-[#262626] dark:text-white/80"
                  >
                    {{ previewMessage }}
                  </div>
                  <div class="text-center">
                    <span class="text-9px text-gray-400 dark:text-gray-500">Today 9:41 AM</span>
                  </div>
                </div>

                <!-- Input Bar Mockup -->
                <div class="flex items-center gap-6px border-t border-gray-200 p-6px dark:border-white/10">
                  <div class="h-28px flex flex-1 items-center rd-14px bg-gray-100 px-10px dark:bg-[#1a1a1a]">
                    <span class="text-10px text-gray-400 dark:text-gray-500">Text Message</span>
                  </div>
                  <div
                    class="h-28px w-28px flex items-center justify-center rd-full bg-gradient-to-r from-blue-500 to-indigo-500"
                  >
                    <icon-material-symbols-arrow-upward class="text-14px text-white" />
                  </div>
                </div>
              </div>

              <!-- Home Bar -->
              <div
                class="absolute bottom-12px left-1/2 h-3px w-60px rd-full bg-gray-100/50 -translate-x-1/2 dark:bg-white/20"
              ></div>
            </div>

            <!-- Char count below preview -->
            <div class="mt-8px flex items-center gap-8px">
              <NTag size="tiny" :type="smsSegments > 1 ? 'warning' : 'success'" round>{{ charCount }} chars</NTag>
              <NTag size="tiny" :type="smsSegments > 2 ? 'error' : 'info'" round>
                {{ smsSegments }} segment{{ smsSegments > 1 ? 's' : '' }}
              </NTag>
            </div>
          </div>
        </NGi>
      </NGrid>
    </NScrollbar>
    <template #footer>
      <NSpace justify="end" :size="16">
        <NButton @click="closeModal">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.sms-modal {
  border-radius: 12px;
}

.phone-frame {
  transition: transform 0.3s ease;
}

.phone-frame:hover {
  transform: scale(1.02);
}

.sms-bubble {
  animation: fadeInUp 0.3s ease;
  word-break: break-word;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:deep(.n-tag) {
  transition: all 0.2s ease;
}

:deep(.n-tag):hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
