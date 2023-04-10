import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import ReactGA from "react-ga4";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { setDonationState } from "./donateSlice";

export default function Donate() {
  const { t } = useTranslation("donate");
  const dispatch = useDispatch();

  const values = [0, 5, 10, 20, 30, 40, 50, 100, 250];
  const marks = values.map((item, index) => {
    return {
      value: Math.ceil(100 / (values.length - 1) * index),
      label: `$${item}`,
      usd: item,
    };
  });

  const [disableSlider, setDisableSlider] = useState(false);
  const [customValue, setCustomValue] = useState(0);
  const [amount, setAmount] = useState(10);
  const [subscription, setSubscription] = useState(false);
  const [donationText, setDonationText] = useState(t("donate") + " " + marks[2].label);

  const setReminderNever = useCallback(() => {
    const nextReminder = new Date();
    nextReminder.setFullYear(nextReminder.getFullYear() + 10);
    dispatch(setDonationState(nextReminder.getTime()));
  }, [dispatch]);

  const setReminder = useCallback(() => {
    const nextReminder = new Date();
    nextReminder.setDate(nextReminder.getDate() + 3);
    dispatch(setDonationState(nextReminder.getTime()));
  }, [dispatch]);

  useEffect(() => {
    const selectedAmount = customValue || amount;
    const subscriptionText = subscription ? " " + t("monthly") : "";
    setDonationText(t("donate") + ` $${selectedAmount}${subscriptionText}`);
    if(parseInt(selectedAmount) === 0) {
      setDonationText(t("no"));
    }
  }, [amount, customValue, setDonationText, subscription, t]);

  const handleSliderChange = useCallback((e, value) => {
    const mark = marks[marks.findIndex((mark) => mark.value === value)];
    const amount = mark.usd;
    setAmount(amount);
  }, [marks, setAmount]);

  const valueLabelFormat = useCallback((value) => {
    return marks[marks.findIndex((mark) => mark.value === value)].label;
  }, [marks]);

  const handleDonateClick = useCallback(() => {
    const selectedAmount = customValue || amount;
    if(selectedAmount > 0) {
      let url = `https://opencollective.com/fpv-wtf/donate?amount=${selectedAmount}`;
      if(subscription) {
        url += "&interval=month";
      }
      window.open(url, "_blank", "noopener,noreferrer");

      ReactGA.gtag("event", "donation", {
        value: selectedAmount,
        currency: "USD",
        subscription,
      });

      setReminderNever();
    } else {
      ReactGA.gtag("event", "donationNoThankYou");

      setReminder();
    }
  }, [amount, customValue, setReminder, setReminderNever, subscription]);

  const handleSkipClick = useCallback(() => {
    ReactGA.gtag("event", "donationAlreadyPaid");

    setReminderNever();
  }, [setReminderNever]);

  const handleCustomAmountUpdate = useCallback((e) => {
    const value = parseInt(e.target.value);

    setDisableSlider(value > 0);
    setCustomValue(value);
  }, [setCustomValue]);

  const handleSubscriptionUpdate = useCallback((e) => {
    setSubscription(e.target.checked);
  }, [setSubscription]);

  return(
    <Alert severity="success">
      <Stack spacing={2}>
        <Typography sx={{ fontWeight: "bold" }}>
          {t("title")}
        </Typography>

        <Typography>
          {t("description")}
        </Typography>

        <Typography>
          {t("supporter")}
        </Typography>

        <Box
          sx={{
            paddingRight: 2,
            marginBottom: 20,
          }}
        >
          <Slider
            aria-label="Restricted values"
            defaultValue={marks[2].value}
            disabled={disableSlider}
            marks={marks}
            onChangeCommitted={handleSliderChange}
            step={null}
            valueLabelDisplay="auto"
            valueLabelFormat={valueLabelFormat}
          />
        </Box>

        <Stack>
          <TextField
            id="outlined-basic"
            label={t("custom")}
            min={0}
            onChange={handleCustomAmountUpdate}
            type="number"
            variant="outlined"
          />

          <FormControlLabel
            control={
              <Checkbox
                onChange={handleSubscriptionUpdate}
              />
            }
            label={t("subscription")}
          />
        </Stack>

        <Box
          sx={{
            display: "flex",
            justifyContent: "right",
          }}
        >
          <Button
            color="secondary"
            onClick={handleSkipClick}
            sx={{
              marginRight: 2,
              backgroundColor: "gray",
            }}
            variant="contained"
          >
            {t("cancel")}
          </Button>

          <Button
            onClick={handleDonateClick}
            variant="contained"
          >
            {donationText}
          </Button>
        </Box>
      </Stack>
    </Alert>
  );
}

Donate.propTypes = {};
