import Axios from "axios";
import { API_URL } from "../config";


export const loginAction = (data) => {
   // console.log("Data dari page LOGIN", data);
    return {
        type: "LOGIN_SUCCESS",
        payload: data
    }
}

export const loginMiddleware = (userID, pswd) => {
    return async (dispatch) => {
        try {
            let res = await Axios.post(API_URL + `/auth/login`, {
                userID, pswd
            });

            localStorage.setItem('userLogStore', JSON.stringify(res.data));
            localStorage.setItem('hots_tokek', res.data[1]);

            // JSON.Stringify(localStorage.userLogStore);s
            // console.log("ini localStorage => userLogStore", localStorage.userLogStore);
            // delete res.data.token;
            dispatch({
                type: "LOGIN_SUCCESS",
                payload: res.data
            });

            if (res.data[0].uid === userID) {
                return {
                    res, 
                    success: true,
                    user: res.data
                }
                // console.log("res on success login", res)
            } else if (res.data[0].uid !== userID) {

                //fail to login
                return {
                    res, 
                    success: false,
                    message: "501"
                }
                // console.log("res on else fail login", res)
            } else {
                return {
                    res, 
                    success: false,
                    message: "502"
                }
            }

            // console.log("res.data", res.data)
        } catch (error) {
            // console.log(error)
        }
    }
}

export const logoutAction = () => {

    //delete all stored data on localstore
    localStorage.removeItem('userLogStore')
    localStorage.removeItem('temporaryCart')
    localStorage.removeItem('RadioButtonValue')
    localStorage.removeItem('')

    //delete data on state
    return {
        type: "LOGOUT_SUCCESS"
    }
}

// export const onCheckOut = (cart_id, user_id, product_code, cont_size, cont_qty, prod_qty, prod_price, prod_disc, notes, flag,
//     cart_id_2, user_id_2, product_code_2, cont_size_2, cont_qty_2, prod_qty_2, prod_price_2, prod_disc_2, notes_2, flag_2) => {

//     return Axios.post(API_URL + `/cart/addItem`, {

//         cart_id, user_id, product_code, cont_size, cont_qty, prod_qty, prod_price, prod_disc, notes, flag,
//         cart_id_2, user_id_2, product_code_2, cont_size_2, cont_qty_2, prod_qty_2, prod_price_2, prod_disc_2, notes_2, flag_2

//     });



// }

// JSON.stringify()
