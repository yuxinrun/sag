import { defineConfig } from 'vitepress'

const repo = 'https://github.com/yuxinrun/sag'
const officialRepo = 'https://github.com/Zleap-AI/SAG'
const officialWiki = 'https://sag.wiki/'
const benchmarkRepo = 'https://github.com/Zleap-AI/SAG-Benchmark'
const paperLink = 'https://arxiv.org/abs/2606.15971'
const agentSite = 'https://yuxinrun.github.io/better-agent/'
const mcpSite = 'https://github.com/yuxinrun/mcp-patterns'
const base = process.env.BASE ?? '/'

const zhSidebar = [
  {
    text: '开始',
    collapsed: false,
    items: [
      { text: '什么是 SAG', link: '/guide/what-is-sag' },
      { text: '为什么需要 SAG', link: '/guide/why-sag' },
      { text: '15 分钟跑通', link: '/guide/quickstart' }
    ]
  },
  {
    text: '架构',
    collapsed: false,
    items: [
      { text: '事件-实体索引', link: '/architecture/data-model' },
      { text: '离线与在线管线', link: '/architecture/pipeline' },
      { text: '查询时动态超边', link: '/architecture/dynamic-hyperedge' },
      { text: '证据边界与引用', link: '/architecture/evidence-boundary' }
    ]
  },
  {
    text: '论文与基准',
    collapsed: false,
    items: [
      { text: '论文解读', link: '/paper/paper' },
      { text: '基准与复现', link: '/paper/benchmarks' }
    ]
  },
  {
    text: '工程',
    collapsed: false,
    items: [
      { text: '开源实现架构', link: '/engineering/implementation' },
      { text: '检索模式与预算', link: '/engineering/retrieval-modes' },
      { text: '生产部署与安全', link: '/engineering/production' },
      { text: '评测与可观测', link: '/engineering/evaluation' }
    ]
  },
  {
    text: '集成',
    collapsed: false,
    items: [
      { text: 'MCP 与 Agent Skill', link: '/integrations/mcp-skill' },
      { text: 'API 与 Python 引擎', link: '/integrations/api' }
    ]
  },
  {
    text: '争议与边界',
    collapsed: false,
    items: [{ text: '相关工作与四点质疑', link: '/critical/debate' }]
  },
  {
    text: '调试排坑',
    collapsed: false,
    items: [{ text: '故障排查清单', link: '/debugging/pitfalls' }]
  },
  {
    text: '关于',
    collapsed: false,
    items: [
      { text: '资料与出处', link: '/resources' },
      { text: '关于本站', link: '/about' }
    ]
  }
]

const enSidebar = [
  {
    text: 'Start',
    collapsed: false,
    items: [
      { text: 'What is SAG', link: '/en/guide/what-is-sag' },
      { text: 'Why SAG', link: '/en/guide/why-sag' },
      { text: 'Run it in 15 min', link: '/en/guide/quickstart' }
    ]
  },
  {
    text: 'Architecture',
    collapsed: false,
    items: [
      { text: 'Event-entity index', link: '/en/architecture/data-model' },
      { text: 'Offline & online pipeline', link: '/en/architecture/pipeline' },
      { text: 'Query-time hyperedges', link: '/en/architecture/dynamic-hyperedge' },
      { text: 'Evidence boundary', link: '/en/architecture/evidence-boundary' }
    ]
  },
  {
    text: 'Paper & benchmarks',
    collapsed: false,
    items: [
      { text: 'Reading the paper', link: '/en/paper/paper' },
      { text: 'Benchmarks & reproduction', link: '/en/paper/benchmarks' }
    ]
  },
  {
    text: 'Engineering',
    collapsed: false,
    items: [
      { text: 'Reference implementation', link: '/en/engineering/implementation' },
      { text: 'Retrieval modes & budgets', link: '/en/engineering/retrieval-modes' },
      { text: 'Production & security', link: '/en/engineering/production' },
      { text: 'Evaluation & observability', link: '/en/engineering/evaluation' }
    ]
  },
  {
    text: 'Integrations',
    collapsed: false,
    items: [
      { text: 'MCP & Agent Skill', link: '/en/integrations/mcp-skill' },
      { text: 'API & Python engine', link: '/en/integrations/api' }
    ]
  },
  {
    text: 'Debate',
    collapsed: false,
    items: [{ text: 'Related work & four critiques', link: '/en/critical/debate' }]
  },
  {
    text: 'Debug',
    collapsed: false,
    items: [{ text: 'Failure checklist', link: '/en/debugging/pitfalls' }]
  },
  {
    text: 'About',
    collapsed: false,
    items: [
      { text: 'Sources', link: '/en/resources' },
      { text: 'About', link: '/en/about' }
    ]
  }
]

