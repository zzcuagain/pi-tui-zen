/**
 * tui-zen — 终端页面多元化增强扩展
 *
 * 布局：
 *  ┌─ Header ───────────────────────────────────────────────────────────┐
 *  │   ██████╗ ██╗        ┌─ π zen 状态 ──────┐  ┌─ 会话统计 ────────┐ │
 *  │   ██╔══██╗██║   ←   │ ⎇ git 分支        │  │ 📊 上下文进度条    │ │
 *  │   ██████╔╝██║    π   │ ⛭ 会话名          │  │ 📦 提供商          │ │
 *  │   ██╔═══╝ ██║   艺   │ ⚙ 模型            │  │ 🏷 pi 版本         │ │
 *  │   ██║     ██║   术   │ 🧠 思考级别        │  │ 🧩 技能数量        │ │
 *  │   ╚═╝     ╚═╝   字   │ 🎨 主题 / 📁 目录  │  │ 💬 消息 / 🔄 轮次  │ │
 *  │  ──── 彩虹渐变线 ──  │ ⏱ 时钟            │  │ 🔧 工具 / ⏳ 时长  │ │
 *  │  ⌘ zen · 多彩终端     │                    │  │ 📡 状态            │ │
 *  ├─ Widget（编辑器上方）：快捷键提示条 ───────────────────────────────┤
 *  ├─ Footer：π 分支 token 成本 | 模型 时钟 徽章 ──────────────────────┤
 *
 * 命令：
 *  /zen | /zen on | /zen off   — 界面增强开关
 *  /skills                     — 按分类浏览已安装的技能
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { exec } from "node:child_process";
import type { AssistantMessage } from "@earendil-works/pi-ai";
import { DynamicBorder, VERSION, type ExtensionAPI, type ExtensionContext, type Theme } from "@earendil-works/pi-coding-agent";
import { Container, type SelectItem, SelectList, Text, truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

// ---------------------------------------------------------------------------
// 彩虹调色板（256 色 ANSI，兼容性最好）
// ---------------------------------------------------------------------------
const RAINBOW = [
	"\x1b[38;5;203m", // 红
	"\x1b[38;5;209m", // 橙
	"\x1b[38;5;221m", // 黄
	"\x1b[38;5;114m", // 绿
	"\x1b[38;5;81m",  // 青
	"\x1b[38;5;141m", // 紫
	"\x1b[38;5;212m", // 粉
];
const RESET_FG = "\x1b[39m";
const BOLD = "\x1b[1m";
const RESET_ALL = "\x1b[0m";

const colorize = (text: string, color: string): string => `${color}${text}${RESET_FG}`;
const rainbow = (text: string, offset = 0): string =>
	text
		.split("")
		.map((ch, i) => colorize(ch, RAINBOW[(i + offset) % RAINBOW.length]!))
		.join("");

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

const LEFT_COL = 22; // 左栏宽度
const START_TIME = Date.now(); // 会话统计起点

// ---------------------------------------------------------------------------
// 技能分类管理（~/.pi/agent/skills/<分类>/<skill>/SKILL.md）
// ---------------------------------------------------------------------------
const SKILLS_DIR = path.join(os.homedir(), ".pi", "agent", "skills");

interface SkillInfo {
	name: string;
	description: string;
}

interface SkillCategory {
	dir: string;
	label: string;
	icon: string;
	skills: SkillInfo[];
}

const SKILL_CATEGORIES: Omit<SkillCategory, "skills">[] = [
	{ dir: "paper-search", label: "论文检索", icon: "📚" },
	{ dir: "paper-reading", label: "阅读与笔记", icon: "📖" },
	{ dir: "paper-writing", label: "学术写作", icon: "✍️" },
	{ dir: "paper-presentation", label: "海报与演示", icon: "🖼" },
	{ dir: "media", label: "音视频媒体", icon: "🎬" },
	{ dir: "web-dev", label: "Web 开发", icon: "🌐" },
];

function parseFrontmatter(text: string): { name: string; description: string } {
	const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	const fm = fmMatch ? fmMatch[1] : "";
	const name = fm.match(/^name:\s*"?([^"\n]+)"?/m)?.[1]?.trim() ?? "";
	let description = "";
	const single = fm.match(/^description:\s*"([^"]*)"|^description:\s*(.+)$/m);
	if (single) description = (single[1] ?? single[2] ?? "").trim();
	const block = fm.match(/^description:\s*\|\s*\r?\n((?:[ \t]+.*\r?\n?)+)/m);
	if (block) description = block[1]!.replace(/\r?\n[ \t]*/g, " ").trim();
	return { name, description: description.slice(0, 150) };
}

