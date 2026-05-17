export type AiConversationLogEntry = {
  timestamp: string;
  userInput: string;
  aiFinalOutput: string;
  changedFiles: string[];
  verification: string[];
};

export const aiConversationLogEntries: AiConversationLogEntry[] = [
  // ==================== 即我 APP - 安排模块 V1.0 基础功能版 ====================
  {
    timestamp: "2026-05-17 14:00:00 CST (+0800)",
    userInput: "按照 AGENTS.md 和 candidate-rules.md 开发「即我」APP 安排模块 V1.0，实现基础页面、手动增删改查、以后再说、时间录入、本地持久化",
    aiFinalOutput:
      "已完成「即我」APP 安排模块 V1.0 开发，实现列表/新增/编辑/详情基础页面、手动创建/编辑/删除/标记完成、长按/右滑以后再说无焦虑交互、时间录入与本地数据持久化，代码符合 lint 规范，pnpm build 可正常构建，日志自动记录，未修改规则文件，UI 简约优雅。",
    changedFiles: [
      "src/pages/arrangement/ListScreen.tsx",
      "src/pages/arrangement/AddScreen.tsx",
      "src/pages/arrangement/EditScreen.tsx",
      "src/pages/arrangement/DetailScreen.tsx",
      "src/store/arrangementStore.ts",
      "src/data/aiConversationLog.ts",
      "src/types/arrangement.ts"
    ],
    verification: [
      "IDE 静态检查通过（get_errors 无错误）",
      "pnpm lint 代码规范校验通过",
      "pnpm build 正常构建无报错",
      "基础页面渲染与路由跳转正常",
      "手动增删改查安排功能正常",
      "长按/右滑以后再说功能生效",
      "本地数据持久化重启不丢失",
      "测试地址 http://127.0.0.1:5173/ 可正常访问"
    ]
  },

  // ==================== 即我 APP - 安排模块 V2.0 AI 赋能版 ====================
  {
    timestamp: "2026-05-17 14:30:00 CST (+0800)",
    userInput: "基于 V1.0 迭代 V2.0 AI 能力，实现 AI 配置页、本地 AI 工具、私聊对话生成安排、自动提取时间、日历视图",
    aiFinalOutput:
      "已完成「即我」APP 安排模块 V2.0 开发，新增 AI 配置页面支持私有 API 配置、封装本地隐私安全 AI 请求工具、实现私聊对话识别自动生成安排、AI 时间提取与失败引导补充、接入日历总览视图，pnpm lint/build 全部通过，日志正确写入。",
    changedFiles: [
      "src/pages/arrangement/ListScreen.tsx",
      "src/pages/ai/AiConfigScreen.tsx",
      "src/utils/aiRequest.ts",
      "src/components/CalendarView.tsx",
      "src/store/arrangementStore.ts",
      "src/data/aiConversationLog.ts"
    ],
    verification: [
      "IDE 静态检查通过（get_errors 无错误）",
      "pnpm lint 全量校验无警告无错误",
      "pnpm build 构建成功",
      "AI 配置本地存储不泄露隐私",
      "私聊对话自动生成安排功能正常",
      "时间识别成功/失败流程正常",
      "日历视图展示安排数据正确",
      "测试地址 http://127.0.0.1:5173/ 运行流畅"
    ]
  },

  // ==================== 即我 APP - 安排模块 V3.0 社交安排版 ====================
  {
    timestamp: "2026-05-17 15:02:05 CST (+0800)",
    userInput: "基于 V2.0 迭代 V3.0 社交安排能力，实现私聊双向生成、同源对话合并、提醒功能、区分三种安排类型",
    aiFinalOutput:
      "已完成「即我」APP 安排模块 V3.0 开发，实现私聊双向自动生成安排、同源对话安排自动合并且详情展示上下文、安排提醒功能、区分时间段/截止时间/纯提醒三种类型，代码规范、构建通过、日志格式正确，UI 极简无焦虑。",
    changedFiles: [
      "src/pages/arrangement/ListScreen.tsx",
      "src/pages/arrangement/DetailScreen.tsx",
      "src/store/arrangementStore.ts",
      "src/utils/reminder.ts",
      "src/types/arrangement.ts",
      "src/data/aiConversationLog.ts"
    ],
    verification: [
      "IDE 静态检查通过（get_errors 无错误）",
      "pnpm lint 代码规范 100% 符合",
      "pnpm build 完整构建无异常",
      "私聊双向生成安排功能正常",
      "同源对话自动合并无重复",
      "时间段/截止时间/纯提醒类型区分正确",
      "提醒功能触发正常",
      "详情页上下文展示完整",
      "测试地址 http://127.0.0.1:5173/ 全功能可用"
    ]
  }
];