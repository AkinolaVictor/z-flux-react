import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import React, {
    CSSProperties,
    ReactElement,
    ReactNode,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    build_extend_animation,
    findScrollingElement,
    getScrollHeight,
    value_negator,
    vertical_scroll_animations,
} from "z-flux-utils";

gsap.registerPlugin(ScrollTrigger);

type Direction = "normal" | "reverse" | "backward";
type StartAnimation = "top" | "within" | "bottom" | string;

export interface VerticalScrollProps {
    scrollingElement?: string;
    direction?: Direction;
    children?: ReactNode;
    style?: CSSProperties;
    className?: string;
    startAnimation?: StartAnimation;
    gsapScrollTrigger?: ScrollTrigger.Vars;
    scrollSpeed?: number;
    timeline?: gsap.core.Timeline;
    animation: keyof typeof vertical_scroll_animations;
    extendAnimation?: unknown;
}

export default function VerticalScroll({
    scrollingElement,
    direction = "normal",
    children = (
        <div>
            Nothing to Display, Please add some properly styled content
        </div>
    ),
    style,
    className = "",
    startAnimation = "bottom",
    gsapScrollTrigger,
    scrollSpeed = 1,
    timeline,
    animation,
    extendAnimation,
}: VerticalScrollProps): ReactElement {
    const containerRef = useRef<HTMLDivElement>(null);

    const [height, setHeight] = useState<number>(0);

    const useAnimation =
        animation !== undefined
            ? vertical_scroll_animations[animation]
            : undefined;

    const differentDirection =
        direction === "reverse" || direction === "backward";

    const animations = useMemo(() => {
        const from = build_extend_animation(useAnimation, "from");
        const to = build_extend_animation(useAnimation, "to");
        const extendFrom = build_extend_animation(extendAnimation, "from");
        const extendTo = build_extend_animation(extendAnimation, "to");

        if (differentDirection) {
            from.x = value_negator(from, "x");
            extendFrom.x = value_negator(extendFrom, "x");
        }

        return {
            from,
            to,
            extendFrom,
            extendTo,
        };
    }, [useAnimation, extendAnimation, differentDirection]);

    useLayoutEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver(() => {
            getScrollHeight(containerRef, setHeight);
            ScrollTrigger.refresh();
        });

        observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, []);

    useLayoutEffect(() => {
        const el = containerRef.current;

        if (!el || !height) return;

        const childElements = Array.from(el.children) as HTMLElement[];

        const ctx = gsap.context(() => {
            const useDirection =
                {
                    normal: -height,
                    reverse: height,
                    backward: height,
                }[direction] ?? -height;

            const winHeight = window.innerHeight;

            const mid =
                (winHeight - el.getBoundingClientRect().height) / 2;

            const start =
                {
                    top: "top top",
                    within: `top ${mid}px`,
                    bottom: "bottom bottom",
                }[startAnimation as "top" | "within" | "bottom"] ??
                startAnimation;

            const scroller = scrollingElement
                ? (document.querySelector(
                      scrollingElement
                  ) as HTMLElement | null)
                : findScrollingElement(el, true);

            const tl =
                timeline ??
                gsap.timeline({
                    scrollTrigger: {
                        trigger: el,
                        scroller,
                        start,
                        end: `+=${height / scrollSpeed}`,
                        pin: true,
                        scrub: true,
                        invalidateOnRefresh: true,
                        ...gsapScrollTrigger,
                    },
                });

            tl.to(el, {
                x: useDirection,
                ease: "none",
            });

            gsap.set(childElements, {
                ...animations.from,
                ...animations.extendFrom,
            });

            childElements.forEach((child) => {
                gsap.to(child, {
                    ...animations.to,
                    ...animations.extendTo,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: child,
                        containerAnimation: tl,
                        start: differentDirection
                            ? "right 25%"
                            : "left 75%",
                        end: differentDirection
                            ? "right 75%"
                            : "left 25%",
                        scrub: true,
                    },
                });
            });
        }, containerRef);

        return () => ctx.revert();
    }, [
        height,
        animation,
        direction,
        startAnimation,
        gsapScrollTrigger,
        scrollSpeed,
        timeline,
        extendAnimation,
        differentDirection,
        animations,
        scrollingElement,
    ]);

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "auto",
                position: "relative",
                display: "flex",
                alignItems: "flex-start",
                justifyContent:
                    direction === "backward"
                        ? "flex-end"
                        : "flex-start",
                flexDirection:
                    direction === "reverse"
                        ? "row-reverse"
                        : "row",
                ...style,
            }}
            className={`${className} scroll_container`}
        >
            {React.Children.map(children, (child) => child)}
        </div>
    );
}