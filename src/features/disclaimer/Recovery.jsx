import React from "react";
import { useTranslation } from "react-i18next";

import Disclaimer from "./Disclaimer";

export default function Recovery() {
  const { t } = useTranslation("disclaimer");

  return(
    <Disclaimer
      lines={[
        t("line1"),
        t("line2"),
        t("line3"),
      ]}
      title={t("title")}
    />
  );
}
