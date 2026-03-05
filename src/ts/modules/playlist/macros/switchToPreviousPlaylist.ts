import { moduleId } from "../../../constants";
import { isDefined } from "../../../helpers/isDefined";
import { flagKey } from "../constants";

export async function switchToPreviousPlaylist() {
  const previous = game.user.getFlag(moduleId, flagKey);

  if (!previous || !Array.isArray(previous)) {
    await game.user.unsetFlag(moduleId, flagKey);
    ui.notifications.error("No previous playlist stored in user flags.");
    return;
  }

  const previousPlaylists = previous
    .map((x) => game.playlists.get(x))
    .filter(isDefined);

  if (!previousPlaylists) {
    ui.notifications.error("Stored previous playlists could not be found");
    return;
  }

  const currentlyPlaying = game.playlists.playing.filter(
    //@ts-ignore
    (x) => x.channel === "music",
  );
  if (currentlyPlaying) {
    currentlyPlaying.forEach((x) => x.stopAll());
  }

  await Promise.all(previousPlaylists.map((x) => x.playAll()));
}
