# 需求文档：前台服务平台改造

## 简介

对 OpenClaw Club 平台的前台页面进行全面改造，核心变更包括：将"产品"概念统一替换为"服务"、开放未登录用户对服务内容的访问、隐藏未登录用户的订单功能、更新品牌定位描述，以及参考专业网站提升整体设计质量。

## 术语表

- **Frontend**：前台页面，即 `apps/cms/src/app/(frontend)/` 目录下的所有用户可见页面
- **Service_List_Page**：服务列表页面（原产品列表页 `/[locale]/products/`）
- **Service_Detail_Page**：服务详情页面（原产品详情页 `/[locale]/products/[id]/`）
- **Order_Page**：订单相关页面，包括订单列表 `/[locale]/orders/`、订单详情 `/[locale]/orders/[id]/`、创建订单 `/[locale]/orders/new/`
- **Header**：全局导航栏组件 `src/components/Header.tsx`
- **i18n_Messages**：国际化翻译文件，位于 `apps/cms/messages/` 目录下，支持 zh、en、ja、ko、de、fr、es、ur、vi、ms 十种语言
- **Unauthenticated_User**：未登录的访客用户
- **Authenticated_User**：已登录的用户
- **Hero_Section**：首页顶部的品牌展示区域，包含标题、副标题和描述文字

## 需求

### 需求 1：将"产品"概念统一替换为"服务"

**用户故事：** 作为平台运营者，我希望前台所有"产品"相关的文案和概念改为"服务"，以准确反映平台的业务定位。

#### 验收标准

1. THE i18n_Messages SHALL 将所有十种语言文件中 `nav.products`、`common.products`、`products.*`、`home.browseProducts`、`home.featuredProducts`、`home.featuredDescription`、`home.noProducts`、`orders.selectProduct`、`orders.product`、`orders.productRequired` 等包含"产品/product"语义的翻译键值替换为对应的"服务/service"语义
2. THE Header SHALL 将导航链接中原"产品"入口的文案更新为"服务"（各语言对应翻译）
3. THE Service_List_Page SHALL 将页面标题和副标题从"产品目录/Products"更新为"服务目录/Services"
4. THE Service_Detail_Page SHALL 将页面中所有"产品/Product"相关文案更新为"服务/Service"
5. THE Hero_Section SHALL 将"浏览产品/Browse Products"按钮文案更新为"浏览服务/Browse Services"
6. THE Hero_Section SHALL 将"精选产品/Featured Products"区域标题更新为"精选服务/Featured Services"
7. WHEN i18n_Messages 中的翻译键名包含 `product` 或 `products` 时，THE i18n_Messages SHALL 将对应键名重命名为使用 `service` 或 `services`（如 `products.title` → `services.title`、`orders.selectProduct` → `orders.selectService`）
8. WHEN 翻译键名发生变更时，THE Frontend SHALL 同步更新所有引用这些键名的组件代码中的 `useTranslations` 和 `getTranslations` 调用

### 需求 2：未登录用户可访问服务页面

**用户故事：** 作为未登录的访客，我希望能浏览服务列表和服务详情，以便在注册前了解平台提供的服务内容。

#### 验收标准

1. WHEN Unauthenticated_User 访问 Service_List_Page 时，THE Service_List_Page SHALL 正常展示所有已上架的服务列表
2. WHEN Unauthenticated_User 访问 Service_Detail_Page 时，THE Service_Detail_Page SHALL 正常展示服务的完整详情信息
3. THE Frontend SHALL 确保服务列表的 API 调用（`/api/hardware-products`）不依赖用户认证 Cookie
4. WHEN Unauthenticated_User 浏览服务页面时，THE Service_List_Page SHALL 不展示需要登录才能使用的操作按钮（如"加入订单"）
5. WHEN Unauthenticated_User 点击需要登录的操作时，THE Frontend SHALL 引导用户跳转到登录页面

### 需求 3：未登录时隐藏订单功能

**用户故事：** 作为平台运营者，我希望未登录用户看不到订单相关的导航和页面，以保持界面简洁并引导用户先注册登录。

#### 验收标准

