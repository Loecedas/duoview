# DuoView

一个用于查看 Duolingo 公开学习数据的仪表盘应用。

输入用户名后，DuoView 会从 Duolingo 的公开接口拉取数据，并整理成更易读的图表和统计面板。支持查看最近 7 天学习趋势、今日概览、课程分布、年度热力图，并可导出当前仪表盘为分享图片。

## 功能

- 查询任意公开 Duolingo 用户
- 展示连续学习天数、总 XP、学习课程数、账号年龄
- 展示最近 7 天 XP 和学习时长趋势
- 展示今日 XP、今日课程数、今日学习分钟数
- 展示课程 XP 分布
- 展示年度学习热力图，并根据屏幕宽度自动切换季度 / 半年 / 全年视图
- 导出仪表盘截图为 PNG
- 支持浅色 / 深色 / 跟随系统主题
- 服务端缓存用户数据，减少重复请求

## 技术栈

- Astro 5
- React 19
- Tailwind CSS 4
- Recharts

## 环境要求

- Node.js `22.x`
- npm

## 本地运行

```bash
npm install
cp .env.example .env
```

在 `.env` 中配置：

```env
DUOLINGO_JWT=your_duolingo_jwt
```

然后启动开发环境：

```bash
npm run dev
```

默认地址：

```text
http://localhost:4321
```

## 如何使用

1. 打开首页。
2. 输入 Duolingo 用户名。
3. 跳转到 `/dashboard?user=<username>` 查看仪表盘。
4. 需要分享时，点击页面里的导出按钮生成 PNG。

也可以直接访问：

```text
/dashboard?user=duolingo
```

## JWT 说明

`DUOLINGO_JWT` 用于补充需要鉴权的接口数据。

未配置时：

- 仍可查询公开用户的基础信息
- 仍可展示大部分公开统计
- 部分依赖鉴权的增强数据可能缺失

已配置时：

- 可获取更完整的 XP 汇总数据
- 可补充排行榜相关信息
- 学习时长、今日数据、热力图会更完整

获取方式：

1. 在浏览器登录 `duolingo.com`
2. 打开开发者工具
3. 在网络请求里找到带 `Authorization: Bearer <token>` 的请求
4. 复制 token 到 `.env`

## API

项目提供一个服务端接口：

```text
GET /api/data?username=<username>
```

返回内容是整理后的用户学习数据，前端仪表盘直接消费这个接口。

接口特性：

- 用户名格式校验
- 失败超时保护
- 30 分钟内存缓存
- 最多缓存 100 个用户结果

## 常用命令

```bash
npm run dev
npm run build
npm run preview
```

## 部署

仓库已包含以下平台配置文件，可直接按平台方式部署：

- Vercel
- Netlify

部署前确认已配置 `DUOLINGO_JWT` 环境变量，否则只会拿到公开可见的数据。
