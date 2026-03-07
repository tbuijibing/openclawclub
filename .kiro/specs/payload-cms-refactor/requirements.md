# 需求文档：Payload CMS 重构（MVP）

## 简介

本需求文档定义了将 OpenClaw Club 平台重构为 Payload CMS 3.x 统一应用的 MVP 需求。核心变更方向：

- **统一架构**：用户前端合并到 Payload CMS 的 Next.js 应用中（`(frontend)` 路由组），不再保留独立的 Vue 前端
- **移除 apps/web**：Vue 3 + Vant 4 用户端前端（apps/web）将被完全移除
- **MVP 聚焦**：只保留核心业务流程（注册→下单→支付→接单→服务→评价），移除非核心 Collections
- **Stripe 支付**：使用 Stripe Checkout 处理订单支付，通过 Webhook 确认支付状态
- **Payload Auth**：使用 Payload 内置认证（email/password），不使用 Clerk
- **UI 复用**：复用 SaaS-Boilerplate-1.7.7 的 shadcn/ui 组件、Tailwind CSS 主题、next-intl 国际化方案
- **全多语言**：Payload localization（内容字段）+ next-intl（前端 UI 字符串）+ Admin Panel i18n，7 种语言
- **保留**：PostgreSQL 数据库（localhost:5432, user=justin, db=openclaw_club）

## 术语表

- **Payload_CMS**：Payload CMS 3.x，基于 Next.js 的开源 headless CMS，提供自动生成的 Admin Panel、REST API、内置认证和访问控制
- **Collection**：Payload CMS 中的数据集合定义，等价于数据库表 + API 端点 + Admin UI
- **Global**：Payload CMS 中的全局单例配置，用于站点设置、系统配置等只有一条记录的数据
- **Access_Control**：Payload 内置的访问控制函数，在 Collection 级别定义 create/read/update/delete 权限
- **Hook**：Payload 的生命周期钩子（beforeChange, afterChange 等），用于实现业务逻辑
- **Admin_Panel**：Payload 自动生成的管理后台 UI
- **Frontend**：Next.js App Router 中 `(frontend)` 路由组下的用户前端页面
- **Stripe_Checkout**：Stripe 托管的支付页面，用户在此完成支付
- **Stripe_Webhook**：Stripe 发送的支付事件通知，用于确认支付状态
- **next-intl**：Next.js 国际化库，用于前端 UI 字符串的多语言支持，采用 URL 路由 `/[locale]/...`
- **shadcn_ui**：基于 Radix UI + Tailwind CSS 的 UI 组件库
- **Platform**：OpenClaw Club 全球化服务平台
- **User**：平台注册用户
- **Engineer**：认证工程师（certified_engineer 角色），负责执行安装服务

## 需求

### 需求 1：Payload CMS 统一应用架构

**用户故事：** 作为开发者，我希望将用户前端和管理后台统一在一个 Payload CMS Next.js 应用中，以便简化部署和开发流程。

#### 验收标准

1. THE Payload_CMS SHALL 作为独立应用运行在 `apps/cms` 目录下，使用 Next.js 15 App Router，端口为 3000
2. THE Payload_CMS SHALL 通过 @payloadcms/db-postgres 连接现有 PostgreSQL 数据库（localhost:5432, user=justin, database=openclaw_club）
3. THE Frontend SHALL 在 Next.js App Router 的 `(frontend)` 路由组下实现，路径格式为 `/[locale]/...`（如 `/zh/products`、`/en/orders`）
4. THE Frontend SHALL 使用 shadcn_ui 组件库（Radix UI + Tailwind CSS）构建 UI，复用 SaaS-Boilerplate-1.7.7 的组件和主题系统
5. THE Frontend SHALL 使用 CSS 变量实现主题系统，支持亮色和暗色模式切换
6. THE Frontend SHALL 使用 next-intl 实现 UI 字符串国际化，支持 7 种语言（zh、en、ja、ko、de、fr、es）
7. THE Platform SHALL 移除 `apps/web` 目录（Vue 3 + Vant 4 用户端前端）
8. THE Payload_CMS SHALL 集成到现有 pnpm workspace
9. IF Payload_CMS 无法连接 PostgreSQL 数据库，THEN Payload_CMS SHALL 在启动日志中输出明确的连接错误信息并终止启动

### 需求 2：用户认证（Payload Auth）

**用户故事：** 作为用户，我希望通过 email 和密码注册和登录平台，以便使用安装服务。

#### 验收标准

