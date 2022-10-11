import React from "react";
import {
  Alert,
  Button,
  Container,
  Grid,
  LinearProgress,
  Link,
  Stack,
} from "@mui/material";
import { useTranslation } from "react-i18next";


import Header from "../navigation/Header";

import DebugStats from "./DebugStats";
import FileDrop, { useFileDropState } from "./FileDrop";

import VideoWorkerManager from "../../osd-overlay/manager";
import VideoWorkerShared from "../../osd-overlay/shared";


const videoManager = new VideoWorkerManager();

export default function OsdOverlay() {
  const { t } = useTranslation("osdOverlay");

  const canvasRef = React.useRef(null);

  const [files, setFiles] = useFileDropState();
  const videoFile = files.videoFile;
  const osdFile = files.osdFile;
  const fontFiles = React.useMemo(() => ({
    sd1: files.fontFileSd1,
    sd2: files.fontFileSd2,
    hd1: files.fontFileHd1,
    hd2: files.fontFileHd2,
  }), [files]);

  const [progress, setProgress] = React.useState(0);
  const [progressMax, setProgressMax] = React.useState(0);

  const [stats, setStats] = React.useState({
    expectedFrames: null,
    framesDecoded: null,
    framesDecodedMissing: null,
    framesEncoded: null,
    inDecoderQueue: null,
    inEncoderQueue: null,
    queuedForDecode: null,
    queuedForEncode: null,
  });

  const [inProgress, setInProgress] = React.useState(false);
  const [startedOnce, setStartedOnce] = React.useState(false);

  const [error, setError] = React.useState(null);

  const startEnabled = (
    videoFile &&
    osdFile &&
    fontFiles.sd1 &&
    fontFiles.sd2 &&
    fontFiles.hd1 &&
    fontFiles.hd2 &&
    !inProgress
  );
  const progressValue = progressMax ? (progress / progressMax) * 100 : 0;

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = canvas.width * 9 / 16;
  }, [canvasRef]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    videoManager.setCallbacks({
      onComplete: () => {
        setInProgress(false);
      },
      onError: (e) => {
        setError(e);
        setInProgress(false);
      },
      onProgressUpdate: (options) => {
        const {
          framesDecoded,
          framesDecodedMissing,
          framesEncoded,
          inDecoderQueue,
          inEncoderQueue,
          preview,
          queuedForDecode,
          queuedForEncode,
        } = { ...options };

        if (framesEncoded) {
          setProgress(framesEncoded);
        }

        if (preview) {
          const scale = Math.min(
            canvas.width / preview.width,
            canvas.height / preview.height
          );

          const width = preview.width * scale;
          const height = preview.height * scale;
          const x = (canvas.width - width) / 2;
          const y = (canvas.height - height) / 2;

          ctx.drawImage(preview, x, y, width, height);
        }

        setStats((prevStats) => ({
          ...prevStats,
          framesDecoded: framesDecoded ?? prevStats.framesDecoded,
          framesDecodedMissing: framesDecodedMissing ?? prevStats.framesDecodedMissing,
          framesEncoded: framesEncoded ?? prevStats.framesEncoded,
          inDecoderQueue: inDecoderQueue ?? prevStats.inDecoderQueue,
          inEncoderQueue: inEncoderQueue ?? prevStats.inEncoderQueue,
          queuedForDecode: queuedForDecode ?? prevStats.queuedForDecode,
          queuedForEncode: queuedForEncode ?? prevStats.queuedForEncode,
        }));
      },
      onProgressInit: (options) => {
        const { expectedFrames } = options;

        setProgress(0);
        setProgressMax(expectedFrames);
        setStats((prevStats) => ({
          ...prevStats,
          expectedFrames: expectedFrames ?? prevStats.expectedFrames,
        }));
      },
    });
  }, [canvasRef]);

  const handleStart = React.useCallback(async () => {
    const handle = await window.showSaveFilePicker({
      excludeAcceptAllOption: true,
      suggestedName: videoFile.name.replace(/\.[^/.]+$/, "") + "-osd.mp4",
      types: [
        {
          description: "MP4",
          accept: { "video/mp4": [".mp4"] },
        },
      ],
    });

    setInProgress(true);
    setStartedOnce(true);

    videoManager.start({
      type: VideoWorkerShared.MessageType.START,
      fontFiles: fontFiles,
      osdFile: osdFile,
      videoFile: videoFile,
      outHandle: handle,
    });
  }, [
    fontFiles,
    osdFile,
    setInProgress,
    setStartedOnce,
    videoFile,
  ]);

  const handleOnFilesChanged = React.useCallback((files) => {
    setFiles(files);
  }, [setFiles]);

  return (
    <Container
      fixed
    >
      <Header />

      <Stack sx={{ mb: 8 }}>
        <Alert
          severity="info"
          sx={{ mb: 2 }}
        >
          {t("noteHeader")}

          {" "}

          <Link
            color="primary"
            href="/package/fpv-wtf/msp-osd"
          >
            {t("noteConfigLink")}
          </Link>

          <br />

          <br />

          <strong>
            {t("noteWarning")}
          </strong>
        </Alert>

        <Grid
          container
          spacing={2}
        >
          <Grid
            item
            md={3}
            xs={12}
          >
            <Stack
              spacing={2}
              sx={{ height: "100%" }}
            >
              <FileDrop
                files={files}
                onChange={handleOnFilesChanged}
              />

              <Button
                disabled={!startEnabled}
                onClick={handleStart}
                variant="contained"
              >
                {inProgress ? t("processing") : t("start")}
              </Button>
            </Stack>
          </Grid>

          <Grid
            item
            md={9}
            xs={12}
          >
            <Stack
              spacing={2}
            >
              {error && (
                <Alert severity="error">
                  {error.message}
                </Alert>
              )}

              <canvas
                ref={canvasRef}
                style={{
                  backgroundColor: "black",
                  borderRadius: 4,
                  flexGrow: 1,
                }}
              />

              <LinearProgress
                color={
                  (inProgress
                    ? "primary"
                    : startedOnce
                      ? "success"
                      : "primary")
                }
                value={progressValue}
                variant={
                  inProgress && progressValue >= 99 ? "indeterminate" : "determinate"
                }
              />

              <DebugStats
                expectedFrames={stats.expectedFrames}
                framesDecoded={stats.framesDecoded}
                framesDecodedMissing={stats.framesDecodedMissing}
                framesEncoded={stats.framesEncoded}
                inDecoderQueue={stats.inDecoderQueue}
                inEncoderQueue={stats.inEncoderQueue}
                queuedForDecode={stats.queuedForDecode}
                queuedForEncode={stats.queuedForEncode}
              />
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}
