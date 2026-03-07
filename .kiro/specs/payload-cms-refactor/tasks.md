# 实施计划：Payload CMS 重构（MVP）

## 概述

将 OpenClaw Club 平台重构为 Payload CMS 3.x 统一应用。基于已有的 `apps/cms` 空白模板（Payload 3.79.0 + Next.js 15 + @payloadcms/db-postgres），实现 8 个核心 Collections + Media、3 个 Globals、Stripe 支付、shadcn/ui 前端和 next-intl 国际化。

核心业务流程：注册 → 下单 → 支付（Stripe）→ 接单 → 服务 → 评价

## Tasks

- [x] 1. Payload 基础配置与访问控制
  - [x] 1.1 更新 `apps/cms/src/payload.config.ts` 主配置
    - 配置 localization（7 语言，defaultLocale: zh，fallbackLocale: en）
    - 配置 i18n（fallbackLanguage: zh）
    - 配置 db-postgres（push: true，connectionString 从 DATABASE_URI 读取，回退到 postgresql://justin@localhost:5432/openclaw_club）
    - 配置 typescript outputFile
    - 暂时只注册 Users 和 Media collections
    - _Requirements: 1.1, 1.2, 1.9, 12.1, 12.7_

  - [x] 1.2 创建访问控制函数 `apps/cms/src/access/`
    - 创建 `isAdmin.ts`：检查 user.role === 'admin'
    - 创建 `isAdminOrSelf.ts`：admin 全部访问，普通用户只能访问 id === user.id 的记录
    - 创建 `isOwner.ts`：通用 owner 字段匹配函数（接受 userField 参数）
    - _Requirements: 2.5, 2.6_

  - [x] 1.3 编写访问控制函数的属性测试
    - **Property 1: 访问控制强制执行**
    - **Validates: Requirements 2.5, 4.5, 5.6, 6.5**
    - 使用 fast-check 生成随机角色和操作组合，验证 isAdmin/isAdminOrSelf/isOwner 返回正确值

- [x] 2. Users Collection 与 Auth + Media Collection
  - [x] 2.1 创建 `apps/cms/src/collections/Media.ts`
    - 配置 upload：mimeTypes（jpg/png/webp/svg）、imageSizes（thumbnail/card）
    - 配置 access：已登录可上传，公开可读
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 2.2 重写 `apps/cms/src/collections/Users.ts`
    - 启用 `auth: true`，配置 tokenExpiration（24h）
    - 定义字段：displayName、avatarUrl（upload to media）、languagePreference（默认 zh）、timezone、region、role（admin/certified_engineer/individual_user）
    - 配置 access：create 开放、read/update isAdminOrSelf、delete isAdmin
    - 配置 role 字段级 access：`update: isAdmin`
    - 注册 afterChange Hook：writeAuditLog('users')
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 2.3 编写 Users 字段级访问控制属性测试
    - **Property 7: 字段级访问控制**
    - **Validates: Requirements 2.6, 2.7**
    - 验证非 admin 角色的 role 字段 update access 返回 false

- [x] 3. 核心 Collections — 订单、支付、安装
  - [x] 3.1 创建 `apps/cms/src/collections/Orders.ts`
    - 定义字段：orderNumber（unique, update: false）、user、status、totalAmount、currency、region、product（relationship to hardware-products）、serviceTier
    - 配置 access：已登录可创建；admin 全部；普通用户只看自己的
    - 注册 hooks：beforeChange generateOrderNumber、afterChange createInstallOrder
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 3.2 创建 `apps/cms/src/collections/Payments.ts`
    - 定义字段：order、amount（update: false）、currency、status（pending/succeeded/failed/refunded）、stripeSessionId、stripePaymentIntentId
    - 配置 access：已登录可创建；admin 全部；普通用户只看自己订单的支付
    - _Requirements: 5.1, 5.6_

  - [x] 3.3 创建 `apps/cms/src/collections/InstallOrders.ts`
    - 定义字段：order、serviceTier、ocsasLevel、engineer、installStatus、acceptedAt、completedAt
    - 配置 access：admin 全部；certified_engineer 只看/改分配给自己的
    - 注册 afterChange Hook：writeAuditLog('install-orders')
    - _Requirements: 6.1, 6.5, 6.6, 6.7_

  - [x] 3.4 创建 `apps/cms/src/collections/DeliveryReports.ts`、`apps/cms/src/collections/ServiceReviews.ts`
    - DeliveryReports：installOrder 关联、checklist/configItems/testResults（json）、screenshots（array of upload）
    - ServiceReviews：order/user 关联、评分字段（1-5）、comment
    - 各自配置 access 和 hooks
    - _Requirements: 7.1, 7.3, 7.4, 8.1, 8.3, 8.4_

  - [x] 3.5 创建 `apps/cms/src/collections/HardwareProducts.ts`
    - 定义字段：category、name/description/specs（localized）、price、stockByRegion、isActive
    - 配置 access：公开可读；admin 可 CRUD
    - _Requirements: 3.1, 3.4, 3.5, 3.6_

  - [x] 3.6 创建 `apps/cms/src/collections/AuditLogs.ts`
    - 定义字段：user、action、resourceType、resourceId、details、ipAddress
    - 配置 access：仅 admin 可读，其余全部关闭
    - _Requirements: 11.1, 11.2_

