# FanClaw 实现说明

## 概述

FanClaw 是 OpenClaw 的一个扩展功能，提供了独立的登录页面和简化的聊天界面。

## 实现的功能

### 1. 配置文件 (`fanclaw.yaml`)

位于 `ui/public/fanclaw.yaml`，包含以下配置：

- **auth**: 用户名、密码、会话有效期（72小时）
- **gateway**: OpenClaw 网关 token 和 URL
- **captcha**: 纯前端 Canvas 验证码配置（可关闭）
- **development**: 本地开发地址列表（跳过登录）

### 2. 登录页面 (`src/ui/views/fanclaw-login.ts`)

- 使用 OpenClaw 设计系统（颜色、字体、组件样式）
- 显示 FanClaw Logo 和标题
- 用户名、密码输入框
- Canvas 图形验证码（可配置）
- 响应式设计，支持移动端和桌面端
- 错误提示和加载状态

### 3. 聊天页面 (`src/ui/views/fanchat.ts`)

- 复刻原有 chat 页面的所有功能
- 移除了侧边导航栏，专注聊天体验
- 添加 Dashboard 按钮可切换回主 chat 页面
- **自适应底部布局**:
  - 桌面端：输入框 + New Session 按钮 + Send 按钮 水平排列
  - 移动端（<768px）：输入框单独占据一行，按钮在下方水平排列

### 4. 认证模块 (`src/ui/fanclaw-auth.ts`)

- YAML 配置文件加载和解析
- 本地开发地址检测（127.0.0.1, localhost）
- 用户名密码验证
- Session 管理（72小时有效期，localStorage 存储）
- Canvas 验证码验证（纯前端）
- 网关 token 获取

### 5. 应用集成 (`src/ui/app-fanclaw.ts`)

- 提供 FanClaw 状态管理
- 处理登录、登出、页面导航
- 与 OpenClaw 现有状态和方法集成

### 6. 样式文件 (`src/styles/fanclaw.css`)

- 登录页面样式（居中卡片、表单样式、错误提示）
- FanChat 样式（头部、自适应底部布局）
- 移动端适配（<768px 和 <480px 断点）
- 暗色/亮色主题支持

### 7. 路由和导航

- 添加 `fanchat` tab 到导航系统
- URL 路径 `/fanchat`
- 登录页面和聊天页面共享同一个路由，根据登录状态显示

### 8. 集成修改

- `app.ts`: 添加 FanClaw 状态和方法
- `app-render.ts`: 渲染登录页面和 fanchat 页面
- `app-lifecycle.ts`: 初始化 FanClaw 认证
- `navigation.ts`: 添加 fanchat 路由
- `icons.ts`: 添加登录相关图标
- `index.html`: 纯前端，无外部验证码脚本
- `styles.css`: 导入 FanClaw 样式

## 工作流程

### 本地开发环境

1. 访问 `http://127.0.0.1:5173` 或 `http://localhost:5173`
2. 自动跳过登录，直接进入 fanchat 页面
3. 使用配置的 token 连接 OpenClaw 网关

### 生产环境

1. 访问任意非本地地址
2. 跳转到登录页面（如果 session 无效或过期）
3. 输入用户名、密码，完成 Canvas 验证码
4. 验证成功后创建 72 小时 session
5. 进入 fanchat 页面，使用配置的 token 连接网关
6. 点击 Dashboard 按钮可切换到主 chat 页面

## 文件结构

```
ui/
├── public/
│   └── fanclaw.yaml                # 配置文件
├── index.html                      # 无外部验证码脚本
├── src/
│   ├── main.ts                     # 入口（未修改）
│   ├── styles.css                  # 导入 fanclaw.css
│   ├── styles/
│   │   └── fanclaw.css            # FanClaw 样式
│   └── ui/
│       ├── app.ts                  # 集成 FanClaw 状态
│       ├── app-fanclaw.ts         # FanClaw 应用逻辑
│       ├── app-lifecycle.ts       # 初始化 FanClaw
│       ├── app-render.ts          # 渲染登录和 fanchat
│       ├── fanclaw-auth.ts        # 认证模块
│       ├── icons.ts               # 添加图标
│       ├── navigation.ts          # 添加 fanchat 路由
│       └── views/
│           ├── fanclaw-login.ts   # 登录页面视图
│           └── fanchat.ts         # 聊天页面视图
```

## 使用方法

### 1. 配置

编辑 `ui/public/fanclaw.yaml`：

```yaml
auth:
  username: your-username
  password: your-secure-password
  sessionDuration: 72

gateway:
  token: your-openclaw-gateway-token
  url: "" # 留空使用当前主机

captcha:
  type: canvas
```

### 2. 访问

- 本地开发：`http://localhost:5173/fanchat`
- 生产环境：`https://your-domain.com/fanchat`

### 3. 构建

```bash
cd ui
pnpm install
pnpm build
```

## 安全注意事项

1. `fanclaw.yaml` 中的密码是明文存储，建议在生产环境中使用环境变量或加密存储
2. Session 存储在 localStorage 中，建议在生产环境中使用 httpOnly cookie
3. 网关 token 通过配置文件提供，确保文件权限正确

## 自适应设计测试

- 桌面端（>768px）：输入框和按钮水平排列
- 平板端（768px-480px）：输入框单独一行，按钮在下方
- 移动端（<480px）：更紧凑的间距和字体大小
