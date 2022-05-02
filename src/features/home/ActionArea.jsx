import PropTypes from "prop-types";
import React from "react";

import { Link } from "react-router-dom";

import { CardActionArea } from "@mui/material";

export default function ActionArea({
  children,
  href,
  linkTo,
}) {
  console.log(href, linkTo);
  if(linkTo) {
    return(
      <CardActionArea
        component={Link}
        sx={{
          height: "100%",
          flexGrow: 1,
          flexDirection: "column",
          alignItems: "stretch",
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
  href: null,
  linkTo: null,
};

ActionArea.propTypes = {
  children: PropTypes.arrayOf(PropTypes.element).isRequired,
  href: PropTypes.string,
  linkTo: PropTypes.string,
};
