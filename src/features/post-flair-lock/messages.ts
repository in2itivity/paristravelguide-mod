import { reddit } from '@devvit/web/server';

export async function sendPostFlairRevertMsg(
	authorName: string,
	reason: 'mod' | 'global',
	msgParams: {
		subredditName: string,
		postTitle: string,
		postUrl: string,
		oldPostFlair: string,
	}
): Promise<void> {
	const msgText = reason == 'mod' ? `
Sorry, the post flair of your post on r/\ufeff${msgParams.subredditName} has been locked by a moderator, and cannot be changed at this time.

Your post's flair has been reverted to **${msgParams.oldPostFlair}**.

For more information on why your post's flair is locked, please contact the moderators via mod mail.

**Post:** [${msgParams.postTitle}](${msgParams.postUrl})

**Note:** Replies to this message will not be monitored.
` : `
Sorry, the post flair of your post on r/\ufeff${msgParams.subredditName} is a protected flair, and can only be changed with moderator approval.

Your post's flair has been reverted to **${msgParams.oldPostFlair}**.

To request to change this post's flair, please contact the moderators via mod mail.

**Post:** [${msgParams.postTitle}](${msgParams.postUrl})

**Note:** Replies to this message will not be monitored.
`;
	await reddit.sendPrivateMessage({
		to: authorName,
		subject: `Post flair change reverted on r/\ufeff${msgParams.subredditName}`,
		text: msgText
	});
}

export async function sendGracePeriodStartMsg(
	authorName: string,
	msgParams: {
		subredditName: string,
		postTitle: string,
		postUrl: string,
		newPostFlair: string,
		graceLength: number
	}
): Promise<void> {
	await reddit.sendPrivateMessage({
					to: authorName,
					subject: `Regarding your recent post flair edit on r/${msgParams.subredditName}`,
					text: `
Hello u/\ufeff${authorName},

You've recently edited the post flair on one of your posts on ${msgParams.subredditName} to ${msgParams.newPostFlair}, which is a protected flair.  
This means you won't be able to change the flair again without moderator approval.

The post's flair will remain unlocked for the next ${msgParams.graceLength} minutes, after which it will be locked.
If you've changed your mind and want to change the flair to something else, please do so before this time expires.

Past this time, you will need to contact the moderators to change the post's flair again.

Thanks for participating on our subreddit!

**Post:** [${msgParams.postTitle}](${msgParams.postUrl})

_Replies to this message will not be monitored. If you have any questions regarding this system, please contact the moderators._`
				});
}

export async function sendGracePeriodHaltMsg(
	authorName: string,
	msgParams: {
		subredditName: string,
		postTitle: string,
		postUrl: string,
		newPostFlair: string,
		graceLength: number
	}
): Promise<void> {
	await reddit.sendPrivateMessage({
					to: authorName,
					subject: `Regarding your recent post flair edit on r/${msgParams.subredditName}`,
					text: `
Hello u/${authorName},

This message is to confirm that you have changed the post flair of your post to ${msgParams.newPostFlair}, which is a non-protected flair.  
The post flair will no longer be locked, and no further action is required on your part.

Thanks for participating on our subreddit!

**Post:** [${msgParams.postTitle}](${msgParams.postUrl})

_Replies to this message will not be monitored. If you have any questions regarding this system, please contact the moderators._`
				});
}