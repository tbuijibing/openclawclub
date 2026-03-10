# 技术设计文档：前台服务平台改造

## 概述

本设计文档描述 OpenClaw Club 前台平台的全面改造方案。改造涵盖五大核心变更：

1. **术语统一**：将前台所有"产品（Product）"概念替换为"服务（Service）"，包括 i18n 翻译键名/键值、组件代码引用、页面路由（保持 URL 路径 `/products` 不变以避免 SEO 影响，仅更改显示文案）
2. **访问控制调整**：开放未登录用户对服务列表和详情页的访问，同时隐藏订单相关功能
3. **品牌定位更新**：更新首页 Hero 区域的品牌文案，突出 OpenClaw 安装服务、按国家差异化定价、预装硬件销售三大核心业务
4. **前台设计优化**：提升视觉设计质量，增加服务分类筛选、改进响应式布局
5. **语言扩展**：从 7 种语言扩展到 10 种，新增乌尔都语（ur）、越南语（vi）、马来语（ms），其中乌尔都语需要 RTL 支持

技术栈：pnpm monorepo + Payload CMS 3.79 + Next.js 15 + next-intl + Tailwind CSS + Radix UI + PostgreSQL

## 架构

### 现有架构

```mermaid
graph TB
    subgraph "Next.js 15 App Router"
        MW[middleware.ts<br/>next-intl 路由] --> FE["(frontend)/[locale]/"]
        FE --> HOME[page.tsx<br/>首页]
        FE --> PROD[products/page.tsx<br/>产品列表]
        FE --> PRODID[products/[id]/page.tsx<br/>产品详情]
        FE --> ORD[orders/page.tsx<br/>订单列表]
        FE --> ORDNEW[orders/new/page.tsx<br/>创建订单]
        FE --> AUTH[auth/login & register]
    end

    subgraph "组件层"
        HDR[Header.tsx] --> NAV[导航链接]
        HDR --> LANG[语言切换器]
        HDR --> TZ[时区切换器]
        FTR[Footer.tsx]
        PC[ProductCard.tsx]
        OC[OrderCard.tsx]
    end

    subgraph "国际化层"
        RT[i18n/routing.ts<br/>7 种语言] --> MSG[messages/*.json<br/>7 个翻译文件]
        RT --> PCFG[payload.config.ts<br/>i18n + localization]
        AT[admin-translations.ts]
    end

    subgraph "数据层"
        API[Payload REST API] --> PG[(PostgreSQL)]
    end

    PROD --> API
    HOME --> API
```

### 改造后架构

改造不改变整体架构，主要变更点：

1. **i18n 层**：翻译文件从 7 个扩展到 10 个；翻译键名中 `product/products` 重命名为 `service/services`
2. **组件层**：Header 增加认证状态感知（条件渲染订单链接）；ProductCard 重命名为 ServiceCard
3. **页面层**：服务页面移除认证依赖；订单页面增加认证守卫；首页 Hero 区域重新设计
4. **中间件层**：路由配置扩展支持 10 种语言

```mermaid
graph TB
    subgraph "改造后的国际化层"
        RT2[i18n/routing.ts<br/>10 种语言<br/>zh,en,ja,ko,de,fr,es,ur,vi,ms]
        MSG2[messages/*.json<br/>10 个翻译文件]
        RT2 --> MSG2
    end

    subgraph "改造后的组件层"
        HDR2[Header.tsx<br/>+ 认证状态感知<br/>+ 条件渲染订单链接<br/>+ 10 种语言标签]
        SC[ServiceCard.tsx<br/>原 ProductCard 重命名]
    end

    subgraph "改造后的页面层"
        HOME2[page.tsx<br/>新 Hero 设计<br/>品牌文案更新<br/>CTA → 服务列表]
        SERV[products/page.tsx<br/>显示文案改为"服务"<br/>+ 分类筛选功能<br/>无需认证]
        SERVID[products/[id]/page.tsx<br/>显示文案改为"服务"<br/>无需认证<br/>未登录隐藏订单按钮]
        ORD2[orders/page.tsx<br/>+ 认证守卫<br/>未登录重定向登录页]
    end
```

## 组件与接口

### 1. Header 组件改造

**文件**：`apps/cms/src/components/Header.tsx`

**变更内容**：

