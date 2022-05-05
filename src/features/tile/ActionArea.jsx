import PropTypes from "prop-types";
import React from "react";

import { Link } from "react-router-dom";

import { CardActionArea } from "@mui/material";

export default function ActionArea({
  children,
  disabled,
  href,
  linkTo,
}) {
  if(linkTo) {
    return(
      <CardActionArea
        component={Link}
        disabled={disabled}
        sx={{
          height: "100%",
          flexGrow: 1,
          flexDirection: "column",
          alignItems: "stretch",
          opacity: disabled ? 0.2 : 1,
        }}
        to={linkTo}
      >
        {children}
      </CardActionArea>
    );
  }

  return(
    <CardActionArea
      href={href}
      sx={{
        height: "100%",
        flexGrow: 1,
        flexDirection: "column",
        alignItems: "stretch",
      }}
      target="_blank"
    >
      {children}
    </CardActionArea>
  );
}

ActionArea.defaultProps = {
  disabled: false,
  href: null,
  linkTo: null,
};

ActionArea.propTypes = {
  children: PropTypes.arrayOf(PropTypes.element).isRequired,
  disabled: PropTypes.bool,
  href: PropTypes.string,
  linkTo: PropTypes.string,
};
