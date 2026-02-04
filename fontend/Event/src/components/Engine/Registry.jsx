import HeroBlock from "./Blocks/HeroBlock";
import CardBlock from "./Blocks/CardBlock";
import ListBlock from "./Blocks/ListBlock";
import FlipBlock from "./Blocks/FlipBlock";
import HeaderBlock from "./Blocks/HeaderBlock";
import TextBlock from "./Blocks/TextBlock";
import SectionBlock from "./Blocks/SectionBlock";
import CouponFormBlock from "./Blocks/CouponFormBlock";
import CustomHTMLBlock from "./Blocks/CustomHTMLBlock";

export const COMPONENT_REGISTRY = {
    "hero": HeroBlock,
    "card": CardBlock,
    "list": ListBlock,
    "flip": FlipBlock,
    "header": HeaderBlock,
    "navbar": HeaderBlock,
    "text": TextBlock,
    "section": SectionBlock,
    "couponForm": CouponFormBlock,
    "customHtml": CustomHTMLBlock
};

export const resolveComponent = (type) => {
    return COMPONENT_REGISTRY[type] || (() => <div>Unknown Component: {type}</div>);
};
