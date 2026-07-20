import { text_components } from "./components/texts"

export function justSayHello({name}: {name: string}){
    console.log("Hey!!! Hello ", name, ". Package is updated!!!")
} 

export const {
    // TextAnimationTemplate, 
    // TextColorFade,
    // TextRevealByHeight,

    TextEngine,
    TextFade,
    TextFadeDown,
    TextFadeSkew,
    TextFadeSkew_2,
    TextFadeOverlay
} = text_components