function loadSkillTree(): SkillCategory[] {
	const tree: SkillCategory[] = [];
	for (const cat of SKILL_CATEGORIES) {
		const dir = path.join(SKILLS_DIR, cat.dir);
		const skills: SkillInfo[] = [];
		if (fs.existsSync(dir)) {
			for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
				if (!entry.isDirectory()) continue;
				const mdPath = path.join(dir, entry.name, "SKILL.md");
				if (!fs.existsSync(mdPath)) continue;
				try {
					const text = fs.readFileSync(mdPath, "utf8");
					const { name, description } = parseFrontmatter(text);
					skills.push({ name: name || entry.name, description: description || "（无描述）" });
				} catch {
					/* 忽略无法解析的 skill */
				}
			}
		}
		skills.sort((a, b) => a.name.localeCompare(b.name));
		tree.push({ ...cat, skills });
	}
	return tree;
}

// ---------------------------------------------------------------------------
// Header 左栏：box-drawing 大 π 艺术字（每行彩虹渐变）+ 渐变线 + 标语
// ---------------------------------------------------------------------------
const PI_ART = [
	"██████╗ ██╗",
	"██╔══██╗██║",
	"██████╔╝██║",
	"██╔═══╝ ██║",
	"██║     ██║",
	"╚═╝     ╚═╝",
];

function getLeftCol(theme: Theme): string[] {
	const center = (s: string): string =>
		" ".repeat(Math.max(0, Math.floor((LEFT_COL - visibleWidth(s)) / 2))) + s;

	const artLines = PI_ART.map((line, i) => center(colorize(line, RAINBOW[i % RAINBOW.length]!)));
	const sepRow = rainbow("─".repeat(LEFT_COL));
	const tagline = theme.fg("dim", "  ⌘ zen · 多彩终端");

	return [...artLines, sepRow, tagline];
}

// ---------------------------------------------------------------------------
// 通用：带边框的信息面板
// ---------------------------------------------------------------------------
interface PanelRow {
	icon: string;
	label?: string;
	value: string;
	color: "text" | "accent" | "muted" | "dim" | "success" | "warning";
}

function buildPanel(theme: Theme, title: string, rows: PanelRow[]): string[] {
	const inner = rows.map((r) => `${r.icon} ${r.label ? r.label + " " : ""}${r.value}`);
	const innerW = Math.max(...inner.map((s) => visibleWidth(s)));
	const panelW = innerW + 4; // 内边距 2 + 边框 2

	const border = (s: string) => theme.fg("border", s);
	const titleStr = theme.fg("accent", title);
	const titleW = visibleWidth(title);

	const lines: string[] = [];
	lines.push(border("┌─ ") + titleStr + border(" " + "─".repeat(Math.max(1, panelW - 4 - titleW)) + "┐"));
	rows.forEach((r, i) => {
		const content = theme.fg(r.color, inner[i]!);
		lines.push(border("│ ") + content + " ".repeat(innerW - visibleWidth(inner[i]!)) + border(" │"));
	});
	lines.push(border("└" + "─".repeat(panelW - 2) + "┘"));
	return lines;
}

