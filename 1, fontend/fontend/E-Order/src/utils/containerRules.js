const containerRules = {
    default: {
        cbm: 66
    },

    companies: {


        // company_id = 116 (example)
        116: {
            qtyRules: [
                {
                    id: "CHINA_SPECIAL",
                    when: {
                        skuTypes: ["dry", "soup"]
                    },
                    then: {
                        maxQtySum: 3800
                    }
                }
            ],
            cbmRules: [
                {
                    id: "SPECIAL_CBM_401538",
                    when: {
                        skuPair: ["401538"],
                        qtyMax: 4708
                    },
                    then: {
                        cbm: 63.31461
                        // cbm: 63.31

                    }
                }
            ],

        },
        195: {
            mixedRules: [
                {
                    id: "TAIWAN_MIXED_40HC",
                    pairs: [
                        { cont40hc_A: 3840, cont40hc_B: 4182, maxTotal: 3920 }
                    ]
                }
            ]
        }
    }
};

export default containerRules;




