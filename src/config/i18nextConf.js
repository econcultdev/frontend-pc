import i18n from 'i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { Subject } from 'rxjs';

import global_es from '../translations/es/global.json'
import global_en from '../translations/en/global.json'

import EnglishSvg from '../assets/languages/english.svg';
import SpanishSvg from '../assets/languages/spanish.svg';

const language = 'es';
const availableLanguages = ['en', 'es', 'cat'];

export const languagesOptions = [
    { value: 'en', label: 'English', icon: EnglishSvg },
    { value: 'es', label: 'Español', icon: SpanishSvg }
];

i18n
    .use(Backend) // load translations using http (default public/assets/locals/en/translations)
    .use(LanguageDetector) // detect user language
    .init({
        language, // fallback language is english.
        detection: {
            checkWhitelist: true, // options for language detection
        },
        debug: false,
        whitelist: availableLanguages,
        interpolation: {
            escapeValue: false, // no need for react. it escapes by default
        },
        lng: language,
        resources: {
            es: {
                global: global_es
            },
            en: {
                global: global_en
            }
        },
        react: {
            useSuspense: false
        }
    });

export default i18n;

const subject = new Subject();

export const languageService = {
    set: language => subject.next({ language: language }),
    clear: () => subject.next(),
    get: () => subject.asObservable()
};