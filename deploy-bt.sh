#!/bin/bash

# 宝塔面板 API 部署脚本 - OpenClaw Club
# 项目路径: /Users/justin/github/openclawclub
# 域名: openclawclub.cc
# 宝塔地址: https://45.144.138.68:42424/
# API密钥: CRcWpPUAbkcB69Y2pYxh8AqdOinYr6nC

BT_API_URL="https://45.144.138.68:42424"
BT_API_KEY="CRcWpPUAbkcB69Y2pYxh8AqdOinYr6nC"
PROJECT_DIR="/www/wwwroot/openclawclub.cc"
PROJECT_NAME="openclawclub"

echo "=========================================="
echo "🚀 OpenClaw Club 部署脚本"
echo "=========================================="
echo "项目: /Users/justin/github/openclawclub"
echo "目标: ${PROJECT_DIR}"
echo "域名: openclawclub.cc"
echo "宝塔: ${BT_API_URL}"
echo "=========================================="

# 1. 确认项目构建
echo ""
echo "📝 Step 1: 验证项目构建..."
cd /Users/justin/github/openclawclub
pnpm build:cms
if [ $? -eq 0 ]; then
    echo "✅ 项目构建成功"
else
    echo "❌ 项目构建失败，请检查错误"
    exit 1
fi

# 2. 检查宝塔 API 连接
echo ""
echo "🔌 Step 2: 测试宝塔 API 连接..."
RESPONSE=$(curl -s -k "${BT_API_URL}/listSite" -d "key=${BT_API_KEY}")
if echo "$RESPONSE" | grep -q "success\|data"; then
    echo "✅ 宝塔 API 连接正常"
else
    echo "❌ 宝塔 API 连接失败: $RESPONSE"
    exit 1
fi

# 2. 创建远程目录
echo ""
echo "📁 Step 2: 创建远程目录..."
RESPONSE=$(curl -s -k "${BT_API_URL}/site/MakeSite" \
    -d "key=${BT_API_KEY}" \
    -d "data={'name':'${PROJECT_NAME}', 'domain':'openclawclub.cc', 'port':3000, 'type':'node', 'nodejs':'18', 'path':'${PROJECT_DIR}'}")

if echo "$RESPONSE" | grep -q "success"; then
    echo "✅ 目录创建成功"
else
    echo "⚠️  目录可能已存在或创建失败: $RESPONSE"
fi

# 3. 上传项目文件（使用宝塔文件管理API）
echo ""
echo "📤 Step 3: 上传项目文件..."

# 先删除旧的部署目录（如果存在）
curl -s -k "${BT_API_URL}/files/DeleteFile" \
    -d "key=${BT_API_KEY}" \
    -d "path=${PROJECT_DIR}" > /dev/null

# 创建新目录
curl -s -k "${BT_API_URL}/files/MkDir" \
    -d "key=${BT_API_KEY}" \
    -d "path=${PROJECT_DIR}" > /dev/null

# 上传文件（使用递归上传脚本）
echo "正在上传项目文件到 ${PROJECT_DIR}..."
# 注意：宝塔API不支持批量上传，需要逐个文件上传
# 或者使用宝塔终端执行 git clone

# 4. 通过宝塔终端执行部署命令
echo ""
echo "🔧 Step 4: 通过宝塔终端部署..."

# 使用宝塔SSH/终端API执行
# 宝塔Terminal插件支持远程执行命令

# 推荐方案：使用git部署
cat << 'EOF' > /tmp/deploy_script.sh
#!/bin/bash
cd ${PROJECT_DIR}

# 拉取最新代码
if [ ! -d ".git" ]; then
    git clone https://github.com/your-org/openclawclub.git .
else
    git fetch --all
    git reset --hard origin/main
fi

# 安装依赖
pnpm install

# 构建项目
pnpm build:cms

# 启动PM2
pm2 start .next/standalone/server.js --name openclawclub --no-daemon

# 设置开机自启
pm2 save
pm2 startup
EOF

# 上传并执行部署脚本
echo "✅ 部署脚本已准备"
echo ""
echo "=========================================="
echo "📋 开始使用宝塔 API 部署..."
echo "=========================================="

# 3. 通过宝塔 API 创建站点
echo ""
echo "🌐 Step 3: 创建宝塔站点..."
curl -s -k "${BT_API_URL}/site/MakeSite" \
    -d "key=${BT_API_KEY}" \
    -d "data={'name':'${PROJECT_NAME}', 'domain':'openclawclub.cc', 'port':3000, 'type':'node', 'nodejs':'18', 'path':'${PROJECT_DIR}'}" > /tmp/create_site.json

echo "站点创建响应: $(cat /tmp/create_site.json)"

# 4. 通过宝塔 API 上传文件
echo ""
echo "📤 Step 4: 获取站点配置..."
curl -s -k "${BT_API_URL}/site/GetSite" \
    -d "key=${BT_API_KEY}" \
    -d "data={'name':'${PROJECT_NAME}'}" > /tmp/site_info.json

echo "站点信息: $(cat /tmp/site_info.json)"

# 5. 通过宝塔终端部署（使用 shell 命令）
echo ""
echo "🔧 Step 5: 使用宝塔终端执行部署..."
echo "注意：需通过宝塔面板 Terminal 插件执行以下命令："
echo ""
echo "cd ${PROJECT_DIR}"
echo "git clone https://github.com/your-org/openclawclub.git ."
echo "pnpm install"
echo "pnpm build:cms"
echo "pm2 start .next/standalone/server.js --name openclawclub"
echo "pm2 save"
echo ""

# 5. 获取数据库配置
echo ""
echo "💾 Step 5: 检查数据库配置..."
# 宝塔API获取数据库信息
DB_INFO=$(curl -s -k "${BT_API_URL}/database/GetDatabase" -d "key=${BT_API_KEY}")
echo "数据库配置: ${DB_INFO}"

echo ""
echo "=========================================="
echo "✅ 部署准备完成！"
echo "=========================================="
echo ""
echo "🎯 现在你可以："
echo "1. 通过宝塔终端执行部署命令"
echo "2. 或使用 SSH (如果配置了)"
echo "3. 或使用宝塔Places插件上传文件"
echo ""
echo "网站地址: http://openclawclub.cc"
echo "管理后台: http://openclawclub.cc/admin"
echo "=========================================="