- [x] 4. 注册所有 Collections 和 Globals 到 payload.config.ts
  - [x] 4.1 更新 `apps/cms/src/payload.config.ts`
    - import 并注册全部 8 个 Collections + Media
    - _Requirements: 1.1_

  - [x] 4.2 创建 Globals 并注册
    - 创建 `apps/cms/src/globals/SiteSettings.ts`（platformName localized、logoUrl、defaultLanguage、contactEmail）
    - 创建 `apps/cms/src/globals/PricingConfig.ts`（installationPricing group：standard/professional/enterprise）
    - 创建 `apps/cms/src/globals/OcsasStandards.ts`（levels array 含 name/description localized、checklistItems）
    - 注册到 payload.config.ts
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 12.3, 12.4, 12.8_

- [x] 5. 业务逻辑 Hooks 实现
  - [x] 5.1 创建 `apps/cms/src/hooks/generateOrderNumber.ts`
    - beforeChange Hook：operation === 'create' 时生成 OC-YYYYMMDD-XXXXX 格式
    - _Requirements: 4.3_

  - [x] 5.2 创建 `apps/cms/src/hooks/createInstallOrder.ts`
    - afterChange Hook：order.status 变为 paid 时自动创建 install-order
    - _Requirements: 6.2_

  - [x] 5.3 创建 `apps/cms/src/hooks/updateOrderOnDelivery.ts`
    - afterChange Hook：delivery-report 创建时更新 install-order.installStatus 为 pending_acceptance
    - _Requirements: 7.3_

  - [x] 5.4 创建 `apps/cms/src/hooks/completeOrderOnReview.ts`
    - afterChange Hook：service-review 创建时更新 order.status 为 completed
    - _Requirements: 8.4_

  - [x] 5.5 创建 `apps/cms/src/hooks/writeAuditLog.ts`
    - afterChange Hook 工厂函数：检测 users.role 和 install-orders.installStatus 变更
    - 使用 overrideAccess: true 绕过 audit-logs 的 access control
    - _Requirements: 11.3, 11.4_

  - [x] 5.6 编写订单编号格式属性测试
    - **Property 2: 订单编号格式唯一性**
    - **Validates: Requirements 4.3**
    - 使用 fast-check 多次调用 generateOrderNumber，验证格式匹配和唯一性

  - [x] 5.7 编写审计日志属性测试
    - **Property 5: 关键变更审计日志**
    - **Validates: Requirements 11.3, 11.4**
    - 验证角色变更和安装状态变更都会写入 audit-logs

- [x] 6. Checkpoint — 验证 Collections、Globals 和 Hooks
  - Ensure all tests pass, ask the user if questions arise.
  - 确认 Payload 能正常启动并自动同步 schema 到 PostgreSQL
  - 确认 Admin Panel 能显示所有 Collections 和 Globals
  - 确认 Hooks 正确触发

