import Axios from "axios";
import { API_URL } from "../config";

export const getCartHeader = (userToken) => {
    return Axios.get(API_URL + "/cart/get_header", {
        headers: {
            Authorization: `Bearer ${userToken}`,
        },
    });
};

export const getCartDetails = (userToken) => {
    return Axios.get(API_URL + "/cart/get_detail", {
        headers: {
            Authorization: `Bearer ${userToken}`,
        },
    });
};

export const getFlavours = async (userToken) => {
    // console.time("getFlavours Execution Time");

    try {
        const response = await Axios.get(API_URL + "/product/catalog", {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        });

        // console.timeEnd("getFlavours Execution Time");
        return response;
    } catch (error) {
        console.timeEnd("getFlavours Execution Time");
        console.error("Error in getFlavours:", error.message);
        throw error;
    }
};


export const getFlavoursTrucking = async (userToken) => {
    // console.time("getFlavoursTrucking Execution Time");

    try {
        const response = await Axios.get(API_URL + "/product/order?trucking=1", {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        });

        // console.timeEnd("getFlavoursTrucking Execution Time");
        return response;
    } catch (error) {
        console.timeEnd("getFlavoursTrucking Execution Time");
        console.error("Error in getFlavoursTrucking:", error.message);
        throw error;
    }

};

export const getTOP = async (userToken) => {
    // console.time("getFlavoursTrucking Execution Time");

    try {
        const response = await Axios.get(API_URL + "/user/top", {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        });

        // console.timeEnd("getFlavoursTrucking Execution Time");
        return response;
    } catch (error) {
        console.timeEnd("getFlavoursTrucking Execution Time");
        console.error("Error in getFlavoursTrucking:", error.message);
        throw error;
    }

};

export const getPorts = async (userToken) => {
    // console.time("getPorts Execution Time");

    try {
        const response = await Axios.get(API_URL + "/user/port", {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        });

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
        const response = await Axios.get(API_URL + "/user/stp", {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        });

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
        const response = await Axios.get(API_URL + "/user/ostp", {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        });

        // console.timeEnd("getOtherParties Execution Time");
        return response;
    } catch (error) {
        console.timeEnd("getOtherParties Execution Time");
        console.error("Error in getOtherParties:", error.message);
        throw error;
    }

};

export const getCreationDetails = (userToken) => {
    return Axios.get(API_URL + "/cart/get_s_week", {
        headers: {
            Authorization: `Bearer ${userToken}`,
        },
    });
};

export const doDeleteDraft = (userToken, company_id, created_date, cart_id) => {
    return Axios.delete(API_URL + `/cart/delete?cart_id=${cart_id}`, {
        headers: {
            Authorization: `Bearer ${userToken}`,
        },
        data: { company_id, created_date },
    });
};

export const getStuffingWeek = async (userToken) => {

    // console.time("getStuffingWeek Execution Time");

    try {
        const response = await Axios.get(API_URL + "/order/stuffingweek", {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        });

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
        const response = await Axios.get(API_URL + "/order/stuffing_date", {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        });

        // console.timeEnd("getStuffingDate Execution Time");
        return response;
    } catch (error) {
        console.timeEnd("getStuffingDate Execution Time");
        console.error("Error in getStuffingDate:", error.message);
        throw error;
    }

}

export const getContainers = (userToken) => {
    return Axios.get(API_URL + "/order/container", {
        headers: {
            Authorization: `Bearer ${userToken}`,
        },
    });
}

export const getBannerData = (userToken) => {
    return Axios.get(API_URL + "/user/banner", {
        headers: {
            Authorization: `Bearer ${userToken}`,
        },
    });
}
