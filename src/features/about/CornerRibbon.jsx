/*
  borrowed (and modified) from https://github.com/shotforsky/react-corner-ribbon
*/

import React from "react";
import PropTypes from "prop-types";

import { Box } from '@mui/system';


const propTypes = {
  backgroundColor: PropTypes.string,
  children: PropTypes.element.isRequired,
  fontColor: PropTypes.string,
  position: PropTypes.string,
};

const defaultProps = {
  backgroundColor: "#2c7",
  fontColor: "#f0f0f0",
  position: "top-right",
};

export default function CornerRibbon({
      children,
      backgroundColor = "#2c7",
      fontColor = "#f0f0f0",
      position = "top-right",
  }) {
  
    let positionStyle = {};
    switch (position) {
      case "top-left":
        positionStyle = {
          top: 0,
          left: 0,
          transform: "translateY(-100%) rotate(-90deg) translateX(-70.71067811865476%) rotate(45deg)",
          transformOrigin: "bottom left",
          WebkitTransform: "translateY(-100%) rotate(-90deg) translateX(-70.71067811865476%) rotate(45deg)",
        };
        break;
      case "top-right":
        positionStyle = {
          top: 0,
          right: 0,
          transform: "translateY(-100%) rotate(90deg) translateX(70.71067811865476%) rotate(-45deg)",
          transformOrigin: "bottom right",
          WebkitTransform: "translateY(-100%) rotate(90deg) translateX(70.71067811865476%) rotate(-45deg)",
        };
        break;
      case "bottom-left":
        positionStyle = {
          bottom: 0,
          left: 0,
          transform: "translateY(100%) rotate(90deg) translateX(-70.71067811865476%) rotate(-45deg)",
          transformOrigin: "top left",
          WebkitTransform: "translateY(100%) rotate(90deg) translateX(-70.71067811865476%) rotate(-45deg)",
        };
        break;
      case "bottom-right":
        positionStyle = {
          right: 0,
          bottom: 0,
          transform: "translateY(100%) rotate(-90deg) translateX(70.71067811865476%) rotate(45deg)",
          transformOrigin: "top right",
          WebkitTransform: "translateY(100%) rotate(-90deg) translateX(70.71067811865476%) rotate(45deg)",
        };
        break;
      default:
        break;
    }

    const computedStyle = {
      // backgroundColor: '#e43',
      position: "absolute",
      // transform: 'rotate(-45deg)',
      // WebkitTransform: 'rotate(-45deg)',
      padding: "0.1em 2em",
      zIndex: 99,
      textAlign: "center",
      letterSpacing: "2px",
      fontSize: "14px",
      // color: '#f0f0f0',
      pointerEvents: "auto",
      // position: 'fixed',
      boxShadow: "0 0 3px rgba(0,0,0,.3)",
      ...backgroundColor && { backgroundColor },
      ...fontColor && { color: fontColor },
      ...positionStyle,
    };

    const containerStyle = {
      position: "absolute",
      top: 0,
      right: 0,
      left: 0,
      bottom: 0,
      overflow: "hidden",
      backgroundColor: "transparent",
      pointerEvents: "none",
    };

    return (
      <Box
        sx={containerStyle}
      >
        <Box sx={computedStyle}>
          {children}
        </Box>
      </Box>
    );
  
}

CornerRibbon.propTypes = propTypes;
CornerRibbon.defaultProps = defaultProps;

