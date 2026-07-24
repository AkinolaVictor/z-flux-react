import { useGSAP } from '@gsap/react';
import React, { useEffect, useRef, useState } from 'react';
import { animation_list, build_extend_animation, findScrollingElement, getProgressionData } from 'z-flux-utils';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(SplitText, ScrollTrigger)

export default function Z_Text(props) {
    const {
        text, 
        scrollingElement,
        progression="char",
        animation= "Fade",
        trigger, // onscroll, inview, none
        controllerRef=null,
        style,
        className,
        children,
        delay=0,
        timeline=undefined,
        speed,
        gsapScrollTrigger,
        extendAnimation,
        watch=false
    } = props
    const containerRef = useRef(null);
    const [fontLoaded, setFontLoaded] = useState(false)
    const [resizeTick, setResizeTick] = useState(0);

    const playOnScroll = trigger==="onscroll"
    const playInView = trigger==="inview"
    const paused = playOnScroll || playInView
    const tl = timeline ?? gsap.timeline({ paused, delay });
    
    if(controllerRef){
        controllerRef.current = tl
    }

    function initi_animation() {
        if(trigger==="none") return

        const element = containerRef.current;
        if (!element || !fontLoaded) return;
        const ctx = gsap.context(() => {
            const scroller = scrollingElement?document.querySelector(`${scrollingElement}`):findScrollingElement(element, true);

            const split = SplitText.create(element, {
                type: "lines,words,chars",
                autoSplit: true,
                linesClass: "line",
                wordsClass: "word",
                charsClass: "char"
            });

            const { chars, words, lines } = split;

            const progressionData = getProgressionData(
                progression,
                chars,
                words,
                lines,
                speed,
                playOnScroll
            );

            const useAnimation = animation_list[animation] ?? animation_list["Fade"]

            const fromAnimation = {
                ...build_extend_animation(useAnimation, "from"),
                ...build_extend_animation(extendAnimation, "from")
            };

            const toAnimation = {
                ...build_extend_animation(useAnimation, "to"),
                ...build_extend_animation(extendAnimation, "to")
            };

            tl.set(progressionData.set, fromAnimation);

            const grouped = progression === "char_line" || progression === "word_line";
            if (grouped) {
                progressionData.animate.forEach(item => {
                    tl.to(
                        item.char,
                        toAnimation,
                        item.charIndexInLine * progressionData.speed
                    );
                });
            } else {
                tl.to(
                    progressionData.animate,
                    {
                        ...toAnimation,
                        stagger: progressionData.speed
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
                    ...triggerOptions
                });
            } else if (playInView) {
                ScrollTrigger.create({
                    trigger: element,
                    scroller,
                    start: "top bottom",
                    animation: tl,
                    onEnter: () => tl.restart(),
                    onLeaveBack: () => tl.pause(),
                    ...triggerOptions
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
        const update = () => setResizeTick(prev => prev + 1);
        target.addEventListener("resize", update);
        return () => {
            target.removeEventListener("resize", update);
        };
    }

    useEffect(() => {
        const cleanup = updateScreenResize();
        return cleanup;
    }, [watch]);

    useEffect(() => {
        let mounted = true;
        async function waitForFonts() {
            await document.fonts.ready;
            if (mounted) setFontLoaded(true);
        }
        waitForFonts();
        return () => mounted = false;
    }, []);

    useGSAP(
        initi_animation,
        {
            scope: containerRef,
            dependencies: [
                fontLoaded,
                resizeTick,
                trigger
            ]
        }
    );

    if(React.isValidElement(children)){
        return React.cloneElement(children, {
            ref: containerRef,
            style: {
                visibility: fontLoaded?"visible":"hidden",
                ...style,
                ...children.props.style
            },
            className: [
                "fade_textation_x",
                children.props.className, 
                className,
            ].filter(Boolean).join(" ")
        })
    }

    return (
        <p 
            className={`fade_textation_x ${className}`}
            style={{
                visibility: fontLoaded?"visible":"hidden",
                ...style
            }} 
            ref={containerRef}
        >
            {text}
        </p>
    );
}
