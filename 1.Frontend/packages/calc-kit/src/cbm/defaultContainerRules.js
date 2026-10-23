/**
 * @hots/calc-kit — default E-Order container rules (company overrides) — pass your own rules object to the resolvers
 * Head: src/index.js
 * Source: E-Order/src/utils/containerRules.js (copied 2026-10-06, logic unchanged; BOM/CRLF and garbled emoji comments cleaned). E-Order unchanged.
 */
const containerRules = {
    default: {
        cbm: 66
    },

    companies: {


        // company_id = 116 (Shanghai)
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
            // 💡 Rules for Company 116 are now dynamic.
            // Check Special Condition ID 20 (Mixing Load CBM Rule) in the database.
            cbmRules: [],
        },
        // company_id = 195 (Taiwan)
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




