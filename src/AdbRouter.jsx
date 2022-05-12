import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Routes,
  Route,
} from "react-router-dom";
import {
  useDispatch,
  useSelector,
} from "react-redux";

import AdbWebCredentialStore from "@yume-chan/adb-credential-web";
import AdbWebUsbBackend, { AdbWebUsbBackendWatcher } from "@yume-chan/adb-backend-webusb";
import { Adb } from "@yume-chan/adb";

import AdbWrapper from "./utils/AdbWrapper";

import About from "./features/about/About";
import App from "./App";

import {
  checkBinaries,
  checked,
  connected,
  connecting,
  connectionFailed,
  disconnected,
  selectChecked,
  setAdb as deviceSetAdb,
} from "./features/device/deviceSlice";

import { reset } from "./features/packages/packagesSlice";
import { selectRooting } from "./features/root/rootSlice";

export default function AdbRouter() {
  const dispatch = useDispatch();

  const isChecked = useSelector(selectChecked);
  const isRooting = useSelector(selectRooting);

  const [adb, setAdb] = useState(null);
  const [watcher, setWatcher] = useState(null);

  const connectToDevice = useCallback(async (device) => {
    if(device) {
      try {
        const credentialStore = new AdbWebCredentialStore();
        const streams = await device.connect();
        const adbLocal = await Adb.authenticate(streams, credentialStore, undefined);
        const adbWrapper = new AdbWrapper(adbLocal);
        await adbWrapper.establishReverseSocket(1);

        setAdb(adbWrapper);

        dispatch(reset());
        dispatch(connected());
        dispatch(deviceSetAdb(true));
        dispatch(checkBinaries(adbWrapper));
      } catch(e) {
        console.log(e);
        dispatch(connectionFailed());
      }
    } else {
      dispatch(reset());
    }
  }, [dispatch]);

  const autoConnect = useCallback(async() => {
    const devices = await AdbWebUsbBackend.getDevices();
    if(devices.length > 0) {
      await connectToDevice(devices[0]);
    }
  }, [connectToDevice]);

  useEffect(() => {
    if(!watcher) {
      const watcher = new AdbWebUsbBackendWatcher(async (id) => {
        if(!id) {
          setAdb(null);
          dispatch(disconnected());
          dispatch(checked(false));
        } else {
          if(!isRooting) {
            await autoConnect();
          }
        }
      });

      setWatcher(watcher);
    }
  }, [autoConnect, connectToDevice, dispatch, isRooting, watcher]);

  useEffect(() => {
    if(!isChecked && !adb && !isRooting) {
      dispatch(checked(true));
      autoConnect();
    }
  }, [adb, autoConnect, dispatch, isChecked, isRooting]);

  // Try to connect when comming from rooting menu
  useEffect(() => {
    if(!isRooting && !adb) {
      dispatch(checked(true));
      autoConnect();
    }
  }, [adb, autoConnect, dispatch, isRooting]);

  const handleDeviceConnect = useCallback(async() => {
    dispatch(connecting());

    try {
      const device = await AdbWebUsbBackend.requestDevice();
      await connectToDevice(device);
    } catch(e) {
      console.log(e);
      dispatch(connectionFailed());
    }
  }, [connectToDevice, dispatch]);

  return(
    <Routes>
      <Route
        element={<About adb={adb} />}
        path="/about"
      />

      <Route
        element={
          <App
            adb={adb}
            handleAdbConnectClick={handleDeviceConnect}
          />
        }
        path="/*"
      />
    </Routes>
  );
}
