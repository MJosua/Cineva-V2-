import Axios from "axios";
import { API_URL } from "../../config";

export const clearSeasonStorage = async (order) => {

    let po_url = null;
    let stuffing_Year = null;
    let stuffing_Id = null;
    let editStatus = false;
    let cart_id = 0;
    let created_date = "";
    let editDetails = { editStatus, cart_id, created_date };
    sessionStorage.setItem("editDraft", JSON.stringify(editDetails));

};







