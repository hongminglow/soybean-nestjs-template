# Soybean Admin Development Guide

This guide outlines the best practices and patterns to follow when developing in this project. It covers Soybean Admin architecture, UnoCSS for styling, and Naive UI for components.

## 🚀 General Development Practices

### 1. Component Options (`defineOptions`)
Every page component in `src/views` should use the `defineOptions` macro to set a component name.

```typescript
defineOptions({
  name: 'YourComponentName'
});
```
> **Note:** The `name` must match the **Route Name** exactly for the **Keep-alive (tab caching)** functionality to work correctly. It also helps with identification in Vue DevTools.

### 2. Route Configuration
- **Static Routes:** Configure custom meta (icons, order, constant status) in `build/plugins/router.ts` within the `onRouteMetaGen` hook.
- **Auto Generation:** The project uses `elegant-router`. New files in `src/views` will automatically generate routes in `src/router/elegant/routes.ts`.

### 3. Usage of Constants
Avoid hardcoding strings for business logic (like status codes or dropdown options).
- Use `src/constants/business.ts` for domain-specific constants.
- Use the `CommonType.Option` interface for dropdown/select data structures to maintain type safety.

### 4. Custom Typing SOP (`.d.ts` vs `types.ts`)
We follow a strict Soybean-style typing strategy.

#### 4.1 Decision Rule (Must Follow)
- Put types in `src/typings/**/*.d.ts` when the type is **cross-module/global contract** (API namespace, global augmentation, router/storage/app-level shared typing).
- Put types in local `types.ts` (near feature/page/component) when the type is **feature-local UI typing** (table row shape used only in one page, local form state, component-only props helpers).

#### 4.2 When You MUST Add/Update `src/typings`
1. **New Backend API contract**
  - Add/update files under `src/typings/api/`.
  - Keep request/response contracts centralized by domain.
2. **Global augmentation**
  - Update `src/typings/global.d.ts` for `Window`, global constants, or project-level globals.
3. **Framework-level shared contracts**
  - Update related global declaration files (for router meta, storage keys, app namespaces, etc.) when many modules consume the same type.

#### 4.3 When to Use Local `types.ts` (React-style)
- Use local `types.ts` if the type is only meaningful inside one feature folder.
- Example (recommended):
  - `src/views/home/index.vue`
  - `src/views/home/types.ts`
- This is equivalent to typical React colocated typing and is fully allowed in this project.

#### 4.4 Why This Project Uses `.d.ts`
- `.d.ts` declarations are discovered globally by TypeScript, reducing repetitive imports for project-wide contracts.
- Namespaced declarations (for example `Api.*`) keep large API contracts organized and consistent across service/store/view layers.

#### 4.5 Naming and Structure Convention
- API domain typings: `src/typings/api/<domain>.d.ts` (example: `user-management.d.ts`).
- Local feature typings: `types.ts` inside the same feature folder.
- Avoid creating global declarations for one-off local UI data.

### 5. React Developer Notes (Important)
These conventions are valid Vue patterns, but can be confusing if you come from React. Use the following mapping as the project SOP.

#### 5.1 `views/**/modules` vs `src/components/**`
- `views/<feature>/modules/*` = route-local components (used by one page/feature).
- `src/components/*` = shared reusable components (used by multiple features/layouts).
- In this project, prefer `modules` for page-local pieces to stay consistent with existing Soybean structure.

---

## 🛣️ Adding a New Route (Step-by-Step)

Follow these steps to add a new page and ensure it integrates correctly with the sidebar and permissions system.

### Step 1: Create the View File
Create a new folder and an `index.vue` file inside `src/views`.
- **Example:** `src/views/log-management/system-log/index.vue`
- The folder structure determines the route path (e.g., `/log-management/system-log`).

### Step 2: Set Component Name
Inside your new `index.vue`, use `defineOptions` to set the name.
```vue
<script setup lang="ts">
defineOptions({
  name: 'LogManagement_SystemLog' // Note: underscore represents folder level
});
</script>
```
> **Note:** The name should follow the route key pattern (folders joined by underscores).

### Step 3: Wait for Auto-Generation
The `elegant-router` plugin will detect your new file and automatically update:
- `src/router/elegant/routes.ts`
- `src/typings/elegant-router.d.ts` (for type safety)

### Step 4: Configure Metadata
If you want to set a specific **icon**, **order**, or **active menu** for the route, open `build/plugins/router.ts` and add logic to `onRouteMetaGen`:

```typescript
if (key === 'log-management_system-log') {
  meta.icon = 'mdi:text-box-list-outline';
  meta.order = 5;
}
```

### Step 5: Add Internationalization (i18n)
Add the translation for the menu title in `src/locales/langs/en-us.ts` (and other languages):
```typescript
const local: App.I18n.Schema = {
  route: {
    'log-management_system-log': 'System Log'
  }
};
```

---

## 🎨 UnoCSS Styling Rules

UnoCSS is used for atomic styling. It is configured to be compatible with Tailwind CSS utility classes.

- **Prefer Atomic Classes:** Use utility classes (e.g., `flex-center`, `gap-16px`, `p-24px`) directly in templates rather than writing custom `<style>` blocks.
- **Shortcuts:** Look into `uno.config.ts` for project-specific shortcuts like `flex-center` or `wh-full`.
- **Spacing:** Use standard pixel values (e.g., `m-12px`) or the spacing scale for consistency.

---

## � Naive UI Usage

- **Global Instances:** Use the global `window.$message`, `window.$dialog`, and `window.$notification` for feedback logic outside of component templates (e.g., in API interceptors).
- **Type Safety:** Always import and use types from `naive-ui` when defining props or refs that interact with component instances (e.g., `DataTableInst`, `FormInst`).
- **Theming:** Use the `useThemeVars` hook from Naive UI if you need to access theme colors (primary, success, etc.) inside your Javascript logic.

---

## 🌐 Internationalization (i18n)

- All UI text should be defined in `src/locales/langs/`.
- Access translations using the `$t('key')` function in templates or `i18n.t('key')` in scripts.
- Route titles are automatically mapped to `route.{key}` in the locale files.

---

*This guide is a living document. Please add new patterns and "gotchas" as you discover them during development.*
