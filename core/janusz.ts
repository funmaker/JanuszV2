import type JanuszCore from "./index";

// Kept separate from ./index so that hot-reloading the core does not reload every module importing the instance.
export let janusz: JanuszCore;

export function setJanusz(core: JanuszCore) {
  janusz = core;
}
