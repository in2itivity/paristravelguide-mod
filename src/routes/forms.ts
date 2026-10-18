import { Hono } from 'hono';
import type { UiResponse } from '@devvit/web/shared';
import {
  handleMopCommentSubmit,
  handleMopPostSubmit,
  type NukeFormValues,
} from '../features/mop/forms.js';
import { handleManualPostSubmit } from '../features/manual-post/forms.js';
import { handlePostFlairLockUpdate, type PostFlairLockFormValues } from '../features/post-flair-lock/forms.js'
import { ManualPostFormValues } from '../features/manual-post/form-values.js';

// Router for form submit endpoints declared in devvit.json/forms.
export const forms = new Hono();

forms.post('/mop-comment-submit', async (c) => {
  // Parse submitted form values into typed payload.
  const values = await c.req.json<NukeFormValues>();
  console.log('values', values);
  // Delegate business logic to feature module.
  const response = await handleMopCommentSubmit(values);

  // Return UI response consumed by Reddit client.
  return c.json<UiResponse>(response, 200);
});

forms.post('/mop-post-submit', async (c) => {
  // Parse submitted form values into typed payload.
  const values = await c.req.json<NukeFormValues>();
  console.log('values', values);
  // Delegate business logic to feature module.
  const response = await handleMopPostSubmit(values);

  // Return UI response consumed by Reddit client.
  return c.json<UiResponse>(response, 200);
});

forms.post('/manual-post', async (c) => {
  // Parse submitted form values into typed payload.
  const values = await c.req.json<ManualPostFormValues>();
  console.log('values', values);
  const response = await handleManualPostSubmit(values);

  // Return UI response consumed by Reddit client.
  return c.json<UiResponse>(response, 200);
});

forms.post('/post-flair-lock', async (c) => {
  const values = await c.req.json<PostFlairLockFormValues>();
  console.log('values', values);

  const response = await handlePostFlairLockUpdate(values);

  return c.json<UiResponse>(response, 200);
})
