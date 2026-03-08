---
inclusion: manual
---

# 全面多语言支持指南 (Payload CMS + Next.js + next-intl)

## 架构概览

本项目多语言分为三层：
1. **前台 UI 翻译** — next-intl 的 messages JSON 文件
2. **后台 Admin 面板翻译** — Payload 内置 i18n + collection labels
3. **内容数据多语言** — Payload localization（数据库 _locales 表）

## 一、前台 UI 翻译 (next-intl)

### 文件位置
- `apps/cms/messages/{locale}.json` — 每种语言一个文件
- 支持的语言: zh, en, ja, ko, de, fr, es

### 注意事项
- 所有前端页面的静态文本必须通过 `useTranslations('namespace')` 获取
- 新增页面时必须同步更新所有 7 个语言文件
- 使用 `{variable}` 语法做变量插值，如 `"copyright": "© {year} OpenClaw Club"`
- 嵌套 namespace 用 `.` 分隔: `useTranslations('products.categories')`

### 路由
- `localePrefix: 'always'` — URL 始终包含 locale 前缀: `/zh/orders`, `/en/orders`
- middleware 在 `apps/cms/src/middleware.ts` 处理 locale 检测和重定向
- 使用 `@/i18n/navigation` 的 `Link`, `useRouter`, `usePathname` 替代 `next/navigation`

## 二、后台 Admin 面板翻译 (Payload i18n)

### 配置位置
- `apps/cms/src/payload.config.ts` — `i18n.supportedLanguages` 和 `i18n.translations`
- `apps/cms/src/i18n/admin-translations.ts` — 自定义翻译（group 名、collection 名等）

### Collection/Global 多语言 labels
每个 collection 必须配置:
```typescript
labels: {
  singular: { zh: '订单', en: 'Order', ja: '注文', ... },
  plural: { zh: '订单', en: 'Orders', ja: '注文', ... },
},
admin: {
  group: { zh: '订单管理', en: 'Order Management', ja: '注文管理', ... },
}
```

Global 使用 `label` 而非 `labels`:
```typescript
label: { zh: '站点设置', en: 'Site Settings', ... },
```

### 注意事项
- Payload 内置翻译通过 `import { zh } from 'payload/i18n/zh'` 导入
- 自定义翻译放在 `i18n.translations` 中，结构为 `{ [locale]: { custom: { ... } } }`
- Admin 面板语言切换在右上角用户菜单中
- Field labels 也可以用 `{ zh: '...', en: '...' }` 格式

## 三、内容数据多语言 (Payload Localization)

### 配置
```typescript
localization: {
  locales: [
    { label: '中文', code: 'zh' },
    { label: 'English', code: 'en' },
    // ...
  ],
  defaultLocale: 'zh',
  fallback: true,
}
```

### 字段标记
在需要多语言的字段上添加 `localized: true`:
```typescript
{ name: 'name', type: 'text', required: true, localized: true }
```

### 数据库结构
- 带 `localized: true` 的字段会自动创建 `{table}_locales` 关联表
- 表结构: `id, field1, field2, ..., _locale, _parent_id`
- API 查询时通过 `?locale=en` 参数获取对应语言内容

### 哪些字段需要 localized
- ✅ 产品名称、描述、规格说明
- ✅ 字典的 label、description
- ✅ OCSAS 标准名称、检查项
- ✅ 站点名称
- ❌ 价格、数量、状态码、ID、时间戳
- ❌ 用户邮箱、密码
- ❌ 订单号、支付金额

## 四、业务字典多语言

### 用途
将系统中的枚举值（订单状态、角色、区域等）的显示文本存入数据库，支持多语言。

### 表结构
- `business_dictionary` — 主表（category, key, value, sort_order, is_active）
- `business_dictionary_locales` — 翻译表（label, description, _locale, _parent_id）

### API 使用
```
GET /api/business-dictionary?locale=en&where[category][equals]=order_status
```

### 前端使用建议
- 页面加载时从 API 获取当前 locale 的字典数据
- 缓存到 React Context 或 SWR/React Query
- 用 key 匹配替代硬编码的状态文本

## 五、接口返回内容多语言

### Payload API 自动支持
- 所有带 `localized: true` 的字段，API 会根据 `?locale=` 参数返回对应语言
- 不传 locale 时返回 defaultLocale (zh)

### 注意事项
- 前端 fetch 时必须带 `locale` 参数: `fetch(\`/api/products?locale=\${locale}\`)`
- 枚举值（如 status: 'paid'）本身不翻译，翻译在前端 messages 或业务字典中
- 错误消息通过 Payload i18n 自动翻译

## 六、新增语言的 Checklist

1. `apps/cms/messages/{locale}.json` — 添加前台翻译文件
2. `apps/cms/src/i18n/routing.ts` — `locales` 数组添加新语言
3. `apps/cms/src/payload.config.ts`:
   - `import { xx } from 'payload/i18n/xx'`
   - `supportedLanguages` 添加
   - `localization.locales` 添加
4. `apps/cms/src/i18n/admin-translations.ts` — 添加新语言的自定义翻译
5. 所有 collection 的 `labels` 和 `admin.group` 添加新语言
6. 所有 global 的 `label` 和 `admin.group` 添加新语言
7. 数据库 `_locales` enum 添加新值: `ALTER TYPE _locales ADD VALUE 'xx'`
8. 业务字典补充新语言的 label 数据
9. Header 组件 `localeLabels` 添加新语言

## 七、常见坑

1. **middleware 位置**: Next.js 只识别 `src/middleware.ts`，不能放在项目根目录
2. **middleware 不能用 alias**: 不能 `import from '@/...'`，需要内联配置
3. **Payload push 模式**: 新增 collection 后 `payload_locked_documents_rels` 需要手动加列
4. **SelectItem value 必须是 string**: Radix UI Select 的 value 不接受 number
5. **router.push + reload 不可靠**: 登录后用 `window.location.href` 确保 cookie 生效
6. **时区**: 前端时区切换需要 Context Provider，不能只存 localStorage
7. **Payload i18n vs Localization**: i18n = admin UI 语言, localization = 内容数据多语言，两者独立
