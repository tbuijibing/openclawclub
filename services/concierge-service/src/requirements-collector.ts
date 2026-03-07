import { ServiceRequirements } from './types';

/**
 * Requirement fields that must be collected for an installation service plan.
 * Req: 14.2, 2.2 — collect device environment, OS, network, use case, preferred service time
 */
export const REQUIRED_FIELDS: (keyof ServiceRequirements)[] = [
  'deviceEnvironment',
  'operatingSystem',
  'networkEnvironment',
  'useCase',
  'preferredServiceTime',
];

/**
 * Patterns used to extract requirement info from user messages.
 * Each field has an array of regex patterns that indicate the user is providing that info.
 */
const EXTRACTION_PATTERNS: Record<keyof ServiceRequirements, RegExp[]> = {
  operatingSystem: [
    /\b(ubuntu|debian|centos|fedora|rhel|red\s*hat|arch|linux|mint)\b/i,
    /\b(macos|mac\s*os|osx|os\s*x|macbook|imac)\b/i,
    /\b(windows\s*\d+|windows\s*server|win\s*\d+|win\s*11|win\s*10)\b/i,
    /\b(freebsd|openbsd|netbsd)\b/i,
  ],
  deviceEnvironment: [
    /\b(\d+\s*(?:gb|tb)\s*(?:ram|memory|内存))\b/i,
    /\b(gpu|nvidia|amd|rtx|gtx|显卡|cpu|intel|apple\s*m\d|core\s*i\d)\b/i,
    /\b(\d+\s*(?:core|核心|cores))\b/i,
    /\b(ssd|hdd|nvme|硬盘|磁盘)\b/i,
    /\b(mac\s*mini|nuc|server|workstation|laptop|desktop|vps|cloud\s*instance|ec2|ecs)\b/i,
  ],
  networkEnvironment: [
    /\b(vpn|proxy|direct\s*(?:internet|connection)|air[\s-]?gap(?:ped)?|firewall)\b/i,
    /\b(nat|port\s*forward|内网|外网|公网|局域网|corporate\s*network)\b/i,
    /\b(bandwidth|mbps|gbps|带宽)\b/i,
  ],
  useCase: [
    /\b(personal|individual|个人|自用|hobby)\b/i,
    /\b(team|group|小组|团队|collaboration)\b/i,
    /\b(enterprise|company|corporate|公司|企业|production|生产)\b/i,
    /\b(development|dev|开发|testing|test|测试|staging)\b/i,
    /\b(education|学习|learning|research|研究)\b/i,
  ],
  preferredServiceTime: [
    /\b(morning|afternoon|evening|night|上午|下午|晚上|早上)\b/i,
    /\b(weekday|weekend|工作日|周末)\b/i,
    /\b(asap|as\s*soon\s*as\s*possible|urgent|尽快|immediately)\b/i,
    /\b(utc|gmt|est|pst|cst|jst|cet|时区)\b/i,
    /\b(\d{1,2}[:\s]*\d{2}\s*(?:am|pm)?)\b/i,
    /\b(next\s*week|this\s*week|tomorrow|today|下周|明天|今天)\b/i,
  ],
};

/**
 * Extract requirement information from a user message.
 * Returns only newly detected fields (not already collected).
 */
export function extractRequirements(
  message: string,
  existing: Partial<ServiceRequirements>,
): Partial<ServiceRequirements> {
  const extracted: Partial<ServiceRequirements> = {};

  for (const field of REQUIRED_FIELDS) {
    // Skip already collected fields
    if (existing[field]) continue;

    const patterns = EXTRACTION_PATTERNS[field];
    const matched = patterns.some((p) => p.test(message));
    if (matched) {
      extracted[field] = message;
    }
  }

  return extracted;
}

/**
 * Check which requirement fields are still missing.
 */
export function getMissingFields(
  collected: Partial<ServiceRequirements>,
): (keyof ServiceRequirements)[] {
  return REQUIRED_FIELDS.filter((f) => !collected[f]);
}

/**
 * Check if all required fields have been collected.
 */
export function hasAllRequirements(collected: Partial<ServiceRequirements>): boolean {
  return getMissingFields(collected).length === 0;
}

/**
 * Check if enough core requirements are collected to generate a plan.
 * At minimum we need: OS, device environment, and use case.
 */
export function hasMinimumRequirements(collected: Partial<ServiceRequirements>): boolean {
  return !!(collected.operatingSystem && collected.deviceEnvironment && collected.useCase);
}

/**
 * Human-readable labels for requirement fields (used in prompts).
 */
export const FIELD_LABELS: Record<keyof ServiceRequirements, Record<string, string>> = {
  deviceEnvironment: {
    en: 'device/hardware environment',
    zh: '设备/硬件环境',
    ja: 'デバイス/ハードウェア環境',
    ko: '장치/하드웨어 환경',
    de: 'Geräte-/Hardwareumgebung',
    fr: 'environnement matériel',
    es: 'entorno de hardware',
  },
  operatingSystem: {
    en: 'operating system',
    zh: '操作系统',
    ja: 'オペレーティングシステム',
    ko: '운영 체제',
    de: 'Betriebssystem',
    fr: 'système d\'exploitation',
    es: 'sistema operativo',
  },
  networkEnvironment: {
    en: 'network environment',
    zh: '网络环境',
    ja: 'ネットワーク環境',
    ko: '네트워크 환경',
    de: 'Netzwerkumgebung',
    fr: 'environnement réseau',
    es: 'entorno de red',
  },
  useCase: {
    en: 'use case/scenario',
    zh: '使用场景',
    ja: '使用シナリオ',
    ko: '사용 시나리오',
    de: 'Anwendungsfall',
    fr: 'cas d\'utilisation',
    es: 'caso de uso',
  },
  preferredServiceTime: {
    en: 'preferred service time',
    zh: '期望服务时间',
    ja: '希望するサービス時間',
    ko: '희망 서비스 시간',
    de: 'bevorzugte Servicezeit',
    fr: 'heure de service préférée',
    es: 'horario de servicio preferido',
  },
};

/**
 * Recommend a service tier based on collected requirements.
 * Req: 2.3 — auto-recommend the most suitable tier.
 */
export function recommendTier(
  reqs: Partial<ServiceRequirements>,
): 'standard' | 'professional' | 'enterprise' {
  const useCase = (reqs.useCase ?? '').toLowerCase();
  const device = (reqs.deviceEnvironment ?? '').toLowerCase();
  const network = (reqs.networkEnvironment ?? '').toLowerCase();

  // Enterprise indicators
  if (
    useCase.includes('enterprise') ||
    useCase.includes('公司') ||
    useCase.includes('企业') ||
    useCase.includes('production') ||
    useCase.includes('生产') ||
    network.includes('air-gap') ||
    network.includes('airgap') ||
    device.includes('server') ||
    device.includes('cluster')
  ) {
    return 'enterprise';
  }

  // Professional indicators
  if (
    useCase.includes('team') ||
    useCase.includes('团队') ||
    useCase.includes('professional') ||
    useCase.includes('collaboration') ||
    useCase.includes('staging') ||
    device.includes('workstation')
  ) {
    return 'professional';
  }

  return 'standard';
}
