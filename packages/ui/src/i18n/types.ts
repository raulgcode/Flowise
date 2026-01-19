import 'i18next'
import en from './locales/en'

export type TranslationKeys = keyof typeof en

declare module 'i18next' {
    interface CustomTypeOptions {
        defaultNS: 'translation'
        resources: {
            translation: typeof en
        }
        returnNull: false
    }
}
