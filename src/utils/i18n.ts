export type Language = 'zh-CN';

export const translations = {
  'zh-CN': {
    'nav.home': '返回 首页',
    'nav.theme': '主题',
    'nav.share': '分享',
    'nav.icon': '图标',
    'nav.refresh': '刷新',
    'nav.updating': '正在更新...',
    'nav.not_updated': '尚未更新',
    'nav.updated_at': '更新于 {time}',
    'hero.title': '查看任意用户的学习数据',
    'hero.subtitle': '无需登录 · 输入用户名 · 秒速生成仪表盘',
    'hero.label': '多邻国用户名 / ID',
    'hero.placeholder': '输入用户名…',
    'hero.submit': '查看学习数据 →',
    'hero.redirecting': '正在跳转…',
    'hero.examples': '试试这些用户：',
    'hero.footer': 'DuoView 是非官方工具，与 Duolingo 公司无关 · 数据来自公开的多邻国 API',
    'dash.distribution': '语言分布',
    'dash.total_courses': '共 {count} 门课程',
    'dash.overview': '今日概览',
    'dash.recent_xp': '最近 7 天经验',
    'dash.recent_time': '最近 7 天学习时间',
    'dash.total_xp': '总经验',
    'dash.account_age': '账号年龄',
    'dash.streak': '连胜天数',
    'dash.study_time': '学习分钟',
    'dash.estimated_time': '预估投入时间',
    'dash.learning_courses': '学习课程',
    'dash.today_xp': '今日 XP',
    'dash.today_lessons': '今日课程',
    'dash.heatmap': '年度学习热力图',
    'dash.user_data': '{username} 的学习数据',
    'dash.fetching': '正在获取 {username} 的学习数据...',
    'dash.loading_tip': '（首次加载约需 5~10 秒）',
    'dash.loading_label': '加载中',
    'dash.joined_days': '已加入多邻国 {days} 天',
    'dash.learning_focus': '当前重点：{language}',
    'dash.sharing_title': '正在为您生成分享图...',
    'dash.sharing_tip': '为了保证图表完整，请稍等片刻',
    'error.back': '返回首页',
    'error.user_not_found': '找不到该用户',
    'error.user_not_found_tip': '用户名 {username} 不存在，或该用户资料已设置为私密。',
    'error.reenter': '重新输入用户名',
    'theme.light': '浅色',
    'theme.dark': '深色',
    'theme.system': '系统',
    'unit.hour': '小时',
    'unit.minute': '分钟',
    'unit.day': '天',
    'unit.year': '年',
    'status.loading': '正在加载数据...',
    'status.error': '数据加载失败',
    'status.no_data': '暂无数据',
  }
};

/**
 * 获取系统语言
 * 已关闭监听，固定返回 zh-CN
 */
export function getSystemLanguage(): Language {
  return 'zh-CN';
}


/**
 * 翻译函数
 */
export function t(key: keyof typeof translations['zh-CN'], params?: Record<string, any>): string {
  const lang = getSystemLanguage();
  let text = translations[lang][key] || key;
  
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
  }
  
  return text;
}

