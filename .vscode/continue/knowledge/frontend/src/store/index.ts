
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import catalogReducer from './slices/catalogSlice';
import ticketsReducer from './slices/ticketsSlice';
import userManagementReducer from './slices/userManagementSlice';
import customFunctionReducer from './slices/customFunctionSlice';
import srfSliceReducer from './slices/srf_slice';
import skuSliceReducer from './slices/SKUslice';
import analystSliceReducer from './slices/analystslice';
import countrySliceReducer from './slices/countryslice';
import srf_purposeSlideRecuder from './slices/srf_purpose';
import srf_todaysweekReducer from './slices/srf_todaysweekSlice';
// import srf_poSlideRecuder from './slices/srf_po_slice';
import dashboardReducer from "./slices/dashboardSlice";
import meetingroomReducer from "./slices/meetingroom_slice";
import assignmentReducer from "./slices/assignmentSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    catalog: catalogReducer,
    tickets: ticketsReducer,
    userManagement: userManagementReducer,
    customFunction: customFunctionReducer,

    srf: srfSliceReducer,
    sku: skuSliceReducer,

    analyst: analystSliceReducer,
    country: countrySliceReducer,

    srf_purpose: srf_purposeSlideRecuder,

    srf_todaysweek: srf_todaysweekReducer,
    // srf_po: srf_poSlideRecuder,
    srf_todaysweek: srf_todaysweekReducer,

    dashboard: dashboardReducer,

    meetingroom: meetingroomReducer,
    assignment: assignmentReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