// ---------------------------------------------------------------------------
// 上下文使用率进度条：▓▓▓▓▓░░░░░ 23%
// ---------------------------------------------------------------------------
function buildUsageBar(theme: Theme, percent: number | null): string {
	if (percent == null) return theme.fg("dim", "———— 未知 ————");
	const barLen = 10;
	const filled = Math.round((Math.min(100, Math.max(0, percent)) / 100) * barLen);
	const bar =
		theme.fg("success", "▓".repeat(filled)) + theme.fg("dim", "░".repeat(barLen - filled));
	const pct = theme.fg(percent > 80 ? "warning" : "success", `${Math.round(percent)}%`);
	return `${bar} ${pct}`;
}

// ---------------------------------------------------------------------------
// 辅助：时钟 / 时长 / token 格式化
// ---------------------------------------------------------------------------
const fmt = (n: number): string => (n < 1000 ? `${n}` : `${(n / 1000).toFixed(1)}k`);

function getClock(): string {
	const d = new Date();
	const pad = (x: number) => String(x).padStart(2, "0");
	return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getElapsed(): string {
	const s = Math.floor((Date.now() - START_TIME) / 1000);
	const h = Math.floor(s / 3600);
	const m = Math.floor((s % 3600) / 60);
	const sec = s % 60;
	const pad = (x: number) => String(x).padStart(2, "0");
	return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

function getTitle(pi: ExtensionAPI): string {
	const session = pi.getSessionName();
	return session ? `π · ${session}` : "π";
}

// ---------------------------------------------------------------------------
// 扩展主体
// ---------------------------------------------------------------------------
export default function (pi: ExtensionAPI) {
	let enabled = true;
	let currentTui: { requestRender(): void } | null = null;
	let refreshTimer: ReturnType<typeof setInterval> | null = null;
	let titleTimer: ReturnType<typeof setInterval> | null = null;
	let gitBranch: string | null = null;
	let gitTimer: ReturnType<typeof setInterval> | null = null;
	let skillTree: SkillCategory[] = [];

	// ---------- git 分支（异步获取，每 10s 刷新）----------
	function refreshGitBranch(cwd: string) {
		exec("git branch --show-current", { cwd, timeout: 2000 }, (err, stdout) => {
			if (!err && stdout.trim()) gitBranch = stdout.trim();
			else gitBranch = null;
		});
	}

	function stopGitTimer() {
		if (gitTimer) {
			clearInterval(gitTimer);
			gitTimer = null;
		}
	}

	// 低频刷新：合并所有定时刷新为单一 10 秒定时器，避免高频重绘干扰滚动
	function startRefresh() {
		stopRefresh();
		refreshTimer = setInterval(() => currentTui?.requestRender(), 10000);
	}

	function stopRefresh() {
		if (refreshTimer) {
			clearInterval(refreshTimer);
			refreshTimer = null;
		}
	}

	// ---------- 标题栏动画 ----------
	function startTitleAnim(ctx: ExtensionContext) {
		stopTitleAnim(ctx);
		let i = 0;
		titleTimer = setInterval(() => {
			ctx.ui.setTitle(`${SPINNER_FRAMES[i % SPINNER_FRAMES.length]!} ${getTitle(pi)}`);
			i++;
		}, 100);
	}

	function stopTitleAnim(ctx: ExtensionContext) {
		if (titleTimer) {
			clearInterval(titleTimer);
			titleTimer = null;
		}
		ctx.ui.setTitle(getTitle(pi));
	}

	// ---------- 技能分类选择器（两阶段：分类 → 技能）----------
	function pickItem(ctx: ExtensionContext, title: string, items: SelectItem[]): Promise<string | null> {
		return ctx.ui.custom<string | null>((tui, theme, _kb, done) => {
			const container = new Container();
			container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));
			container.addChild(new Text(theme.fg("accent", theme.bold(title)), 1, 0));
			const list = new SelectList(items, Math.min(items.length, 12), {
				selectedPrefix: (t) => theme.fg("accent", t),
				selectedText: (t) => theme.fg("accent", t),
				description: (t) => theme.fg("muted", t),
				scrollInfo: (t) => theme.fg("dim", t),
				noMatch: (t) => theme.fg("warning", t),
			});
			list.onSelect = (item) => done(item.value);
			list.onCancel = () => done(null);
			container.addChild(list);
			container.addChild(new Text(theme.fg("dim", "  ↑↓ 选择 · Enter 确认 · Esc 返回"), 1, 0));
			container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));
			return {
				render: (w) => container.render(w),
				invalidate: () => container.invalidate(),
				handleInput: (d) => {
					list.handleInput(d);
					tui.requestRender();
				},
			};
		});
	}

	async function showSkills(ctx: ExtensionContext) {
		const tree = loadSkillTree();
		const total = tree.reduce((n, c) => n + c.skills.length, 0);
		if (total === 0) {
			ctx.ui.notify("未找到技能（检查 ~/.pi/agent/skills/ 目录）", "warning");
			return;
		}

		// 阶段 1：选择分类
		const catItems: SelectItem[] = tree.map((c) => ({
			value: c.dir,
			label: `${c.icon} ${c.label}`,
			description: `${c.skills.length} 个技能`,
		}));
		const selectedCat = await pickItem(ctx, `🧩 技能分类（共 ${total} 个）`, catItems);
		if (!selectedCat) return;

		// 阶段 2：选择技能
		const cat = tree.find((c) => c.dir === selectedCat);
		if (!cat || cat.skills.length === 0) return;
		const skillItems: SelectItem[] = cat.skills.map((s) => ({
			value: s.name,
			label: s.name,
			description: s.description,
		}));
		const selectedSkill = await pickItem(ctx, `${cat.icon} ${cat.label} · 选择技能`, skillItems);
		if (!selectedSkill) return;

		// 显示技能描述
		const skill = cat.skills.find((s) => s.name === selectedSkill);
		ctx.ui.notify(skill ? `${skill.name}：${skill.description}` : selectedSkill, "info");
	}

	// ---------- 应用全部增强 ----------
	function applyUi(ctx: ExtensionContext) {
		if (!ctx.hasUI) return;

		// 加载技能统计
		skillTree = loadSkillTree();
		const skillTotal = skillTree.reduce((n, c) => n + c.skills.length, 0);

		// git 分支轮询
		refreshGitBranch(ctx.cwd);
		gitTimer = setInterval(() => refreshGitBranch(ctx.cwd), 10000);

		// 启动低频界面刷新（10 秒一次）
		startRefresh();

		// 1. Header：π 艺术字 + 状态面板 + 统计面板（每秒刷新）
		ctx.ui.setHeader((tui, theme) => {
			currentTui = tui;
			return {
				dispose() {
					stopRefresh();
					stopGitTimer();
				},
				invalidate() {},
				render(width: number): string[] {
					// 会话统计
					let msgs = 0,
						turns = 0,
						tools = 0;
					for (const e of ctx.sessionManager.getBranch()) {
						if (e.type === "message") {
							msgs++;
							if (e.message.role === "user") turns++;
							if (e.message.role === "assistant") {
								const m = e.message as AssistantMessage;
								tools += (m as any).tool_calls?.length ?? 0;
							}
						}
					}
					const usage = ctx.getContextUsage();
					const pct = usage?.percent ?? null;
					const provider = ctx.model?.id?.split("-")[0] ?? "?";

					// 状态面板
					const panelA = buildPanel(theme, "π zen 状态", [
						{ icon: "⎇", value: gitBranch ?? "无分支", color: gitBranch ? "accent" : "dim" },
						{ icon: "⛭", value: pi.getSessionName() ?? "未命名", color: "text" },
						{ icon: "⚙", value: ctx.model?.id ?? "no-model", color: "muted" },
						{ icon: "🧠", value: ctx.thinkingLevel ?? "off", color: "accent" },
						{ icon: "🎨", value: ctx.ui.theme.name ?? "?", color: "muted" },
						{ icon: "📁", value: path.basename(ctx.cwd), color: "text" },
						{ icon: "⏱", value: getClock(), color: "dim" },
					]);

					// 统计面板（窄屏时省略）
					const panelB =
						width >= 88
							? buildPanel(theme, "会话统计", [
									{ icon: "📊", label: "上下文", value: buildUsageBar(theme, pct), color: "text" },
									{ icon: "📦", label: "提供商", value: provider, color: "muted" },
									{ icon: "🏷", label: "版本", value: `pi v${VERSION}`, color: "muted" },
									{ icon: "🧩", label: "技能", value: `${skillTotal} 个`, color: "muted" },
									{ icon: "💬", label: "消息", value: `${msgs}`, color: "text" },
									{ icon: "🔄", label: "轮次", value: `${turns}`, color: "text" },
									{ icon: "🔧", label: "工具", value: `${tools}`, color: "warning" },
									{ icon: "⏳", label: "时长", value: getElapsed(), color: "dim" },
									{ icon: "📡", label: "状态", value: ctx.isIdle() ? "空闲" : "工作中", color: ctx.isIdle() ? "muted" : "accent" },
								])
							: null;

					// 拼接三栏
					const left = getLeftCol(theme);
					const rows = Math.max(left.length, panelA.length, panelB?.length ?? 0);
					const out: string[] = [];
					for (let i = 0; i < rows; i++) {
						const l = (left[i] ?? "") + " ".repeat(Math.max(0, LEFT_COL - visibleWidth(left[i] ?? "")));
						const a = i < panelA.length ? panelA[i]! : "";
						let line = l + " " + a;
						if (panelB) {
							const b = i < panelB.length ? panelB[i]! : "";
							line += " " + b;
						}
						out.push(truncateToWidth(line, width));
					}
					return out;
				},
			};
		});

		// 2. Widget：编辑器上方的「快捷操作台」（分区提示）
		ctx.ui.setWidget("tui-zen-hints", (_tui, theme) => {
			const border = (s: string) => theme.fg("border", s);
			const sep = theme.fg("dim", "  ·  ");
			const item = (k: string, l: string) => theme.fg("accent", k) + theme.fg("dim", ` ${l}`);
			const block = (icon: string, label: string, items: string[]) =>
				theme.fg("dim", `${icon} ${label}`) + sep + items.join(sep);

			return {
				render(width: number): string[] {
					const innerW = Math.max(10, width - 4);
					const title = "⌨ 快捷操作台";
					const rows = [
						block("🧭", "导航", [item("?", "帮助"), item("/new", "新会话"), item("/resume", "续会话"), item("/tree", "会话树"), item("/fork", "分支")]),
						block("✏️", "编辑", [item("Ctrl+U", "清空"), item("Ctrl+K", "删尾"), item("Ctrl+G", "外部编辑器"), item("Ctrl+L", "模型")]),
						block("⚡", "常用", [item("/skills", "技能"), item("/zen", "界面"), item("/settings", "设置"), item("/compact", "压缩"), item("/reload", "重载")]),
						block("🚀", "操作", [item("!!", "bash"), item("Ctrl+O", "工具"), item("Ctrl+T", "思考"), item("Alt+Enter", "排队"), item("Esc", "中断")]),
					];
					const out: string[] = [];
					out.push(border("┌─ ") + theme.fg("accent", title) + border(" " + "─".repeat(Math.max(1, innerW - 1 - visibleWidth(title))) + "┐"));
					for (const r of rows) {
						out.push(border("│ ") + truncateToWidth(r, innerW) + " ".repeat(Math.max(0, innerW - visibleWidth(r))) + border(" │"));
					}
					out.push(border("└" + "─".repeat(innerW + 2) + "┘"));
					return out;
				},
				invalidate() {},
			};
		});

		// 3. Footer：π 徽章 + 分支 + token + 成本 | 模型 + 时钟 + 状态徽章
		ctx.ui.setFooter((tui, theme, footerData) => {
			currentTui = tui;
			const unsubBranch = footerData.onBranchChange(() => tui.requestRender());

			return {
				dispose() {
					unsubBranch();
				},
				invalidate() {},
				render(width: number): string[] {
					// token 统计
					let input = 0,
						output = 0,
						cost = 0;
					for (const e of ctx.sessionManager.getBranch()) {
						if (e.type === "message" && e.message.role === "assistant") {
							const m = e.message as AssistantMessage;
							input += m.usage.input ?? 0;
							output += m.usage.output ?? 0;
							cost += m.usage.cost?.total ?? 0;
						}
					}

					const branch = footerData.getGitBranch();
					const sep = theme.fg("dim", " · ");

					const left = [
						theme.fg("accent", "π"),
						branch ? theme.fg("accent", `⎇ ${branch}`) : theme.fg("dim", "⎇ -"),
						theme.fg("success", `↑${fmt(input)}`),
						theme.fg("warning", `↓${fmt(output)}`),
						theme.fg("dim", `$${cost.toFixed(3)}`),
					].join(sep);

					// 状态徽章（来自 setStatus，如 turn 完成 ✓）
					const badge = footerData.getExtensionStatuses().get("tui-zen");
					const right = [
						theme.fg("muted", ctx.model?.id ?? "no-model"),
						theme.fg("dim", getClock()),
						badge ? badge : "",
					]
						.filter(Boolean)
						.join(sep);

					const pad = " ".repeat(Math.max(1, width - visibleWidth(left) - visibleWidth(right)));
					return [truncateToWidth(left + pad + right, width)];
				},
			};
		});

		// 4. 彩虹工作指示器
		ctx.ui.setWorkingIndicator({
			frames: SPINNER_FRAMES.map((frame, i) => colorize(frame, RAINBOW[i % RAINBOW.length]!)),
			intervalMs: 80,
		});
	}

	// ---------- 生命周期 ----------
	pi.on("session_start", async (_event, ctx) => {
		if (enabled) applyUi(ctx);
	});

	pi.on("agent_start", async (_event, ctx) => {
		if (enabled) startTitleAnim(ctx);
	});

	pi.on("agent_end", async (_event, ctx) => {
		stopTitleAnim(ctx);
	});

	pi.on("session_shutdown", async (_event, ctx) => {
		stopTitleAnim(ctx);
		stopRefresh();
		stopGitTimer();
	});

	// turn 状态徽章
	pi.on("turn_start", async (_event, ctx) => {
		if (!enabled) return;
		ctx.ui.setStatus("tui-zen", ctx.ui.theme.fg("accent", "●") + ctx.ui.theme.fg("dim", " 思考中…"));
	});

	pi.on("turn_end", async (_event, ctx) => {
		if (!enabled) return;
		ctx.ui.setStatus("tui-zen", ctx.ui.theme.fg("success", "✓") + ctx.ui.theme.fg("dim", " 本轮完成"));
	});

	// ---------- /skills 命令：分类浏览技能 ----------
	pi.registerCommand("skills", {
		description: "按分类浏览已安装的技能",
		handler: async (_args, ctx) => {
			await showSkills(ctx);
		},
	});

	// ---------- /zen 命令 ----------
	pi.registerCommand("zen", {
		description: "切换 tui-zen 界面增强：on / off",
		handler: async (args, ctx) => {
			const cmd = args.trim().toLowerCase();
			if (cmd === "on") {
				enabled = true;
				applyUi(ctx);
				ctx.ui.notify("tui-zen 已启用", "info");
			} else if (cmd === "off") {
				enabled = false;
				ctx.ui.setHeader(undefined);
				ctx.ui.setFooter(undefined);
				ctx.ui.setWidget("tui-zen-hints", undefined);
				ctx.ui.setWorkingIndicator();
				ctx.ui.setStatus("tui-zen", undefined);
				stopTitleAnim(ctx);
				stopRefresh();
				stopGitTimer();
				ctx.ui.notify("已恢复 pi 默认界面", "info");
			} else {
				ctx.ui.notify(`tui-zen: ${enabled ? "已启用" : "已停用"}（/zen on|off）`, "info");
			}
		},
	});
}
