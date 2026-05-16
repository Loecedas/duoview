export type Language = 'zh-CN' | 'en-US';

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
    'theme.light': '浅色',
    'theme.dark': '深色',
    'theme.system': '系统',
    'unit.hour': '小时',
    'unit.minute': '分钟',
    'unit.day': '天',
    'unit.year': '年',
    'status.loading': '正在加载数据...',
    'status.error': '数据加载失败',
  },
  'en-US': {
    'nav.home': 'Home',
    'nav.theme': 'Theme',
    'nav.share': 'Share',
    'nav.icon': 'Icon',
    'nav.refresh': 'Refresh',
    'nav.updating': 'Updating...',
    'nav.not_updated': 'Not updated',
    'nav.updated_at': 'Updated at {time}',
    'dash.distribution': 'Language Distribution',
    'dash.total_courses': '{count} Courses Total',
    'dash.overview': 'Daily Overview',
    'dash.recent_xp': 'Last 7 Days XP',
    'dash.recent_time': 'Last 7 Days Learning Time',
    'dash.total_xp': 'Total XP',
    'dash.account_age': 'Account Age',
    'dash.streak': 'Day Streak',
    'dash.study_time': 'Study Minutes',
    'dash.estimated_time': 'Estimated Time',
    'dash.learning_courses': 'Courses',
    'dash.today_xp': 'Today XP',
    'dash.today_lessons': 'Today Lessons',
    'dash.heatmap': 'Annual Learning Heatmap',
    'dash.user_data': "{username}'s Learning Data",
    'dash.fetching': 'Fetching {username}\'s Learning Data...',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.system': 'System',
    'unit.hour': 'h',
    'unit.minute': 'm',
    'unit.day': 'd',
    'unit.year': 'y',
    'status.loading': 'Loading data...',
    'status.error': 'Failed to load data',
  }
};

/**
 * 获取系统语言
 */
export function getSystemLanguage(): Language {
  if (typeof navigator === 'undefined') return 'zh-CN';
  const lang = navigator.language || (navigator as any).userLanguage;
  return lang.startsWith('zh') ? 'zh-CN' : 'en-US';
}

/**
 * 翻译函数
 */
export function t(key: keyof typeof translations['zh-CN'], params?: Record<string, any>): string {
  const lang = getSystemLanguage();
  let text = translations[lang][key] || translations['zh-CN'][key] || key;
  
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
  }
  
  return text;
}
