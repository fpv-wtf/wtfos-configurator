import React from "react";
import { useTranslation } from "react-i18next";

import Disclaimer from "./Disclaimer";

export default function Recovery() {
  const { t } = useTranslation("disclaimer");

  return(
    <Disclaimer
      lines={[t("recoveryText")]}
      title={t("recoveryTitle")}
    />
  );
}
