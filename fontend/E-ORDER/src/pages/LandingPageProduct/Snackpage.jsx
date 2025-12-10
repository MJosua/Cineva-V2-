import React from 'react';

import Header from "../../components/header";

import SnackPage from "../../components/Product/Snack";

import Barproduct from "../../components/Barproduct";

import { useLocation } from "react-router-dom"

function LandingPage() {
    const location = useLocation();
    const meta = {
        title: `${location.pathname} page Indofood`,
        description: `Page of ${location.pathname} from Indofood`,
        canonical: `https://www.indofoodinternational.com/e-order${location.pathname}`,
        meta: {
            charset: 'utf-8',
            name: {
                keywords: 'react,meta,document,html,tags'
            }
        }
    };
    return (

        <div className="col-12">

            <Header />

            <div className="pt-4">
                <Barproduct />


                <SnackPage />




            </div>
        </div>


    );
}

export default LandingPage;