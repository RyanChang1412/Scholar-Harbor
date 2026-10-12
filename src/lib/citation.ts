import type { Paper } from '../domain/paper'

function bibValue(value: string) {
  return value.replaceAll(/[{}]/g, '').replaceAll('&', '\\&')
}

export function createBibTeX(paper: Paper) {
  const year = new Date(paper.publishedAt).getUTCFullYear()
  const firstAuthor = paper.authors[0]?.split(/\s+/).at(-1) ?? 'unknown'
  const key = `${firstAuthor.toLowerCase().replaceAll(/[^a-z0-9]/g, '')}${year}`
  const fields = [
    `  title = {${bibValue(paper.title)}}`,
    `  author = {${paper.authors.map(bibValue).join(' and ')}}`,
    `  year = {${year}}`,
    `  eprint = {${paper.arxivId.replace(/v\d+$/, '')}}`,
    '  archivePrefix = {arXiv}',
    ...(paper.doi ? [`  doi = {${bibValue(paper.doi)}}`] : []),
  ]
  return `@article{${key},\n${fields.join(',\n')}\n}`
}
