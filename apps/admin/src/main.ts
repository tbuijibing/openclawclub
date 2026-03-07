import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';
import router from './router';
import i18n from './i18n';

// Admin design system styles
import './styles/index.css';

const app = createApp(App);

// Plugins
app.use(createPinia());
app.use(router);
app.use(i18n);
app.use(ElementPlus);

// Logto Vue plugin placeholder
// In production, configure with:
// import { createLogto } from '@logto/vue';
// app.use(createLogto, {
//   endpoint: import.meta.env.VITE_LOGTO_ENDPOINT,
//   appId: import.meta.env.VITE_LOGTO_ADMIN_APP_ID,
// });

app.mount('#app');