1. THE Payload_CMS SHALL 定义 `users` Collection 并启用 Payload 内置 Auth（`auth: true`），提供 email/password 注册、登录和密码重置功能
2. THE `users` Collection SHALL 包含以下字段：email（auth 自动提供）、displayName（text）、avatarUrl（upload）、languagePreference（select: zh/en/ja/ko/de/fr/es，默认 zh）、timezone（text，默认 UTC）、region（select: apac/na/eu）、role（select: admin/certified_engineer/individual_user，默认 individual_user）
3. WHEN User 通过 Frontend 注册页面提交 email 和 password 时，Payload_CMS SHALL 创建用户账户
4. WHEN User 通过 Frontend 登录页面提交 email 和 password 时，Payload_CMS SHALL 验证凭据并建立会话
5. THE `users` Collection SHALL 定义 Access_Control：admin 可读写所有用户，普通用户只能读写自己的数据
6. THE `users` Collection 的 `role` 字段 SHALL 配置字段级 access，确保只有 admin 可以修改用户角色
7. WHEN 非 admin 用户尝试通过 API 修改 role 字段时，Payload_CMS SHALL 静默忽略该字段的更新

### 需求 3：硬件产品目录

**用户故事：** 作为用户，我希望浏览硬件产品列表，以便选择需要安装的产品。

#### 验收标准

1. THE Payload_CMS SHALL 定义 `hardware-products` Collection，包含字段：category（select）、name（text, localized）、description（textarea, localized）、specs（json, localized）、price（number）、stockByRegion（json）、isActive（checkbox）
2. THE Frontend SHALL 提供产品列表页面（`/[locale]/products`），展示所有上架的硬件产品
3. THE Frontend SHALL 提供产品详情页面（`/[locale]/products/[id]`），展示产品完整信息
4. THE `hardware-products` Collection 的 Access_Control SHALL 确保：所有用户（含未登录访客）可读取产品列表；仅 admin 可创建、修改和删除产品
5. WHEN Frontend 请求产品数据时附带 locale 参数，Payload_CMS SHALL 返回该语言版本的 name、description、specs 字段内容
6. WHEN 请求的 locale 对应字段无翻译内容时，Payload_CMS SHALL 自动回退到 fallbackLocale（en）的内容

### 需求 4：安装订单创建

**用户故事：** 作为用户，我希望选择硬件产品后创建安装订单，以便获得专业安装服务。

#### 验收标准

1. THE Payload_CMS SHALL 定义 `orders` Collection，包含字段：orderNumber（text, unique）、user（relationship）、status（select）、totalAmount（number）、currency（text, 默认 USD）、region（select）
2. THE Frontend SHALL 提供下单页面（`/[locale]/orders/new`），允许已登录用户选择产品和服务等级后创建订单
3. THE `orders` Collection SHALL 使用 `beforeChange` Hook 在创建时自动生成唯一订单编号（格式：OC-YYYYMMDD-XXXXX）
4. THE `orders` Collection 的 `orderNumber` 字段 SHALL 配置 `access: { update: () => false }`，确保订单编号创建后不可修改
5. THE `orders` Collection 的 Access_Control SHALL 确保：已登录用户可创建订单；admin 可管理所有订单；普通用户只能查看自己的订单
6. THE `orders` Collection 的 status 字段 SHALL 支持以下状态：pending_payment、paid、dispatched、accepted、in_progress、completed、cancelled
7. THE Frontend SHALL 提供订单列表页面（`/[locale]/orders`），展示当前用户的所有订单

### 需求 5：Stripe 支付集成

**用户故事：** 作为用户，我希望通过 Stripe 安全地支付订单，以便完成购买流程。

#### 验收标准

1. THE Payload_CMS SHALL 定义 `payments` Collection，包含字段：order（relationship）、amount（number）、currency（text）、status（select: pending/succeeded/failed/refunded）、stripeSessionId（text）、stripePaymentIntentId（text）
2. WHEN User 在 Frontend 点击"支付"按钮时，Payload_CMS SHALL 调用 Stripe API 创建 Checkout Session，并将用户重定向到 Stripe_Checkout 页面
3. WHEN Stripe_Checkout 支付成功后，Stripe SHALL 通过 Stripe_Webhook 发送 `checkout.session.completed` 事件到 Payload_CMS
4. WHEN Payload_CMS 收到 `checkout.session.completed` Webhook 事件时，SHALL 更新 payments 记录状态为 succeeded，并更新关联 orders 的状态为 paid
5. THE Payload_CMS SHALL 验证 Stripe_Webhook 签名，确保事件来源合法
6. THE `payments` Collection 的 `amount` 字段 SHALL 配置 `access: { update: () => false }`，防止支付金额被修改
7. THE Frontend SHALL 提供支付成功页面（`/[locale]/orders/[id]/success`）和支付取消页面（`/[locale]/orders/[id]/cancel`）
8. IF Stripe_Webhook 处理失败，THEN Payload_CMS SHALL 记录错误日志并返回 HTTP 500，Stripe 将自动重试

