# OpenClaw Club CMS — 部署安装运行文档

## 系统要求

| 依赖 | 最低版本 | 说明 |
|------|---------|------|
| Node.js | 20.9.0+ | 推荐 22.x LTS |
| pnpm | 9.0.0+ | 包管理器 |
| PostgreSQL | 14+ | 数据库 |

## 快速开始（本地开发）

### 1. 克隆项目并安装依赖

```bash
git clone <repo-url> openclaw-club-platform
cd openclaw-club-platform
pnpm install
```

### 2. 创建 PostgreSQL 数据库

```bash
# macOS (Homebrew)
brew install postgresql@16
brew services start postgresql@16

# 创建数据库
createdb openclaw_club
```

如果你的 PostgreSQL 用户名不是 `justin`，需要在 `.env` 中修改连接字符串。

### 3. 配置环境变量

```bash
cd apps/cms
cp .env.example .env
```

编辑 `apps/cms/.env`：

```dotenv
# 数据库连接（必填）
DATABASE_URI=postgresql://justin@localhost:5432/openclaw_club

# Payload 密钥（必填，任意随机字符串）
PAYLOAD_SECRET=your-random-secret-at-least-32-chars

# 服务地址（可选，默认 http://localhost:3000）
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000

# Stripe 支付（如需支付功能）
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

> 注意：`payload.config.ts` 读取的环境变量名是 `DATABASE_URI`（非 `DATABASE_URL`）。如果你的 `.env` 中写的是 `DATABASE_URL`，请改为 `DATABASE_URI`，或两者都写上。

### 4. 启动开发服务器

从项目根目录：

```bash
pnpm dev:cms
```

或从 `apps/cms` 目录：

```bash
cd apps/cms
pnpm dev
```

启动后访问：

| 地址 | 说明 |
|------|------|
| http://localhost:3000/admin | Payload Admin 管理后台 |
| http://localhost:3000/zh | 用户前端（中文） |
| http://localhost:3000/en | 用户前端（英文） |

首次启动时，Payload 会自动在 PostgreSQL 中创建所需的数据表（`push: true` 模式）。

### 5. 创建管理员账户

首次访问 http://localhost:3000/admin 时，Payload 会引导你创建第一个管理员账户。

## 生产部署

### 方式一：Node.js 直接部署

#### 构建

```bash
# 从项目根目录
pnpm build:cms

# 或从 apps/cms 目录
cd apps/cms
pnpm build
```

#### 运行

```bash
cd apps/cms
NODE_ENV=production pnpm start
```

生产环境需要设置的环境变量：

```dotenv
NODE_ENV=production
DATABASE_URI=postgresql://user:password@db-host:5432/openclaw_club
PAYLOAD_SECRET=<生产密钥，至少32字符>
PAYLOAD_PUBLIC_SERVER_URL=https://your-domain.com
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

> 生产环境下 `push: false`，不会自动修改数据库 schema。需要使用 Payload 的 migration 命令管理 schema 变更。

#### 生产数据库迁移

```bash
cd apps/cms

# 生成迁移文件
pnpm payload migrate:create

# 执行迁移
pnpm payload migrate
```

### 方式二：Docker 部署

#### 构建镜像

先在 `next.config.mjs` 中启用 standalone 输出：

```js
const nextConfig = {
  output: 'standalone',
  // ...其余配置
}
```

然后构建：

```bash
cd apps/cms
docker build -t openclaw-cms .
```

#### 运行容器

```bash
docker run -d \
  --name openclaw-cms \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URI=postgresql://user:password@db-host:5432/openclaw_club \
  -e PAYLOAD_SECRET=<生产密钥> \
  -e PAYLOAD_PUBLIC_SERVER_URL=https://your-domain.com \
  -e STRIPE_SECRET_KEY=sk_live_xxx \
  -e STRIPE_WEBHOOK_SECRET=whsec_xxx \
  openclaw-cms
```

## Stripe Webhook 配置

### 本地测试

```bash
# 安装 Stripe CLI
brew install stripe/stripe-cli/stripe

# 登录
stripe login

# 转发 webhook 到本地
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

Stripe CLI 会输出一个 `whsec_xxx` 密钥，将其填入 `.env` 的 `STRIPE_WEBHOOK_SECRET`。

### 生产环境

在 [Stripe Dashboard](https://dashboard.stripe.com/webhooks) 中添加 Webhook 端点：

- URL: `https://your-domain.com/api/stripe-webhook`
- 监听事件: `checkout.session.completed`

## 数据迁移（从旧系统）

如果需要从旧的 TypeORM 数据库迁移数据：

```bash
cd apps/cms
npx tsx src/migrations/migrate-from-typeorm.ts
```

迁移脚本会：
- 将现有用户的 `password_hash` 映射到 Payload Auth 格式
- 每张表独立 try/catch，单表失败不影响其他表
- 输出详细迁移日志

## 项目结构速览

```
apps/cms/
├── src/
│   ├── app/
│   │   ├── (frontend)/[locale]/   # 用户前端页面
│   │   ├── (payload)/admin/       # Payload Admin Panel
│   │   └── api/                   # REST API + Stripe Webhook
│   ├── collections/               # 8 个 Collections + Media
│   ├── globals/                   # 3 个 Globals
│   ├── access/                    # 访问控制函数
│   ├── hooks/                     # 业务逻辑 Hooks
│   ├── components/                # shadcn/ui 前端组件
│   └── lib/                       # Stripe SDK、工具函数
├── messages/                      # 7 种语言翻译文件
├── middleware.ts                  # next-intl 路由中间件
└── i18n.ts                        # next-intl 配置
```

## 支持的语言

中文 (zh)、English (en)、日本語 (ja)、한국어 (ko)、Deutsch (de)、Français (fr)、Español (es)

默认语言：中文 | 回退语言：English

## 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev:cms` | 启动开发服务器（根目录） |
| `pnpm build:cms` | 构建生产版本（根目录） |
| `pnpm --filter apps-cms test:int` | 运行集成测试 |
| `pnpm --filter apps-cms payload migrate:create` | 创建数据库迁移 |
| `pnpm --filter apps-cms payload migrate` | 执行数据库迁移 |
| `pnpm --filter apps-cms payload generate:types` | 生成 TypeScript 类型 |

## 故障排查

**数据库连接失败**
- 确认 PostgreSQL 正在运行：`pg_isready`
- 确认 `.env` 中 `DATABASE_URI` 格式正确
- 确认数据库 `openclaw_club` 已创建

**Admin Panel 无法访问**
- 确认访问地址是 `/admin`（不带 locale 前缀）
- 首次启动需要创建管理员账户

**Stripe 支付不生效**
- 确认 `STRIPE_SECRET_KEY` 和 `STRIPE_WEBHOOK_SECRET` 已配置
- 本地测试需要运行 `stripe listen --forward-to localhost:3000/api/stripe-webhook`

**多语言不生效**
- 确认 `messages/` 目录下有对应语言的 JSON 文件
- 确认 URL 包含 locale 前缀（如 `/zh/products`）
