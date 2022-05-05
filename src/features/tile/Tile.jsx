import PropTypes from "prop-types";
import React from "react";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import ActionArea from "./ActionArea";

export default function Tile({
  children,
  disabled,
  description,
  href,
  linkTo,
  title,
}) {
  return (
    <Card
      sx={{ height: "100%" }}
    >
      <ActionArea
        disabled={disabled}
        href={href}
        linkTo={linkTo}
      >
        <Grid
          alignItems="top"
          container
          direction="row"
          justifyContent="center"
          paddingTop={2}
        >
          <Grid item>
            {children}
          </Grid>
        </Grid>

        <CardContent>
          <Typography
            component="div"
            gutterBottom
            variant="h5"
          >
            {title}
          </Typography>

          <Typography
            color="text.secondary"
            variant="body2"
          >
            {description}
          </Typography>
        </CardContent>
      </ActionArea>
    </Card>
  );
}

Tile.defaultProps = {
  disabled: false,
  href: null,
  linkTo: null,
};

Tile.propTypes = {
  children: PropTypes.element.isRequired,
  description: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  href: PropTypes.string,
  linkTo: PropTypes.string,
  title: PropTypes.string.isRequired,
};
