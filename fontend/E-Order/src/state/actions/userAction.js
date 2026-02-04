import Axios from "axios";
import { API_URL } from "../../config";

export const loginAction = (data) => {

  return (dispatch) => {
    return dispatch({
      type: "LOGIN_SUCCESS",
      payload: data,
    });
  };


};

export const loginMiddleware = (userID, pswd) => {
  return async (dispatch) => {

    let res = await Axios.post(API_URL + `/auth/login`, {
      userID,
      pswd,
    });

    if (res.data.success) {

      // localStorage.setItem('userLogStore', JSON.stringify(res.data.userData));
      localStorage.setItem("tokek", res.data.token);
      delete res.data.token;
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: res.data.userData[0],
      });

      if (res.data.userData[0].uid) {

        return {
          success: true,
          user: res.data.userData[0],
          userType: res.data.userData[0].type_id,
          transport: res.data.userData[0].transport,
          message: res.data.message
        };

      } else {

        return {
          success: false,
          message: res.data.message
        };

      }

    } else {

      return {
        success: false,
        message: res.data.message
      };

    }

    // else if (!res.data.userData[0]) {
    //   //fail to login
    //   return {
    //     success: false,
    //   };
    // }

  };
};

export const logoutAction = () => {
  window.location.replace("/");

  //delete all stored data on localstore
  localStorage.removeItem("userLogStore");
  localStorage.removeItem("tokek");
  localStorage.removeItem("temporaryCart");
  localStorage.removeItem("RadioButtonValue");
  localStorage.removeItem("");
  sessionStorage.removeItem("editDraft");
  sessionStorage.removeItem("orderContain");
  sessionStorage.removeItem("orderDetails");
  sessionStorage.removeItem("containerOrdersInformation");
  sessionStorage.removeItem("containerOrders");

  //delete data on state
  // setTimeout(() => { window.location.reload(); }, 300);
  return {
    type: "LOGOUT_SUCCESS",
  };
};

export const seasonOut = () => {
  sessionStorage.clear();
  window.location.replace("/");
  window.location.reload(true);
};