- `localeLabels` 新增三种语言：`ur: 'اردو'`、`vi: 'Tiếng Việt'`、`ms: 'Bahasa Melayu'`
- `navLinks` 数组改为动态生成：订单链接仅在 `user` 不为 null 时包含
- 导航文案从 `t('products')` 改为 `t('services')`（翻译键名变更）
- 移动端菜单同步应用上述变更

```typescript
// 改造后的 navLinks 逻辑
const navLinks = [
  { href: '/' as const, label: t('home') },
  { href: '/products' as const, label: t('services') },
  // 仅已登录用户可见
  ...(user ? [{ href: '/orders' as const, label: t('orders') }] : []),
]
```

**接口不变**：Header 仍为无 props 的客户端组件，通过 `fetch('/api/users/me')` 获取认证状态。

### 2. ServiceCard 组件（原 ProductCard）

**文件**：`apps/cms/src/components/ServiceCard.tsx`（重命名自 `ProductCard.tsx`）

**变更内容**：

- 文件和组件名从 `ProductCard` 改为 `ServiceCard`
- Props 接口名从 `ProductCardProps` 改为 `ServiceCardProps`
- 新增可选 `isAuthenticated` prop，控制是否显示"加入订单"按钮

```typescript
interface ServiceCardProps {
  id: string | number
  name: string
  description: string
  price: number
  category: string
  locale: string
  isAuthenticated?: boolean
  translations: {
    viewDetails: string
    price: string
    categories: Record<string, string>
  }
}
```

### 3. 服务列表页改造

**文件**：`apps/cms/src/app/(frontend)/[locale]/products/page.tsx`

**变更内容**：

- 翻译命名空间从 `products` 改为 `services`
- 新增分类筛选功能：提取为客户端子组件 `ServiceFilter`
- 页面标题和副标题使用新的"服务"文案
- API 调用保持 `/api/hardware-products` 不变（后端数据模型不改）

```typescript
// 分类筛选组件接口
interface ServiceFilterProps {
  categories: string[]
  categoryLabels: Record<string, string>
  selectedCategory: string | null
  onCategoryChange: (category: string | null) => void
}
```

### 4. 服务详情页改造

**文件**：`apps/cms/src/app/(frontend)/[locale]/products/[id]/page.tsx`

**变更内容**：

- 翻译命名空间从 `products` 改为 `services`
- "加入订单"按钮仅对已登录用户显示
- 未登录用户看到"登录后下单"提示，点击跳转登录页
- 通过服务端 cookie 检查认证状态（`cookies().get('payload-token')`）

### 5. 订单页面认证守卫

**文件**：`apps/cms/src/app/(frontend)/[locale]/orders/page.tsx` 及子页面

**变更内容**：

- 在页面加载时检查认证状态
- 未登录用户重定向到 `/{locale}/auth/login?redirect=/orders`
- 客户端组件通过 `fetch('/api/users/me')` 检查，失败时使用 `router.replace` 跳转

### 6. 首页 Hero 区域重设计

**文件**：`apps/cms/src/app/(frontend)/[locale]/page.tsx`

**变更内容**：

- Hero 区域增加渐变背景样式（Tailwind CSS `bg-gradient-to-br`）
- 品牌文案更新：副标题突出"OpenClaw 安装服务平台"
- 描述文字包含三大核心业务信息
- "立即开始"按钮跳转从 `/auth/register` 改为 `/products`（服务列表）
- "浏览产品"按钮文案改为"浏览服务"
- "精选产品"区域标题改为"精选服务"
- "为什么选择我们"三个特性描述更新为与新品牌定位一致

### 7. RTL 支持（乌尔都语）

**变更内容**：

- 在 `[locale]/layout.tsx` 中根据 locale 动态设置 `<html dir="rtl">` 或 `dir="ltr"`
- RTL 语言列表：`['ur']`（当前仅乌尔都语）
- Tailwind CSS 使用 `rtl:` 变体处理需要翻转的布局元素
- Header 中语言切换器下拉菜单位置需要根据 dir 调整

## 数据模型

### i18n 翻译键名变更映射

本次改造涉及翻译键名的系统性重命名。以下是完整的键名映射表：

