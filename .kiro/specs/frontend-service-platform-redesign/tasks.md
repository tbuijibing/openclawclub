# 实施计划：前台服务平台改造

## 概述

基于需求文档和设计文档，将改造拆分为 6 个阶段：i18n 翻译键名重命名与新语言支持 → 组件改造（Header、ServiceCard）→ 页面改造（服务页面、订单页面、首页 Hero）→ RTL 支持 → 集成联调 → 最终验证。每个阶段增量推进，确保代码始终可运行。

## 任务

- [x] 1. i18n 翻译系统改造
  - [x] 1.1 重命名现有 7 个语言文件中的翻译键名（product → service）
    - 按照设计文档中的键名映射表，将 `nav.products` → `nav.services`、`products.*` → `services.*`、`home.browseProducts` → `home.browseServices`、`home.featuredProducts` → `home.featuredServices`、`home.noProducts` → `home.noServices`、`orders.selectProduct` → `orders.selectService`、`orders.product` → `orders.service`、`orders.productRequired` → `orders.serviceRequired`、`common.products` → `common.services`
    - 同时更新键值中的"产品/Product"文案为"服务/Service"（各语言对应翻译）
    - 更新 `home.heroSubtitle`、`home.heroDescription`、`home.featuredDescription` 的值以体现新品牌定位
    - 更新 `home.feature1Title`、`home.feature1Desc`、`home.feature2Title`、`home.feature2Desc`、`home.feature3Title`、`home.feature3Desc` 以匹配新品牌定位
    - 修改文件：`apps/cms/messages/zh.json`、`en.json`、`ja.json`、`ko.json`、`de.json`、`fr.json`、`es.json`
    - _需求：1.1, 1.7, 4.1, 4.2, 4.3, 4.4_

  - [x] 1.2 新增三种语言翻译文件（ur、vi、ms）
    - 创建 `apps/cms/messages/ur.json`、`vi.json`、`ms.json`
    - 键结构与现有语言文件完全一致（使用更新后的 service 键名）
    - 翻译内容需准确对应各语言
    - _需求：6.1_

  - [x] 1.3 更新语言路由和配置
    - 在 `apps/cms/src/i18n/routing.ts` 的 `locales` 数组中添加 `'ur'`、`'vi'`、`'ms'`，导出 `rtlLocales` 常量
    - 在 `apps/cms/src/middleware.ts` 中同步更新路由配置
    - 在 `apps/cms/src/payload.config.ts` 的 `i18n.supportedLanguages` 和 `localization.locales` 中添加三种新语言
    - _需求：6.2, 6.3, 6.4_

  - [x] 1.4 更新后台管理面板翻译
    - 在 `apps/cms/src/i18n/admin-translations.ts` 中为 `ur`、`vi`、`ms` 添加后台翻译
    - _需求：6.6_

  - [x] 1.5 编写属性测试：翻译键名不含 product（属性 1）
    - **属性 1：翻译键名不含 "product"**
    - 加载所有 10 个 JSON 文件，递归遍历 `services`、`nav`、`home`、`orders`、`common` 命名空间中的键名，断言无 `product`/`products`
    - **验证需求：1.7**

  - [x] 1.6 编写属性测试：翻译文件键结构一致性（属性 2）
    - **属性 2：翻译文件键结构一致性**
    - 加载所有 10 个 JSON 文件，提取完整键路径集合，断言所有文件的键集合完全相同
    - **验证需求：6.1, 4.3**

- [x] 2. 检查点 - 确保 i18n 改造完成
  - 确保所有测试通过，如有疑问请询问用户。