1. WHILE Unauthenticated_User 处于未登录状态时，THE Header SHALL 隐藏导航栏中的"订单/Orders"链接
2. WHILE Unauthenticated_User 处于未登录状态时，THE Header SHALL 在移动端菜单中同样隐藏"订单"链接
3. WHEN Unauthenticated_User 直接通过 URL 访问 Order_Page 时，THE Frontend SHALL 将用户重定向到登录页面
4. WHILE Authenticated_User 处于已登录状态时，THE Header SHALL 正常展示"订单"导航链接
5. WHEN Authenticated_User 登录成功后，THE Header SHALL 立即显示"订单"导航链接，无需刷新页面

### 需求 4：品牌定位更新

**用户故事：** 作为平台运营者，我希望更新首页的品牌描述，以准确传达平台提供 OpenClaw 相关安装服务、按国家区分价格体系、以及销售预装硬件的业务定位。

#### 验收标准

1. THE Hero_Section SHALL 将副标题从"全球化硬件安装服务平台/Global Hardware Installation Platform"更新为体现"OpenClaw 安装服务"定位的新文案
2. THE Hero_Section SHALL 将描述文字更新为包含以下三个核心信息：提供 OpenClaw 相关设备的安装服务、根据不同国家提供差异化的价格和服务体系、销售已预装好服务的硬件设备
3. THE i18n_Messages SHALL 为所有十种语言提供更新后的品牌文案翻译
4. THE Hero_Section SHALL 更新"为什么选择我们"区域的三个特性描述，使其与新的品牌定位一致
5. THE Hero_Section SHALL 将"立即开始/Get Started"按钮的跳转目标从注册页面更新为服务列表页面，以便未登录用户也能直接浏览服务

### 需求 5：前台页面设计优化

**用户故事：** 作为平台用户，我希望前台页面具有专业、现代的视觉设计，以提升使用体验和对平台的信任感。

#### 验收标准

1. THE Hero_Section SHALL 采用现代化的视觉设计，包含渐变背景或品牌色彩方案，提升视觉层次感
2. THE Service_List_Page SHALL 提供清晰的服务分类筛选功能，支持按服务类别（如 ClawBox Lite、ClawBox Pro、ClawBox Enterprise、推荐硬件、配件）进行过滤
3. THE Frontend SHALL 在所有页面保持一致的设计语言，包括统一的间距、字体层级和配色方案
4. THE Header SHALL 在桌面端和移动端均提供流畅的导航体验，移动端菜单支持平滑的展开/收起动画
5. THE Frontend SHALL 确保所有页面在移动端（≥320px）、平板端（≥768px）和桌面端（≥1024px）均有良好的响应式布局
6. THE Service_List_Page SHALL 为每个服务卡片展示关键信息：服务名称、简要描述、价格和服务类别标签
7. THE Hero_Section SHALL 包含明确的行动号召（CTA）按钮，引导用户浏览服务或了解更多信息

### 需求 6：新增三种语言支持

**用户故事：** 作为平台运营者，我希望新增乌尔都语（ur）、越南语（vi）和马来语（ms）的支持，将平台语言覆盖从 7 种扩展到 10 种，以服务更广泛的用户群体。

#### 验收标准

1. THE i18n_Messages SHALL 新增 `apps/cms/messages/ur.json`、`apps/cms/messages/vi.json`、`apps/cms/messages/ms.json` 三个翻译文件，包含与现有语言文件完全一致的键结构
2. THE Frontend SHALL 在 `apps/cms/src/i18n/routing.ts` 的 `locales` 数组中添加 `'ur'`、`'vi'`、`'ms'`
3. THE Frontend SHALL 在 `apps/cms/src/middleware.ts` 的路由配置中添加三种新语言
4. THE Frontend SHALL 在 `apps/cms/src/payload.config.ts` 的 `i18n.supportedLanguages` 和 `localization.locales` 中添加三种新语言
5. THE Header SHALL 在 `localeLabels` 中添加 `ur: 'اردو'`、`vi: 'Tiếng Việt'`、`ms: 'Bahasa Melayu'`
6. THE Frontend SHALL 在 `apps/cms/src/i18n/admin-translations.ts` 中为三种新语言添加后台管理面板翻译
7. WHEN 乌尔都语（ur）被选择时，THE Frontend SHALL 正确处理 RTL（从右到左）文本方向
8. THE Frontend SHALL 确保所有现有页面和组件在三种新语言下正常渲染，无布局错位
