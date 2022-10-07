import PropTypes from "prop-types";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  useDispatch,
  useSelector,
} from "react-redux";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import {
  fetchPackage, fetchConfig, fetchConfigSchema, selectPackage, selectRepo, selectDetails, packageRepo, selectFetched,
} from "./packageSlice";
import TableCell from "@mui/material/TableCell";

import { selectHasOpkgBinary } from "../device/deviceSlice";
import SetupHint from "../setup/SetupHint";

export default function Package({ adb }) {
  let {
    repo, packageSlug,
  } = useParams();


  const dispatch = useDispatch();

  const { t } = useTranslation("package");
  const packageName = useSelector(selectPackage);
  const repoName = useSelector(selectRepo);
  const details = useSelector(selectDetails);
  const hasOpkgBinary = useSelector(selectHasOpkgBinary);
  const fetched = useSelector(selectFetched);

  useEffect(() => {
    dispatch(packageRepo({
      repo,
      packageSlug,
    }));
  }, [dispatch, repo, packageSlug]);

  useEffect(() => {
    if (!fetched) {
      dispatch(fetchPackage({
        adb,
        packageSlug,
        repo,
      }));
    }
  }, [adb, dispatch, fetched]);


  useEffect(() => {
    // if (!fetched) {
    dispatch(fetchConfig(adb));
    // }
  }, [adb, dispatch, fetched]);


  useEffect(() => {
    // if (!fetched) {
    dispatch(fetchConfigSchema(adb));
    // }
  }, [adb, dispatch, fetched]);

  return (
    <>

      {!hasOpkgBinary &&
      <SetupHint />}

      <h1>
        {`${repoName}-${packageName}`}
      </h1>

      <p>
        {details && details.description}
      </p>

    </>
  );
}

Package.propTypes = { adb: PropTypes.shape().isRequired };

