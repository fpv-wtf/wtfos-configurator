import PropTypes from "prop-types";
import React, {
  useCallback,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

import { Link } from "react-router-dom";

import { selectConnected } from "../device/deviceSlice";

export default function Header({ deviceName }) {
  const location = useLocation();

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const connected = useSelector(selectConnected);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleClick = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  let title = "Home";
  switch(location.pathname) {
    case "/cli": title = "CLI"; break;
    case "/packages": title = "Packages"; break;
    case "/startup": title = "Startup"; break;
    default: title = "Home";
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            aria-controls={open ? "menu-appbar" : null}
            aria-expanded={open ? "true" : undefined}
            aria-haspopup="true"
            aria-label="menu"
            color="inherit"
            edge="start"
            onClick={handleClick}
            size="large"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "left",
            }}
            id="menu-appbar"
            keepMounted
            onClose={handleClose}
            open={open}
          >
            <MenuItem
              component={Link}
              onClick={handleClose}
              to="/"
            >
              Home
            </MenuItem>

            <MenuItem
              component={Link}
              onClick={handleClose}
              to="/packages"
            >
              Package Manager
            </MenuItem>

            <MenuItem
              component={Link}
              onClick={handleClose}
              to="/startup"
            >
              Startup
            </MenuItem>

            <MenuItem
              component={Link}
              onClick={handleClose}
              to="/cli"
            >
              CLI
            </MenuItem>

            <MenuItem
              component={Link}
              onClick={handleClose}
              to="/wtfos"
            >
              WTFOS
            </MenuItem>

            <MenuItem
              component={Link}
              onClick={handleClose}
              to="/root"
            >
              Root
            </MenuItem>
          </Menu>

          <Typography
            component="div"
            sx={{ flexGrow: 1 }}
            variant="h6"
          >
            {title}
          </Typography>

          <Typography>
            {deviceName}
          </Typography>
        </Toolbar>
      </AppBar>
    </Box>
  );
}

Header.defaultProps = { deviceName: "" };

Header.propTypes = { deviceName: PropTypes.string };
