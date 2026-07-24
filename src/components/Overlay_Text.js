import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { build_extend_animation, countNumbers, findScrollingElement, randomizeArray, getLayerWidth,  overlay_text_animations} from 'z-flux-utils';

gsap.registerPlugin(ScrollTrigger)

function DefalutLayerComponent({data, index}) {
    return (
        <div className=''>
        </div>
    )
}


export default function Overlay_Text(props) {
    const {
        text, 
        children,
        textClass,
        textStyle,
        layerStyle,
        layerClass,
        containerStyle,
        containerClass,
        scrollingElement,
        trigger, // onscroll, inview, none
        timeline,
        stagger=0.2,
        duration=1.5,
        layers=1,
        layerColor="white",
        RenderLayer=DefalutLayerComponent,
        animationOrder="normal", //reverse, normal, random
        animation,
        animationDimension="y",
        extendAnimation,
        gsapScrollTrigger,
        controllerRef=null,
        useOpacity,
        animationDirection=0,
        onClick
    } = props

    const containerRef = useRef(null)
    const heightRef = useRef(null)
    const allLayers = countNumbers(layers)
    const [layerWidth, setLayerWidth] = useState({eachWidth: "100%", lastWidth: "100%"})
    const [layerHeight, setLayerHeight] = useState({eachWidth: "100%", lastWidth: "100%"})
    
    const tl = timeline||gsap.timeline({})
    if(controllerRef){
        controllerRef.current = tl
    }
    
    const anim = overlay_text_animations[animation] || overlay_text_animations["VerticalReveal"]
    const {defaultGsap, animation_origins, animationStyles} = anim

    function animate_func(){
        if(trigger=="none") return

        const parent = heightRef.current
        if(!parent) return
        const elements = [...parent.children]
        
        
        const el = (
            animationOrder==="reverse"?
            [...elements].reverse():
            animationOrder==="random"?
            randomizeArray(elements):
            elements
        )
        
        const ctx = gsap.context(()=>{
            const scroller = scrollingElement?document.querySelector(`${scrollingElement}`):findScrollingElement(parent, true);

            tl.set(el, {
                opacity: useOpacity?1:1,
                ...build_extend_animation(defaultGsap, "from"),
                ...build_extend_animation(extendAnimation, "from"),
            })

            tl.to(el, {
                opacity: useOpacity?0:1,
                stagger,
                ...build_extend_animation(defaultGsap, "to"),
                duration,
                ...build_extend_animation(extendAnimation, "to"),
            })
            
            const triggerOptions =
                typeof gsapScrollTrigger === "function"
                    ? gsapScrollTrigger(tl) || {}
                    : gsapScrollTrigger || {};
            
            
            if(trigger==="onscroll"){
                ScrollTrigger.create({
                    trigger: el,
                    start: "top 65%",
                    end: "top 30%",
                    animation: tl,
                    scrub: true,
                    scroller,
                    ...triggerOptions
                })
            }

            if(trigger==="inview"){
                ScrollTrigger.create({
                    trigger: el,
                    start: "top bottom",
                    onEnter: () => tl.restart(),
                    onLeaveBack: () => tl.pause(),
                    animation: tl,
                    scroller,
                    ...triggerOptions
                })
            }
        }, elements)
        
        return ()=>{
            ctx.revert();
        }
    }

    useEffect(()=>{
        if(animationDimension == "y"){
            const {eachWidth, lastWidth} = getLayerWidth(heightRef, allLayers.length, "width")
            setLayerWidth({eachWidth, lastWidth})
        } else {
            const {eachWidth, lastWidth} = getLayerWidth(heightRef, allLayers.length, "height")
            setLayerHeight({eachWidth, lastWidth})
        }
    }, [])

    useLayoutEffect(()=>{
        const anim = animate_func()
        return anim
    }, [ props ])

    return (
        <div  
            style={{
                width: "auto",
                height: "auto",
                display: "flex", 
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
                ...containerStyle
            }}
            onClick={onClick}
            className={`overlay_text_container ${containerClass}`}
            
        >
            {
                text?
                <p ref={containerRef} className={`text-parentz ${textClass}`} style={{...textStyle}}>
                    {text}
                </p>:
                React.cloneElement(children, {
                    ref: containerRef,
                    style: {
                        ...children.props.style,
                        ...textStyle
                    },
                    className: [
                        children.props.className, 
                        "text-parentz",
                        textClass
                    ].filter(Boolean).join(" ")
                })
            }

            <div 
                ref={heightRef}
                className={`text_overlay_container`}
                style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    display: "flex",
                    flexDirection: animationDimension=="y"?"row":"column",
                    justifyContent: "flex-start",
                    alignItems: "flex-start"
                }}
            >
                {
                    allLayers.map((data, index)=>{
                        const last = allLayers.length-1 === index
                        const {eachWidth, lastWidth} = layerWidth
                        const eachHeight = layerHeight.eachWidth
                        const lastHeight = layerHeight.lastWidth
                        return (
                            <div 
                                key={index}
                                className={`each-overlay-block ${layerClass}`}
                                style={{
                                    height: (
                                        animationDimension=="y"?
                                        "100%":
                                        last?lastHeight:eachHeight
                                    ),
                                    width: (
                                        animationDimension=="x"?
                                        "100%":
                                        last?lastWidth:eachWidth
                                    ),
                                    willChange: "transform",
                                    background: layerColor,
                                    transformOrigin: (
                                        typeof(animationDirection)=="number"?
                                        animation_origins[animationDirection] || "center":
                                        animationDirection
                                    ), 
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    ...animationStyles,
                                    ...layerStyle
                                }}
                            >
                                <RenderLayer data={data} index={index}/>
                            </div>
                        )
                    })
                }
            </div>
        </div>
    )
}