| 旧键名 | 新键名 | 说明 |
|--------|--------|------|
| `nav.products` | `nav.services` | 导航栏链接文案 |
| `common.products` | `common.services` | 通用文案 |
| `products.*` | `services.*` | 整个产品命名空间重命名 |
| `home.browseProducts` | `home.browseServices` | 首页 CTA 按钮 |
| `home.featuredProducts` | `home.featuredServices` | 首页精选区域标题 |
| `home.featuredDescription` | `home.featuredDescription` | 保持不变，更新值 |
| `home.noProducts` | `home.noServices` | 空状态提示 |
| `orders.selectProduct` | `orders.selectService` | 订单表单 |
| `orders.product` | `orders.service` | 订单详情 |
| `orders.productRequired` | `orders.serviceRequired` | 表单验证 |

### 新增翻译文件结构

新增的 `ur.json`、`vi.json`、`ms.json` 文件结构与现有语言文件完全一致，包含以下顶级命名空间：

```
common, nav, auth, services, orders, engineer, review, home, theme, footer, header
```

### 语言配置扩展

```typescript
// i18n/routing.ts
export const locales = ['zh', 'en', 'ja', 'ko', 'de', 'fr', 'es', 'ur', 'vi', 'ms'] as const

// RTL 语言标识
export const rtlLocales = ['ur'] as const
```

### 数据库变更

需要在 PostgreSQL 中扩展 `_locales` 枚举类型：

```sql
ALTER TYPE _locales ADD VALUE 'ur';
ALTER TYPE _locales ADD VALUE 'vi';
ALTER TYPE _locales ADD VALUE 'ms';
```


## 正确性属性（Correctness Properties）

*属性（Property）是指在系统所有有效执行中都应保持为真的特征或行为——本质上是对系统应做什么的形式化陈述。属性是人类可读规范与机器可验证正确性保证之间的桥梁。*

### 属性 1：翻译键名不含 "product"

*对于任意* locale JSON 文件（10 种语言中的任何一种），在 `services`、`nav`、`home`、`orders`、`common` 命名空间中，不应存在包含 `product` 或 `products` 的键名。所有原 `product/products` 键名应已被替换为 `service/services`。

**验证需求：1.7**

### 属性 2：翻译文件键结构一致性

*对于任意* 两个 locale JSON 文件，它们的完整键路径集合（递归展开所有嵌套对象后的点分隔路径）应完全相同。即 `zh.json` 的键集合 === `en.json` 的键集合 === ... === `ms.json` 的键集合。

**验证需求：6.1, 4.3**

### 属性 3：订单链接可见性与认证状态一致

*对于任意* 用户认证状态（已登录或未登录），Header 组件中"订单"导航链接的可见性应等于用户的认证状态。即：已登录时可见，未登录时不可见。此属性在桌面端和移动端菜单中均应成立。

**验证需求：3.1, 3.2, 3.4**

### 属性 4：未登录用户不可见订单操作按钮

*对于任意* 服务详情页面，当用户未登录时，页面中不应渲染"加入订单"或任何需要认证的操作按钮。

**验证需求：2.4**

### 属性 5：分类筛选正确性

*对于任意* 服务列表和任意选中的分类筛选条件，筛选后显示的所有服务卡片的 `category` 字段应与选中的分类完全匹配。当筛选条件为"全部"时，应显示所有服务。

**验证需求：5.2**

### 属性 6：服务卡片包含必要信息

*对于任意* 有效的服务数据（包含 name、description、price、category），ServiceCard 组件渲染的输出应包含服务名称、描述文本、价格数值和分类标签。

**验证需求：5.6**

### 属性 7：RTL 方向正确性

*对于任意* locale，当 locale 为 `'ur'` 时，HTML 文档方向应为 `rtl`；当 locale 为其他 9 种语言中的任何一种时，文档方向应为 `ltr`。

**验证需求：6.7**

### 属性 8：源代码无旧翻译键引用

*对于任意* `apps/cms/src/` 目录下的 `.tsx` 或 `.ts` 文件，不应包含对已废弃翻译键（如 `'products.'`、`'nav.products'`、`'home.browseProducts'`、`'home.featuredProducts'`、`'home.noProducts'`、`'orders.selectProduct'`、`'orders.product'`、`'orders.productRequired'`）的引用。

**验证需求：1.8**

## 错误处理

### 认证状态检查失败