### 需求 6：工程师接单与服务

**用户故事：** 作为认证工程师，我希望查看和接受安装订单，以便为用户提供安装服务。

#### 验收标准

1. THE Payload_CMS SHALL 定义 `install-orders` Collection，包含字段：order（relationship）、serviceTier（select: standard/professional/enterprise）、ocsasLevel（number, 1-3）、engineer（relationship）、installStatus（select）、各时间戳字段
2. WHEN orders 状态变为 paid 时，Payload_CMS SHALL 通过 Hook 自动创建关联的 install-orders 记录，installStatus 为 pending_dispatch
3. THE Frontend SHALL 提供工程师工作台页面（`/[locale]/engineer/orders`），展示待接单和进行中的安装订单
4. WHEN Engineer 在 Frontend 点击"接单"时，Payload_CMS SHALL 更新 install-orders 的 engineer 字段和 installStatus 为 accepted
5. THE `install-orders` Collection 的 Access_Control SHALL 确保：admin 可管理所有安装订单；certified_engineer 只能查看和操作分配给自己的安装订单
6. THE `install-orders` Collection 的 installStatus 字段 SHALL 支持以下状态：pending_dispatch、accepted、in_progress、pending_acceptance、completed
7. THE `install-orders` Collection SHALL 使用 `afterChange` Hook 在状态变更时写入 audit-logs 记录

### 需求 7：交付报告与服务完成

**用户故事：** 作为认证工程师，我希望在完成安装后提交交付报告，以便记录服务成果。

#### 验收标准

1. THE Payload_CMS SHALL 定义 `delivery-reports` Collection，包含字段：installOrder（relationship）、checklist（json）、configItems（json）、testResults（json）、screenshots（array of upload）
2. THE Frontend SHALL 提供交付报告提交页面（`/[locale]/engineer/orders/[id]/report`），允许工程师填写检查清单、配置项、测试结果并上传截图
3. WHEN Engineer 提交交付报告后，Payload_CMS SHALL 通过 Hook 将关联 install-orders 的 installStatus 更新为 pending_acceptance
4. THE `delivery-reports` Collection 的 Access_Control SHALL 确保：admin 和 certified_engineer 可创建；admin 可管理所有报告；工程师只能查看自己提交的报告

### 需求 8：用户评价

**用户故事：** 作为用户，我希望在服务完成后对安装服务进行评价，以便帮助其他用户做出选择。

#### 验收标准

1. THE Payload_CMS SHALL 定义 `service-reviews` Collection，包含字段：order（relationship）、user（relationship）、overallRating（number, 1-5）、attitudeRating（number, 1-5）、skillRating（number, 1-5）、comment（textarea）
2. THE Frontend SHALL 提供评价页面（`/[locale]/orders/[id]/review`），允许用户对已完成的订单进行评分和评论
3. THE `service-reviews` Collection 的 Access_Control SHALL 确保：评价公开可读；已登录用户可创建评价；用户只能修改自己的评价
4. WHEN User 提交评价后，Payload_CMS SHALL 通过 Hook 将关联 orders 的状态更新为 completed

### 需求 9：Media 文件上传

**用户故事：** 作为用户和工程师，我希望上传图片文件（头像、交付报告截图），以便在平台中使用。

#### 验收标准

1. THE Payload_CMS SHALL 定义 `media` Collection，支持图片文件上传（jpg、png、webp、svg）
2. THE `media` Collection SHALL 配置合理的文件大小限制和图片尺寸
3. THE `media` Collection 的 Access_Control SHALL 确保：已登录用户可上传文件；公开可读

### 需求 10：Globals 配置

**用户故事：** 作为平台管理员，我希望通过 Admin Panel 管理平台级别的系统配置，以便无需改代码即可调整设置。

#### 验收标准

