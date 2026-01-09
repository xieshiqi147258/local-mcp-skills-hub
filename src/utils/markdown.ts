// Markdown 渲染工具
import { marked, type Tokens } from 'marked';
import hljs from 'highlight.js';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

// 配置 dayjs
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

// 配置 marked - GitHub Flavored Markdown
marked.setOptions({
  gfm: true,        // GitHub Flavored Markdown
  breaks: true,     // 换行符转为 <br>
  async: false,     // 同步渲染
});

// 自定义渲染器
const renderer = new marked.Renderer();

// 代码块高亮 - 带语言标签
renderer.code = ({ text, lang }: Tokens.Code) => {
  const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
  const highlighted = hljs.highlight(text, { language }).value;
  const langLabel = lang || 'text';
  
  // 计算行数用于行号显示
  const lines = text.split('\n');
  const lineNumbers = lines.map((_, i) => `<span class="line-number">${i + 1}</span>`).join('');
  
  return `<div class="code-block">
    <div class="code-block-header">
      <span class="code-block-lang">${langLabel}</span>
      <button class="code-block-copy" title="复制代码" aria-label="复制代码">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
    </div>
    <div class="code-block-content">
      <div class="line-numbers" aria-hidden="true">${lineNumbers}</div>
      <pre class="hljs"><code class="language-${language}">${highlighted}</code></pre>
    </div>
  </div>`;
};

// 行内代码 - 带背景色和圆角
renderer.codespan = ({ text }: Tokens.Codespan) => {
  // 转义 HTML 实体
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<code class="inline-code">${escaped}</code>`;
};

// 链接 - 新窗口打开
renderer.link = ({ href, title, text }: Tokens.Link) => {
  const titleAttr = title ? ` title="${title}"` : '';
  return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer" class="md-link">${text}</a>`;
};

// 引用块 - 左边框样式
renderer.blockquote = ({ text }: Tokens.Blockquote) => {
  return `<blockquote class="md-blockquote">${text}</blockquote>`;
};

// 表格 - 带样式
renderer.table = ({ header, rows }: Tokens.Table) => {
  const headerCells = header.map(cell => 
    `<th class="md-table-th" style="text-align: ${cell.align || 'left'}">${cell.text}</th>`
  ).join('');
  
  const bodyRows = rows.map(row => {
    const cells = row.map(cell => 
      `<td class="md-table-td" style="text-align: ${cell.align || 'left'}">${cell.text}</td>`
    ).join('');
    return `<tr class="md-table-row">${cells}</tr>`;
  }).join('');
  
  return `<div class="md-table-wrapper">
    <table class="md-table">
      <thead class="md-table-head"><tr class="md-table-row">${headerCells}</tr></thead>
      <tbody class="md-table-body">${bodyRows}</tbody>
    </table>
  </div>`;
};

// 标题 - h1-h6
renderer.heading = ({ text, depth }: Tokens.Heading) => {
  return `<h${depth} class="md-heading md-h${depth}">${text}</h${depth}>`;
};

// 段落
renderer.paragraph = ({ text }: Tokens.Paragraph) => {
  return `<p class="md-paragraph">${text}</p>`;
};

// 列表
renderer.list = ({ ordered, start, items }: Tokens.List) => {
  const tag = ordered ? 'ol' : 'ul';
  const startAttr = ordered && start !== 1 ? ` start="${start}"` : '';
  const itemsHtml = items.map(item => renderer.listitem!(item)).join('');
  return `<${tag} class="md-list md-list-${ordered ? 'ordered' : 'unordered'}"${startAttr}>${itemsHtml}</${tag}>`;
};

// 列表项
renderer.listitem = ({ text, task, checked }: Tokens.ListItem) => {
  if (task) {
    const checkedAttr = checked ? ' checked disabled' : ' disabled';
    return `<li class="md-list-item md-task-item">
      <input type="checkbox"${checkedAttr} class="md-checkbox" />
      <span>${text}</span>
    </li>`;
  }
  return `<li class="md-list-item">${text}</li>`;
};

// 水平线
renderer.hr = () => {
  return `<hr class="md-hr" />`;
};

// 粗体
renderer.strong = ({ text }: Tokens.Strong) => {
  return `<strong class="md-strong">${text}</strong>`;
};

// 斜体
renderer.em = ({ text }: Tokens.Em) => {
  return `<em class="md-em">${text}</em>`;
};

// 删除线
renderer.del = ({ text }: Tokens.Del) => {
  return `<del class="md-del">${text}</del>`;
};

// 图片
renderer.image = ({ href, title, text }: Tokens.Image) => {
  const titleAttr = title ? ` title="${title}"` : '';
  return `<img src="${href}" alt="${text}"${titleAttr} class="md-image" loading="lazy" />`;
};

marked.use({ renderer });

/**
 * 渲染 Markdown 内容为 HTML
 * @param content Markdown 字符串
 * @returns 渲染后的 HTML 字符串
 */
export function renderMarkdown(content: string): string {
  if (!content) return '';
  try {
    return marked.parse(content) as string;
  } catch (error) {
    console.error('Markdown 渲染错误:', error);
    return `<p class="md-error">内容渲染失败</p>`;
  }
}

/**
 * 格式化相对时间
 * @param timestamp 时间戳（毫秒）或 Date 对象
 * @returns 相对时间字符串（如 "刚刚"、"5分钟前"、"昨天"）
 */
export function formatRelativeTime(timestamp: number | Date): string {
  return dayjs(timestamp).fromNow();
}

/**
 * 格式化精确时间
 * @param timestamp 时间戳（毫秒）或 Date 对象
 * @param format 格式字符串，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的时间字符串
 */
export function formatExactTime(timestamp: number | Date, format = 'YYYY-MM-DD HH:mm:ss'): string {
  return dayjs(timestamp).format(format);
}

/**
 * 判断是否为今天
 * @param timestamp 时间戳（毫秒）或 Date 对象
 */
export function isToday(timestamp: number | Date): boolean {
  return dayjs(timestamp).isSame(dayjs(), 'day');
}

/**
 * 判断是否为昨天
 * @param timestamp 时间戳（毫秒）或 Date 对象
 */
export function isYesterday(timestamp: number | Date): boolean {
  return dayjs(timestamp).isSame(dayjs().subtract(1, 'day'), 'day');
}

/**
 * 获取日期分组标签
 * @param timestamp 时间戳（毫秒）或 Date 对象
 * @returns 分组标签（如 "今天"、"昨天"、"2024-01-15"）
 */
export function getDateGroupLabel(timestamp: number | Date): string {
  if (isToday(timestamp)) return '今天';
  if (isYesterday(timestamp)) return '昨天';
  return dayjs(timestamp).format('YYYY-MM-DD');
}

// 导出 highlight.js 和 dayjs 供外部使用
export { default as hljs } from 'highlight.js';
export { default as dayjs } from 'dayjs';
