# EnglishEcho 部署指南

本文档提供两种部署方案：VMware 虚拟机和阿里云服务器。

---

## 方案一：VMware 虚拟机部署

### 1.1 环境要求

| 项目 | 最低配置 | 推荐配置 |
|------|----------|----------|
| CPU | 2 核心 | 4 核心 |
| 内存 | 4 GB | 8 GB |
| 磁盘 | 40 GB | 100 GB |
| 系统 | Ubuntu 20.04+ / CentOS 8+ | Ubuntu 22.04 LTS |

### 1.2 安装 Docker

#### Ubuntu / Debian
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装依赖
sudo apt install -y curl wget apt-transport-https ca-certificates gnupg lsb-release

# 添加 Docker GPG 密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 添加 Docker 仓库
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 添加当前用户到 docker 组
sudo usermod -aG docker $USER
```

#### CentOS / RHEL
```bash
# 安装依赖
sudo yum install -y yum-utils

# 添加 Docker 仓库
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 安装 Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker
```

### 1.3 部署 EnglishEcho

```bash
# 1. 克隆项目
git clone https://github.com/CHNVincent/Englinshlearning.git
cd Englinshlearning

# 2. 构建并启动容器
docker-compose up -d

# 3. 查看运行状态
docker-compose ps

# 4. 查看日志
docker-compose logs -f
```

### 1.4 访问应用

- 前端：http://服务器IP
- API：http://服务器IP:3001
- 健康检查：http://服务器IP:3001/health

### 1.5 配置防火墙

```bash
# Ubuntu (UFW)
sudo ufw allow 80/tcp
sudo ufw allow 3001/tcp
sudo ufw enable

# CentOS (firewalld)
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
```

---

## 方案二：阿里云服务器部署

### 2.1 购买 ECS 实例

1. 登录阿里云控制台
2. 进入 ECS 产品页面
3. 创建实例：
   - **地域**：根据目标用户选择（华北2、华东1等）
   - **实例规格**：ecs.t6-c1m1.large（2核4G）或更高
   - **操作系统**：Ubuntu 22.04 LTS 或 Alinux 3
   - **带宽**：5-10 Mbps
   - **安全组**：开放 80、3001 端口

### 2.2 远程连接服务器

```bash
# 使用 SSH 连接
ssh root@你的服务器IP
```

### 2.3 安装 Docker（阿里云优化）

```bash
# Ubuntu 22.04
apt update && apt install -y docker.io docker-compose

# 启动 Docker
systemctl start docker
systemctl enable docker
```

### 2.4 部署项目

```bash
# 1. 安装 git
apt install -y git

# 2. 克隆项目
git clone https://github.com/CHNVincent/Englinshlearning.git
cd Englinshlearning

# 3. 创建数据目录
mkdir -p backend/audio backend/prisma

# 4. 复制数据库文件（如果有本地数据库）
# scp -r ./backend/prisma/dev.db root@服务器IP:/root/Englinshlearning/backend/prisma/

# 5. 构建并启动
docker-compose up -d
```

### 2.5 配置域名（可选）

```bash
# 安装 Nginx
apt install -y nginx

# 配置反向代理
cat > /etc/nginx/sites-available/english-echo << 'EOF'
server {
    listen 80;
    server_name your-domain.com; # 替换为你的域名

    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

# 启用配置
ln -s /etc/nginx/sites-available/english-echo /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 2.6 配置 SSL（HTTPS）

```bash
# 安装 Certbot
apt install -y certbot python3-certbot-nginx

# 获取 SSL 证书
certbot --nginx -d your-domain.com

# 自动续期
certbot renew --dry-run
```

---

## 常用管理命令

### 启动/停止
```bash
# 启动
docker-compose up -d

# 停止
docker-compose down

# 重启
docker-compose restart
```

### 查看日志
```bash
# 所有服务日志
docker-compose logs -f

# 单个服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 更新部署
```bash
# 拉取最新代码
git pull origin main

# 重新构建
docker-compose build

# 重启服务
docker-compose up -d
```

### 数据备份
```bash
# 备份数据库
cp backend/prisma/dev.db backup-$(date +%Y%m%d).db

# 备份音频文件
tar -czvf audio-backup-$(date +%Y%m%d).tar.gz audio/
```

---

## 故障排查

### 容器启动失败
```bash
# 查看详细错误
docker-compose logs
docker-compose logs backend
```

### 端口被占用
```bash
# 查看端口占用
netstat -tlnp | grep 80
netstat -tlnp | grep 3001

# 修改端口（docker-compose.yml）
```

### 数据库问题
```bash
# 重新初始化数据库
cd backend
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

---

## 安全建议

1. **修改默认密码**：在 `docker-compose.yml` 中设置 `ADMIN_PASSWORD` 环境变量
2. **限制端口**：仅开放必要端口
3. **定期备份**：设置自动备份脚本
4. **启用防火墙**：配置 UFW 或 firewalld
5. **使用 HTTPS**：生产环境务必启用 SSL

---

## 生产环境检查清单

- [ ] 服务器系统更新到最新
- [ ] Docker 已安装并运行
- [ ] 防火墙已配置
- [ ] 管理员密码已修改
- [ ] 数据库已备份
- [ ] 域名已解析（可选）
- [ ] SSL 证书已配置（可选）
- [ ] 监控告警已设置（可选）
