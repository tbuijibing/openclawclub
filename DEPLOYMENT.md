# OpenClaw Club - 部署指南

## 项目信息

- **项目名称**: OpenClaw Club
- **站点域名**: openclawclub.cc
- **服务端口**: 3000
- **部署目标目录**: /www/wwwroot/openclawclub.cc
- **宝塔服务器**: https://45.144.138.68:42424

---

## 🚀 快速部署步骤

### 1. SSH 登录到服务器

```bash
ssh root@45.144.138.68
```

### 2. 创建项目目录

```bash
mkdir -p /www/wwwroot/openclawclub.cc
cd /www/wwwroot/openclawclub.cc
```

### 3. 拉取代码

```bash
git clone https://github.com/your-org/openclawclub.git .
```

### 4. 安装依赖

```bash
# 安装 pnpm（如果未安装）
npm install -g pnpm

# 安装依赖
pnpm install
```

### 5. 构建项目

```bash
pnpm build:cms
```

### 6. 启动应用（使用 PM2）

```bash
pm2 start .next/standalone/server.js --name openclawclub
pm2 save
pm2 startup
```

### 7. 配置反向代理

在宝塔面板中：

1. 进入 **网站** → **添加站点**
2. 域名：`openclawclub.cc`
3. 类型：**反向代理**
4. 目标 URL：`http://127.0.0.1:3000`

或者使用 Nginx 配置：

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 8. 设置 SSL

在宝塔面板中为 `openclawclub.cc` 配置 SSL 证书（Let's Encrypt 免费证书）。

---

## 🔧 手动部署脚本

也可以使用提供的部署脚本：

```bash
# 上传部署脚本到服务器
scp deploy-bt-v2.sh root@45.144.138.68:/root/

# SSH 登录后执行
ssh root@45.144.138.68
chmod +x /root/deploy-bt-v2.sh
./deploy-bt-v2.sh
```

---

## 📝 启动后验证

### 1. 检查 PM2 状态

```bash
pm2 status
```

### 2. 查看日志

```bash
pm2 logs openclawclub
```

### 3. 访问网站

- **网站**: https://openclawclub.cc
- **管理后台**: https://openclawclub.cc/admin

---

## 🔧 开发环境配置

在本地开发时，确保 `.env` 文件配置正确：

```env
# 数据库配置
DATABASE_URI=postgresql://user:password@localhost:5432/openclaw_club

# 站点配置
PAYLOAD_PUBLIC_SERVER_URL=https://openclawclub.cc
PAYLOAD_SECRET=your-secret-key-here

# Stripe 配置（如果需要支付功能）
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Redis 配置（可选）
REDIS_URL=redis://localhost:6379
```

---

## 🐛 故障排查

### 1. 502 Bad Gateway

- 检查 PM2 是否正常运行：`pm2 status`
- 检查端口是否监听：`netstat -tuln | grep 3000`
- 检查 Nginx 配置

### 2. 数据库连接失败

- 检查 PostgreSQL 是否运行：`servicepostgresql status`
- 检查数据库配置：`DATABASE_URI`

### 3. 权限问题

```bash
# 修改目录权限
chown -R www:www /www/wwwroot/openclawclub.cc

# 重新启动 PM2
pm2 restart openclawclub
```

---

## 📦 更新部署

每次更新代码后：

```bash
cd /www/wwwroot/openclawclub.cc
git pull
pnpm install
pnpm build:cms
pm2 restart openclawclub
pm2 logs openclawclub
```

---

## 🔄 后续优化

1. **配置 CDN**: 使用 Cloudflare 或宝塔 CDN
2. **配置缓存**: Redis 缓存
3. **配置监控**: 宝塔监控插件
4. **配置备份**: 自动数据库备份

---

## 📞 需要帮助？

如果遇到问题，请检查：

1. 宝塔面板是否安装了 **Node.js 环境**
2. 是否安装了 **PM2 管理器**
3. 防火墙是否开放端口 3000
4. SSL 证书是否有效

---

**状态**: ✅ 项目已构建完成，等待部署到生产环境
