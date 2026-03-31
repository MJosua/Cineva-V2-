import HeroBlock from "./Blocks/HeroBlock";
import CardBlock from "./Blocks/CardBlock";
import ListBlock from "./Blocks/ListBlock";
import FlipBlock from "./Blocks/FlipBlock";
import HeaderBlock from "./Blocks/HeaderBlock";
import TextBlock from "./Blocks/TextBlock";
import SectionBlock from "./Blocks/SectionBlock";
import CouponFormBlock from "./Blocks/CouponFormBlock";
import CustomHTMLBlock from "./Blocks/CustomHTMLBlock";
import UrlCouponBlock from "./Blocks/UrlCouponBlock";
import OverlayBlock from "./Blocks/OverlayBlock";
import TextOverlayBlock from "./Blocks/TextOverlayBlock";

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
    "customHtml": CustomHTMLBlock,
    "urlCoupon": UrlCouponBlock,
    "overlay": OverlayBlock,
    "textOverlay": TextOverlayBlock,
};

export const resolveComponent = (type) => {
    return COMPONENT_REGISTRY[type] || (() => <div style={{ padding: 16, color: "red", border: "1px dashed red" }}>Unknown Block: {type}</div>);
};
