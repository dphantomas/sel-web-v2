import 'server-only'

const dictionaries = {
  es: () => import('./locales/es.json').then((module) => module.default),
  en: () => import('./locales/en.json').then((module) => module.default),
}

export type Locale = keyof typeof dictionaries

export const getDictionary = async (locale: Locale) => {
  return dictionaries[locale]?.() ?? dictionaries.es()
}
