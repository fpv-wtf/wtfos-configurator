import PropTypes from "prop-types";
import React from "react";
import { styled } from "@mui/material/styles";
import { Link } from "react-router-dom";

export default function DefaultRouterLink({
  text,
  to,
}) {
  const StyledLink = styled(Link)(() => ({
    "&": {
      whiteSpace: "nowrap",
      color: "#1676c7",
      textDecoration: "underline",
      textDecorationColor: "rgba(22, 118, 199, 0.4)",
    },
    "&:hover": { textDecorationColor: "inherit" },
  }));

  return (
    <StyledLink to={to}>
      {text}
    </StyledLink>
  );
}

DefaultRouterLink.propTypes = {
  text: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
};
