<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { enableStatusOptions } from '@/constants/business';
import { createConfig, updateConfig } from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({
  name: 'ConfigOperateDrawer'
});

interface Props {
  operateType: NaiveUI.TableOperateType;
  rowData?: Config.ConfigItem | null;
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
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: $t('page.manage.config.addConfig'),
    edit: $t('page.manage.config.editConfig')
  };

  return titles[props.operateType];
});

const model: Config.ConfigModel = reactive(createDefaultModel());

function createDefaultModel(): Config.ConfigModel {
  return {
    id: '',
    configKey: '',
    configValue: '',
    status: 'ENABLED'
  };
}

type RuleKey = Extract<keyof Config.ConfigModel, 'configKey' | 'configValue' | 'status'>;

const rules: Record<RuleKey, App.Global.FormRule> = {
  configKey: defaultRequiredRule,
  configValue: defaultRequiredRule,
  status: defaultRequiredRule
};

function handleInitModel() {
  Object.assign(model, createDefaultModel());

  if (props.operateType === 'edit' && props.rowData) {
    Object.assign(model, props.rowData);
  }
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();

  if (props.operateType === 'add') {
    const payload: Config.ConfigCreateModel = {
      configKey: model.configKey,
      configValue: model.configValue,
      status: model.status
    };

    const { error } = await createConfig(payload);
    if (error) return;

    window.$message?.success($t('common.addSuccess'));
  } else {
    const { error } = await updateConfig(model);
    if (error) return;

    window.$message?.success($t('common.updateSuccess'));
  }

  closeDrawer();
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
  <NDrawer v-model:show="visible" display-directive="show" :width="360">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules">
        <NFormItem :label="$t('page.manage.config.configKey')" path="configKey">
          <NInput v-model:value="model.configKey" :placeholder="$t('page.manage.config.form.configKey')" />
        </NFormItem>
        <NFormItem :label="$t('page.manage.config.configValue')" path="configValue">
          <NInput v-model:value="model.configValue" :placeholder="$t('page.manage.config.form.configValue')" />
        </NFormItem>
        <NFormItem :label="$t('page.manage.config.configStatus')" path="status">
          <NRadioGroup v-model:value="model.status">
            <NRadio
              v-for="item in enableStatusOptions"
              :key="item.value"
              :value="item.value"
              :label="$t(item.label as App.I18n.I18nKey)"
            />
          </NRadioGroup>
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace :size="16">
          <NButton @click="closeDrawer">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped></style>
