import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import es from './locales/es.json';

export type AdminMessageSchema = typeof en;
export type SupportedLocale = 'en' | 'zh' | 'ja' | 'ko' | 'de' | 'fr' | 'es';

export const SUPPORTED_LOCALES: { code: SupportedLocale; label: string }[] = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
];

function detectBrowserLocale(): SupportedLocale {
  const lang = navigator.language.split('-')[0] as SupportedLocale;
  return SUPPORTED_LOCALES.some((l) => l.code === lang) ? lang : 'en';
}

const i18n = createI18n<[AdminMessageSchema], SupportedLocale>({
  legacy: false,
  locale: (localStorage.getItem('oc-admin-locale') as SupportedLocale) || detectBrowserLocale(),
  fallbackLocale: 'en',
  messages: { en, zh, ja, ko, de, fr, es },
});

export default i18n;
