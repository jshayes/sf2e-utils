import { moduleId } from "../../../constants";
import { validate } from "../../../helpers/validation";
import { flagKey } from "../constants";

type Input = {
  playlistName: string;
};

function validateInput(input: Input): asserts input is Input {
  validate(
    [
      (scope) => ({
        condition:
          !scope.playlistName || typeof scope.playlistName !== "string",
        message: `The playlistName property must be a string, received: ${typeof scope.playlistName}`,
      }),
    ],
    input,
  );
}

export async function switchToPlaylist(input: Input) {
  validateInput(input);

  const { playlistName } = input;

  const targetPlaylist = game.playlists.getName(playlistName);
  if (!targetPlaylist) {
    ui.notifications.error(`Playlist not found: ${playlistName}`);
    return;
  }

  const currentlyPlaying = game.playlists.playing.filter(
    //@ts-ignore: channel is not on the type, but it is there
    (x) => x.channel === "music",
  );
  if (currentlyPlaying) {
    await game.user.setFlag(
      moduleId,
      flagKey,
      currentlyPlaying.map((x) => x.id),
    );

    currentlyPlaying.forEach((x) => x.stopAll());
  } else {
    await game.user.unsetFlag(moduleId, flagKey);
  }

  await targetPlaylist.playAll();
}
