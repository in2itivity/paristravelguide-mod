import { Hono } from 'hono';
import type { MenuItemRequest, UiResponse } from '@devvit/web/shared';
import { buildNukeForm } from '../features/mop/menu.js';
import { createWeeklyMegathreadManual } from '../features/scheduler-megathread/handlers.js';
import { sendTestChatMessage } from '../features/test-message/handlers.js';
import { buildManualPostForm } from '../features/manual-post/menu.js';
import { buildPostFlairLockForm } from '../features/post-flair-lock/menu.js';
import { handlePostFlairLockCheck, handlePostFlairLockPrint } from '../features/post-flair-lock/flair-lock.js';

// Router for menu actions declared in devvit.json/menu.items.
export const menu = new Hono();

menu.post('/mop-comment', async (c) => {
  // Parse menu payload to access selected target id.
  const request = await c.req.json<MenuItemRequest>();
  console.log('request', request.targetId);
  return c.json<UiResponse>(
    {
      showForm: {
        name: 'mopComment',
        form: buildNukeForm('Mop Comments', request.targetId),
      },
    },
    200
  );
});

menu.post('/mop-post', async (c) => {
  // Parse menu payload to access selected target id.
  const request = await c.req.json<MenuItemRequest>();
  return c.json<UiResponse>(
    {
      showForm: {
        name: 'mopPost',
        form: buildNukeForm('Mop Post Comments', request.targetId),
      },
    },
    200
  );
});

menu.post('/manual-post', async (c) => {
  // Parse menu payload to access selected target id.
  // const request = await c.req.json<MenuItemRequest>();
  return c.json<UiResponse>(
    {
      showForm: {
        name: 'manualPost',
        form: await buildManualPostForm(),
      },
    },
    200
  );
});

menu.post('/create-weekly-megathread', async (c) => {
  // Payload is unused today, but parsing keeps this route consistent
  // with other menu handlers and easier to extend later.
  await c.req.json<MenuItemRequest>();
  // Delegate to feature handler that performs settings/permission checks.
  const result = await createWeeklyMegathreadManual();

  return c.json<UiResponse>(
    {
      showToast: result.message,
    },
    200
  );
});

menu.post('/send-test-message', async (c) => {
  // Payload is unused today, but parsing keeps this route consistent
  // with other menu handlers and easier to extend later.
  await c.req.json<MenuItemRequest>();
  // Delegate to feature handler that performs settings/permission checks.
  const result = await sendTestChatMessage();

  return c.json<UiResponse>(
    {
      showToast: result.message,
    },
    200
  );
});

menu.post('/set-flair-lock', async (c) => {
  const request = await c.req.json<MenuItemRequest>();

  return c.json<UiResponse>(
    {
      showForm: {
        name: 'postFlairLock',
        form: await buildPostFlairLockForm(request.targetId)
      }
    }
  );
});

menu.post('/print-flair-lock', async (c) => {
  const request = await c.req.json<MenuItemRequest>();

  const result = await handlePostFlairLockPrint(request.targetId);

  return c.json<UiResponse>(
    {
      showToast: `${result.success ? 'Success' : 'Failed'}: ${result.message}`
    }
  );
});

menu.post('/get-flair-lock', async (c) => {
  const request = await c.req.json<MenuItemRequest>();

  const result = await handlePostFlairLockCheck(request.targetId);

  return c.json<UiResponse>(
    {
      showToast: result.message
    }
  );
});
