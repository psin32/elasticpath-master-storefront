'use client'

import { StoryblokComponent } from "@storyblok/react";

interface IContent {
    content: any;
}

export default function Content({content}: IContent): JSX.Element {

    return (
        content?.story?.content && <StoryblokComponent blok={content?.story.content} />
    )
}
