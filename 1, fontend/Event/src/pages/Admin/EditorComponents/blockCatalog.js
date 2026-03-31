import {
    MdTextFields,
    MdList,
    MdViewCarousel,
    MdViewDay,
    MdGridView,
    MdReceipt,
    MdWeb,
    MdCode,
    MdQrCode,
    MdPhotoSizeSelectActual,
    MdAutoAwesome,
    MdAdd
} from "react-icons/md";

export const BLOCK_CATALOG = {
    Layout: [
        {
            type: "header",
            label: "Header / Navbar",
            description: "Sticky top bar with logo and navigation links.",
            icon: MdWeb,
            color: "blue",
            defaultProps: { logo: "", links: [], bgColor: "rgba(255,255,255,1)", textColor: "rgba(51,51,51,1)" }
        },
        {
            type: "section",
            label: "Section Container",
            description: "Full-width container to hold nested block layers.",
            icon: MdViewDay,
            color: "cyan",
            defaultProps: { background: "rgba(255,255,255,0)", children: [] }
        },
        {
            type: "card",
            label: "Card",
            description: "Bordered card block with optional child layers.",
            icon: MdGridView,
            color: "teal",
            defaultProps: { title: "Card Title", children: [], bgColor: "rgba(255,255,255,1)", textColor: "rgba(0,0,0,1)" }
        }
    ],
    Content: [
        {
            type: "hero",
            label: "Hero Section",
            description: "Large brand display: title, subtitle, and optional image.",
            icon: MdAutoAwesome,
            color: "purple",
            defaultProps: { title: "Event Title", subtitle: "Join us!", imageUrl: "", bgColor: "rgba(255,255,255,0)", textColor: "rgba(0,0,0,1)" }
        },
        {
            type: "text",
            label: "Rich Text",
            description: "Styled paragraph with WYSIWYG editing support.",
            icon: MdTextFields,
            color: "gray",
            defaultProps: { content: "<p>Enter your text here...</p>", align: "center" }
        },
        {
            type: "list",
            label: "Bullet List",
            description: "Simple bulleted list, great for terms or instructions.",
            icon: MdList,
            color: "orange",
            defaultProps: { items: ["Item 1", "Item 2", "Item 3"], textColor: "rgba(0,0,0,1)" }
        },
        {
            type: "flip",
            label: "Image Slideshow",
            description: "Auto-rotating image carousel / banner.",
            icon: MdViewCarousel,
            color: "pink",
            defaultProps: { images: [], interval: 3000, direction: "horizontal" }
        }
    ],
    Interactive: [
        {
            type: "couponForm",
            label: "Dynamic Form",
            description: "Configurable submission form. Connects to reward pool.",
            icon: MdReceipt,
            color: "green",
            defaultProps: {
                title: "Submit Your Receipt",
                description: "",
                fields: [],
                buttonText: "Submit",
                buttonColor: "rgba(72,187,120,1)",
                buttonTextColor: "rgba(255,255,255,1)",
                onSuccessAction: "/success",
                onUsedAction: "/claimed",
                onInvalidAction: "/invalid"
            }
        },
        {
            type: "urlCoupon",
            label: "Auto Fetch Coupon",
            description: "Reads a code from the URL path, verifies it, then shows a configurable form.",
            icon: MdQrCode,
            color: "red",
            badge: "NEW",
            defaultProps: {
                title: "Verify Your Code",
                subtitle: "Your coupon is being checked automatically.",
                fields: [],
                buttonText: "Submit",
                buttonColor: "rgba(72,187,120,1)",
                buttonTextColor: "rgba(255,255,255,1)",
                invalidTitle: "Invalid Code",
                invalidMessage: "This code does not exist or has expired.",
                usedTitle: "Already Claimed",
                usedMessage: "This code has already been used.",
                usedNavLabel: "Back to Home",
                onSuccessAction: "/success",
                onUsedAction: "/claimed",
                onInvalidAction: "/invalid"
            }
        }
    ],
    Advanced: [
        {
            type: "customHtml",
            label: "Custom HTML",
            description: "Paste raw HTML + CSS for fully custom blocks.",
            icon: MdCode,
            color: "gray",
            defaultProps: { html: "<div style='padding:20px;text-align:center;'>Custom HTML here</div>", customCss: "" }
        },
        {
            type: "overlay",
            label: "Overlay Asset",
            description: "Absolute floating image asset",
            icon: MdAdd,
            color: "indigo",
            defaultProps: {
                imageUrl: "",
                top: "auto",
                left: "auto",
                right: "auto",
                bottom: "auto",
                width: "auto",
                height: "auto",
                maxWidth: "200px",
                maxHeight: "none",
                zIndex: 10,
                opacity: 1
            }
        },
        {
            type: "textOverlay",
            label: "Text Overlay",
            description: "Draggable and free-resize rich text overlay layer.",
            icon: MdTextFields,
            color: "teal",
            defaultProps: {
                content: "<p><strong>Text Overlay</strong></p>",
                top: "auto",
                left: "auto",
                right: "auto",
                bottom: "auto",
                width: "260px",
                height: "140px",
                maxWidth: "none",
                maxHeight: "none",
                zIndex: 11,
                opacity: 1
            }
        }
    ]
};

const FALLBACK_META = {
    icon: MdPhotoSizeSelectActual,
    color: "gray",
    label: "Block",
    preview: () => "Block"
};

export const BLOCK_TYPE_META = {
    hero: { icon: MdViewDay, color: "blue", label: "Hero", preview: (p) => p.title || "Hero Section" },
    header: { icon: MdWeb, color: "blue", label: "Header", preview: (p) => p.logo ? "Logo + Links" : "Navigation Bar" },
    navbar: { icon: MdWeb, color: "blue", label: "Navbar", preview: (p) => p.logo ? "Logo + Links" : "Navigation Bar" },
    card: { icon: MdGridView, color: "cyan", label: "Card", preview: (p) => p.title || "Card Block" },
    section: { icon: MdViewDay, color: "cyan", label: "Section", preview: (p) => `${(p.children || []).length} block(s) inside` },
    flip: { icon: MdViewCarousel, color: "pink", label: "Slideshow", preview: (p) => `${(p.images || []).length} image(s)` },
    text: { icon: MdTextFields, color: "gray", label: "Text", preview: (p) => p.content?.replace(/<[^>]+>/g, "").slice(0, 40) || "Rich Text" },
    list: { icon: MdList, color: "orange", label: "List", preview: (p) => `${(p.items || []).length} item(s)` },
    couponForm: { icon: MdReceipt, color: "green", label: "Form", preview: (p) => p.title || "Dynamic Form" },
    urlCoupon: { icon: MdQrCode, color: "red", label: "Auto Fetch Coupon", preview: (p) => p.title || "URL-Code Verifier" },
    customHtml: { icon: MdCode, color: "gray", label: "HTML", preview: () => "Custom HTML Block" },
    overlay: { icon: MdPhotoSizeSelectActual, color: "indigo", label: "Overlay", preview: (p) => p.imageUrl ? "Floating Asset" : "No image selected" },
    textOverlay: { icon: MdTextFields, color: "teal", label: "Text Overlay", preview: (p) => p.content?.replace(/<[^>]+>/g, "").slice(0, 36) || "Floating Text" }
};

export function getBlockMeta(type) {
    return BLOCK_TYPE_META[type] || { ...FALLBACK_META, label: type || "Unknown" };
}

export function getCatalogCategories() {
    return Object.keys(BLOCK_CATALOG);
}

export function getAllCatalogTemplates() {
    return getCatalogCategories().flatMap((category) => BLOCK_CATALOG[category] || []);
}
