import { reddit } from '@devvit/web/server';
import {
  T2,
  T3,
  type OnPostFlairUpdateRequest
} from '@devvit/web/shared';

import { checkPostFlairLockStatus, FlairLockCheckResult, verifyFlairModerationPermissions, /*type FlairRecord*/ } from './flair-lock.js';
import { getPostFlairLockSettings } from './settings.js';
import { getFlairRecord, storeFlairRecord, deleteFlairRecord } from './storage.js';
import { sendGracePeriodHaltMsg, sendGracePeriodStartMsg, sendPostFlairRevertMsg } from './messages.js';

function asT3(id: string): T3 {
  return (id.startsWith('t3_') ? id : `t3_${id}`) as T3;
}

function asT2(id: string): T2 {
  return (id.startsWith('t2_') ? id : `t2_${id}`) as T2;
}

async function revertUnauthorizedFlairChange(input: OnPostFlairUpdateRequest, lockStatus: FlairLockCheckResult): Promise<void> {
	if (!input.author || !input.subreddit?.name || !input.post?.id) 
		return;

	// Revert flair
	const flairRecord = await getFlairRecord(asT3(input.post?.id));
	if (!flairRecord || !flairRecord.flairTemplateId || !flairRecord.flairText)
		return;

	await reddit.setPostFlair({
		subredditName: input.subreddit.name,
		postId: asT3(input.post.id),
		flairTemplateId: flairRecord.flairTemplateId,
		text: flairRecord.flairText
	});

	// const post = await reddit.getPostById(asT3(input.post.id));
	// Send notification if enabled
	if (lockStatus.lockState && lockStatus.reason == 'mod' && lockStatus.notificationEnabled) {
		await sendPostFlairRevertMsg(input.author.name,
			'mod',
			{
				subredditName: input.subreddit.name,
				postTitle: input.post.title,
				postUrl: input.post.url,
				oldPostFlair: flairRecord.flairText
			}
		);

	} else if (lockStatus.lockState && lockStatus.reason == 'global') {
		const settings = await getPostFlairLockSettings();

		if (settings.notifyOnProtectedChange) {
			await sendPostFlairRevertMsg(
				input.author.name,
				'global',
				{
					subredditName: input.subreddit.name,
					postTitle: input.post.title,
					postUrl: input.post.url,
					oldPostFlair: flairRecord.flairText
				}
			);
		}
	}
}

async function handlePostFlairUpdateAsNonMod(input: OnPostFlairUpdateRequest): Promise<void> {
	if (!input.author || !input.subreddit?.name || !input.post?.id) 
		return;

	const t3 = asT3(input.post?.id);

	const lockStatus = await checkPostFlairLockStatus(t3);

	if (lockStatus.lockState) {
		await revertUnauthorizedFlairChange(input, lockStatus);
		return;
	}

	if (lockStatus.reason == 'mod') return;

	// Check if protected flair needs to be set
	const settings = await getPostFlairLockSettings();
	const isProtected = input.post.linkFlair?.templateId ?
		settings.protectedFlairUUIDs.has(input.post.linkFlair?.templateId) : settings.protectEmpty;

	
	if (isProtected) {
		const flairRecord = await getFlairRecord(t3);
		if (flairRecord?.flairTemplateId != input.post.linkFlair?.templateId) {
			console.log(`Non-mod has changed post ${input.post.id} to the protected flair "${input.post.linkFlair?.text}"`);

			await storeFlairRecord(t3, {
				flairTemplateId: input.post.linkFlair?.templateId ?? '',
				flairText: input.post.linkFlair?.text ?? '',
				// globalLock: true,
				establishedDate: Date.now()
			});

			// Send warning message
			if (settings.gracePeriodLength > 0) {
				await sendGracePeriodStartMsg(
					input.author.name,
					{
						subredditName: input.subreddit.name,
						postTitle: input.post.title,
						postUrl: input.post.url,
						newPostFlair: input.post.linkFlair?.text ?? "",
						graceLength: settings.gracePeriodLength
					}
				);
			}
		}
	} else {
		
		await deleteFlairRecord(t3);
		if (lockStatus.gracePeriod == true) {
			// Changed flair to not protected -- send confirmation message
			await sendGracePeriodHaltMsg(
				input.author.name,
				{
					subredditName: input.subreddit.name,
					postTitle: input.post.title,
					postUrl: input.post.url,
					newPostFlair: input.post.linkFlair?.text ?? "",
					graceLength: settings.gracePeriodLength
				}
			);
		}
	}
}


async function handlePostFlairUpdateAsMod(input: OnPostFlairUpdateRequest): Promise<void> {
	
	return;
}

export async function handlePostFlairUpdate(
  input: OnPostFlairUpdateRequest
): Promise<void> {
	if (!input.author || !input.subreddit?.name || !input.post?.id) 
		return;

	const author = await reddit.getUserById(asT2(input.author.id));
	if (!author) return;

	// Check for mod permissions
	const isFlairMod = await verifyFlairModerationPermissions(
		author,
		input.subreddit?.name,
	);

	if (isFlairMod) {
		// await handlePostFlairUpdateAsMod(input);
	} else {
		await handlePostFlairUpdateAsNonMod(input);
	}
}