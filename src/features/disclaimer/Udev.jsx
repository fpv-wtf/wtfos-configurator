import React from "react";
import { useTranslation } from "react-i18next";

import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";

import CodeBlock from "../CodeBlock/CodeBlock";

export default function Udev() {
  const { t } = useTranslation("udev");

  return(
    <Alert severity="warning">
      <Typography sx={{ fontWeight: "bold" }}>
        {t("udevTitle")}
      </Typography>

      <Typography>
        {t("udevText")}
      </Typography>

      <CodeBlock
        content={"SUBSYSTEM==\"usb\", ATTR{idVendor}==\"2ca3\", ATTR{idProduct}==\"001f\", MODE=\"0660\", GROUP=\"plugdev\""}
      />

      <Typography>
        {t("udevCreate")}
      </Typography>

      <CodeBlock
        content={"sudo printf \"## rules for DJI device \\nSUBSYSTEM==\\\"usb\\\", ATTR{idVendor}==\\\"2ca3\\\", ATTR{idProduct}==\\\"001f\\\", MODE=\\\"0660\\\", GROUP=\\\"plugdev\\\"\" > /etc/udev/rules.d/51-dji-adb.rules"}
      />

      <Typography>
        {t("udevRestart")}
      </Typography>

      <CodeBlock
        content="sudo udevadm control --reload-rules && sudo udevadm trigger"
      />
    </Alert>
  );
}
