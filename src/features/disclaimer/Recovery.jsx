import React from "react";

import Disclaimer from "./Disclaimer";

export default function Recovery() {
  return(
    <Disclaimer
      lines={[
        "When WTFOS is started, /system is overwritten with a writable copy of the partition kept in /blacbkox/wtfos/system.img",
        "If you hold the bind button down during bootup on any device WTFOS startup will be skipped with adb enabled to allow wiping of wtfos or diagnosis",
        "If the WTFOS scripts detect a fatal issue, they will likewise attempt to boot up without any modifications and with adb enabled",
      ]}
      title="Safety measures/recovery hints:"
    />
  );
}
