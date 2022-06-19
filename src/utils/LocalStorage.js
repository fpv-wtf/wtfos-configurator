import settings from "../settings.json";

const {
  availableLanguages,
  defaultLanguage,
} = settings;

function loadLanguage() {
  let storedLanguage = localStorage.getItem("language");
  if(!storedLanguage) {
    const browserLanguage = (navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage;
    if(browserLanguage) {
      for(let [, value] of Object.entries(availableLanguages)) {
        if(value.value === browserLanguage) {
          storedLanguage = browserLanguage;
          break;
        }
      }

      if(!storedLanguage && browserLanguage.split("-").length > 1) {
        const part = browserLanguage.split("-")[0];
        for(let [, value] of Object.entries(availableLanguages)) {
          if(value.value === part) {
            storedLanguage = part;
            break;
          }
        }
      }
    }
  }

  return(storedLanguage || defaultLanguage);
}

export {
  loadLanguage,
};