1. THE Payload_CMS SHALL 定义 `site-settings` Global，包含：platformName（localized）、logoUrl、defaultLanguage、contactEmail
2. THE Payload_CMS SHALL 定义 `pricing-config` Global，包含：三个安装服务等级的价格（标准 $99、专业 $299、企业 $999 起）
3. THE Payload_CMS SHALL 定义 `ocsas-standards` Global，包含：三级 OCSAS 安全标准的配置项清单和检查规则，name 和 description 字段使用 `localized: true`
4. WHEN admin 在 Admin_Panel 中修改 Global 配置时，Payload_CMS SHALL 立即生效，无需重启服务
5. THE Payload_CMS SHALL 通过 `/api/globals/{global-slug}` 端点提供 Globals 数据的读取接口
6. THE `pricing-config` Global 的 Access_Control SHALL 确保：所有用户可读取价格信息；仅 admin 可修改价格配置

### 需求 11：审计日志

**用户故事：** 作为管理员，我希望系统自动记录关键操作的审计日志，以便追踪和审计。

#### 验收标准

1. THE Payload_CMS SHALL 定义 `audit-logs` Collection，包含字段：user（relationship）、action（text）、resourceType（text）、resourceId（text）、details（json）、ipAddress（text）
2. THE `audit-logs` Collection 的 Access_Control SHALL 确保：仅 admin 可读取审计日志；所有用户不可直接创建、修改或删除审计日志（仅通过 Hook 自动写入）
3. WHEN users 的角色发生变更时，Payload_CMS SHALL 通过 Hook 自动写入 audit-logs 记录
4. WHEN install-orders 的状态发生变更时，Payload_CMS SHALL 通过 Hook 自动写入 audit-logs 记录

### 需求 12：全多语言支持

**用户故事：** 作为全球用户，我希望平台支持多种语言，以便使用我熟悉的语言浏览和操作。

#### 验收标准

1. THE Payload_CMS SHALL 在 `payload.config.ts` 的 `localization` 配置中包含全部 7 种语言：zh、en、ja、ko、de、fr、es，defaultLocale 为 zh，fallbackLocale 为 en
2. THE `hardware-products` Collection 的 name、description、specs 字段 SHALL 使用 Payload 原生 `localized: true` 属性
3. THE `ocsas-standards` Global 的 name 和 description 字段 SHALL 使用 `localized: true` 属性
4. THE `site-settings` Global 的 platformName 字段 SHALL 使用 `localized: true` 属性
5. THE Frontend SHALL 使用 next-intl 实现 UI 字符串国际化，翻译文件存放在 `messages/` 目录下
6. THE Frontend SHALL 通过 URL 路由 `/[locale]/...` 实现语言切换，支持 7 种语言
7. THE Admin_Panel SHALL 配置中文（zh）为默认语言
8. THE Admin_Panel SHALL 为所有 `localized: true` 字段显示语言标签页，允许管理员逐语言录入翻译

### 需求 13：数据库连接与种子数据

**用户故事：** 作为开发者，我希望 Payload CMS 连接现有 PostgreSQL 数据库并兼容种子数据，以便使用真实数据进行开发。

#### 验收标准

1. THE Payload_CMS SHALL 通过 `@payloadcms/db-postgres` 的 `push: true` 配置在开发阶段自动同步 schema
2. WHEN Payload_CMS 启动时，SHALL 自动在 PostgreSQL 中创建或更新所需的数据表
3. THE Payload_CMS SHALL 兼容现有种子数据（10 个用户、6 个订单、3 个硬件产品）
4. THE 数据迁移脚本 SHALL 将现有 users 表的 `password_hash`（bcrypt 格式）映射到 Payload Auth 的密码字段格式，确保现有用户可直接登录
5. IF 数据迁移过程中某张表迁移失败，THEN 迁移脚本 SHALL 回滚该表的变更并继续处理其他表，最终输出失败表的错误详情

### 需求 14：旧代码清理

**用户故事：** 作为开发者，我希望在重构完成后清理被替代的旧代码，以便保持项目结构清晰。

#### 验收标准

1. WHEN Payload_CMS 所有功能验证通过后，THE Platform SHALL 移除 `apps/web` 目录（Vue 3 + Vant 4 用户端前端）
2. WHEN Payload_CMS 所有功能验证通过后，THE Platform SHALL 移除 `services/api-gateway` 目录（NestJS API Gateway）
3. WHEN Payload_CMS 所有功能验证通过后，THE Platform SHALL 移除 `apps/admin` 目录（Vue 3 + Element Plus 管理后台）
4. THE Platform SHALL 更新 `pnpm-workspace.yaml` 移除对已删除目录的引用
5. THE Platform SHALL 更新根目录 `package.json` 的 scripts，添加 `dev:cms` 和 `build:cms` 命令
