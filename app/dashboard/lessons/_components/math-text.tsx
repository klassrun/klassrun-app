'use client'
// app/dashboard/lessons/_components/math-text.tsx
// batch-3-phase-1-5-math-text
//
// Renders text containing LaTeX math delimited by $...$ (inline) and
// $$...$$ (block) using KaTeX. Falls back gracefully on parse errors:
// the offending expression renders in red as raw text instead of crashing
// the whole document.

import katex from 'katex'

type Part = { type: 'text' | 'inline' | 'block'; value: string }

export function MathText({ text }: { text: string | null | undefined }) {
  if (!text) return null
  const parts = splitMath(text)
  return (
    <>
      {parts.map((p, i) => {
        if (p.type === 'text') {
          return <span key={i}>{p.value}</span>
        }
        const html = renderMathHtml(p.value, p.type === 'block')
        return (
          <span
            key={i}
            className={p.type === 'block' ? 'katex-block-wrap' : ''}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )
      })}
    </>
  )
}

function renderMathHtml(expr: string, displayMode: boolean): string {
  try {
    return katex.renderToString(expr, {
      displayMode,
      throwOnError: false,
      errorColor: '#dc2626',
      output: 'html',
      strict: 'ignore',
    })
  } catch {
    return `<span style="color:#dc2626">${escapeHtml(expr)}</span>`
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// Split first on $$...$$ (block), then within text segments on $...$ (inline).
// Block math is allowed to span newlines; inline math is not.
function splitMath(input: string): Part[] {
  const parts: Part[] = []
  const blockRe = /\$\$([\s\S]+?)\$\$/g
  let lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = blockRe.exec(input)) !== null) {
    if (m.index > lastIndex) {
      for (const p of splitInline(input.slice(lastIndex, m.index))) parts.push(p)
    }
    parts.push({ type: 'block', value: m[1].trim() })
    lastIndex = m.index + m[0].length
  }
  if (lastIndex < input.length) {
    for (const p of splitInline(input.slice(lastIndex))) parts.push(p)
  }
  return parts
}

function splitInline(input: string): Part[] {
  const parts: Part[] = []
  // No newline inside inline math; require non-empty body.
  const inlineRe = /\$([^$\n]+?)\$/g
  let lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = inlineRe.exec(input)) !== null) {
    if (m.index > lastIndex) {
      parts.push({ type: 'text', value: input.slice(lastIndex, m.index) })
    }
    parts.push({ type: 'inline', value: m[1].trim() })
    lastIndex = m.index + m[0].length
  }
  if (lastIndex < input.length) {
    parts.push({ type: 'text', value: input.slice(lastIndex) })
  }
  return parts
}
