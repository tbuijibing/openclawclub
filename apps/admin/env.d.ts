/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}

// Type stub for @element-plus/icons-vue — resolved after pnpm install
declare module '@element-plus/icons-vue' {
  import type { DefineComponent } from 'vue';
  const Odometer: DefineComponent;
  const User: DefineComponent;
  const Document: DefineComponent;
  const SetUp: DefineComponent;
  const ChatDotRound: DefineComponent;
  const Connection: DefineComponent;
  const Reading: DefineComponent;
  const Monitor: DefineComponent;
  const DataAnalysis: DefineComponent;
  const Setting: DefineComponent;
  const Fold: DefineComponent;
  const Expand: DefineComponent;
  const ArrowDown: DefineComponent;
  const SwitchButton: DefineComponent;
  const Loading: DefineComponent;
  const Search: DefineComponent;
  export {
    Odometer, User, Document, SetUp, ChatDotRound, Connection,
    Reading, Monitor, DataAnalysis, Setting, Fold, Expand,
    ArrowDown, SwitchButton, Loading, Search,
  };
}

// Type stub for @logto/vue — resolved after pnpm install
declare module '@logto/vue' {
  export function createLogto(config: Record<string, unknown>): unknown;
}
