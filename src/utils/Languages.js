import i18next from "i18next";
import settings from "../settings.json";

import { loadLanguage } from "./LocalStorage";

const initializeLanguages = () => {
  const languages = settings.availableLanguages;
  const languageKeys = Object.keys(languages);
  const translationFiles = [
    "about",
    "claimed",
    "cli",
    "common",
    "cookie",
    "disclaimer",
    "donate",
    "error",
    "healthcheck",
    "home",
    "navigation",
    "osdOverlay",
    "package",
    "packages",
    "root",
    "settings",
    "setup",
    "startup",
    "udev",
  ];

  const resources = {};
  for(const language of languageKeys) {
    resources[language] = {};
    for(const file of translationFiles) {
      resources[language][file] =  require(`../translations/${language}/${file}.json`);
    }
  }

  i18next.init({
    interpolation: { escapeValue: false },
    lng: loadLanguage(),
    fallbackLng: settings.defaultLanguage,
    resources,
  });

  return i18next;
};

export {
  initializeLanguages,
};
