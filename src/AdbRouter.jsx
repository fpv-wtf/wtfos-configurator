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
import Settings from "./features/settings/Settings";

import {
  checkBinaries,
  checked,
  connected,
  connecting,
  connectionFailed,
  contextReset,
  reset as resetDevice,
  selectChecked,
  setAdb as deviceSetAdb,
  setProductInfo,
  setTemperature,
} from "./features/device/deviceSlice";

import { reset as resetPackages } from "./features/packages/packagesSlice";
import { reset as resetHealthchecks } from "./features/healthcheck/healthcheckSlice";
import TabGovernor from "./utils/TabGovernor";

export default function AdbRouter() {
  const dispatch = useDispatch();

  const isChecked = useSelector(selectChecked);

  const [adb, setAdb] = useState(null);
  const [device, setDevice] = useState(null);
  const [intervalId, setIntervalId] = useState(null);
  const [watcher, setWatcher] = useState(null);

  const [master, setMaster] = useState(true);
  const [tabGovernor, setTabGovernor] = useState(null);
  const [checkedMasterState, setCheckedMasterState] = useState(false);

  const [canAutoConnect, setCanAutoConnect] = useState(false);

  const adbRef = useRef();
  const deviceRef = useRef();
  const intervalRef = useRef();
  const watcherRef = useRef();
  const devicePromiseRef = useRef();

  const connectToDevice = useCallback(async (device) => {
    if(device) {
      try {
        setDevice(device);

        const credentialStore = new AdbWebCredentialStore();
        const streams = await device.connect();
        const adbLocal = await Adb.authenticate(streams, credentialStore, undefined);
        const adbWrapper = new AdbWrapper(adbLocal);

        /**
         * The temperature check has two functions:
         * 1. Obviously checking the temperature
         * 2. Setting the adb prop sometimes adb is not connectible from the beginning
         *    and requests to it might fail. As soon as the temperature is successfully
         *    returned, we can be confident that ADB is ready for our requests.
         */
        const checkTemp = async () => {
          const temp = await adbWrapper.getTemperature();
          if(temp && temp > 0 && !adbRef.current) {
            setAdb(adbWrapper);

            await adbWrapper.establishReverseSocket(1);

            const info = await adbWrapper.getProductInfo();
            dispatch(setProductInfo(info));

            dispatch(resetPackages());
            dispatch(resetHealthchecks());
            dispatch(connected());
            dispatch(deviceSetAdb(true));
            dispatch(checkBinaries(adbWrapper));
          }

          dispatch(setTemperature(temp));
        };

        const newIntervalId = setInterval(checkTemp, 3000);
        setIntervalId(newIntervalId);
        await checkTemp();
      } catch(e) {
        console.log("Failed connecting to device:", e);
        dispatch(connectionFailed());
      }
    } else {
      dispatch(resetPackages());
      dispatch(resetHealthchecks());
    }
  }, [dispatch]);

  /**
   * Auto connect to ADB device if all criteria are matched.
   *
   * Assumes the first matching device to be the device we want to
   * connect to.
   */
  const autoConnect = useCallback(async() => {
    if(canAutoConnect) {
      const devices = await AdbWebUsbBackend.getDevices();
      if(devices.length > 0) {
        await connectToDevice(devices[0]);
      }
    }
  }, [canAutoConnect, connectToDevice]);

  // Handle button press for device connection
  const handleDeviceConnect = useCallback(async() => {
    dispatch(connecting());

    try {
      devicePromiseRef.current = AdbWebUsbBackend.requestDevice();
      const device = await devicePromiseRef.current;
      await connectToDevice(device);
      devicePromiseRef.current = null;
    } catch(e) {
      dispatch(connectionFailed());
    }
  }, [connectToDevice, devicePromiseRef, dispatch]);

  // Check if we are able to auto connect to the device
  useEffect(() => {
    setCanAutoConnect(!devicePromiseRef.current && checkedMasterState && master);
  }, [checkedMasterState, devicePromiseRef, master]);

  useEffect(() => {
    if(!tabGovernor) {
      const tabGovernor = new TabGovernor((isMaster) => {
        setMaster(isMaster);
        setCheckedMasterState(true);
      });
      tabGovernor.connect();
      setTabGovernor(tabGovernor);
    }
  }, [tabGovernor, setMaster, setCheckedMasterState, setTabGovernor]);

  // Set watcher to monitor WebUSB devices popping up or going away
  useEffect(() => {
    if(!watcher && window.navigator.usb) {
      const watcher = new AdbWebUsbBackendWatcher(async (id) => {
        if(!id) {
          setAdb(null);
          dispatch(resetDevice());
          clearInterval(intervalRef.current);
          setIntervalId(null);
        } else {
          await autoConnect();
        }
      });

      setWatcher(watcher);
    }
  }, [autoConnect, connectToDevice, dispatch, watcher]);

  // Automatically try to connect to device when application starts up
  useEffect(() => {
    if(!isChecked && !adb && window.navigator.usb) {
      dispatch(checked(true));
      autoConnect();
    }
  }, [adb, autoConnect, dispatch, isChecked]);

  // Clean up when switching context (onUnmount)
  useEffect(() => {
    dispatch(contextReset());

    return async() => {
      dispatch(contextReset());

      if(watcherRef.current) {
        watcherRef.current.dispose();
      }

      if(intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      if(deviceRef.current) {
        try {
          await deviceRef.current._device.close();
        } catch(e) {
          console.log("Failed closing device:", e);
        }
      }

      setAdb(null);
      setDevice(null);
      setIntervalId(null);
      setWatcher(null);
    };
  }, [dispatch]);

  // Update references when they change
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
    watcherRef.current = watcher;
  }, [watcher]);

  return(
    <Routes>
      <Route
        element={<Settings />}
        path="/settings"
      />

      <Route
        element={<About />}
        path="/about"
      />

      <Route
        element={
          <App
            adb={adb}
            handleAdbConnectClick={handleDeviceConnect}
            isMaster={master}
          />
        }
        path="/*"
      />
    </Routes>
  );
}