- [x] 3. 组件改造
  - [x] 3.1 将 ProductCard 重命名为 ServiceCard
    - 将 `apps/cms/src/components/ProductCard.tsx` 重命名为 `ServiceCard.tsx`
    - 组件名从 `ProductCard` 改为 `ServiceCard`，Props 接口名从 `ProductCardProps` 改为 `ServiceCardProps`
    - 新增可选 `isAuthenticated` prop，控制"加入订单"按钮的显示
    - 确保 ServiceCard 展示：服务名称、描述、价格、分类标签
    - 更新所有引用 `ProductCard` 的文件
    - _需求：1.4, 2.4, 5.6_

  - [x] 3.2 改造 Header 组件
    - 在 `localeLabels` 中添加 `ur: 'اردو'`、`vi: 'Tiếng Việt'`、`ms: 'Bahasa Melayu'`
    - 将导航文案从 `t('products')` 改为 `t('services')`
    - 将 `navLinks` 改为动态生成：订单链接仅在 `user` 不为 null 时包含
    - 移动端菜单同步应用上述变更
    - _需求：1.2, 3.1, 3.2, 3.4, 3.5, 6.5_

  - [x] 3.3 创建 ServiceFilter 分类筛选组件
    - 创建客户端组件 `apps/cms/src/components/ServiceFilter.tsx`
    - 实现按服务类别（ClawBox Lite、ClawBox Pro、ClawBox Enterprise、推荐硬件、配件）筛选
    - 支持"全部"选项显示所有服务
    - _需求：5.2_

  - [x] 3.4 编写属性测试：订单链接可见性与认证状态一致（属性 3）
    - **属性 3：订单链接可见性与认证状态一致**
    - 生成随机认证状态（`fc.boolean()`），渲染 Header，断言订单链接可见性 === 认证状态
    - **验证需求：3.1, 3.2, 3.4**

  - [x] 3.5 编写属性测试：分类筛选正确性（属性 5）
    - **属性 5：分类筛选正确性**
    - 生成随机服务列表和随机分类（`fc.array()` + `fc.constantFrom()`），执行筛选，断言结果全部匹配
    - **验证需求：5.2**

  - [x] 3.6 编写属性测试：服务卡片包含必要信息（属性 6）
    - **属性 6：服务卡片包含必要信息**
    - 生成随机服务数据（`fc.record()`），渲染 ServiceCard，断言输出包含名称、描述、价格、分类标签
    - **验证需求：5.6**

- [x] 4. 检查点 - 确保组件改造完成
  - 确保所有测试通过，如有疑问请询问用户。

- [x] 5. 页面改造
  - [x] 5.1 改造服务列表页
    - 修改 `apps/cms/src/app/(frontend)/[locale]/products/page.tsx`
    - 翻译命名空间从 `products` 改为 `services`
    - 页面标题和副标题使用新的"服务"文案
    - 集成 ServiceFilter 组件实现分类筛选
    - 使用 ServiceCard 替换 ProductCard，传入 `isAuthenticated` prop
    - API 调用保持 `/api/hardware-products` 不变
    - _需求：1.3, 2.1, 2.3, 2.4, 5.2, 5.6_

  - [x] 5.2 改造服务详情页
    - 修改 `apps/cms/src/app/(frontend)/[locale]/products/[id]/page.tsx`
    - 翻译命名空间从 `products` 改为 `services`
    - 通过 `cookies().get('payload-token')` 检查认证状态
    - "加入订单"按钮仅对已登录用户显示
    - 未登录用户显示"登录后下单"提示，点击跳转登录页
    - _需求：1.4, 2.2, 2.4, 2.5_

  - [x] 5.3 添加订单页面认证守卫
    - 修改 `apps/cms/src/app/(frontend)/[locale]/orders/page.tsx` 及子页面（`[id]/page.tsx`、`new/page.tsx`）
    - 未登录用户重定向到 `/{locale}/auth/login?redirect=/orders`
    - 认证检查期间显示 loading 状态
    - _需求：3.3_

  - [x] 5.4 重设计首页 Hero 区域
    - 修改 `apps/cms/src/app/(frontend)/[locale]/page.tsx`
    - Hero 区域增加渐变背景样式（`bg-gradient-to-br`）
    - 更新品牌文案：副标题突出"OpenClaw 安装服务平台"，描述包含三大核心业务
    - "立即开始"按钮跳转从 `/auth/register` 改为 `/products`
    - "浏览产品"按钮文案改为"浏览服务"（使用 `home.browseServices` 键）
    - "精选产品"区域标题改为"精选服务"（使用 `home.featuredServices` 键）
    - "为什么选择我们"三个特性描述更新
    - 包含明确的 CTA 按钮
    - _需求：1.5, 1.6, 4.1, 4.2, 4.4, 4.5, 5.1, 5.7_

  - [x] 5.5 更新所有组件中的旧翻译键引用
    - 全局搜索 `apps/cms/src/` 下所有 `.tsx`/`.ts` 文件
    - 将 `useTranslations('products')` 改为 `useTranslations('services')`
    - 将 `getTranslations({ namespace: 'products' })` 改为 `getTranslations({ namespace: 'services' })`
    - 更新所有引用旧键名的代码（如 `t('browseProducts')` → `t('browseServices')`）
    - _需求：1.8_

  - [x] 5.6 编写属性测试：未登录用户不可见订单操作按钮（属性 4）
    - **属性 4：未登录用户不可见订单操作按钮**
    - 生成随机服务数据（`fc.record()`），以未登录状态渲染详情页，断言无订单按钮
    - **验证需求：2.4**

  - [x] 5.7 编写属性测试：源代码无旧翻译键引用（属性 8）
    - **属性 8：源代码无旧翻译键引用**
    - 扫描 `apps/cms/src/` 下所有 `.tsx`/`.ts` 文件，断言无 `'products.'`、`'nav.products'`、`'home.browseProducts'` 等旧键引用
    - **验证需求：1.8**

