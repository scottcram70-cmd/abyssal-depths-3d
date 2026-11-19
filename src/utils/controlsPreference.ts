export const MIRRORED_CONTROLS_STORAGE_KEY = 'abyssal-depths-mirrored-controls';

export function loadMirroredControlsPreference(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(MIRRORED_CONTROLS_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function saveMirroredControlsPreference(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      MIRRORED_CONTROLS_STORAGE_KEY,
      enabled ? 'true' : 'false'
    );
  } catch {
    // Ignore storage errors (e.g. private browsing quota/restrictions)
  }
}
