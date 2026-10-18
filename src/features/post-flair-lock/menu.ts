import type { Form } from '@devvit/web/shared';
import { isT3 } from '@devvit/web/shared';

import { getModLock } from './storage.js';
import type { PostFlairManualLockRecord } from './flair-lock.js';

export async function buildPostFlairLockForm(targetId: string): Promise<Form> {
	let modLockRecord: PostFlairManualLockRecord | null = null;
	if (isT3(targetId)) {
		modLockRecord = await getModLock(targetId);
	}

	return {
		fields: [
			{
				type: 'string',
				name: 'targetId',
				label: "Target post ID",
				helpText: "Autofilled from the selected item.",
				defaultValue: targetId,
				required: true,
				disabled: true
			},
			{
				type: 'select',
				name: 'lockState',
				label: "Post flair lock setting",
				helpText: "\"Not set\" will use the global rules defined in the app settings.",
				options: [
					{
						label: "Not set",
						value: 'null'
					},
					{
						label: "Locked",
						value: 'true'
					},
					{
						label: "Unlocked",
						value: 'false'
					}
				],
				defaultValue: [
					`${modLockRecord?.lockState}`
				],
				required: true,
				multiSelect: false
			},
			{
				type: 'paragraph',
				name: 'modNote',
				label: "Mod note",
				helpText: "Only saved if post flair lock setting is set to \"Locked\" or \"Unlocked\".",
				defaultValue: modLockRecord?.modNote ?? "",
			}
		],
		title: "Manage post flair lock"
	};
}