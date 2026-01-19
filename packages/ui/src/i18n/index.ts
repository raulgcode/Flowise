import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en'
import es from './locales/es'
import './types'

export const supportedLanguages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' }
] as const

export type SupportedLanguage = (typeof supportedLanguages)[number]['code']

const resources = {
    en: {
        translation: en
    },
    es: {
        translation: es
    }
}

const savedLanguage = localStorage.getItem('language') || 'en'

i18n.use(initReactI18next).init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false
    }
})

export default i18n
