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
import { useTranslation } from "react-i18next";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Badge from "@mui/material/Badge";
import { styled } from "@mui/material/styles";

import ReactGA from "react-ga4";

import LanguageSwitcher from "./LanguageSwitcher";

import {
  selectHasAdb,
  selectConnected,
  selectNiceName,
  selectTemperature,
} from "../device/deviceSlice";

import { selectUpgradable } from "../packages/packagesSlice";

const UpdateBadge = styled(Badge)(() => ({
  "& .MuiBadge-badge": {
    right: -12,
    top: 10,
  },
}));

export default function Header() {
  const { t } = useTranslation("navigation");
  const location = useLocation();

  const isConnected = useSelector(selectConnected);
  const temperature = useSelector(selectTemperature);
  const niceName = useSelector(selectNiceName);

  const hasAdb = useSelector(selectHasAdb);
  const upgradable = useSelector(selectUpgradable);

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

  let title = "Home";
  switch(location.pathname) {
    case "/cli": title = t("titleCli"); break;
    case "/packages": title = t("titlePackages"); break;
    case "/settings": title = t("titleSettings"); break;
    case "/startup": title = t("titleStartup"); break;
    case "/about": title = t("titleAbout"); break;
    case "/root": title = t("titleRoot"); break;
    case "/wtfos": title = t("titleWtfos"); break;
    case "/wtfos/update": title = t("titleWtfosUpdate"); break;
    case "/wtfos/install": title = t("titleWtfosInstall"); break;
    case "/wtfos/remove": title = t("titleWtfosRemove"); break;
    default: title = t("titleHome");
  }

  const pageTitle = `${title} - WTFOS Configurator`;
  document.title = pageTitle;

  useEffect(() => {
    ReactGA.send({
      hitType: "pageview",
      page: location.pathname,
    });
  }, [location.pathname]);

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
              {t("menuHome")}
            </MenuItem>

            <MenuItem
              component={Link}
              onClick={handleClose}
              to="/packages"
            >
              {t("menuPackageManager")}
            </MenuItem>

            {hasAdb && upgradable.length > 0 && (
              <MenuItem
                component={Link}
                onClick={handleClose}
                to="/wtfos/update"
              >
                <UpdateBadge
                  badgeContent={upgradable.length}
                  color="secondary"
                >
                  {t("menuUpdate")}
                </UpdateBadge>
              </MenuItem>
            )}

            <MenuItem
              component={Link}
              onClick={handleClose}
              to="/startup"
            >
              {t("menuStartup")}
            </MenuItem>

            <MenuItem
              component={Link}
              onClick={handleClose}
              to="/cli"
            >
              {t("menuCli")}
            </MenuItem>

            <MenuItem
              component={Link}
              onClick={handleClose}
              to="/wtfos"
            >
              {t("menuWtfos")}
            </MenuItem>

            <MenuItem
              component={Link}
              onClick={handleClose}
              to="/root"
            >
              {t("menuRoot")}
            </MenuItem>

            <MenuItem
              component={Link}
              onClick={handleClose}
              to="/settings"
            >
              {t("menuSettings")}
            </MenuItem>

            <MenuItem
              component={Link}
              onClick={handleClose}
              to="/about"
            >
              {t("menuAbout")}
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

          <LanguageSwitcher />
        </Toolbar>
      </AppBar>
    </Box>
  );
}
