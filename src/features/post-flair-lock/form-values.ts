export type PostFlairLockFormValues = {
  targetId?: string,
  lockState?: string,
  modNote?: string
};

export type NormalizedPostFlairLockFormValues = {
	lockState: string,
	modNote: string,
};

export function normalizePostFlairLockFormValues(
	values: PostFlairLockFormValues
): NormalizedPostFlairLockFormValues {
	return {
		lockState: values.lockState ?? 'null',
		modNote: values.modNote ?? ""
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
