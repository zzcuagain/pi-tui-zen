<div align="center">

# π TUI Zen

**为 [pi](https://github.com/earendil-works/pi) 打造的多彩终端界面增强扩展**

![version](https://img.shields.io/badge/version-0.1.0-blue?style=flat-square)
![license](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![pi](https://img.shields.io/badge/pi-%3E%3D0.84.2-purple?style=flat-square)
![platform](https://img.shields.io/badge/platform-Windows%20%E2%94%82%20WSL%20%E2%94%82%20Linux-lightgrey?style=flat-square)

彩虹 π 艺术字 header · 双信息面板仪表盘 · 快捷操作台 · 技能分类浏览

</div>

---

## ✨ 功能特性

| 特性 | 说明 |
|------|------|
| 🎨 **彩虹 π 艺术字 header** | box-drawing 大 π banner，每行彩虹渐变 + 彩虹分隔线，品牌感十足 |
| 📊 **双信息面板** | 宽屏并排展示，窄屏自动降级，信息一目了然 |
| ⌨ **快捷操作台** | 编辑器上方分区展示常用快捷键与指令，新手零门槛上手 |
| 🧩 **技能分类浏览** | `/skills` 按 6 大分类浏览已安装技能，选分类 → 选技能 → 看描述 |
| 🌈 **彩虹动画** | 流式响应时 7 色旋转 spinner + 终端标题栏动画 |
| ⏱ **实时动态** | footer 每秒刷新 token 统计、成本、时钟、turn 状态徽章 |

## 🖥 界面预览

![界面预览](docs/screenshot.png)

### 布局总览

```
┌─ ① Header 品牌 + 状态 + 数据 ─────────────────────────────────────────┐
│   ██████╗ ██╗      ┌─ π zen 状态 ──────┐  ┌─ 会话统计 ────────────┐ │
│   ██╔══██╗██║      │ ⎇ git 分支        │  │ 📊 上下文 ▓▓▓░░░░░░░ 23% │ │
│   ██████╔╝██║  π   │ ⛭ 会话名          │  │ 📦 提供商 deepseek    │ │
│   ██╔═══╝ ██║  艺  │ ⚙ 模型            │  │ 🧩 技能 30 个          │ │
│   ██║     ██║  术  │ 🧠 思考级别        │  │ 💬 消息 · 🔄 轮次      │ │
│   ╚═╝     ╚═╝  字  │ 🎨 主题 / 📁 目录  │  │ 🔧 工具 · ⏳ 时长      │ │
│  ── 彩虹渐变线 ──   │ ⏱ 实时时钟        │  │ 📡 状态 空闲/工作中   │ │
├─ ② 快捷操作台（编辑器上方）───────────────────────────────────────────┤
│ 🧭 导航 · ✏️ 编辑 · ⚡ 常用 · 🚀 操作                                │
├─ ③ 编辑器输入区 ─────────────────────────────────────────────────────┤
├─ ④ Footer 运行信息 ──────────────────────────────────────────────────┤
│ π · ⎇ 分支 · ↑in ↓out · $成本         模型 · 时钟 · ● 思考中…        │
└───────────────────────────────────────────────────────────────────────┘
```

### 双信息面板详情

**π zen 状态**（左侧面板）：git 分支 · 会话名 · 模型 · 思考级别 · 当前主题 · 工作目录 · 实时时钟

**会话统计**（右侧面板，≥88 列显示）：上下文使用率进度条（`▓▓▓░░░░░░░ 23%`，>80% 自动变黄）· 提供商 · pi 版本 · 技能数量 · 消息数 · 轮次数 · 工具调用 · 运行时长 · 工作状态

## 📦 安装

### 方式一：从 GitHub 安装（推荐）

```bash
pi install git:github.com/zzcuagain/pi-tui-zen
```

### 方式二：从 npm（待发布）

```bash
pi install npm:pi-tui-zen
```

### 方式三：手动复制（本地使用）

```bash
# 将扩展文件放入全局扩展目录
cp extensions/tui-zen.ts ~/.pi/agent/extensions/
# 在 pi 中重载
/reload
```

### 方式四：临时试用（不安装）

```bash
pi -e ./extensions/tui-zen.ts
```

## 🚀 使用

| 命令 | 说明 |
|------|------|
| `/zen` | 查看当前状态（已启用 / 已停用） |
| `/zen on` | 启用全部界面增强 |
| `/zen off` | 恢复 pi 默认界面 |
| `/skills` | 按分类浏览已安装技能（6 大类） |

### 快捷操作台速查

| 分区 | 内容 |
|------|------|
| 🧭 导航 | `?` 帮助 · `/new` 新会话 · `/resume` 续会话 · `/tree` 会话树 · `/fork` 分支 |
| ✏️ 编辑 | `Ctrl+U` 清空 · `Ctrl+K` 删到行尾 · `Ctrl+G` 外部编辑器 · `Ctrl+L` 选模型 |
| ⚡ 常用 | `/skills` 技能 · `/zen` 界面 · `/settings` 设置 · `/compact` 压缩 · `/reload` 重载 |
| 🚀 操作 | `!!` bash 模式 · `Ctrl+O` 工具展开 · `Ctrl+T` 思考折叠 · `Alt+Enter` 排队 · `Esc` 中断 |

## 🎨 配套主题

扩展内置了 3 套配套主题，放入 `~/.pi/agent/themes/` 后在 `/settings` 中切换：

| 主题 | 风格 | 色系 |
|------|------|------|
| `tokyo-night` | 蓝紫霓虹 | 深蓝底 + 青/紫/粉高亮 |
| `aurora` | 青绿极光 | 深绿黑底 + 极光青绿 + 粉紫点缀 |
| `sunset` | 橙粉日落 | 暖棕底 + 橙/金/玫瑰 |

> 编辑主题 JSON 文件会**热重载**，改色即时生效。

## 🧩 技能分类说明

`/skills` 浏览的 6 大分类（对应 `~/.pi/agent/skills/<分类>/` 目录）：

| 分类 | 说明 | 示例 |
|------|------|------|
| 📚 论文检索 | 查找、筛选、分析学术论文 | scholar-search、zotero-paper-reader |
| 📖 阅读与笔记 | 论文深读与笔记整理 | paper-analyzer、deeppapernote |
| ✍️ 学术写作 | 论文写作与润色 | research-writing-skill |
| 🖼 海报与演示 | 学术海报与幻灯片 | paper2slides、paper-comic |
| 🎬 音视频媒体 | 语音、转写、3D、截图 | speech、transcribe、blender |
| 🌐 Web 开发 | 浏览器自动化与部署 | playwright、vercel-deploy |

## 📁 项目结构

```
pi-tui-zen/
├── extensions/
│   └── tui-zen.ts      # 扩展本体（含 /zen 与 /skills 命令）
├── docs/
│   └── screenshot.png  # 界面截图
├── package.json        # pi 包清单
├── README.md
└── LICENSE             # MIT
```

## 🤔 常见问题

**Q：装好后没反应？**
A：扩展在 `~/.pi/agent/extensions/` 下自动发现，执行 `/reload` 或重启 pi。

**Q：统计面板不见了？**
A：终端宽度 <88 列时会自动隐藏右侧统计面板（保留状态面板），拉宽窗口即可。

**Q：面板里的 git 分支不更新？**
A：分支每 10 秒自动刷新一次，切换分支后稍等片刻。

**Q：想改彩虹色？**
A：编辑 `tui-zen.ts` 顶部的 `RAINBOW` 数组（256 色 ANSI 码）即可自定义。

## 🤝 贡献

欢迎提交 Issue 和 PR！开发流程：

```bash
git clone https://github.com/zzcuagain/pi-tui-zen
cd pi-tui-zen
pi -e ./extensions/tui-zen.ts   # 本地试运行
```

## 📄 许可

[MIT](LICENSE) © 2025 [zzcuagain](https://github.com/zzcuagain)
