const INITIAL_STATE = {
    stuffingWeek: null,
    poRef: null,
    port: 0,
    shipToParty: 0,
    contSize: 3,
    contQty: 0,
    bulk: false,
    skuIndex1: [],
    skuIndex2: [],
    skuIndex3: [],
    sku1: [],
    sku2: [],
    sku3: [],
    skuName1: [],
    skuName2: [],
    skuName3: [],
    qty1: [],
    qty2: [],
    qty3: [],
    qtyMax1: [],
    qtyMax2: [],
    qtyMax3: [],
    qtyMoq1: [],
    qtyMoq2: [],
    qtyMoq3: [],
    remarks: []
}

export const orderReducer = (state = INITIAL_STATE, action) => {
    // console.log("data from action", action);

    switch (action.type) {
        case "LOGIN_SUCCESS":
            // console.log("payload", action.payload)
            return { ...state, ...action.payload };
        case "UPDATE_STATUS":
            return { ...state, status: action.payload };
        case "LOGOUT_SUCCESS":
            return INITIAL_STATE;
        default:
            return state;
    }
}