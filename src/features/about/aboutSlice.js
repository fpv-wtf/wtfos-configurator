import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  team: [
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
  ],
};

export const aboutSlice = createSlice({
  name: "about",
  initialState,
});

export const selectTeam = (state) => state.about.team;

export default aboutSlice.reducer;
