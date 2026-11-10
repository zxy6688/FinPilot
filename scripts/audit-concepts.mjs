/**
 * Read-only content audit for Concept Studio. Run: node scripts/audit-concepts.mjs
 * It checks structural integrity and exports a manual content review checklist;
 * it does NOT certify financial content accuracy or mastery progress.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = name => JSON.parse(fs.readFileSync(path.join(root, 'content', name), 'utf8'));
const knowledge = read('knowledge.json');
const lessons = read('lessons.json');
const quizzes = read('quizzes.json');
const arr = Array.isArray(quizzes) ? quizzes : quizzes.quizzes || [];
const ids = knowledge.concepts.map(c => c.id);
const idSet = new Set(ids);
const lessonIds = new Set(lessons.map(l => l.id));
const quizIds = new Set(arr.map(q => q.id));
const domainSet = new Set(knowledge.domains.map(d => d.id));
const errors = [];
const warnings = [];
const fail = (id, msg) => errors.push(`概念 ${id}: ${msg}`);
const caution = (id, msg) => warnings.push(`概念 ${id}: ${msg}`);
const validInternal = path => typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');
const counts = new Map();
for (const domain of knowledge.domains) for (const id of domain.concept_ids || []) counts.set(id, (counts.get(id) || 0) + 1);
for (const c of knowledge.concepts) {
  const id = c.id;
  if (!domainSet.has(c.domain)) fail(id, `未知所属领域 ${c.domain}`);
  if (counts.get(id) !== 1) fail(id, `领域目录中出现 ${counts.get(id) || 0} 次（应当恰好一次）`);
  if (!c.title?.trim() || !c.summary?.trim() || !c.explain?.trim()) fail(id, '术语、摘要或解释缺失');
  for (const k of ['example','misunderstanding','boundary','source_note','origin']) if (!c[k]?.trim()) caution(id, `${k} 缺失`);
  if (!Array.isArray(c.diagram) || c.diagram.length !== 3 || c.diagram.some(x => !x?.trim())) fail(id, '关系图节点不完整');
  if (!c.quiz || !Array.isArray(c.quiz.options) || c.quiz.options.length < 2) fail(id, '即时题缺少选项');
  else if (!Number.isInteger(c.quiz.correct_answer) || c.quiz.correct_answer < 0 || c.quiz.correct_answer >= c.quiz.options.length) fail(id, '正确答案越界');
  if (!c.quiz?.explanation?.trim()) fail(id, '即时题缺少解释');
  if (c.quiz?.id !== undefined && !quizIds.has(c.quiz.id)) caution(id, `映射原题 ${c.quiz.id} 在 quizzes.json 中找不到`);
  for (const lessonId of c.lesson_ids || []) if (!lessonIds.has(lessonId)) fail(id, `关联不存在的课程 ${lessonId}`);
  for (const relatedId of c.related || []) if (!idSet.has(relatedId)) fail(id, `关联不存在的概念 ${relatedId}`);
  if (!idSet.has(c.prerequisite)) caution(id, `前置概念 ${c.prerequisite} 未找到`);
  if (!validInternal(c.story) || !validInternal(c.tool)) caution(id, '关联专题或工具站内地址异常');
  try { const url = new URL(c.reference?.url); if (!['https:', 'http:'].includes(url.protocol)) throw new Error(); } catch { caution(id, '参考来源网址格式异常'); }
}
if (ids.length !== idSet.size) errors.push('概念 ID 存在重复');
if (knowledge.concepts.length !== 36) warnings.push(`预期 36 个概念，实际 ${knowledge.concepts.length}`);
if (knowledge.domains.length !== 6) warnings.push(`预期 6 个领域，实际 ${knowledge.domains.length}`);
if (lessons.length !== 28) warnings.push(`预期 28 节课程，实际 ${lessons.length}`);
if (arr.length !== 64) warnings.push(`预期 64 道题，实际 ${arr.length}`);
const reviewHeader = ['id','名称','领域','关联课程','即时题有正式id','机制图人工核对','专业术语人工核对','示例金额人工核对','错项解释人工核对','来源与链接核对','适用边界核对','手机端验收','状态'];
const escape = v => `"${String(v ?? '').replaceAll('"','""')}"`;
const reviewRows = knowledge.concepts.map(c => [c.id,c.title,c.domain,(c.lesson_ids||[]).join('|'),c.quiz?.id == null?'否':'是', ...Array(7).fill('待审'), '未验收']);
const outFile = path.join(root, 'docs', 'concept-br', 'C5-36概念人工核验表.csv');
fs.mkdirSync(path.dirname(outFile), { recursive: true });
if (!fs.existsSync(outFile)) fs.writeFileSync(outFile, '\uFEFF' + [reviewHeader,...reviewRows].map(row=>row.map(escape).join(',')).join('\n') + '\n','utf8');
console.log(`内容基线：领域 ${knowledge.domains.length}，概念 ${knowledge.concepts.length}，课程 ${lessons.length}，原题 ${arr.length}；映射正式原题 ${knowledge.concepts.filter(c=>c.quiz?.id!==undefined).length}`);
console.log(`人工审核清单：${outFile}`);
for (const x of errors) console.error('ERROR', x);
for (const x of warnings) console.warn('WARN',x);
if (errors.length) process.exitCode = 1;
