import Axios from "axios";
import { API_URL } from "../config";

export const clearSeasonStorage = async (order) => {

    let hots_tokek = localStorage.getItem('hots_tokek');
    let containerLenth =
        (await Axios.get(API_URL + "/order/container", { headers: { Authorization: `Bearer ${hots_tokek}` } })).data;
    let array = []
    array.push(containerLenth.splice(containerLenth.indexOf(), 1)[0])
    let container = array[0].container_id

    let po_url = null;
    let stuffing_Year = null;
    let stuffing_Id = null;
    let editStatus = false;
    let cart_id = 0;
    let created_date = "";
    let editDetails = { editStatus, cart_id, created_date };
    sessionStorage.setItem("editDraft", JSON.stringify(editDetails));

  
};


