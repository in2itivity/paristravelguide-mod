# r/ParisTravelGuide's Custom Moderation App

This is a custom moderation app for r/ParisTravelGuide. We've programmed it with features for our specific needs, such as 

## Feature overview

Here is an overview of the features of our moderation app.

### Post flair locking

This feature allows moderators to lock and unlock a post's flair.

**Manual locking/unlocking:**

* Use the "Set post flair lock" menu action to set a post's flair as manually locked or manually unlocked.
  * The app records this state with your username, date/time, and you can also a mod note.
  * By default, OP will be notified if they attempt to change the flair while locked, but you can set this message to be suppressed.
* Use the "Print post flair lock details" menu action to retrieve information for a manual post flair lock or unlock and print them as a private message.

**Protected flairs:**

* Protected flairs are considered locked by default, and cannot be edited unless a moderator overrides this.
* Use the app settings to mark post flairs as protected by entering their flair template IDs.
* Use the app settings to define a grace period. See below for details.
* Existing posts will not update their flair lock status automatically when adding or removing protected flairs. To force a manual update, run the "Check for post flair restrictions" menu action on the post.

**OP's perspective:**

* If an OP attempts to change a post's flair when it is locked or protected, the flair is reverted automatically and a message is sent to notify them.
* If a post's flair is unlocked but OP changes the flair to a protected flair, a notification is sent and a grace period begins. After the grace period ends, the flair is locked and can no longer be changed.
* An OP can use the "Check for post flair restrictions" public menu action to verify a post's flair lock status.
  * They can see whether the flair is locked by a moderator, locked due to a protected flair, or explicitly unlocked by a moderator. If a grace period is active, they can see the time remaining.

## Notes

* This app outputs notifications to moderators and OPs as chat messages from the app's account.

## Tech Stack

- [Devvit](https://developers.reddit.com/): Reddit's platform for building and deploying apps
- [Vite](https://vite.dev/): Fast build tool for the web components
- [Hono](https://hono.dev/): Lightweight web framework for backend logic
- [TypeScript](https://www.typescriptlang.org/): Type-safe development
