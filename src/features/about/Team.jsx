import React from "react";
import { useSelector } from "react-redux";

import Grid from "@mui/material/Grid";

import TeamTile from "./TeamTile";

import { selectTeam } from "./aboutSlice";

export default function Team() {
  const team = useSelector(selectTeam);
  const renderedTeam = team.map((member) => {
    return (
      <Grid
        item
        key={member.nick}
        xs={3}
      >
        <TeamTile
          description={member.description}
          honorary={member.honorary}
          name={member.name}
          nick={member.nick}
          twitter={member.twitter}
        />
      </Grid>
    );
  });

  return(
    <Grid
      alignItems="stretch"
      container
      spacing={2}
    >
      {renderedTeam}
    </Grid>
  );
}
