import { marked } from 'marked';
const files = import.meta.glob('../../content/posts/*.json', { eager: true, import: 'default' });
const posts = Object.values(files).filter(p => !p.draft).sort((a,b) => a.order-b.order);
const paths = new Set();
for (const post of posts) {
  if (!/^\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+(?:\.html|\/)$/.test(post.path) || paths.has(post.path)) throw new Error(`Invalid or duplicate article URL: ${post.path}`);
  paths.add(post.path);
  if (post.format !== 'html') post.body = marked.parse(post.body || '');
}
export default posts;
