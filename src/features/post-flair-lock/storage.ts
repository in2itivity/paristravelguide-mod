import { redis, reddit } from '@devvit/web/server';
import type { T3 } from '@devvit/web/shared';
import { type PostFlairManualLockRecord, type FlairRecord } from './flair-lock.js'

function keyForFlairState(postId: T3): string {
	return `postFlairLock:state:${postId}`;
}

function keyForGlobalLockRecord(postId: T3): string {
  return `postFlairLock:global:${postId}`;
}

function keyForManualLockRecord(postId: T3): string {
	return `postFlairLock:mod:${postId}`;
}


export async function storeCurrentFlair(postId: T3): Promise<void> {
	const post = await reddit.getPostById(postId);
	const flairRecord: FlairRecord = {
		flairTemplateId: post.flair?.templateId ?? '',
		flairText: post.flair?.text ?? ''
	};

	await redis.hSet(keyForFlairState(postId), flairRecord);
}

export async function getLockedFlairData(postId: T3): Promise<FlairRecord> {
	const record = await redis.hGetAll(keyForFlairState(postId));

	const flairRecord: FlairRecord = {
		flairTemplateId: record['flairTemplateId'] ?? '',
		flairText: record['flairText'] ?? ''
	};

	return flairRecord;
}

export async function deleteCurrentFlair(postId: T3): Promise<void> {
	await redis.del(keyForFlairState(postId));
}

export async function setModLock(postId: T3, lockRecord: PostFlairManualLockRecord): Promise<void> {
	await redis.hSet(keyForManualLockRecord(postId), {
		lockState: String(lockRecord.lockState),
		createdBy: lockRecord.createdBy,
		createdAt: String(lockRecord.createdAt),
		modNote: lockRecord.modNote
	});
}

export async function delModLock(postId: T3): Promise<void> {
	await redis.del(keyForManualLockRecord(postId));
	console.log("deleted");
}

export async function getModLock(postId: T3): Promise<PostFlairManualLockRecord> {
	const record = await redis.hGetAll(keyForManualLockRecord(postId));

	const lockRecord: PostFlairManualLockRecord = {
		lockState: 'lockState' in record ? (record['lockState'] == 'true') : null,
		createdBy: record['createdBy'] ?? '',
		createdAt: Number(record['createdAt']),
		modNote: record['modNote'] ?? ''
	};

	return lockRecord;
}

export async function deleteAllLockRecords(postId: T3): Promise<void> {
	await Promise.all([
		redis.del(keyForFlairState(postId)),
		redis.del(keyForManualLockRecord(postId)),
		redis.del(keyForGlobalLockRecord(postId))
	]);
}