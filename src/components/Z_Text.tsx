import { useGSAP } from "@gsap/react";
import React, {
    CSSProperties,
    ReactElement,
    RefObject,
    useEffect,
    useRef,
    useState,
} from "react";
import {
    build_extend_animation,
    findScrollingElement,
    getProgressionData,
    randomizeArray,
    z_text_animations,
} from "z-flux-utils";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(SplitText, ScrollTrigger);

type Trigger = "onscroll" | "inview" | "none";

type AnimationOrder =
    | "firstToLast"
    | "lastToFirst"
    | "random";

interface ProgressionItem {
    char: Element | Element[];
    charIndexInLine: number;
}

interface ProgressionData {
    set: Element[];
    animate: Element[] | ProgressionItem[];
    speed: number;
}

interface ZTextProps {
    text?: string;
    scrollingElement?: string;
    progression?: string;
    animation: keyof typeof z_text_animations;
    animationOrder?: AnimationOrder;
    trigger?: Trigger;
    controllerRef?: RefObject<gsap.core.Timeline | null>;
    style?: CSSProperties;
    className?: string;
    children?:  React.ReactElement<{
        style?: React.CSSProperties;
        className?: string;
    }>
    delay?: number;
    timeline?: gsap.core.Timeline;
    speed?: number;
    stagger?: number;
    gsapScrollTrigger?:
        | ScrollTrigger.Vars
        | ((timeline: gsap.core.Timeline) => ScrollTrigger.Vars);
    extendAnimation?: unknown;
    watch?: boolean | string;
    repeatAnimation?: number | "loop";
}

export default function Z_Text({
    text,
    scrollingElement,
    progression = "char",
    animation,
    animationOrder = "firstToLast",
    trigger,
    controllerRef,
    style,
    className = "",
    children,
    delay = 0,
    timeline,
    speed,
    stagger,
    gsapScrollTrigger,
    extendAnimation,
    watch = false,
    repeatAnimation = 0,
}: ZTextProps): ReactElement {
    const containerRef = useRef<HTMLElement | null>(null);

    const [resizeTick, setResizeTick] = useState(0);

    const playOnScroll = trigger === "onscroll";
    const playInView = trigger === "inview";
    const paused = playOnScroll || playInView;

    const useAnimation =
        animation !== undefined
            ? z_text_animations[animation]
            : {};

    const tl =
        timeline ??
        gsap.timeline({
            paused,
            delay,
            repeat:
                repeatAnimation === "loop"
                    ? -1
                    : repeatAnimation,
        });

    if (controllerRef) {
        controllerRef.current = tl;
    }

    function initi_animation() {
        if (trigger === "none") return;

        const element = containerRef.current;
        if (!element) return;

        const ctx = gsap.context(() => {
            const scroller = scrollingElement
                ? (document.querySelector(
                      scrollingElement
                  ) as HTMLElement | null)
                : findScrollingElement(element, true);

            const split = SplitText.create(element, {
                type: "lines,words,chars",
                autoSplit: true,
                linesClass: "line",
                wordsClass: "word",
                charsClass: "char",
            });

            const words =
                animationOrder === "lastToFirst"
                    ? [...split.words].reverse()
                    : animationOrder === "random"
                    ? randomizeArray(split.words)
                    : split.words;

            const lines =
                animationOrder === "lastToFirst"
                    ? [...split.lines].reverse()
                    : animationOrder === "random"
                    ? randomizeArray(split.lines)
                    : split.lines;

            const chars =
                animationOrder === "lastToFirst"
                    ? [...split.chars].reverse()
                    : animationOrder === "random"
                    ? randomizeArray(split.chars)
                    : split.chars;

            const progressionData = getProgressionData(
                progression,
                chars,
                words,
                lines,
                speed || stagger,
                playOnScroll
            ) as ProgressionData;

            element.style.visibility = "visible";

            tl.set(progressionData.set, {
                ...build_extend_animation(useAnimation, "from"),
                ...build_extend_animation(
                    extendAnimation,
                    "from"
                ),
            });

            const grouped =
                progression === "char_line" ||
                progression === "word_line";

            if (grouped) {
                (progressionData.animate as ProgressionItem[]).forEach(
                    (item) => {
                        tl.to(
                            item.char,
                            {
                                ...build_extend_animation(
                                    useAnimation,
                                    "to"
                                ),
                                ...build_extend_animation(
                                    extendAnimation,
                                    "to"
                                ),
                            },
                            item.charIndexInLine *
                                progressionData.speed
                        );
                    }
                );
            } else {
                tl.to(
                    progressionData.animate as Element[],
                    {
                        ...build_extend_animation(
                            useAnimation,
                            "to"
                        ),
                        ...build_extend_animation(
                            extendAnimation,
                            "to"
                        ),
                        stagger: progressionData.speed,
                    },
                    0
                );
            }

            const triggerOptions =
                typeof gsapScrollTrigger === "function"
                    ? gsapScrollTrigger(tl) || {}
                    : gsapScrollTrigger || {};

            if (playOnScroll) {
                ScrollTrigger.create({
                    trigger: element,
                    scroller,
                    start: "top 85%",
                    end: "top 35%",
                    scrub: true,
                    animation: tl,
                    ...triggerOptions,
                });
            } else if (playInView) {
                ScrollTrigger.create({
                    trigger: element,
                    scroller,
                    start: "top bottom",
                    animation: tl,
                    onEnter: () => tl.restart(),
                    onLeaveBack: () => tl.pause(),
                    ...triggerOptions,
                });
            }
        }, containerRef);

        return () => ctx.revert();
    }

    function updateScreenResize() {
        if (!watch) return;

        const target =
            typeof watch === "string"
                ? document.querySelector(watch)
                : window;

        if (!target) return;

        const update = () =>
            setResizeTick((prev) => prev + 1);

        target.addEventListener("resize", update);

        return () => {
            target.removeEventListener(
                "resize",
                update
            );
        };
    }

    useEffect(() => {
        const cleanup = updateScreenResize();
        return cleanup;
    }, [watch]);

    useGSAP(initi_animation, {
        scope: containerRef,
        dependencies: [
            resizeTick,
            scrollingElement,
            progression,
            animation,
            animationOrder,
            trigger,
            delay,
            speed,
            stagger,
            gsapScrollTrigger,
            extendAnimation,
        ],
    });

    if (React.isValidElement(children)) {
        return React.cloneElement(
            children as React.ReactElement<any>,
            {
                ref: containerRef,
                style: {
                    visibility: "hidden",
                    ...style,
                    ...(children.props.style ?? {}),
                },
                className: [
                    "fade_textation_x",
                    children.props.className,
                    className,
                ]
                    .filter(Boolean)
                    .join(" "),
            }
        );
    }

    return (
        <p
            ref={containerRef as React.Ref<HTMLParagraphElement>}
            className={`fade_textation_x ${className}`}
            style={{
                visibility: "hidden",
                ...style,
            }}
        >
            {text}
        </p>
    );
}