- **场景**：`fetch('/api/users/me')` 请求失败（网络错误、服务端错误）
- **处理**：将用户视为未登录状态，隐藏订单功能，不阻塞页面渲染
- **现有行为**：Header 中已有 `.catch(() => {})` 处理，保持一致

### 翻译键缺失

- **场景**：某语言文件缺少翻译键
- **处理**：next-intl 的 fallback 机制会回退到 `defaultLocale`（zh），不会导致页面崩溃
- **预防**：通过属性 2（键结构一致性测试）在 CI 中捕获

### 服务 API 调用失败

- **场景**：`/api/hardware-products` 请求失败
- **处理**：返回空数组，页面显示"暂无服务"提示（现有逻辑已处理）

### RTL 布局异常

- **场景**：乌尔都语下某些组件布局错位
- **处理**：使用 Tailwind CSS 的 `rtl:` 变体进行针对性修复；关键组件（Header、Footer、Card）需要 RTL 适配测试

### 订单页面未授权访问

- **场景**：未登录用户直接访问 `/orders` URL
- **处理**：客户端检测到未登录后，使用 `router.replace('/{locale}/auth/login?redirect=/orders')` 重定向
- **边界情况**：认证检查期间显示 loading 状态，避免闪烁

## 测试策略

### 双重测试方法

本项目采用单元测试 + 属性测试的双重策略：

- **单元测试**：验证具体示例、边界情况和错误条件
- **属性测试**：验证跨所有输入的通用属性

两者互补，缺一不可。

### 属性测试配置

- **测试库**：`fast-check`（TypeScript 生态中成熟的属性测试库）
- **测试框架**：`vitest`（与 Next.js 15 生态兼容）
- **每个属性测试最少运行 100 次迭代**
- **每个属性测试必须通过注释引用设计文档中的属性编号**
- **标签格式**：`Feature: frontend-service-platform-redesign, Property {number}: {property_text}`

### 属性测试计划

| 属性 | 测试方法 | 生成器 |
|------|---------|--------|
| 属性 1：翻译键名不含 product | 加载所有 10 个 JSON 文件，递归遍历键名，断言无 product/products | 无需生成器，遍历所有文件 |
| 属性 2：翻译文件键结构一致 | 加载所有 10 个 JSON 文件，提取键路径集合，断言集合相等 | 无需生成器，遍历所有文件 |
| 属性 3：订单链接可见性 | 生成随机认证状态（true/false），渲染 Header，断言订单链接可见性 === 认证状态 | `fc.boolean()` 生成认证状态 |
| 属性 4：未登录不可见订单按钮 | 生成随机服务数据，以未登录状态渲染详情页，断言无订单按钮 | `fc.record()` 生成服务数据 |
| 属性 5：分类筛选正确性 | 生成随机服务列表和随机分类，执行筛选，断言结果全部匹配 | `fc.array()` + `fc.constantFrom()` |
| 属性 6：服务卡片信息完整 | 生成随机服务数据，渲染 ServiceCard，断言输出包含所有必要字段 | `fc.record()` 生成服务数据 |
| 属性 7：RTL 方向正确性 | 生成随机 locale，断言 dir 属性与预期一致 | `fc.constantFrom(...locales)` |
| 属性 8：源代码无旧键引用 | 扫描所有 .tsx/.ts 文件，断言无旧翻译键字符串 | 无需生成器，遍历所有文件 |

### 单元测试计划

单元测试聚焦于具体示例和边界情况：

- Header 导航文案显示"服务"而非"产品"（需求 1.2）
- 首页 Hero CTA 按钮链接到 `/products` 而非 `/auth/register`（需求 4.5）
- 未登录用户访问订单页面被重定向到登录页（需求 3.3）
- 未登录用户可正常访问服务列表页（需求 2.1）
- 服务 API 调用不携带认证 Cookie（需求 2.3）
- 乌尔都语下 HTML dir 属性为 rtl（需求 6.7 的具体示例）
- 空服务列表时显示"暂无服务"提示
- 认证检查失败时降级为未登录状态

### 每个正确性属性由单个属性测试实现

每个设计文档中的正确性属性必须由恰好一个属性测试实现，测试中需包含注释标签：

```typescript
// Feature: frontend-service-platform-redesign, Property 1: 翻译键名不含 product
test.prop('所有 locale 文件中无 product 键名', [...], (args) => {
  // ...
})
```
