import React, {
  useCallback,
  useEffect,
  useRef,
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
  reset as resetDevice,
  selectChecked,
  setAdb as deviceSetAdb,
  setProductInfo,
  setTemperature,
} from "./features/device/deviceSlice";

import { reset as resetPackages } from "./features/packages/packagesSlice";
import { selectRooting } from "./features/root/rootSlice";

export default function AdbRouter() {
  const dispatch = useDispatch();

  const isChecked = useSelector(selectChecked);
  const isRooting = useSelector(selectRooting);

  const [adb, setAdb] = useState(null);
  const [device, setDevice] = useState(null);
  const [watcher, setWatcher] = useState(null);
  const [intervalId, setIntervalId] = useState(null);

  const adbRef = useRef();
  const deviceRef = useRef();
  const intervalRef = useRef();

  const connectToDevice = useCallback(async (device) => {
    if(device) {
      try {
        setDevice(device);

        const credentialStore = new AdbWebCredentialStore();
        const streams = await device.connect();
        const adbLocal = await Adb.authenticate(streams, credentialStore, undefined);
        const adbWrapper = new AdbWrapper(adbLocal);
        await adbWrapper.establishReverseSocket(1);

        setAdb(adbWrapper);

        const checkTemp = async () => {
          const temp = await adbWrapper.getTemperature();
          dispatch(setTemperature(temp));
        };

        const newIntervalId = setInterval(checkTemp, 3000);
        setIntervalId(newIntervalId);
        await checkTemp();

        const info = await adbWrapper.getProductInfo();
        dispatch(setProductInfo(info));

        dispatch(resetPackages());
        dispatch(connected());
        dispatch(deviceSetAdb(true));
        dispatch(checkBinaries(adbWrapper));
      } catch(e) {
        console.log(e);
        dispatch(connectionFailed());
      }
    } else {
      dispatch(resetPackages());
    }
  }, [dispatch]);

  const autoConnect = useCallback(async() => {
    const devices = await AdbWebUsbBackend.getDevices();
    if(devices.length > 0) {
      await connectToDevice(devices[0]);
    }
  }, [connectToDevice]);

  useEffect(() => {
    adbRef.current = adb;
  }, [adb]);

  useEffect(() => {
    deviceRef.current = device;
  }, [device]);

  useEffect(() => {
    intervalRef.current = intervalId;
  }, [intervalId]);

  useEffect(() => {
    if(!watcher && window.navigator.usb) {
      const watcher = new AdbWebUsbBackendWatcher(async (id) => {
        if(!id) {
          setAdb(null);
          dispatch(resetDevice());
          clearInterval(intervalRef.current);
          setIntervalId(null);
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

  useEffect(() => {
    dispatch(resetDevice());

    // Clean up when switching context
    return async() => {
      clearInterval(intervalRef.current);
      await deviceRef.current._device.close();
    };
  }, [dispatch]);

  return(
    <Routes>
      <Route
        element={<About />}
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
