import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import React, { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { build_extend_animation, findScrollingElement, getScrollHeight, randomizeArray, value_negator, vertical_scroll_animations, } from 'z-flux-utils';

gsap.registerPlugin(ScrollTrigger)

export default function VerticalScroll(props) {
    const {
        scrollingElement,
        direction="normal", //normal, reverse, backward
        children = <div>Nothing to Display, Please add some properly styled content</div>,
        style,
        className,
        startAnimation="bottom",  //top, within, bottom
        gsapScrollTrigger,
        scrollSpeed=1, // -.5, 0.6, 1,2,3,4,5,6 ++
        timeline,
        contentOrder,
        animation,
        extendAnimation,
    } = props
    const containerRef = useRef()
    const [height, setHeight] = useState(0)
    const useAnimation = vertical_scroll_animations[animation]

    useEffect(()=>{
        getScrollHeight(
            containerRef,
            setHeight
        )
    }, [])
    
    
    useLayoutEffect(()=>{
        const el = containerRef.current
        if(!el || !height) return;
        const elements = [...el.children]
        const children = (
            contentOrder==="reverse"?
            elements.reverse():
            contentOrder==="random"?
            randomizeArray(elements):
            elements
        )
        
        let ctx = gsap.context(()=>{
            const scroller = scrollingElement?document.querySelector(`${scrollingElement}`):findScrollingElement(el, true);
            
            const useDirection = {
                normal: -height,
                reverse: height,
                backward: height
            }[direction]??-height

            const mid = (window.innerHeight - el.getBoundingClientRect().height)/2
            
            const start = {
                top: "top top",
                within: `top ${mid}px`,
                bottom: "bottom bottom",
            }[startAnimation]??startAnimation

            const tl = timeline||gsap.timeline({
                scrollTrigger: {
                    trigger: el,
                    scroller,
                    start,
                    end: `+=${height / scrollSpeed}`,
                    pin: true,
                    scrub: true,
                    invalidateOnRefresh: true,
                    ...gsapScrollTrigger
                }
            });

            tl.to(el, {
                x: useDirection,
                ease: "none"
            });

            const differentDirection = direction==="reverse"||direction==="backward"
            let animateFrom = build_extend_animation(useAnimation, "from")
            let extendFrom = build_extend_animation(extendAnimation, "from")

            if(differentDirection) animateFrom.x = value_negator(animateFrom, "x")
            if(differentDirection) extendFrom.x = value_negator(extendFrom, "x")

            gsap.set(children, {
                ...animateFrom,
                ...extendFrom,
            })
            
            children.forEach((child) => {
                gsap.to(child, {
                    ...build_extend_animation(useAnimation, "to"),
                    ...build_extend_animation(extendAnimation, "to"),
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: child,
                        containerAnimation: tl,
                        start: (
                            differentDirection?
                            "right 25%":
                            "left 75%"
                        ),
                        end: (
                            differentDirection?
                            "right 75%":
                            "left 25%"
                        ),
                        scrub: true,
                        toggleActions: "play none none reverse"
                    }
                });
            });
        }, containerRef)

        return ()=>ctx.revert()
    }, [
        height,
        props
    ])


    return (
        <div
            ref={containerRef} 
            style={{
                width: "100%", height: "auto", position: "relative",
                display: "flex", 
                alignItems: "flex-start",
                justifyContent: `${direction=="backward"?"flex-end":"flex-start"}`,
                flexDirection: `${direction=="reverse"?"row-reverse":"row"}`,
                ...style
            }}
            className={`${className} scroll_container`}
        >
            {
                React.Children.map(children, (child, index)=>{
                    return (
                        <Fragment 
                            key={index}
                        >
                            {child}
                        </Fragment>
                    )
                })
            }
        </div>
    )
}