const zhNav = [
  { text: '基础', link: '/guide/what-is-sag', activeMatch: '/guide/' },
  { text: '架构', link: '/architecture/data-model', activeMatch: '/architecture/' },
  { text: '论文', link: '/paper/paper', activeMatch: '/paper/' },
  { text: '工程', link: '/engineering/implementation', activeMatch: '/engineering/' },
  { text: '集成', link: '/integrations/mcp-skill', activeMatch: '/integrations/' },
  {
    text: '更多',
    items: [
      { text: '争议与边界', link: '/critical/debate' },
      { text: '调试排坑', link: '/debugging/pitfalls' },
      { text: '资料与出处', link: '/resources' },
      { text: '关于本站', link: '/about' },
      { text: '官方文档 sag.wiki ↗', link: officialWiki, target: '_blank', rel: 'noopener' },
      { text: '官方仓库 Zleap-AI/SAG ↗', link: officialRepo, target: '_blank', rel: 'noopener' },
      { text: '姊妹站：构建更好的 Agent ↗', link: agentSite, target: '_blank', rel: 'noopener' },
      { text: '姊妹站：MCP Patterns ↗', link: mcpSite, target: '_blank', rel: 'noopener' }
    ]
  }
]

const enNav = [
  { text: 'Basics', link: '/en/guide/what-is-sag', activeMatch: '/en/guide/' },
  { text: 'Architecture', link: '/en/architecture/data-model', activeMatch: '/en/architecture/' },
  { text: 'Paper', link: '/en/paper/paper', activeMatch: '/en/paper/' },
  { text: 'Engineering', link: '/en/engineering/implementation', activeMatch: '/en/engineering/' },
  { text: 'Integrations', link: '/en/integrations/mcp-skill', activeMatch: '/en/integrations/' },
  {
    text: 'More',
    items: [
      { text: 'Debate & limits', link: '/en/critical/debate' },
      { text: 'Failure checklist', link: '/en/debugging/pitfalls' },
      { text: 'Sources', link: '/en/resources' },
      { text: 'About', link: '/en/about' },
      { text: 'Official docs sag.wiki ↗', link: officialWiki, target: '_blank', rel: 'noopener' },
      { text: 'Official repo Zleap-AI/SAG ↗', link: officialRepo, target: '_blank', rel: 'noopener' },
      { text: 'Sister site: Better Agents ↗', link: agentSite, target: '_blank', rel: 'noopener' },
      { text: 'Sister site: MCP Patterns ↗', link: mcpSite, target: '_blank', rel: 'noopener' }
    ]
  }
]

const brandFooter = (slogan: string, alt: string) =>
  `<span class="mp-footer-brand"><img src="${base}yuxin-run.png" alt="${alt}" width="546" height="363" /><span>${slogan}</span></span>`