- [x] 7. Stripe 支付集成
  - [x] 7.1 创建 `apps/cms/src/lib/stripe.ts`
    - 初始化 Stripe SDK
    - 实现 createCheckoutSession 函数
    - _Requirements: 5.2_

  - [x] 7.2 创建 `apps/cms/src/app/api/stripe-webhook/route.ts`
    - 验证 Webhook 签名
    - 处理 checkout.session.completed 事件：更新 payment.status 和 order.status
    - _Requirements: 5.3, 5.4, 5.5, 5.8_

  - [x] 7.3 创建支付发起 API 端点
    - 在 orders 相关页面中实现"支付"按钮，调用 createCheckoutSession 并重定向
    - 创建 payment 记录（status: pending, stripeSessionId）
    - _Requirements: 5.2, 5.7_

  - [x] 7.4 编写 Stripe Webhook 签名验证属性测试
    - **Property 8: Stripe Webhook 签名验证**
    - **Validates: Requirements 5.5**
    - 验证无效签名返回 400 且不更新数据

- [x] 8. 前端基础设施搭建
  - [x] 8.1 安装前端依赖
    - 安装 shadcn/ui 相关：@radix-ui/* 组件、tailwindcss-animate、class-variance-authority、clsx、tailwind-merge
    - 安装 next-intl
    - 安装 react-hook-form + zod + @hookform/resolvers
    - 安装 lucide-react
    - 创建 `components.json`（shadcn/ui 配置）
    - 创建 `apps/cms/src/lib/utils.ts`（cn 函数）
    - _Requirements: 1.4, 1.6_

  - [x] 8.2 配置 Tailwind CSS 主题
    - 更新 `tailwind.config.ts`：添加 CSS 变量主题、暗色模式支持、tailwindcss-animate 插件
    - 添加 CSS 变量到全局样式（亮色/暗色主题变量）
    - _Requirements: 1.5_

  - [x] 8.3 配置 next-intl
    - 创建 `apps/cms/i18n.ts`
    - 创建 `apps/cms/middleware.ts`（locale 路由中间件，排除 /api、/admin、/_next、/media）
    - 创建 `apps/cms/messages/zh.json` 和 `apps/cms/messages/en.json`（基础翻译）
    - _Requirements: 1.6, 12.5, 12.6_

  - [x] 8.4 创建基础 shadcn/ui 组件
    - 创建 `apps/cms/src/components/ui/button.tsx`
    - 创建 `apps/cms/src/components/ui/card.tsx`
    - 创建 `apps/cms/src/components/ui/input.tsx`
    - 创建 `apps/cms/src/components/ui/badge.tsx`
    - 创建 `apps/cms/src/components/ui/select.tsx`
    - _Requirements: 1.4_

  - [x] 8.5 创建前端布局组件
    - 创建 `apps/cms/src/app/(frontend)/[locale]/layout.tsx`（Header + Footer + ThemeToggle）
    - 创建 `apps/cms/src/components/Header.tsx`（导航、语言切换、登录/注册按钮）
    - 创建 `apps/cms/src/components/Footer.tsx`
    - 创建 `apps/cms/src/components/ThemeToggle.tsx`（亮色/暗色切换）
    - _Requirements: 1.3, 1.5_

- [x] 9. 前端页面实现 — 认证与产品
  - [x] 9.1 创建认证页面
    - 创建 `apps/cms/src/app/(frontend)/[locale]/auth/register/page.tsx`（email + password 注册表单）
    - 创建 `apps/cms/src/app/(frontend)/[locale]/auth/login/page.tsx`（email + password 登录表单）
    - 使用 react-hook-form + zod 表单验证
    - 调用 Payload REST API（/api/users、/api/users/login）
    - _Requirements: 2.3, 2.4_

  - [x] 9.2 创建产品页面
    - 创建 `apps/cms/src/app/(frontend)/[locale]/products/page.tsx`（产品列表，使用 ProductCard 组件）
    - 创建 `apps/cms/src/app/(frontend)/[locale]/products/[id]/page.tsx`（产品详情）
    - 创建 `apps/cms/src/components/ProductCard.tsx`
    - 调用 Payload REST API（/api/hardware-products?where[isActive][equals]=true&locale=X）
    - _Requirements: 3.2, 3.3, 3.5_

  - [x] 9.3 创建首页
    - 创建 `apps/cms/src/app/(frontend)/[locale]/page.tsx`（展示精选产品、平台介绍）
    - 创建根路由重定向 `apps/cms/src/app/(frontend)/page.tsx`（重定向到 /[defaultLocale]）
    - _Requirements: 1.3_

- [x] 10. 前端页面实现 — 订单与支付
  - [x] 10.1 创建订单页面
    - 创建 `apps/cms/src/app/(frontend)/[locale]/orders/page.tsx`（我的订单列表）
    - 创建 `apps/cms/src/app/(frontend)/[locale]/orders/new/page.tsx`（创建订单：选择产品+服务等级）
    - 创建 `apps/cms/src/app/(frontend)/[locale]/orders/[id]/page.tsx`（订单详情+支付按钮）
    - 创建 `apps/cms/src/components/OrderCard.tsx`
    - _Requirements: 4.2, 4.7_

  - [x] 10.2 创建支付结果页面
    - 创建 `apps/cms/src/app/(frontend)/[locale]/orders/[id]/success/page.tsx`
    - 创建 `apps/cms/src/app/(frontend)/[locale]/orders/[id]/cancel/page.tsx`
    - _Requirements: 5.7_

  - [x] 10.3 创建评价页面
    - 创建 `apps/cms/src/app/(frontend)/[locale]/orders/[id]/review/page.tsx`（评分+评论表单）
    - _Requirements: 8.2_

- [x] 11. 前端页面实现 — 工程师工作台
  - [x] 11.1 创建工程师页面
    - 创建 `apps/cms/src/app/(frontend)/[locale]/engineer/orders/page.tsx`（待接单+进行中列表）
    - 创建 `apps/cms/src/app/(frontend)/[locale]/engineer/orders/[id]/report/page.tsx`（交付报告表单）
    - _Requirements: 6.3, 7.2_

- [x] 12. Checkpoint — 验证前端页面
  - Ensure all tests pass, ask the user if questions arise.
  - 确认注册、登录、产品浏览、下单、支付、工程师接单、交付报告、评价全流程可用
  - 确认多语言切换正常
  - 确认暗色模式正常

- [x] 13. 数据迁移与翻译文件
  - [x] 13.1 创建数据迁移脚本 `apps/cms/src/migrations/migrate-from-typeorm.ts`
    - 将 users.password_hash 映射到 Payload hash 字段
    - 验证核心表数据完整性
    - 每张表独立 try/catch，失败回滚该表并继续
    - 输出迁移日志
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [x] 13.2 补充其余 5 种语言翻译文件
    - 创建 `messages/ja.json`、`messages/ko.json`、`messages/de.json`、`messages/fr.json`、`messages/es.json`
    - _Requirements: 12.5, 12.6_

  - [x] 13.3 编写迁移表级回滚属性测试
    - **Property: 迁移表级回滚**
    - **Validates: Requirements 13.5**
    - 验证单表失败时该表回滚，其他表继续

- [x] 14. 旧代码清理
  - [x] 14.1 移除 `apps/web` 目录
    - _Requirements: 14.1_

  - [x] 14.2 更新 `pnpm-workspace.yaml` 和根 `package.json`
    - 移除对已删除目录的引用
    - 添加 `dev:cms` 和 `build:cms` scripts
    - _Requirements: 14.4, 14.5_

- [x] 15. Final checkpoint — 全部验证
  - Ensure all tests pass, ask the user if questions arise.
  - 确认 8 个 Collections + Media + 3 个 Globals 正常工作
  - 确认 Stripe 支付流程完整（Checkout → Webhook → 状态更新）
  - 确认前端全流程：注册→下单→支付→接单→服务→评价
  - 确认 7 种语言切换正常
  - 确认 Admin Panel 中文默认、localized 字段语言标签页正常

## Notes

- Tasks marked with `*` are optional property tests, can be skipped for faster MVP
- 核心 Collections 从 18 个精简到 8 个 + Media，聚焦 MVP 业务流程
- 被移除的 Collections 对应的数据库表保留不删除，后续版本可重新添加
- 属性测试使用 fast-check + vitest
- 旧代码物理删除（services/api-gateway、apps/admin）建议在全部验证通过后手动执行
