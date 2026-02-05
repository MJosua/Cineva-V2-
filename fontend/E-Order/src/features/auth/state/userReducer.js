const INITIAL_STATE = {
  uid: "",
  firstname: "",
  midname: "",
  lastname: "",
  user_id: null,
  lang_id: null,
  employee_id: null,
  country_id: null,
  company_name: "",
  company_id: null,
  country_desc: "",
  active: null,
  type_id: null,
  user_type: "",
  max_sku: null,
  pallet: 0,
  spc_condition: 0,
  spc_condition_details: [],
  tolling: 0,
  transport: 1
};

export const userReducer = (state = INITIAL_STATE, action) => {
  // console.log("state from reducer",state);

  switch (action.type) {
    case "LOGIN_SUCCESS":
      return {
        ...state,
        ...action.payload,
      };

    case "LOGOUT_SUCCESS":
      return INITIAL_STATE;

    default:
      return state;

  }
};




