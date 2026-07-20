import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import React, { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { findScrollingElement } from 'z-flux-utils';

gsap.registerPlugin(ScrollTrigger)

export default function VerticalScroll({
    scrollingElement,
    direction="normal", //normal, reverse, backward
    children = <div>Nothing to Display, Please add some properly styled content</div>,
    style,
    className,
    startAnimation="bottom",  //top, within, bottom
    gsapScrollTrigger,
    scrollSpeed=1, // -.5, 0.6, 1,2,3,4,5,6 ++
}) {
    const containerRef = useRef()
    const [ready, setReady] = useState(false)
    const [height, setHeight] = useState(0)

    function performCalculations(){
        if(ready) return
        function getTotalWidth(){
            const el = containerRef.current
            if(!el) return
            const children = el.children
            const first = children[0].getBoundingClientRect().width
            let total = 0
            for(let i=0; i<children.length; i++){
                const eachChild = children[i]
                const width = eachChild.getBoundingClientRect().width
                total=total+width
            }
            return total - first
        }

        const totalWidth = getTotalWidth()
        if(totalWidth) setHeight(totalWidth)
        setReady(true)
    }

    useEffect(()=>{
        performCalculations()
    }, [])

    useLayoutEffect(()=>{
        const el = containerRef.current
        if(!el || !height) return;

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
            
            const setX = gsap.quickTo(el, "x", {
                ease: "power3.out",
                duration: 0.2
            })

            ScrollTrigger.create({
                trigger: el,
                scroller,
                start,
                end: `+=${height/scrollSpeed}px`,
                pin: true,
                scrub: true,
                invalidateOnRefresh: true,
                onUpdate: (self)=>{
                    setX(useDirection*self.progress)
                },
                ...gsapScrollTrigger
            })

        }, containerRef)

        return ()=>ctx.revert()

    }, [
        height,
        direction,
        startAnimation,
        scrollSpeed,
        scrollingElement,
        gsapScrollTrigger
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
                        <Fragment key={index}>
                            {child}
                        </Fragment>
                    )
                })
            }
        </div>
    )
}

