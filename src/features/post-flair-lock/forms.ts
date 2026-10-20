import { UiResponse, isT3 } from '@devvit/web/shared';
import { context } from '@devvit/web/server';
import {
	getSubmittedTargetId,
	normalizePostFlairLockFormValues,
	type PostFlairLockFormValues } from './form-values.js';
import { handlePostFlairLockChange } from './flair-lock.js'


export type { PostFlairLockFormValues } from './form-values.js';

export async function handlePostFlairLockUpdate(values: PostFlairLockFormValues): Promise<UiResponse> {

	const normalized = normalizePostFlairLockFormValues(values);

	const targetId = getSubmittedTargetId(values, context.postId);
	if (!isT3(targetId)) {
		console.error('targetId is not a T3', targetId);
		return {
			showToast: 'Failed! Please try again later.',
		};
	}

	const result = await handlePostFlairLockChange({
		...normalized,
		postId: targetId,
		subredditId: context.subredditId
	});

	console.log(
    `Result - ${result.success ? 'success' : 'fail'} - ${result.message}`
  );

	return {
		showToast: `${result.message}`
	};
}