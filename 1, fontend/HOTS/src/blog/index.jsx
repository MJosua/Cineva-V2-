import React from 'react';

import Header from "../components/header";
import Hero from "../components/hero";
import Blog from "../components/blog";
import Glance from "../components/glance";
import Banner from "../components/banner";
import Footer from "../components/footer";

function LandingPage() {

    return (

        <div className="container-fluid pt-5 px-0">
            <Header />

            <Blog />

            <Footer/>
        </div>
    );
}

export default LandingPage;