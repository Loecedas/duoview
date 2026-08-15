# DuoView

[English](./README.en.md) | 简体中文

> 一个基于 Astro + React + Recharts 构建的现代化多邻国（Duolingo）学习数据可视化与双人对比仪表盘。

---

## 界面预览

![双人对比查询展示](./assets/compare-users.png)

---

## 功能特性

- **核心指标看板**：直观展示连胜天数、总累计经验（XP）、学习课程总数以及注册账号天数。
- **双人同屏对比**：支持输入两个用户名进行全方位学习数据 PK，包含连胜天数、总 XP、累计时长、注册天数的进度对比条与动态排序图表。
- **多维度趋势分析**：
  - **7 天经验与时长**：最近 7 天的每日 XP 与学习时间波动面积图。
  - **月度历史分析**：支持“近 12 个月”滚动视图与历史年份切换，XP/时间一键切换。
  - **年度数据沉淀**：年度经验与学习时长的历史跨度分析。
- **年度学习热力图**：全天候打卡热力图，支持多历年快速切换，自适应不同屏幕宽度。
- **语言与科目分布**：以清晰的占比进度条和课程明细，呈现各语种及兴趣科目的学习分布。
- **今日学习概览**：实时统计今日学完课程数、今日获得经验与今日学习时长。
- **丰富个性化设置**：
  - 支持多邻国 Emoji 与扁平矢量图标风格自由切换。
  - 支持浅色模式 / 深色模式 / 跟随系统主题。
- **一键长图分享**：内置仪表盘截图导出功能，便于一键保存高清图片并分享打卡。

---

## 项目结构

```text
duoview/
├── assets/                     # 预览截图与静态资源
├── public/                     # 静态公共资源（图标、manifest 等）
├── src/
│   ├── components/             # React 组件
│   │   ├── dashboard/          # 仪表盘核心图表与统计卡片组件
│   │   ├── DashboardApp.tsx    # 仪表盘主应用与路由逻辑
│   │   ├── LandingHero.tsx     # 首页引导与查询入口
│   │   ├── Navbar.tsx          # 顶部导航栏
│   │   └── AppIcon.tsx         # 多模式图标组件
│   ├── layouts/
│   │   └── Layout.astro        # 页面通用模板
│   ├── pages/
│   │   ├── api/
│   │   │   └── data.ts         # 多邻国数据服务端聚合与缓存接口
│   │   ├── dashboard.astro     # 仪表盘页面
│   │   └── index.astro         # 首页
│   ├── services/
│   │   └── duolingoService.ts  # 多邻国 API 数据解析与清洗服务
│   ├── styles/
│   │   ├── duolingoColors.ts   # 官方主题配色
│   │   └── global.css          # 全局样式
│   ├── types.ts                # 全局 TypeScript 类型定义
│   └── utils/                  # 国际化与通用辅助函数
├── astro.config.mjs            # Astro 配置文件
├── package.json
└── tsconfig.json
```

---

## 环境要求

- **Node.js**：`20.x` 或 `22.x`
- **包管理器**：`npm` / `yarn` / `pnpm`

---

## 快速开始

### 1. 克隆仓库与安装依赖

```bash
git clone https://github.com/Loecedas/duoview.git
cd duoview
npm install
```

### 2. 配置环境变量

复制 `.env.example` 文件并重命名为 `.env`：

```bash
cp .env.example .env
```

在 `.env` 中填写你的配置：

```env
# 必填：Duolingo JWT Token（用于获取公开数据）
# 获取方式：在浏览器登录 duolingo.com，按 F12 打开开发者工具 → Network → 找到任一 /users 请求 → 复制请求头中的 Authorization Bearer Token
DUOLINGO_JWT=your_duolingo_jwt_token
```

### 3. 启动开发服务器

```bash
npm run dev
```

启动成功后，在浏览器打开 `http://localhost:4321` 即可体验。

### 4. 构建与预览

```bash
npm run build    # 构建生产版本
npm run preview  # 预览构建产物
```

---

## 开源许可证

本项目基于 [MIT License](./LICENSE) 协议开源。
