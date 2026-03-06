import { apiDelete, apiGet } from "../../services/api/http";

export const getCartHeader = (userToken) => {
    return apiGet("/cart/get_header", userToken);
};

export const getCartDetails = (userToken) => {
    return apiGet("/cart/get_detail", userToken);
};

export const getFlavours = async (userToken) => {
    // console.time("getFlavours Execution Time");

    try {
        const response = await apiGet("/product/catalog", userToken);

        // console.timeEnd("getFlavours Execution Time");
        return response;
    } catch (error) {
        console.timeEnd("getFlavours Execution Time");
        console.error("Error in getFlavours:", error.message);
        throw error;
    }
};



export const getTOP = async (userToken) => {
    try {
        const response = await apiGet("/user/top", userToken);
        return response;
    } catch (error) {
        console.error("Error in getTOP:", error.message);
        throw error;
    }
};

export const getPorts = async (userToken) => {
    // console.time("getPorts Execution Time");

    try {
        const response = await apiGet("/user/port", userToken);

        // console.timeEnd("getPorts Execution Time");
        return response;
    } catch (error) {
        console.timeEnd("getPorts Execution Time");
        console.error("Error in getPorts:", error.message);
        throw error;
    }

};

export const getShipToParties = async (userToken) => {
    // console.time("getShipToParties Execution Time");

    try {
        const response = await apiGet("/user/stp", userToken);

        // console.timeEnd("getShipToParties Execution Time");
        return response;
    } catch (error) {
        console.timeEnd("getShipToParties Execution Time");
        console.error("Error in getShipToParties:", error.message);
        throw error;
    }

};

export const getOtherParties = async (userToken) => {
    // console.time("getOtherParties Execution Time");

    try {
        const response = await apiGet("/user/ostp", userToken);

        // console.timeEnd("getOtherParties Execution Time");
        return response;
    } catch (error) {
        console.timeEnd("getOtherParties Execution Time");
        console.error("Error in getOtherParties:", error.message);
        throw error;
    }

};

export const getCreationDetails = (userToken) => {
    return apiGet("/cart/get_s_week", userToken);
};

export const doDeleteDraft = (userToken, company_id, created_date, cart_id) => {
    return apiDelete(`/cart/delete?cart_id=${cart_id}`, userToken, {
        data: { company_id, created_date },
    });
};

export const getStuffingWeek = async (userToken) => {

    // console.time("getStuffingWeek Execution Time");

    try {
        const response = await apiGet("/order/stuffingweek", userToken);

        // console.timeEnd("getStuffingWeek Execution Time");
        return response;
    } catch (error) {
        console.timeEnd("getStuffingWeek Execution Time");
        console.error("Error in getStuffingWeek:", error.message);
        throw error;
    }


}

export const getStuffingDate = async (userToken) => {

    // console.time("getStuffingDate Execution Time");

    try {
        const response = await apiGet("/order/stuffing_date", userToken);

        // console.timeEnd("getStuffingDate Execution Time");
        return response;
    } catch (error) {
        throw error;
    }

}

export const getContainers = (userToken) => {
    return apiGet("/order/container", userToken);
}

export const getBannerData = (userToken) => {
    return apiGet("/user/banner", userToken);
}





