import React, {
    CSSProperties,
    MouseEventHandler,
    ReactElement,
    RefObject,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
    build_extend_animation,
    countNumbers,
    findScrollingElement,
    randomizeArray,
    getLayerWidth,
    overlay_text_animations,
} from "z-flux-utils";

gsap.registerPlugin(ScrollTrigger);

type Trigger = "onscroll" | "inview" | "none";
type AnimationOrder = "normal" | "reverse" | "random";
type AnimationDimension = "x" | "y";

interface RenderLayerProps {
    data: any;
    index: number;
}

interface OverlayTextProps {
    text?: string;
    children?: React.ReactElement<{
        style?: React.CSSProperties;
        className?: string;
    }>;
    textClass?: string;
    textStyle?: CSSProperties;
    layerStyle?: CSSProperties;
    layerClass?: string;
    containerStyle?: CSSProperties;
    containerClass?: string;
    scrollingElement?: string;
    trigger?: Trigger;
    timeline?: gsap.core.Timeline;
    stagger?: number;
    duration?: number;
    layers?: number;
    layerColor?: string;
    RenderLayer?: React.ComponentType<RenderLayerProps>;
    animationOrder?: AnimationOrder;
    animation: keyof typeof overlay_text_animations;
    animationDimension?: AnimationDimension;
    extendAnimation?: unknown;
    gsapScrollTrigger?:
        | ScrollTrigger.Vars
        | ((timeline: gsap.core.Timeline) => ScrollTrigger.Vars);
    controllerRef?: RefObject<gsap.core.Timeline | null>;
    useOpacity?: boolean;
    animationDirection?: number | string;
    onClick?: MouseEventHandler<HTMLDivElement>;
}

function DefaultLayerComponent({
    data,
    index,
}: RenderLayerProps): ReactElement {
    return <div />;
}

