# EnglishEcho - 英语跟读练习应用

一个完整的英语发音练习Web应用，支持英式和美式发音，拥有发音评分功能。

## 功能特性

- ✅ 英式/美式发音播放
- ✅ 语音录制与智能评分
- ✅ 颜色编码评分系统（绿/黄/红）
- ✅ 词级发音分析
- ✅ 管理员后台（添加/编辑/删除句子）
- ✅ 自动TTS音频生成
- ✅ Docker部署支持

## 技术栈

| 组件 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite |
| 后端 | Node.js + Express + TypeScript |
| 数据库 | SQLite + Prisma ORM |
| 语音合成 | Google Translate TTS API |
| 语音识别 | Web Speech API |
| 部署 | Docker + Docker Compose |

## 快速开始

### 开发模式

1. 启动后端：
```bash
cd backend
npm install
npx prisma migrate dev
npx tsx prisma/seed.ts  # 初始化数据
npm run dev
```

2. 启动前端（新终端）：
```bash
cd frontend
npm install
npm run dev
```

3. 访问 http://localhost:5173

### Docker 部署

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

访问 http://localhost

## 默认账户

- 用户名: `admin`
- 密码: `admin123`

## API 端点

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | /api/sentences | 获取句子列表 |
| GET | /api/sentences/:id | 获取单个句子 |
| POST | /api/sentences | 创建句子 |
| PUT | /api/sentences/:id | 更新句子 |
| DELETE | /api/sentences/:id | 删除句子 |
| POST | /api/auth/login | 管理员登录 |

## 项目结构

```
english-echo/
├── backend/              # Express API 服务器
│   ├── src/
│   │   ├── controllers/  # 请求处理
│   │   ├── services/    # 业务逻辑
│   │   ├── routes/     # API 路由
│   │   └── prisma/     # 数据库模型
│   ├── prisma/         # 数据库schema
│   ├── audio/         # 生成的音频文件
│   └── Dockerfile
├── frontend/           # React 应用
│   ├── src/
│   │   ├── components/ # UI组件
│   │   ├── pages/     # 页面
│   │   ├── services/  # API调用
│   │   └── styles/   # 样式
│   └── Dockerfile
├── docker-compose.yml  # Docker编排
└── SPEC.md            # 详细规格文档
```

## 评分说明

- 🟢 **绿色 (≥80%)**: 发音优秀
- 🟡 **黄色 (60-79%)**: 发音良好，需要改进
- 🔴 **红色 (<60%)**: 发音需要多加练习

## 生产环境注意事项

1. 修改 `backend/.env` 中的 `ADMIN_PASSWORD`
2. 配置反向代理（推荐使用 Nginx）
3. 启用 HTTPS
4. 定期备份 SQLite 数据库
