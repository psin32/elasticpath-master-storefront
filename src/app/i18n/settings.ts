export const fallbackLng = 'en'
export const languages = [fallbackLng, 'fr', 'de', 'it']
export const defaultNS = 'header'
export const cookieName = 'locale'

export function getOptions(lng = fallbackLng, ns = defaultNS) {
  return {
    supportedLngs: languages,
    fallbackLng,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns,
  }
}