export default defineConfig({
  title: 'SAG',
  description:
    'SAG（SQL-Retrieval Augmented Generation）：事件-实体索引与查询时动态超边。写给 Agent 开发工程师的进阶手册，基于 arXiv:2606.15971 与 Zleap-AI/SAG 开源实现。',
  base,
  lang: 'zh-CN',
  appearance: true,
  lastUpdated: true,
  metaChunk: true,
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }],
    ['meta', { name: 'theme-color', content: '#f6f4ee', media: '(prefers-color-scheme: light)' }],
    ['meta', { name: 'theme-color', content: '#06100e', media: '(prefers-color-scheme: dark)' }],
    ['meta', { name: 'author', content: '鱼心快跑' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'SAG｜事件-实体索引与查询时动态超边' }],
    [
      'meta',
      {
        property: 'og:description',
        content: '不建全局图：把 chunk 写成一个事件加一组实体，查询时用 SQL 现场连出局部超边。非官方进阶教程。'
      }
    ],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }]
  ],
  markdown: {
    theme: { light: 'github-dark', dark: 'github-dark' },
    lineNumbers: false,
    image: { lazyLoading: true }
  },
  themeConfig: {
    logo: { light: '/logo.svg', dark: '/logo-dark.svg' },
    siteTitle: 'SAG',
    nav: zhNav,
    sidebar: zhSidebar,
    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    lastUpdated: { text: '最后更新于', formatOptions: { dateStyle: 'short', timeStyle: 'short' } },
    editLink: { pattern: `${repo}/edit/main/docs/:path`, text: '在 GitHub 上编辑此页' },
    socialLinks: [{ icon: 'github', link: repo }],
    footer: {
      message: brandFooter('鱼心快跑，Bug 追不上', '鱼心快跑'),
      copyright: '© 2026 鱼心快跑 · SAG 进阶手册（非官方）· 论文与基准以官方为准'
    },
    search: {
      provider: 'local',
      options: {
        detailedView: true,
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
          modal: {
            displayDetails: '显示详情',
            resetButtonTitle: '清除查询',
            backButtonTitle: '返回',
            noResultsText: '没有找到结果',
            footer: {
              selectText: '选择',
              selectKeyAriaLabel: '回车',
              navigateText: '切换',
              navigateUpKeyAriaLabel: '上箭头',
              navigateDownKeyAriaLabel: '下箭头',
              closeText: '关闭',
              closeKeyAriaLabel: 'Esc'
            }
          }
        }
      }
    },
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    langMenuLabel: '切换语言',
    notFound: {
      title: '页面不存在',
      quote: '这个查询没有可组装的局部超边。回到首页重新规划。',
      linkText: '返回首页'
    }
  },
  locales: {
    root: { label: '简体中文', lang: 'zh-CN' },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      title: 'SAG',
      description:
        'An advanced, unofficial handbook on SAG: event-entity indexing and query-time dynamic hyperedges (arXiv:2606.15971).',
      themeConfig: {
        nav: enNav,
        sidebar: enSidebar,
        outline: { level: [2, 3], label: 'On this page' },
        docFooter: { prev: 'Previous', next: 'Next' },
        lastUpdated: { text: 'Updated', formatOptions: { dateStyle: 'short', timeStyle: 'short' } },
        editLink: { pattern: `${repo}/edit/main/docs/:path`, text: 'Edit this page on GitHub' },
        footer: {
          message: brandFooter('Run, Yuxin, run. Bugs cannot catch you.', 'Yuxin Runs'),
          copyright: '© 2026 Yuxin Runs · SAG handbook (unofficial) · official sources take precedence'
        },
        search: {
          provider: 'local',
          options: {
            detailedView: true,
            translations: {
              button: { buttonText: 'Search docs', buttonAriaLabel: 'Search docs' }
            }
          }
        },
        returnToTopLabel: 'Return to top',
        sidebarMenuLabel: 'Menu',
        darkModeSwitchLabel: 'Appearance',
        lightModeSwitchTitle: 'Switch to light theme',
        darkModeSwitchTitle: 'Switch to dark theme',
        langMenuLabel: 'Change language',
        notFound: {
          title: 'Page not found',
          quote: 'No local hyperedge could be assembled for this query. Head back and re-plan.',
          linkText: 'Go home'
        }
      }
    }
  },
  transformHead({ pageData }) {
    const title = pageData.frontmatter.title
      ? `${pageData.frontmatter.title} | SAG`
      : 'SAG｜事件-实体索引与查询时动态超边'
    return [['meta', { property: 'og:title', content: title }]]
  }
})
