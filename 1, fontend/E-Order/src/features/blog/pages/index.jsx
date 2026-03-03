import React from 'react';

import Header from "../../../components/layout/header.jsx";
import Hero from "../../../components/landing/hero.jsx";
import Blog from "../../../components/landing/blog.jsx";
import Glance from "../../../components/landing/glance.jsx";
import Banner from "../../../components/landing/banner.jsx";
import Footer from "../../../components/layout/footer.jsx";

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




