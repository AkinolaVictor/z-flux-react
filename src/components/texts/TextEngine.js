import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import React, { useEffect, useRef, useState } from 'react';

gsap.registerPlugin(SplitText, ScrollTrigger)

export default function TextEngine(props) {
    const {
        text, 
        scrollingElement,
        progression="char",
        style,
        className,
        children,
        playOnScroll=false,
        playInView=false,
        delay=0,
        timeline=undefined,
        speed,
        gsapScrollTrigger,
        defaultAnimation,
        extendAnimation,
        watch=false
    } = props
    const containerRef = useRef(null);
    const [screenResize, setScreenResize] = useState(0)
    const [fontLoaded, setFontLoaded] = useState(false)

    
    function initi_animation(){
        const el = containerRef.current;
        if(!el || !fontLoaded) return;
        // if(!el) return;
        
        // declare scrolling element
        function findScrollingElement(elem){
            let parent = document.querySelector(elem)
            
            while(parent) {
                const {overflowY} = getComputedStyle(parent)
                if((overflowY === "auto" || overflowY === "scroll") && (parent.scrollHeight > parent.clientHeight)){
                    return parent
                }
                parent = parent.parentElement
            }

            return document.scrollingElement
        }

        const scroller = scrollingElement?document.querySelector(`${scrollingElement}`):findScrollingElement(".fade_textation_x");

        const splitRef = SplitText.create(el, {
            type: "lines,words,chars",
            linesClass: "line",
            wordsClass: "word",
            charsClass: "char",
            autoSplit: true,
        })

        const {chars, lines, words} = splitRef;
        const progression_data = progression_state()
        
        // depending on the type of animation progression the developer wants
        // return elements that must be looped through to create the animation
        function progression_state() {
            
            let anim2 = chars
            if(progression === "char_line") {
                // animate characters and line together
                const charMeta = lines.flatMap((line)=>{
                    const lineChars = chars.filter((c)=>{
                        return line.contains(c);
                    });
                    return lineChars.map((char, charIndexInLine)=>({char, charIndexInLine}));
                });
                anim2 = charMeta
            } else if(progression === "word_line") {
                // animate words and line together
                const wordMeta = lines.flatMap((line, index1)=>{
                    const lineWords = words.filter((c)=>{
                        return line.contains(c);
                    });
                    return lineWords.map((char, charIndexInLine)=>({char, charIndexInLine}));
                });
                anim2 = wordMeta
            } else {
                anim2 = (
                    progression=="char"?chars:
                    progression=="word"?words:
                    progression=="line"?lines:
                    chars
                );
            }


            return {
                set: (
                    progression=="char"?chars:  //animate characters progressively
                    progression=="word"?words:    //animate words progressively
                    progression=="line"?lines:    //animate lines progressively
                    progression=="char_line"?chars:    //animate characters with line progressively
                    progression=="word_line"?words:    //animate words with line progressively
                    chars
                ),
                animate: anim2,
                speed_0: speed || (
                    progression=="char"?(playOnScroll?0.005:0.1):
                    progression=="word"?0.35:
                    progression=="line"?0.9:
                    progression=="char_line"?0.08:
                    progression=="word_line"?0.5:
                    0.08
                ),
            };
        };

        // convert extend animation input to acceptable css styles for the engine
        function build_extend_animation(animation, which){
            const obj = typeof(animation)=="object"?
                        animation:
                        {};
            
            const input_obj = Object.entries(obj).map((each)=>{
                const [key, val] = each;
                return {key, val};
            });
    
            const all = {};
    
            for(let i=0; i<input_obj.length; i++){
                const key = input_obj[i].key;
                const val = input_obj[i].val;
                const which_val = which=="from"?val[0]:
                                which=="to"?val[1]:
                                "";
                if(which_val !== null){
                    all[key] = which_val;
                }
            };
            
            return all;
        }
        
        const paused = (playOnScroll || playInView)?true:false;
        const tl = timeline || gsap.timeline({paused, delay});

        // gsap.set(progression_data.set, {
        tl.set(progression_data.set, {
            opacity: 0,
            ...build_extend_animation(defaultAnimation, "from"),
            ...build_extend_animation(extendAnimation, "from")
        });


        const moreScroll = moreScrollTrigger()

        const anim = (tl)=>{
            if(!tl) return null;
            
            // loop through each line and apply styles to each character sequentially
            progression_data.animate.forEach((charz, index)=>{
                let check_progression = progression==="char_line" || progression==="word_line";
                let char = check_progression ? charz.char : charz;
                const charIndexInLine = check_progression ? charz.charIndexInLine : index;

                tl.to(
                    char,
                    {
                        opacity: 1,
                        ease: "power3.out",
                        ...build_extend_animation(defaultAnimation, "to"),
                        ...build_extend_animation(extendAnimation, "to"),
                    },
                    charIndexInLine*progression_data.speed_0 //use for speed (fast or slow)
                );
            });
            
            return tl;
        }

        anim(tl);

        function moreScrollTrigger(){
            if(typeof(gsapScrollTrigger)==="object"){
                return gsapScrollTrigger;
            };

            if(typeof(gsapScrollTrigger)==="function"){
                return gsapScrollTrigger(tl)||{};
            };

            return {};
        }

        if(playOnScroll){
            ScrollTrigger.create({
                trigger: el,
                scroller,
                start: "top 85%",
                end: "top 35%",
                scrub: playOnScroll,
                animation: tl,
                ...moreScroll,
            });

        } else if (playInView){
            ScrollTrigger.create({
                trigger: el,
                scroller,
                start: "top bottom",
                onEnter: ()=>tl.restart(),
                onLeaveBack: ()=>tl.pause(),
                ...moreScroll,
            });
        };

        // setReady(true);

        return () => {
            splitRef.revert()
            tl.kill();
            ScrollTrigger.getAll().forEach(st => {
                if (st.trigger === el) st.kill();
            })
        };
    }

    function updateScreenResize(){
        if(!watch) return

        const elem = typeof(watch)==="string"?document.querySelector(watch):window
        elem.addEventListener("resize", ()=>{
            setScreenResize((prev)=>prev+1);
        });
    }

    // // watch for screen resize so animation can be updated
    useEffect(()=>{
        updateScreenResize();
    }, []);
    
    useEffect(() => {
        if (document.fonts.status === 'loaded') {
            setFontLoaded(true);
        } else {
            async function seekFonts() {
                await document.fonts.ready.then(() => {
                    setFontLoaded(true);
                }).catch(()=>{
                    setFontLoaded(true);
                });
            }
            seekFonts()
        }

        // window.onload=()=>setReady(true)
        // document.addEventListener("DOMContentLoaded",()=>setReady(true))
        // if(document.readyState=="complete") setReady(true)
    }, []);

    // // useLayoutEffect(()=>{
    // useEffect(()=>{
    //     let anim = initi_animation();
    //     return anim;
    // }, [fontLoaded, screenResize])
    
    useGSAP(initi_animation, {
        dependencies: [fontLoaded, screenResize],
        scope: containerRef
    })


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
                visibility: fontLoaded?"visible":"hidden" ,
                ...style
            }} 
            ref={containerRef}
        >
            {text}
        </p>
    );
};
