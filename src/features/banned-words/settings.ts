import { settings } from '@devvit/web/server';
import type {
  SettingsValidationRequest,
  SettingsValidationResponse,
} from '@devvit/web/shared';
import { findRemovalReason } from './triggers.js'


export type BannedWordsSettings = {
  enabled: boolean;
  words: string[];
  removalReasonName: string;
};

// Parse a moderator-provided CSV/newline list into canonical values used for matching.
// We normalize to lowercase and remove duplicates so matching logic can stay simple.
function parseBannedWords(raw: string | undefined): string[] {
  // Empty setting means no banned words configured.
  if (!raw) return [];

  const values = raw
    // Allow mods to enter either one-per-line or comma-separated entries.
    .split(/[\n,]+/)
    // Normalize whitespace and case for stable matching behavior.
    .map((entry) => entry.trim().toLowerCase())
    // Ignore blank entries created by trailing commas/newlines.
    .filter(Boolean);

  // Deduplicate so repeated entries do not waste compute.
  return [...new Set(values)];
}

export async function getBannedWordsSettings(): Promise<BannedWordsSettings> {
  // Feature toggle stored in subreddit install settings.
  const enabled = Boolean(await settings.get<boolean>('bannedWordsEnabled'));
  // Raw list entered by moderators in settings UI.
  const raw = await settings.get<string>('bannedWordsList');
  // Name of removal reason to use for the removal
  const removalReasonName = String(await settings.get<string>('automatedRemovalReason'));

  return {
    enabled,
    // Always return parsed/canonical values to callers.
    words: parseBannedWords(raw),
    removalReasonName
  };
}

export function validateBannedWords(
  request: SettingsValidationRequest<string>
): SettingsValidationResponse {
  // Run the same parser used by runtime code to ensure consistent semantics.
  const parsed = parseBannedWords(request.value);
  // Keep entry length bounded to avoid accidental huge tokens and noisy modmail.
  if (parsed.some((entry) => entry.length > 64)) {
    return {
      success: false,
      error: 'Each banned word or phrase must be 64 characters or fewer.',
    };
  }

  // Validation passed.
  return { success: true };
}

export async function validateRemovalReason(request: SettingsValidationRequest<string>): Promise<SettingsValidationResponse> {
  if (!request.value)
    return { success: true };

  // Determine whether a removal reason exists with the specified value
  if (await findRemovalReason(request.value)) {
    return { success: true };
  } else {
    return {
      success: false,
      error: "No removal reason with this title was found on the subreddit."
    };
  }
}
