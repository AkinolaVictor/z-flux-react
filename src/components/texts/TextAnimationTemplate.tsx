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
    // speed?: any
}


function TextAnimationTemplate(props: Props) {
    const {
        children,
        speed=0.05,
        delay=0,
        duration=0.65,
        animateOnScroll=false,
        scrub=false,
    } = props
    
    const stagger = speed=="fast"?0.02:
                    speed=="slow"?0.008:
                    0.05
    const containerRef: RefObject<HTMLElement | null> = useRef<HTMLElement>(null)
    
    function animator_func(){
        gsap.registerPlugin(SplitText, ScrollTrigger)
        const el = containerRef.current
        if(!el) return
        
        const splitRef = SplitText.create(el, {
            type: "lines,words,chars",
            linesClass: "line",
            wordsClass: "word",
            charsClass: "char",
            autoSplit: true,
        })

        const {chars, lines} = splitRef

        // initialize styles of each character
        gsap.set(chars, {
            x: 100,
            opacity: 0,
            skewX: 70
        })

        // set each character in a line into an array
        // number of array = number of lines,
        // total number of elements in each array is equal to the total number of characters in that line
        const charMeta = lines.flatMap((line)=>{
            const lineChars = chars.filter((c)=>{
                return line.contains(c)
            })
            return lineChars.map((char, charIndexInLine)=>({char, charIndexInLine}))
        })

        const animate = (tl:any)=>{
            if(!tl) return null
            
            // loop through each line and apply styles to each character sequentially
            charMeta.forEach(({char, charIndexInLine})=>{
                tl.to(
                    char,
                    {
                        x: 0,
                        opacity: 1,
                        skewX: 0,
                        color: "yellow",
                        ease: "power3.out"
                    },
                    charIndexInLine*stagger
                )
            })
            
            return tl
        }
        
        if(scrub){
            const tl = gsap.timeline({paused: true, delay})
            animate(tl)

            ScrollTrigger.create({
                trigger: el,
                start: "top 90%",
                end: "top 45%",
                scrub: true,
                animation: tl
            })

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



        const tl = gsap.timeline({delay})
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
            "animated-header"
        ].filter(Boolean).join(" ")
    })
}

export default TextAnimationTemplate
