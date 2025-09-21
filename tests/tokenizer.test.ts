import { expect, test } from 'vitest'
import { CodeTokenizer } from '../src/core/tokenizer.js'

test('tokenize JavaScript code', () => {
  const code = 'function test() { return 42; }'
  const tokens = CodeTokenizer.tokenize(code, 'javascript')
  expect(tokens).toContain('function')
  expect(tokens).toContain('test')
  expect(tokens).toContain('return')
})

test('normalize code content', () => {
  const code = 'function test() {\n  return 42;\n}'
  const normalized = CodeTokenizer.normalize(code, 'javascript')
  expect(normalized).toContain('FUNC')
})

test('detect language from filepath', () => {
  expect(CodeTokenizer.detectLanguage('test.js')).toBe('javascript')
  expect(CodeTokenizer.detectLanguage('test.py')).toBe('python')
  expect(CodeTokenizer.detectLanguage('test.unknown')).toBe('unknown')
})

test('generate content hash', () => {
  const hash1 = CodeTokenizer.hash('hello world')
  const hash2 = CodeTokenizer.hash('hello world')
  const hash3 = CodeTokenizer.hash('different content')
  
  expect(hash1).toBe(hash2)
  expect(hash1).not.toBe(hash3)
  expect(hash1).toHaveLength(16)
})