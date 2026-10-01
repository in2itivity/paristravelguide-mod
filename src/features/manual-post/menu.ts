import type { Form } from '@devvit/web/shared';
import { context } from '@devvit/web/server';

export function buildManualPostForm(): Form {
    
    return {
        fields: [
            {
                type: "select",
                options: [
                    {label: "u/" + context.appSlug, value: "profile"}
                ],
                name: "dest",
                label: "Post to"
            },
            {
                type: "string",
                name: "title",
                label: "Post title"
            },
            {
                type: "paragraph",
                name: "body",
                label: "Post body"
            },
            {
                type: 'boolean',
                name: 'pinned',
                label: "Pin post"
            },
            {
                type: "boolean",
                name: "locked",
                label: "Lock post"
            }
        ],
        title: "Post as bot"
    };
}