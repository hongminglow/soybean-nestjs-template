<script setup lang="ts">
const techStack = ['Vue 3', 'Vite 6', 'TypeScript', 'Naive UI', 'UnoCSS', 'NestJS', 'Prisma'];

const highlights = [
  'Clean UI and consistent design tokens',
  'Role-based auth and dynamic route support',
  'Modular backend with Prisma data layer'
];

const links = [
  { label: 'Frontend', value: 'frontend/' },
  { label: 'Backend', value: 'backend/' },
  { label: 'Setup Guide', value: 'SETUP.md' }
];
</script>

<template>
  <NSpace vertical :size="16" class="min-h-500px">
    <NCard :bordered="false" class="card-wrapper">
      <NSpace vertical :size="8">
        <NTag type="success" size="small" round>About</NTag>
        <NH2 class="mb-0!">Soybean NestJS Template</NH2>
        <NText depth="3">
          A simple demo about page with hardcoded content, built using the same Naive UI style used in Soybean pages.
        </NText>
      </NSpace>
    </NCard>

    <NGrid :cols="24" :x-gap="16" :y-gap="16" item-responsive>
      <NGi span="24 m:12">
        <NCard title="Project Info" :bordered="false" class="h-full card-wrapper">
          <NDescriptions label-placement="left" :column="1" bordered size="small">
            <NDescriptionsItem label="Name">Soybean NestJS Template</NDescriptionsItem>
            <NDescriptionsItem label="Version">1.0.0 (demo)</NDescriptionsItem>
            <NDescriptionsItem label="Maintainer">Team Soybean</NDescriptionsItem>
            <NDescriptionsItem label="Environment">Local Development</NDescriptionsItem>
          </NDescriptions>
        </NCard>
      </NGi>

      <NGi span="24 m:12">
        <NCard title="Tech Stack" :bordered="false" class="h-full card-wrapper">
          <NSpace>
            <NTag v-for="item in techStack" :key="item" type="info" round>
              {{ item }}
            </NTag>
          </NSpace>
        </NCard>
      </NGi>

      <NGi span="24 m:12">
        <NCard title="Highlights" :bordered="false" class="h-full card-wrapper">
          <NList bordered>
            <NListItem v-for="item in highlights" :key="item">
              {{ item }}
            </NListItem>
          </NList>
        </NCard>
      </NGi>

      <NGi span="24 m:12">
        <NCard title="Quick Links" :bordered="false" class="h-full card-wrapper">
          <NSpace vertical>
            <NButton v-for="item in links" :key="item.label" type="primary" ghost block>
              {{ item.label }} · {{ item.value }}
            </NButton>
          </NSpace>
        </NCard>
      </NGi>
    </NGrid>
  </NSpace>
</template>

<style scoped></style>
