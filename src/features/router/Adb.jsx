import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import {
  useDispatch,
  useSelector,
} from "react-redux";

import AdbWebCredentialStore from "@yume-chan/adb-credential-web";
import AdbWebUsbBackend, { AdbWebUsbBackendWatcher } from "@yume-chan/adb-backend-webusb";
import { Adb } from "@yume-chan/adb";

import AdbWrapper from "../../utils/AdbWrapper";

import About from "../about/About";
import App from "./App";
import OsdOverlay from "../osd-overlay/OsdOverlay";
import Settings from "../settings/Settings";

import {
  hasAdb,
  timeout,
} from "../../utils/WebusbHelpers";

import {
  checkBinaries,
  connected,
  connecting,
  connectionFailed,
  contextReset,
  reset as resetDevice,
  setAdb as deviceSetAdb,
  setAdbDetectionFailed,
  setProductInfo,
  setTemperature,
  setClaimed,
  selectAdbDetectionFailed,
} from "../device/deviceSlice";

import {
  selectChecked as selectCheckedMaster,
  selectIsMaster,
} from "../tabGovernor/tabGovernorSlice";

import { reset as resetPackages } from "../packages/packagesSlice";
import { reset as resetHealthchecks } from "../healthcheck/healthcheckSlice";

export default function AdbRouter() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isMaster = useSelector(selectIsMaster);
  const checkedMasterState = useSelector(selectCheckedMaster);
  const adbDetectionFailed = useSelector(selectAdbDetectionFailed);

  const [startupCheck, setStartupCheck] = useState(false);
  const [adb, setAdb] = useState(null);
  const [adbDetection, setAdbDetection] = useState(false);
  const [showAdbDetection, setShowAdbDetection] = useState(false);

  const adbRef = useRef();
  const deviceRef = useRef();
  const devicePromiseRef = useRef();
  const intervalRef = useRef();
  const watcherRef = useRef();

  const detectionCountRef = useRef();
  const detectionDeviceRef = useRef();

  const connectToDevice = useCallback(async (device) => {
    if(device && !adb) {
      try {
        deviceRef.current = device;

        const credentialStore = new AdbWebCredentialStore();
        const streams = await deviceRef.current.connect();
        const adbLocal = await Adb.authenticate(streams, credentialStore, undefined);
        const adbWrapper = new AdbWrapper(adbLocal);

        dispatch(setClaimed(true));

        /**
         * The temperature check has two functions:
         * 1. Obviously checking the temperature
         * 2. Setting the adb prop: sometimes adb is not connectible from the beginning
         *    and requests to it might fail. As soon as the temperature is successfully
         *    returned, we can be confident that ADB is ready for our requests.
         *
         * A failsafe is in place, if we checked a certain amount of times, we assume
         * connection went fine. Some vistas seem to not query the temperature correctly.
         */
        const maxCheck = 3;
        let currentCheck = 0;
        const checkTemp = async () => {
          const temp = await adbWrapper.getTemperature();
          if(((temp && temp > 0) || (++currentCheck >= maxCheck)) && !adbRef.current) {
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

          dispatch(setTemperature(temp || "??"));
        };

        intervalRef.current = setInterval(checkTemp, 3000);
        await checkTemp();
      } catch(e) {
        console.log("Failed connecting to device:", e);
        dispatch(connectionFailed());
      }
    } else {
      if(!device) {
        dispatch(resetPackages());
        dispatch(resetHealthchecks());
      }
    }
  }, [adb, dispatch, setAdb]);

  /**
   * If an ADB interface could be found, attempt to connect, otherwise
   * redirect to rooting page.
   *
   * This can be triggered while it is still running, in this case we reset
   * the iteration cound update the device reference and keep on going.
   */
  const connectOrRedirect = useCallback(async (device) => {
    detectionDeviceRef.current = device;
    detectionCountRef.current = 0;

    if (adbDetection || adbDetectionFailed) {
      return;
    }

    setAdbDetection(true);

    const maxIteration = 5;
    const interval = 5000;
    do {
      if (hasAdb(detectionDeviceRef.current)) {
        const backendDevice = new AdbWebUsbBackend(detectionDeviceRef.current);
        await connectToDevice(backendDevice);

        // Device connection promised resolved
        devicePromiseRef.current = null;
        setAdbDetection(false);
        dispatch(setAdbDetectionFailed(false));

        return;
      }

      // Show the ADB detection banner only if it did not recognize it immediately
      setShowAdbDetection(true);
      await timeout(interval);
      detectionCountRef.current += 1;
    } while(detectionCountRef.current < maxIteration);

    /**
     * Redirect to root after trying to verify that ADB device is there for a
     * certain amountof time - this is needed for the VISTA where the correct
     * interface does not show up immediately.
     */
    setAdbDetection(false);
    dispatch(setAdbDetectionFailed(true));
    navigate("/root");
  }, [adbDetection, adbDetectionFailed, connectToDevice, dispatch, navigate, setAdbDetection]);

  /**
   * Auto connect to ADB device if all criteria are matched.
   *
   * Assumes the first matching device to be the device we want to
   * connect to.
   */
  const autoConnect = useCallback(async() => {
    const canConnect = (!devicePromiseRef.current && checkedMasterState && isMaster);
    if(canConnect) {
      const devices = await navigator.usb.getDevices();
      if(devices.length > 0) {
        connectOrRedirect(devices[0]);
      }
    }
  }, [connectOrRedirect, checkedMasterState, devicePromiseRef, isMaster]);

  /**
   * When the connect button is pressed, a general usb device is invoked and
   * the selected device is then used to creat an ADB Backend, if this does
   * not work, then we know that the device is not rooted yet and we can redirect
   * the user accordingly.
   *
   * This has the benefit that the user paired the device once and we will
   * be able to automatically connect after successful root without any
   * more user interaction.
   */
  const handleDeviceConnect = useCallback(async() => {
    if(!devicePromiseRef.current) {
      dispatch(connecting());

      try {
        const filters = [{ vendorId: 0x2ca3 }];
        devicePromiseRef.current = navigator.usb.requestDevice({ filters });
        const device = await devicePromiseRef.current;

        connectOrRedirect(device);
      } catch(e) {
        devicePromiseRef.current = null;
        dispatch(connectionFailed());
      }
    }
  }, [connectOrRedirect, devicePromiseRef, dispatch]);

  /**
   * Automatically try to connect to device when application starts up.
   *
   * The only pre-requisits that must be met are:
   * - webusb is present
   * - master state has been checked
   */
  useEffect(() => {
    if(window.navigator.usb && checkedMasterState) {
      if(watcherRef.current) {
        watcherRef.current.dispose();
      }

      watcherRef.current = new AdbWebUsbBackendWatcher(async (id) => {
        if(!id) {
          setAdb(null);

          dispatch(resetDevice());
          clearInterval(intervalRef.current);
        } else {
          await autoConnect();
        }
      });

      if(!startupCheck) {
        setStartupCheck(true);
        autoConnect();
      }
    }
  }, [autoConnect, checkedMasterState, dispatch, setAdb, startupCheck]);

  /**
   * Clean up when switching context (onUnmount)
   *
   * This basically will only happen if moving to rooting tab, since all other routes
   * are within this context.
   */
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
          deviceRef.current = null;
        } catch(e) {
          console.log("Failed closing device:", e);
        }
      }
    };
  }, [dispatch]);

  // Update Refs when state changes. Useful if refs are used in callbacks (intervals, timeouts)
  useEffect(() => {
    adbRef.current = adb;
  }, [adb]);

  // Disable ADB detection banner if ADB detection has finished
  useEffect(() => {
    if(!adbDetection) {
      setShowAdbDetection(false);
    }
  }, [adbDetection, setShowAdbDetection]);

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
        element={<OsdOverlay />}
        path="/osd-overlay"
      />

      <Route
        element={
          <App
            adb={adb}
            adbDetection={showAdbDetection}
            handleAdbConnectClick={handleDeviceConnect}
          />
        }
        path="/*"
      />
    </Routes>
  );
}
