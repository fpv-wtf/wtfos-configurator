import PropTypes from "prop-types";
import * as React from "react";

import Avatar from "@mui/material/Avatar";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import GitHubIcon from "@mui/icons-material/GitHub";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import TwitterIcon from "@mui/icons-material/Twitter";
import Typography from "@mui/material/Typography";

import CornerRibbon from "./CornerRibbon";

export default function TeamTile({
  honorary,
  name,
  nick,
  twitter,
  description,
}) {
  return (
    <Card sx={{
      height: "100%",
      position:"relative" ,
    }}
    >
      { honorary && (
        <CornerRibbon
          backgroundColor="success.main"
          fontColor="text.main"
          position="top-right"
        >
          HONORARY
        </CornerRibbon>
      )}

      <CardContent>
        <Grid
          container
          justifyContent="center"
          textAlign="center"
        >
          <Grid item>
            <Avatar
              alt={nick}
              src={"https://github.com/" + nick + ".png"}
              sx={{
                display: "inline-block",
                width: 56,
                height: 56,
              }}
            />

            <Typography
              gutterBottom
              paddingTop={1}
              variant="h5"
            >
              {nick}
            </Typography>

            <Typography
              color="text.secondary"
              display="block"
              gutterBottom
              variant="caption"
            >
              {name}
            </Typography>

            <Typography
              color=""
              paddingTop={1}
              variant="body2"
            >
              {description}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>

      <CardActions>
        <IconButton
          aria-label="github"
          href={"https://github.com/" + nick}
          target="_new"
        >
          <GitHubIcon />
        </IconButton>

        {twitter && (
          <IconButton
            aria-label="twitter"
            href={"https://twitter.com/" + twitter}
            target="_new"
          >
            <TwitterIcon />
          </IconButton>
        )}
      </CardActions>
    </Card>
  );
}

TeamTile.defaultProps = {
  description: null,
  honorary: false,
  name: null,
  nick: null,
  twitter: null,
};

TeamTile.propTypes = {
  description: PropTypes.string,
  honorary: PropTypes.bool,
  name: PropTypes.string,
  nick: PropTypes.string,
  twitter: PropTypes.string,
};
