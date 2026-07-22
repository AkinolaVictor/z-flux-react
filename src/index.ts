import { components } from "./components"
import { text_components } from "./components/texts"

export function justSayHello({name}: {name: string}){
    console.log("Hey!!! Hello ", name, ". Package is updated!!!")
} 

export const {
    TextEngine,
    TextFade,
    TextFadeDown,
    TextFadeSkew,
    TextFadeSkew_2,
    TextFadeOverlay,

} = text_components

export const {
    Z_Text,
    VerticalScroll
} = components


// export const {VerticalScroll} = components

