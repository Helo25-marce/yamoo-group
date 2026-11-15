import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import { messages } from "./messages"

void i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: messages.fr },
    en: { translation: messages.en },
  },
  lng: "fr",
  fallbackLng: "fr",
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
})

export default i18n
