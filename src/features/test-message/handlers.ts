import { reddit } from '@devvit/web/server';

type TestMessageResult = {
  success: boolean;
  message: string;
};

export async function sendTestChatMessage(): Promise<TestMessageResult> {
    const currentUser = await reddit.getCurrentUser();
    // const subreddit = await reddit.getCurrentSubreddit();
    if (!currentUser) {
        return {
            success: false,
            message: 'Unable to identify current user.',
        };
    }

    console.log("Attempting to send a test message to: " + currentUser.username);

    try {
        await reddit.sendPrivateMessage({
            to: currentUser.username,
            subject: "Test message from r/ParisTravelGuide",
            text: `
If you can see this message, automated chat notifications from r/ParisTravelGuide are working correctly.

**Replies to this chat are not monitored.** If you need assistance from the moderators, please contact them via mod mail.
`
        });
    } catch (e) {
        console.log(e);
        return {success: false, message: "Message was not successfully sent. Please check your chat permission settings."};
    }

    return {success: true, message: "Message was sent sucessfully. Please check your chat messages."};
}