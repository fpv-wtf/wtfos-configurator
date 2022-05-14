import React from "react";

import Alert from "@mui/material/Alert";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";

export default function Disclaimer() {
  return(
    <Alert severity="warning">
      <Typography sx={{ fontWeight: "bold" }}>
        Disclaimer:
      </Typography>

      <List>
        <ListItem>
          <Typography>
            Make sure that the device to be rooted is powered from a reliable power source
          </Typography>
        </ListItem>

        <ListItem>
          <Typography>
            Make sure that the device is properly cooled if necessary
          </Typography>
        </ListItem>

        <ListItem>
          <Typography>
            Only have one device connected/paired
          </Typography>
        </ListItem>

        <ListItem>
          <Typography>
            Do not power off during rooting
          </Typography>
        </ListItem>

        <ListItem>
          <Typography>
            Proceed at your own risk
          </Typography>
        </ListItem>
      </List>
    </Alert>
  );
}
