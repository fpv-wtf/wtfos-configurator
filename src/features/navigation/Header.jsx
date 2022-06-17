import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useSelector } from "react-redux";
import {
  Link,
  useLocation,
} from "react-router-dom";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

import ReactGA from "react-ga4";

import {
  selectConnected,
  selectNiceName,
  selectTemperature,
} from "../device/deviceSlice";

export default function Header() {
  const location = useLocation();

  const isConnected = useSelector(selectConnected);
  const temperature = useSelector(selectTemperature);
  const niceName = useSelector(selectNiceName);

  let name = "";
  if(isConnected) {
    name = niceName;
    if(temperature) {
      name += ` - ${temperature}°C`;
    }
  }

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleClick = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  useEffect(() => {
    ReactGA.send({
      hitType: "pageview",
      page: location.pathname,
    });
  }, [location.pathname]);

  let title = "Home";
  switch(location.pathname) {
    case "/cli": title = "CLI"; break;
    case "/packages": title = "Packages"; break;
    case "/startup": title = "Startup"; break;
    case "/about": title = "About fpv.wtf"; break;
    case "/root": title = "Root"; break;
    case "/wtfos": title = "WTFOS"; break;
    case "/wtfos/update": title = "WTFOS - Update"; break;
    case "/wtfos/install": title = "WTFOS - Install"; break;
    case "/wtfos/remove": title = "WTFOS - Remove"; break;
    default: title = "Home";
  }

  return (
    <Box
      marginBottom={2}
      sx={{ flexGrow: 1 }}
    >
      <AppBar
        position="static"
      >
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

            <MenuItem
              component={Link}
              onClick={handleClose}
              to="/about"
            >
              About fpv.wtf
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
            {name}
          </Typography>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
