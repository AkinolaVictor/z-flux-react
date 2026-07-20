import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import React, { ReactElement, RefObject, useEffect, useRef } from 'react'

interface Props {
    children: ReactElement<{
        className?: string;
        ref?: React.Ref<HTMLElement>;
    }>,
    speed?: number | string,
    delay?: number,
    duration?: number,
    animateOnScroll?: boolean,
    scrub?: boolean,
}


function TextColorFade(props: Props) {
    const {
        children,
        delay=0,
        animateOnScroll=false,
        scrub=false,
    } = props
    const containerRef: RefObject<HTMLElement | null> = useRef<HTMLElement>(null)
    
    function animator_func(){
        gsap.registerPlugin(SplitText, ScrollTrigger)
        const el = containerRef.current
        // const el = ".text-parentz"
        if(!el) return
        
        const splitRef = SplitText.create(el, {
            type: "lines,words,chars",
            linesClass: "line",
            wordsClass: "word",
            charsClass: "char",
            autoSplit: true,
        })

        const {chars, lines, words} = splitRef

        // const whichToAnimate = words
        // const whichToAnimate = lines
        const whichToAnimate = chars

        // initialize styles of each character
        gsap.set(whichToAnimate, {
            // x: 100,
            opacity: 0.4,
            // color: "rosybrown",
            // skewX: 50
        })

        const animate = (tl:any)=>{
            if(!tl) return null
            
            // loop through each line and apply styles to each character sequentially
            // charMeta.forEach(({char, charIndexInLine})=>{
            whichToAnimate.forEach((char, charIndexInLine)=>{
                tl.to(
                    char,
                    {
                        opacity: 1,
                        // color: "white",
                        // color: "yellow",
                        ease: "power3.out",
                        // skewX: 0
                    },
                    charIndexInLine*0.05
                )
            })
            
            return tl
        }

        
        if(scrub){
            
            const tl = gsap.timeline({paused: true, delay})
            ScrollTrigger.create({
                trigger: el,
                start: "top 90%",
                end: "top 35%",
                scrub: true,
                animation: tl
            })
            animate(tl)

            return splitRef.revert
        }
        
        if(animateOnScroll){
            const tl = gsap.timeline({paused: true, delay})
            animate(tl)

            ScrollTrigger.create({
                trigger: el,
                start: "top 90%",
                onEnter: ()=>tl.restart(),
                onLeaveBack: ()=>tl.pause(),
            })

            return splitRef.revert
        }



        const tl = gsap.timeline({delay:0})
        animate(tl)

        return splitRef.revert
    }

    useEffect(()=>{
        return animator_func()
    }, [])

    return React.cloneElement(children, {
        ref: containerRef,
        className: [
            children.props.className, 
            "text-parentz"
        ].filter(Boolean).join(" ")
    })
}

export default TextColorFade
