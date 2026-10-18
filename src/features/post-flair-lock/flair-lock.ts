import type {
  ModeratorPermission,
  Post,
  User
} from '@devvit/web/server';

import { reddit } from '@devvit/web/server';
import { isT3 } from '@devvit/web/shared';
import type { T3, T5 } from '@devvit/web/shared';
import { deleteCurrentFlair, delModLock, getModLock, setModLock, storeCurrentFlair } from './storage.js';

export type PostFlairManualLockRecord = {
	lockState: boolean | null,
	createdBy: string,
	createdAt: number,
	modNote: string
};

export type FlairRecord = {
	flairTemplateId?: string,
	flairText?: string
};

export type FlairLockOperationProps = {
  lockState: string,
	modNote: string
  postId: T3;
  subredditId: T5;
};

export type FlairLockOperationResult = {
  success: boolean;
  message: string;
};

function failedUnexpectedly(error: unknown): FlairLockOperationResult {
	console.error(error);
	return {
		success: false,
		message: "Flair lock operation failed! Please try again later.",
	};
}

function canManageFlair(permissions: readonly ModeratorPermission[]): boolean {
  return permissions.includes('all') || permissions.includes('flair');
}

// Determine the correct toast message
function successResult(oldLockState: boolean | null, newLockState: boolean | null, modNoteUpdated: boolean, messageSent: boolean): FlairLockOperationResult {
	let message: string;
	let success: boolean = true;
	
	if (oldLockState == newLockState) {
		if (modNoteUpdated)
			message = "Mod note updated";
		else {
			message = "No changes made";
			success = false;
		}
	} else {
		if (newLockState == null) {
			message = `Post flair lock has been removed`;
		} else {
			message = `Post flair has been ${newLockState == true ? "locked" : "unlocked"}`;
		}

		if (messageSent)
			message += "; message sent to OP";
	}

	return {
		success: success,
		message: message,
	};
}

async function getCurrentUserAndPost(
  postId: T3
): Promise<{ user: User; post: Post } | FlairLockOperationResult> {
  try {
    const [user, post] = await Promise.all([
      reddit.getCurrentUser(),
      reddit.getPostById(postId),
    ]);

    if (!user) {
      return { success: false, message: "Can't get user" };
    }

    return { user, post };
  } catch (error) {
    return failedUnexpectedly(error);
  }
}

export async function verifyFlairModerationPermissions(
	user: User,
	subredditName: string,
	deniedLogMessage: string
): Promise<FlairLockOperationResult | undefined> {
	let modPermissions: ModeratorPermission[];
	try {
		modPermissions = await user.getModPermissionsForSubreddit(subredditName);
	} catch (error) {
		return failedUnexpectedly(error);
	}

	const allowed = canManageFlair(modPermissions);
	const formattedPermissions = modPermissions.join(',');
	console.log(
		`Mod Info: r/${subredditName} u/${user.username} permissions:${formattedPermissions}: ${
			allowed ? 'Can mod' : 'Cannot mod'
		}`
	);

	if (allowed) return undefined;

	console.info(deniedLogMessage);
	return {
		message: "Insufficient permissions",
		success: false,
	};
}

export async function handlePostFlairLockCheck(postId: string): Promise<{ message: string }> {
	if (!isT3(postId))
		return { message: "Error: An unexpected error occurred" };

	const resolved = await getCurrentUserAndPost(postId);
  if ('success' in resolved) return resolved;

	// Check if user is OP or a moderator
	if (resolved.user.id != resolved.post.authorId) {
		const permissionFailure = await verifyFlairModerationPermissions(
			resolved.user,
			resolved.post.subredditName,
			"A user without the correct permissions tried to check a post's flair status."
  	);
		if (permissionFailure)
			return {
				message: "Only the OP and moderators can perform this action"
			};
	}
  
	const modLockRecord = await getModLock(postId);

	if (modLockRecord.lockState) {
		return {
			message: "This post's flair has been locked by the moderators"
		};
	} else {
		return {
			message: "No post flair restrictions found on this post"
		};
	}
}

export async function handlePostFlairLockPrint(postId: string): Promise<FlairLockOperationResult> {
	if (!isT3(postId))
		return {
			success: false,
			message: "Error: An unexpected error occurred"
		};
	
	const resolved = await getCurrentUserAndPost(postId);
  if ('success' in resolved) return resolved;

	const permissionFailure = await verifyFlairModerationPermissions(
		resolved.user,
		resolved.post.subredditName,
		"A user without the correct permissions tried to check a post's flair status."
	);
	if (permissionFailure)
		return {
			success: false,
			message: "Only moderators can perform this action"
		};

	const modLockRecord = await getModLock(postId);

	if (modLockRecord.lockState != null) {
		try {
			await reddit.sendPrivateMessage({
				to: resolved.user.username,
				subject: "Post flair lock details",
				text: `Here are the requested post flair lock details:
				
**Post:** [${resolved.post.title}](${resolved.post.url})
				
**Flair lock state:** ${modLockRecord.lockState ? "Locked" : "Unlocked"}

**Created by:** ${modLockRecord.createdBy}

**Mod note:** ${modLockRecord.modNote}`
			});
		} catch {
			return {
				success: false,
				message: "Failed to send message"
			};
		}

		return {
			success: true,
			message: "Flair lock record found; please check your chat messages"
		};
	} else {
		return {
			success: false,
			message: "No flair lock record found for this post"
		};
	}
}

export async function handlePostFlairLockChange(
	props: FlairLockOperationProps
): Promise<FlairLockOperationResult> {
	const currentTime = Date.now();
	
	const resolved = await getCurrentUserAndPost(props.postId);
  if ('success' in resolved) return resolved;

	// Verify moderation permissions
	const permissionFailure = await verifyFlairModerationPermissions(
    resolved.user,
    resolved.post.subredditName,
    "A user without the correct mod permissions tried to modify a post flair's lock."
  );
  if (permissionFailure) return permissionFailure;

	const currentLockRecord = await getModLock(props.postId);
	let modNoteUpdated: boolean = false;

	// Setting case
	if (props.lockState != 'null') {
		modNoteUpdated = props.modNote != currentLockRecord.modNote;

		const newModLockRecord: PostFlairManualLockRecord = {
			lockState: props.lockState == 'true',
			modNote: props.modNote,
			createdBy: resolved.user.username,
			createdAt: currentTime
		};
		await Promise.all([
			setModLock(props.postId, newModLockRecord),
			storeCurrentFlair(props.postId)
		]);

	} else {
		if (currentLockRecord.lockState != null) {
			await Promise.all([
				delModLock(props.postId),
				deleteCurrentFlair(props.postId)
			]);
		}
	}

	return successResult(
		currentLockRecord.lockState,
		props.lockState == 'null' ? null : (props.lockState == 'true'),
		modNoteUpdated, false
	);
}
