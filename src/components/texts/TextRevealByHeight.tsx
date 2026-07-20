import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import React, { ReactElement, RefObject, useEffect, useRef } from 'react'

interface Props {
    children: ReactElement<{
        className?: string;
        ref?: React.Ref<HTMLElement>;
    }>,
}

function TextRevealByHeight(props: Props) {
    const {children} = props
    const containerRef: RefObject<HTMLElement | null> = useRef<HTMLElement>(null)
    const heightRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null)
    
    function animate_func(){
        const el = heightRef.current
        gsap.registerPlugin(ScrollTrigger)

        gsap.fromTo(el, 
            {
                scaleY: 1
            }, 
            {
                scaleY: 0,
                scrollTrigger: {
                    trigger: el,
                    start: "top 80%",
                    end: "bottom 50%",
                    scrub: true
                }
            }
        )
    }

    useEffect(()=>{
        animate_func()
    }, [])

    return (
        <div className='w-full h-screen bg-black text-white flex flex-col justify-center items-center'>
            <div className='relative w-auto h-auto max-w-201'>
                
                {
                    React.cloneElement(children, {
                        ref: containerRef,
                        className: [
                            children.props.className, 
                            "text-parentz"
                        ].filter(Boolean).join(" ")
                    })
                }

                <div 
                    ref={heightRef}
                    className={`
                        layer-one w-full h-full bg-black absolute top-0 left-0 opacity-70 origin-bottom will-change-transform
                    `}
                />
            </div>
        </div>
    )
}

export default TextRevealByHeight
