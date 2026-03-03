import { configureStore, applyMiddleware } from '@reduxjs/toolkit';
import { userReducer } from '../../features/auth/state/userReducer';
import { orderReducer } from './orderReducer';
import reduxThunk from 'redux-thunk';
export const rootStore = configureStore({

    //gabung semua reducer kesini
    reducer: {
        userReducer,
        orderReducer
    }

}, applyMiddleware(reduxThunk));






