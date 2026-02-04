import { configureStore, applyMiddleware } from '@reduxjs/toolkit';
import { userReducer } from './userReducer';
import { orderReducer } from './orderReducer';
import  reduxThunk  from 'redux-thunk';
export const rootStore = configureStore({

    //gabung semua reducer kesini
    reducer: {
        userReducer,
        orderReducer
    }
    
}, applyMiddleware(reduxThunk));






