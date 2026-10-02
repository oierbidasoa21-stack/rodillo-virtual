export interface UpdatePromptState {
  /** A new version is installed and waiting. */
  needRefresh: boolean;
  /** The user chose "Más tarde" in this page load. */
  dismissed: boolean;
  /** A session is playing; reloading now would cut it short. */
  playing: boolean;
  /** The editor is open; reloading now would lose unsaved changes. */
  editing: boolean;
}

/** Updating reloads the page, so only offer it when nothing would be lost. */
export function shouldShowUpdatePrompt(s: UpdatePromptState): boolean {
  return s.needRefresh && !s.dismissed && !s.playing && !s.editing;
}
