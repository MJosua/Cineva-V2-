export const MOCK_EVENTS = {
    "tw-2024": {
        slug: "tw-2024",
        theme: {
            background: "linear-gradient(180deg, #A8E6CF 0%, #DCEDC1 100%)",
            fontFamily: "Inter, sans-serif",
        },
        blocks: [
            {
                type: "header",
                _id: "block-header-1",
                props: {
                    logo: "/image/event/aset/Bunny_HiRes4K.png",
                    links: [
                        { label: "Home", url: "/" },
                        { label: "Rules", url: "#rules" }
                    ],
                    bgColor: "rgba(255,255,255,0.9)"
                }
            },
            {
                type: "hero",
                _id: "block-hero-1",
                props: {
                    imageUrl: "/image/event/aset/IndomieLogo-tw.png",
                    title: "Taiwan 2024 Event",
                    subtitle: "抽獎活動"
                }
            },
            {
                type: "flip",
                _id: "block-flip-1",
                props: {
                    images: [
                        "/image/event/aset/information.png",
                        "/image/event/aset/informationg2.png",
                        "/image/event/aset/information3.png"
                    ],
                    interval: 2000,
                    direction: "horizontal"
                }
            },
            {
                type: "card",
                _id: "block-card-1",
                props: {
                    title: "注意事項 (Rules)",
                    bgColor: "rgba(255,255,255,1)",
                    children: [
                        {
                            type: "list",
                            _id: "block-list-1",
                            props: {
                                items: [
                                    "1. 發票開立日期及發票登錄日期皆為活動期間 2024/11/25 ~ 2025/01/25。",
                                    "2. 本活動僅限於通路購買外銷版營多麵全系列商品...",
                                    "3. 每人每日限登錄二十張發票..."
                                ]
                            }
                        }
                    ]
                }
            }
        ]
    },
    "tw-2025": {
        slug: "tw-2025",
        theme: {
            background: "linear-gradient(180deg, #667eea 0%, #764ba2 100%)",
            fontFamily: "Inter, sans-serif",
        },
        blocks: [
            {
                type: "hero",
                _id: "block-hero-2",
                props: {
                    title: "Taiwan 2025 Campaign",
                    subtitle: "New Year Promotion",
                    bgColor: "rgba(102,126,234,0.8)",
                    textColor: "rgba(255,255,255,1)"
                }
            },
            {
                type: "couponForm",
                _id: "block-form-1",
                props: {
                    title: "Submit Your Receipt",
                    fields: [
                        { name: "name", label: "姓名 (Name)", type: "text" },
                        { name: "phone", label: "電話 (Phone)", type: "phone" },
                        { name: "receipt_no", label: "發票號碼", type: "text" }
                    ],
                    buttonText: "Submit",
                    buttonColor: "rgba(102,126,234,1)"
                }
            }
        ]
    },
    "maldives-2025": {
        slug: "maldives-2025",
        theme: {
            background: "linear-gradient(180deg, #00d9ff 0%, #0077b6 100%)",
            fontFamily: "Inter, sans-serif",
        },
        blocks: [
            {
                type: "hero",
                _id: "block-hero-3",
                props: {
                    title: "Maldives Paradise Promotion",
                    subtitle: "Win a Trip to Paradise",
                    bgColor: "rgba(0,217,255,0.3)",
                    textColor: "rgba(255,255,255,1)"
                }
            },
            {
                type: "section",
                _id: "block-section-1",
                props: {
                    background: "rgba(255,255,255,0.9)",
                    children: [
                        {
                            type: "text",
                            _id: "block-text-1",
                            props: {
                                content: "<h2>How to Participate</h2><p>Submit your receipt and enter to win!</p>",
                                align: "center"
                            }
                        }
                    ]
                }
            }
        ]
    }
};
