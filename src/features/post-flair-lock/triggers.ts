import { reddit } from '@devvit/web/server';
import {
  T2,
  T3,
  type OnPostFlairUpdateRequest
} from '@devvit/web/shared';

import { verifyFlairModerationPermissions } from './flair-lock.js'
import { getLockedFlairData, getModLock } from './storage.js';

function asT3(id: string): T3 {
  return (id.startsWith('t3_') ? id : `t3_${id}`) as T3;
}

function asT2(id: string): T2 {
  return (id.startsWith('t2_') ? id : `t2_${id}`) as T2;
}

async function sendRevertMessage(
	subredditName: string | undefined,
  authorName: string | undefined,
	postUrl: string,
  flairText: string
): Promise<void> {
	if (!subredditName || !authorName || authorName === '[deleted]') return;

	await reddit.sendPrivateMessage({
		to: authorName,
		subject: `Post flair change reverted on r/${subredditName}`,
		text: `
Sorry, the post flair of [your post on r/${subredditName}](${postUrl}) has been locked by a moderator, and cannot be changed at this time.

Your post's flair has been reverted to ${flairText}.

For more information on why your post's flair is locked, please contact the moderators via mod mail.

**Note:** Replies to this message will not be monitored.`
	});
}

export async function handlePostFlairUpdateFlairLock(
  input: OnPostFlairUpdateRequest
): Promise<void> {
	if (!input.author || !input.subreddit?.name || !input.post?.id) 
		return;

  const modLockRecord = await getModLock(asT3(input.post?.id));

	if (!modLockRecord.lockState)
		return;

	const author = await reddit.getUserById(asT2(input.author.id));
	if (!author) return;

	// Check for mod permissions
	const permissionFailure = await verifyFlairModerationPermissions(
		author,
		input.subreddit?.name,
		"Non-mod attempted to change."
	);
	if (!permissionFailure) {
		// TODO: add case for updating flair
		return;
	}
	
		
	// Revert flair
	const flairRecord = await getLockedFlairData(asT3(input.post?.id));
	if (!flairRecord.flairTemplateId || !flairRecord.flairText)
		return;

	await reddit.setPostFlair({
		subredditName: input.subreddit.name,
		postId: asT3(input.post.id),
		flairTemplateId: flairRecord.flairTemplateId,
		text: flairRecord.flairText
	});

	console.log(`Post flair on ${input.post.id} reverted to ${flairRecord.flairText}`);

	const postUrl = (await reddit.getPostById(asT3(input.post.id))).url;

	await sendRevertMessage(
		input.subreddit.name,
		input.author.name,
		postUrl,
		flairRecord.flairText
	);
}