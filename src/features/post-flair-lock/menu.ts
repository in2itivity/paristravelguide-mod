import type { Form } from '@devvit/web/shared';
import { getPostFlairLockSettings } from './settings.js';
import { isT3 } from '@devvit/web/shared';

import { getModLock } from './storage.js';
import type { PostFlairManualLockRecord } from './flair-lock.js';

export async function buildPostFlairLockForm(targetId: string): Promise<Form> {
	let modLockRecord: PostFlairManualLockRecord | null = null;
	if (isT3(targetId)) {
		modLockRecord = await getModLock(targetId);
	}
	const settings = await getPostFlairLockSettings();

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
					`${modLockRecord?.lockState ?? 'null'}`
				],
				required: true,
				multiSelect: false
			},
			{
				type: 'boolean',
				name: 'notificationEnabled',
				label: "Notify OP if they try to change the post flair",
				helpText: "Only applicable if post flair lock setting is set to \"Locked\".",
				defaultValue: modLockRecord?.lockState == true ? modLockRecord.notificationEnabled : settings.notifyOnProtectedChange
			},
			{
				type: 'paragraph',
				name: 'privateModNote',
				label: "Mod note",
				helpText: "Only saved if post flair lock setting is set to \"Locked\" or \"Unlocked\".",
				defaultValue: modLockRecord?.privateModNote ?? "",
			}
		],
		title: "Manage post flair lock"
	};
}