export default function Overlay_Text({
    text,
    children,
    textClass = "",
    textStyle,
    layerStyle,
    layerClass = "",
    containerStyle,
    containerClass = "",
    scrollingElement,
    trigger,
    timeline,
    stagger = 0.2,
    duration = 1.5,
    layers = 1,
    layerColor = "white",
    RenderLayer = DefaultLayerComponent,
    animationOrder = "normal",
    animation,
    animationDimension = "y",
    extendAnimation,
    gsapScrollTrigger,
    controllerRef,
    useOpacity,
    animationDirection = 0,
    onClick,
}: OverlayTextProps): ReactElement {
    const containerRef = useRef<HTMLElement | null>(null);
    const heightRef = useRef<HTMLDivElement>(null);

    const allLayers = countNumbers(layers);

    const [layerWidth, setLayerWidth] = useState<any>({
        eachWidth: "100%",
        lastWidth: "100%",
    });

    const [layerHeight, setLayerHeight] = useState<any>({
        eachWidth: "100%",
        lastWidth: "100%",
    });

    const tl = timeline ?? gsap.timeline();

    if (controllerRef) {
        controllerRef.current = tl;
    }

    const anim =
        animation !== undefined
            ? overlay_text_animations[animation] ??
              overlay_text_animations.VerticalReveal
            : overlay_text_animations.VerticalReveal;

    const {
        defaultGsap,
        animation_origins,
    } = anim;

    const color = animation=="OpacityX"||animation=="OpacityY"?
                overlay_text_animations.OpacityX.color:
                null

    function animate_func() {
        if (trigger === "none") return;

        const parent = heightRef.current;

        if (!parent) return;

        const elements = Array.from(parent.children) as HTMLElement[];

        const el =
            animationOrder === "reverse"
                ? [...elements].reverse()
                : animationOrder === "random"
                ? randomizeArray(elements)
                : elements;

        const ctx = gsap.context(() => {
            const scroller = scrollingElement
                ? (document.querySelector(
                      scrollingElement
                  ) as HTMLElement | null)
                : findScrollingElement(parent, true);

            tl.set(el, {
                opacity: useOpacity ? 1 : 1,
                ...build_extend_animation(defaultGsap, "from"),
                ...build_extend_animation(
                    extendAnimation,
                    "from"
                ),
            });

            tl.to(el, {
                opacity: useOpacity ? 0 : 1,
                stagger,
                duration,
                ...build_extend_animation(defaultGsap, "to"),
                ...build_extend_animation(
                    extendAnimation,
                    "to"
                ),
            });

            const triggerOptions =
                typeof gsapScrollTrigger === "function"
                    ? gsapScrollTrigger(tl) || {}
                    : gsapScrollTrigger || {};

            if (trigger === "onscroll") {
                ScrollTrigger.create({
                    trigger: parent,
                    start: "top 65%",
                    end: "top 30%",
                    animation: tl,
                    scrub: true,
                    scroller,
                    ...triggerOptions,
                });
            }

            if (trigger === "inview") {
                ScrollTrigger.create({
                    trigger: parent,
                    start: "top bottom",
                    animation: tl,
                    scroller,
                    onEnter: () => tl.restart(),
                    onLeaveBack: () => tl.pause(),
                    ...triggerOptions,
                });
            }
        }, heightRef);

        return () => ctx.revert();
    }

    useEffect(() => {
        if (animationDimension === "y") {
            const { eachWidth, lastWidth } = getLayerWidth(
                heightRef,
                allLayers.length,
                "width"
            );

            setLayerWidth({ eachWidth, lastWidth });
        } else {
            const { eachWidth, lastWidth } = getLayerWidth(
                heightRef,
                allLayers.length,
                "height"
            );

            setLayerHeight({ eachWidth, lastWidth });
        }
    }, []);

    useLayoutEffect(() => {
        const cleanup = animate_func();
        return cleanup;
    }, [
        scrollingElement,
        trigger,
        timeline,
        stagger,
        duration,
        animationOrder,
        animation,
        animationDimension,
        extendAnimation,
        gsapScrollTrigger,
        useOpacity,
        animationDirection,
    ]);

    return (
        <div
            className={`overlay_text_container ${containerClass}`}
            style={{
                width: "auto",
                height: "auto",
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
                ...containerStyle,
            }}
            onClick={onClick}
        >
            {text ? (
                <p
                    ref={containerRef as React.Ref<HTMLParagraphElement>}
                    className={`text-parentz ${textClass}`}
                    style={textStyle}
                >
                    {text}
                </p>
            ) : (
                React.isValidElement(children) &&
                React.cloneElement( children as React.ReactElement<any>, {
                    ref: containerRef,
                    style: {
                        ...(children.props.style ?? {}),
                        ...textStyle,
                    },
                    className: [
                        children.props.className,
                        "text-parentz",
                        textClass,
                    ]
                        .filter(Boolean)
                        .join(" "),
                })
            )}

            <div
                ref={heightRef}
                className="text_overlay_container"
                style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    display: "flex",
                    flexDirection:
                        animationDimension === "y"
                            ? "row"
                            : "column",
                }}
            >
                {allLayers.map((data, index) => {
                    const last =
                        index === allLayers.length - 1;

                    return (
                        <div
                            key={index}
                            className={`each-overlay-block ${layerClass}`}
                            style={{
                                height:
                                    animationDimension === "y"
                                        ? "100%"
                                        : last
                                        ? layerHeight.lastWidth
                                        : layerHeight.eachWidth,
                                width:
                                    animationDimension === "x"
                                        ? "100%"
                                        : last
                                        ? layerWidth.lastWidth
                                        : layerWidth.eachWidth,
                                willChange: "transform",
                                background: color||layerColor,
                                transformOrigin:
                                    typeof animationDirection ===
                                    "number"
                                        ? animation_origins[
                                              animationDirection
                                          ] ?? "center"
                                        : animationDirection,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                ...layerStyle,
                            }}
                        >
                            <RenderLayer
                                data={data}
                                index={index}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}