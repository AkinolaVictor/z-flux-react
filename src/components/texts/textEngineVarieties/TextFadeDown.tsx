import React, { ReactElement } from 'react';
import TextEngine from '../TextEngine';

export interface TextEngineTypes {
    children?: ReactElement<{
        className?: string;
        style:any;
        ref?: React.Ref<HTMLElement>;
    }>,
    text?: string,
    scrollingElement?: string,
    progression?: "char" | "word" | "line" | "char_line" | "word_line",
    style?: any,
    className?: string,
    speed?: number,
    playOnScroll?: boolean | number | undefined,
    playInView?: boolean,
    delay?: number,
    timeline?: any,
    gsapScrollTrigger?: any,
    extendAnimation?: any,
    defaultAnimation?: any,
    watch?: any
}

function TextFadeDown(props: TextEngineTypes) {


    return (
        <TextEngine 
            defaultAnimation={{
                opacity: [0, 1],
                y: ["100%", "0%"],
                duration: [null, 1],
                stagger: [null, 0.1]
            }}
            {...props}
        />
    )
}

export default TextFadeDown
