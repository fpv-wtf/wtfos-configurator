import React, {
  useCallback,
  useState,
} from "react";
import i18next from "i18next";

import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";

import settings from "../../settings.json";

import { loadLanguage } from "../../utils/LocalStorage";

export default function LanguageSwitcher() {
  const [activeLanguage, setActiveLanguage] = useState(loadLanguage());
  const languages = Object.keys(settings.availableLanguages);
  const options = languages.map((item) => {
    const name = settings.availableLanguages[item];
    return(
      <MenuItem
        key={item}
        value={item}
      >
        {name}
      </MenuItem>
    );
  });

  const handleChange = useCallback((e) => {
    const language = e.target.value;
    setActiveLanguage(language);
    console.log("change language", language);
    localStorage.setItem("language", language);
    i18next.changeLanguage(language);
  }, [setActiveLanguage]);

  return (
    <Select
      onChange={handleChange}
      sx={{ marginLeft: 2 }}
      value={activeLanguage}
    >
      {options}
    </Select>
  );
}
