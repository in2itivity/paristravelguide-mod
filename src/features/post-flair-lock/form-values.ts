export type PostFlairLockFormValues = {
  targetId?: string,
  lockState?: string,
  notificationEnabled?: boolean,
  privateModNote?: string,
  // publicModNote?: string
};

export type NormalizedPostFlairLockFormValues = {
	lockState: string,
  notificationEnabled: boolean
	privateModNote: string,
  // publicModNote: string
};

export function normalizePostFlairLockFormValues(
	values: PostFlairLockFormValues
): NormalizedPostFlairLockFormValues {
	return {
		lockState: values.lockState ?? 'null',
    notificationEnabled: values.notificationEnabled ?? true,
		privateModNote: values.privateModNote ?? ""
    // publicModNote: values.publicModNote ?? ""
	};
}

export function getSubmittedTargetId(
  values: PostFlairLockFormValues,
  fallbackTargetId: string | undefined
): string | undefined {
  if (typeof values.targetId === 'string' && values.targetId.trim()) {
    return values.targetId.trim();
  }

  return fallbackTargetId;
}
