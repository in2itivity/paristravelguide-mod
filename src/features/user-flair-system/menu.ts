import type { Form } from '@devvit/web/shared';

export function buildUserFlairSelectionForm(): Form {
	return {
		fields: [
			{
				type: 'select',
				name: 'flair',
				label: "User flair label",
				options: [
					{value: 'test', label: "Test"}
				],
				required: false
			}
		]
	};
}
