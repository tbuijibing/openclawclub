#!/bin/bash

# 宝塔面板 API 部署脚本 - OpenClaw Club
# 使用方式: ./deploy-bt-v2.sh

BT_HOST="45.144.138.68"
BT_PORT="42424"
BT_API_KEY="CRcWpPUAbkcB69Y2pYxh8AqdOinYr6nC"
PROJECT_NAME="openclawclub"

echo "=========================================="
echo "🚀 OpenClaw Club - 宝塔 API 部署脚本"
echo "=========================================="
echo "宝塔地址: https://${BT_HOST}:${BT_PORT}"
echo "API Key: ${BT_API_KEY}"
echo "项目名称: ${PROJECT_NAME}"
echo "=========================================="

# 1. 检查宝塔 Web UI 是否可访问
echo ""
echo "🌐 Step 1: 检查宝塔 Web UI..."
curl -k -s "https://${BT_HOST}:${BT_PORT}" > /tmp/bt_index.html
if [ -s /tmp/bt_index.html ]; then
    echo "✅ 宝塔 Web UI 可访问"
else
    echo "❌ 宝塔 Web UI 无法访问"
    echo "请检查："
    echo "  1. 宝塔面板是否已启动"
    echo "  2. 端口 ${BT_PORT} 是否已开放"
    echo "  3. SSL 证书是否有效"
    cat /tmp/bt_index.html
    exit 1
fi

# 2. 测试 API接入点
echo ""
echo "🔌 Step 2: 测试宝塔 API..."
# 宝塔 API 通常在 /api/ 路径下
curl -k -s "https://${BT_HOST}:${BT_PORT}/api" > /tmp/bt_api.html
if grep -qi "success\|data" /tmp/bt_api.html 2>/dev/null; then
    echo "✅ 宝塔 API 正常"
else
    echo "⚠️  API 接口可能需要添加 /api/ 前缀"
    curl -k -s "https://${BT_HOST}:${BT_PORT}/api/system" > /tmp/bt_api2.html
    if [ -s /tmp/bt_api2.html ]; then
        echo "✅ 尝试 /api/system 成功"
        cat /tmp/bt_api2.html | head -20
    else
        echo "❌ 无法访问 API 端点"
        exit 1
    fi
fi

# 3. 部署项目文件
echo ""
echo "📤 Step 3: 项目已构建完成"
echo "请手动执行以下命令在远程服务器部署："
echo ""
echo "_ssh 45.144.138.68_:"

cat << 'EOF'

# 在远程宝塔服务器执行：
cd /www/wwwroot/openclawclub.cc

# 拉取最新代码
git clone https://github.com/your-org/openclawclub.git .
pnpm install
pnpm build:cms

# 启动应用
pm2 start .next/standalone/server.js --name openclawclub
pm2 save
pm2 startup

# 设置 Nginx 反向代理
# 在宝塔面板 -> 网站 -> 设置 -> 反向代理
# 目标 URL: http://127.0.0.1:3000

EOF

echo "=========================================="
echo "✅ 部署准备完成！"
echo "=========================================="
