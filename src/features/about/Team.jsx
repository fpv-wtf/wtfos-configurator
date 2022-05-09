import React from "react";

import Grid from "@mui/material/Grid";

import TeamTile from "./TeamTile";


export default function Team() {
  const team = [
    {
      nick: "j005u",
      name: "Joonas Trussmann",
      twitter: "j005u",
      description: "Doing the boogie woogie since voc-poc",
    },
    {
      nick: "jaanuke",
      description: "Busy flying most of the time",
    },
    {
      nick: "funnel",
      description: "Finds all the best shit",
    },
    {
      nick: "bri3d",
      name: "Brian Ledbetter",
      twitter: "bri3d",
      description: "Likes hacking things that move",
    },
    {
      nick: "stylesuxx",
      name: "Chris L.",
      twitter: "stylesuxx",
      description: "God of Configurators",
    },
    {
      honorary: true,
      nick: "tmbinc",
      name: "Felix Domke",
      twitter: "tmbinc",
      description: "Don't turn it off, take it apar..bzzzt",
    },
    {
      honorary: true,
      nick: "bin4ry",
      description: "Sir Dronehacks",
    },
  ];
  return(
    <Grid
      alignItems="stretch"
      container
      spacing={2}
    >
      {team.map((member) => {
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
      })}
      
    </Grid>
  );
}
