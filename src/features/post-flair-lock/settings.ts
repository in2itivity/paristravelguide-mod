import { settings } from '@devvit/web/server';
import { SettingsValidationRequest, SettingsValidationResponse } from "@devvit/web/shared";
import { reddit } from '@devvit/web/server';

export type PostFlairLockSettings = {
	protectedFlairUUIDs: Set<string>;
	gracePeriodLength: number;
	messageCooldown: number;
	protectEmpty: boolean;
	notifyOnProtectedChange: boolean;
	sendGraceWarning: boolean;
};

export async function getPostFlairLockSettings(): Promise<PostFlairLockSettings> {
	// Fetch settings
	const enableProtected = await settings.get<string>('postFlairLock_enableProtectedFlairs');
	const rawList = await settings.get<string>('postFlairLock_protectedFlairList');
	const graceLength = await settings.get<number>('postFlairLock_graceMinutes');
	const messageCooldown = await settings.get<number>('postFlairLock_messageCooldown');
	const protectEmpty = await settings.get<boolean>('postFlairLock_protectedEmptyFlair');
	const messageOnProtectedChange = await settings.get<boolean>('postFlairLock_notifyOnProtectedChange');
	const sendGraceWarning = await settings.get<boolean>('postFlairLock_sendGraceWarning');

	let ids: Set<string> = new Set();
	if (rawList && enableProtected) {
		const idsArray = rawList.split(/\r?\n/).map(id => id.trim());
		ids = new Set(idsArray);
	}

	return {
		protectedFlairUUIDs: ids,
		gracePeriodLength: graceLength ?? 0,
		messageCooldown: messageCooldown ?? 0,
		protectEmpty: protectEmpty ?? false,
		notifyOnProtectedChange: messageOnProtectedChange ?? true,
		sendGraceWarning: sendGraceWarning ?? true
	}
}

export async function validatePostFlairLockProtectedUUIDList(request: SettingsValidationRequest<string>): Promise<SettingsValidationResponse> {
	const flairIdRegex: RegExp = /^[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}(?:\r?\n[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12})*$/;


	if (request.value && !flairIdRegex.test(request.value)) {
		return {
			success: false,
			error: "Enter a valid list of UUIDs, separated by line breaks."
		};
	}

	if (!request.value) return {
		success: true
	};

	const ids = request.value.split(/\r?\n/).map(id => id.trim());

	const subreddit = await reddit.getCurrentSubreddit();
	const templates = await reddit.getPostFlairTemplates(subreddit.name);

	const validIds = new Set(templates.map(template => template.id));

	const invalidIds = ids.filter(id => !validIds.has(id));

	if (invalidIds.length > 0) {
		return {
			success: false,
			error: `Invalid flair template IDs: ${invalidIds.join(", ")}`
		};
	}


	return {
		success: true
	};
}