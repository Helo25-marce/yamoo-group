import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import { driveExtraEn, driveExtraFr } from "../drive/i18n"
import { messages } from "./messages"

function withDrive<T extends { drive: { err: object } }>(tree: T, extra: typeof driveExtraFr) {
  return { ...tree, drive: { ...tree.drive, f: extra.f, sc: extra.sc, err: { ...tree.drive.err, ...extra.err } } }
}

void i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: withDrive(messages.fr, driveExtraFr) },
    en: { translation: withDrive(messages.en, driveExtraEn) },
  },
  lng: "fr",
  fallbackLng: "fr",
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
})

export default i18n
