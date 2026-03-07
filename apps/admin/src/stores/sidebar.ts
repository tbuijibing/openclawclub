import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSidebarStore = defineStore('admin-sidebar', () => {
  const isCollapsed = ref(false);

  function toggle(): void {
    isCollapsed.value = !isCollapsed.value;
  }

  function setCollapsed(collapsed: boolean): void {
    isCollapsed.value = collapsed;
  }

  return { isCollapsed, toggle, setCollapsed };
});