- [x] 6. 检查点 - 确保页面改造完成
  - 确保所有测试通过，如有疑问请询问用户。

- [x] 7. RTL 支持与响应式优化
  - [x] 7.1 实现乌尔都语 RTL 支持
    - 修改 `apps/cms/src/app/(frontend)/[locale]/layout.tsx`
    - 根据 locale 动态设置 `<html dir="rtl">` 或 `dir="ltr"`
    - 从 `routing.ts` 导入 `rtlLocales` 常量判断
    - _需求：6.7_

  - [x] 7.2 RTL 布局适配
    - 使用 Tailwind CSS `rtl:` 变体处理需要翻转的布局元素
    - Header 语言切换器下拉菜单位置根据 dir 调整
    - 确保 ServiceCard、Footer 等关键组件在 RTL 下布局正确
    - _需求：6.7, 6.8_

  - [x] 7.3 响应式布局优化
    - 确保所有页面在移动端（≥320px）、平板端（≥768px）和桌面端（≥1024px）均有良好布局
    - Header 移动端菜单支持平滑展开/收起动画
    - 保持一致的设计语言：统一间距、字体层级和配色方案
    - _需求：5.3, 5.4, 5.5_

  - [x] 7.4 编写属性测试：RTL 方向正确性（属性 7）
    - **属性 7：RTL 方向正确性**
    - 生成随机 locale（`fc.constantFrom(...locales)`），断言 `ur` 时 dir 为 `rtl`，其他为 `ltr`
    - **验证需求：6.7**

- [x] 8. 数据库迁移
  - [x] 8.1 扩展 PostgreSQL _locales 枚举类型
    - 执行 SQL：`ALTER TYPE _locales ADD VALUE 'ur'; ALTER TYPE _locales ADD VALUE 'vi'; ALTER TYPE _locales ADD VALUE 'ms';`
    - 或通过 Payload CMS 的迁移机制自动处理
    - _需求：6.2, 6.3, 6.4_

- [x] 9. 最终检查点 - 全面验证
  - 确保所有测试通过，如有疑问请询问用户。

## 备注

- 标记 `*` 的任务为可选任务，可跳过以加速 MVP 交付
- 每个任务引用了具体的需求编号以确保可追溯性
- URL 路径 `/products` 保持不变以避免 SEO 影响，仅更改显示文案
- 属性测试验证跨所有输入的通用正确性属性，单元测试验证具体示例和边界情况
