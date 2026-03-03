type Converter = (text: string) => string

const identityConverter: Converter = (text) => text
let converterPromise: Promise<Converter> | null = null

const MANUAL_REPLACEMENTS: Array<[RegExp, string]> = [
  [/妳/g, '你'],
  [/祢/g, '你'],
]

function applyManualReplacements(text: string): string {
  return MANUAL_REPLACEMENTS.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    text
  )
}

async function getTraditionalToSimplifiedConverter(): Promise<Converter> {
  if (converterPromise) return converterPromise

  converterPromise = import('opencc-js')
    .then((openCC) => openCC.Converter({ from: 't', to: 'cn' }))
    .catch(() => identityConverter)

  return converterPromise
}

/**
 * 将文本从繁体中文转换为简体中文。
 * 转换器按需动态加载，避免增加首页首屏体积。
 */
export async function toSimplifiedChinese(text: string): Promise<string> {
  if (!text) return ''

  try {
    const converter = await getTraditionalToSimplifiedConverter()
    return applyManualReplacements(converter(text))
  } catch {
    return text
  }
}

