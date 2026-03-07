import { Injectable } from '@nestjs/common';
import type { SupportedLanguage, Region, PaymentMethod } from '../types';

import en from './locales/en.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import es from './locales/es.json';

export interface LocaleInfo {
  language: SupportedLanguage;
  region: Region;
  timezone: string;
}

type TranslationMap = Record<string, Record<string, string>>;

const TRANSLATIONS: Record<SupportedLanguage, TranslationMap> = {
  en: en as TranslationMap,
  zh: zh as TranslationMap,
  ja: ja as TranslationMap,
  ko: ko as TranslationMap,
  de: de as TranslationMap,
  fr: fr as TranslationMap,
  es: es as TranslationMap,
};

const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['zh', 'en', 'ja', 'ko', 'de', 'fr', 'es'];

/** Maps Accept-Language prefixes to SupportedLanguage */
const LANGUAGE_MAP: Record<string, SupportedLanguage> = {
  zh: 'zh',
  en: 'en',
  ja: 'ja',
  ko: 'ko',
  de: 'de',
  fr: 'fr',
  es: 'es',
};

/** Maps region to default timezone */
const REGION_TIMEZONE: Record<Region, string> = {
  apac: 'Asia/Shanghai',
  na: 'America/New_York',
  eu: 'Europe/Berlin',
};

/** Regional payment method mapping */
const REGIONAL_PAYMENT_METHODS: Record<Region, PaymentMethod[]> = {
  apac: ['alipay', 'wechat_pay', 'credit_card'],
  na: ['credit_card', 'paypal'],
  eu: ['sepa', 'credit_card', 'paypal'],
};

@Injectable()
export class LocalizationService {
  /**
   * Detect user locale from IP-based region hint and Accept-Language header.
   * IP geolocation is expected to be resolved upstream (e.g., by CDN or gateway)
   * and passed as a region hint.
   */
  detectLocale(ipRegionHint: string | undefined, acceptLanguage: string): LocaleInfo {
    const language = this.parseAcceptLanguage(acceptLanguage);
    const region = this.inferRegion(ipRegionHint, language);
    const timezone = REGION_TIMEZONE[region];

    return { language, region, timezone };
  }

  /** Get translations for a given language and namespace */
  getTranslations(language: SupportedLanguage, namespace: string): Record<string, string> {
    const langTranslations = TRANSLATIONS[language] ?? TRANSLATIONS.en;
    return langTranslations[namespace] ?? {};
  }

  /** Get a single translation key using dot notation (e.g., "common.welcome") */
  translate(language: SupportedLanguage, key: string): string {
    const [namespace, ...rest] = key.split('.');
    const translationKey = rest.join('.');
    const ns = this.getTranslations(language, namespace);
    return ns[translationKey] ?? key;
  }

  /** Get available payment methods for a region */
  getRegionalPaymentMethods(region: Region): PaymentMethod[] {
    return REGIONAL_PAYMENT_METHODS[region] ?? REGIONAL_PAYMENT_METHODS.na;
  }

  /** Get all supported languages */
  getSupportedLanguages(): SupportedLanguage[] {
    return [...SUPPORTED_LANGUAGES];
  }

  /** Parse Accept-Language header and return the best matching SupportedLanguage */
  parseAcceptLanguage(acceptLanguage: string): SupportedLanguage {
    if (!acceptLanguage) return 'en';

    const parts = acceptLanguage.split(',');
    for (const part of parts) {
      const lang = part.split(';')[0].trim().toLowerCase();
      const prefix = lang.split('-')[0];
      if (LANGUAGE_MAP[prefix]) {
        return LANGUAGE_MAP[prefix];
      }
    }
    return 'en';
  }

  private inferRegion(ipRegionHint: string | undefined, language: SupportedLanguage): Region {
    // If upstream provides a region hint, use it
    if (ipRegionHint && ['apac', 'na', 'eu'].includes(ipRegionHint)) {
      return ipRegionHint as Region;
    }

    // Infer region from language as fallback
    switch (language) {
      case 'zh':
      case 'ja':
      case 'ko':
        return 'apac';
      case 'de':
      case 'fr':
      case 'es':
        return 'eu';
      case 'en':
      default:
        return 'na';
    }
  }
}
