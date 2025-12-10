import React from 'react';

import Header from "../components/header";
import Hero from "../components/hero";
import Blog from "../components/blog";
import Glance from "../components/glance";
import Banner from "../components/banner";
import Footer from "../components/footer";
import ReadCatalogue from '../components/ReadCatalogue';
import DocumentMeta from 'react-document-meta';
import { useLocation } from "react-router-dom"
import Sidebar from "../components/Sidebar";


function LandingPage() {
    const location = useLocation();
    const meta = {
        title: 'Indofood International',
        description: "We offer a wide range of products, which include instant noodles, sauces and food seasonings, cooking oil, dairy, snacks, and nutrition-packed food products. Our products are recognized for their quality, delicious taste and are Halal Certified. It is our vision to turn our Indofood products to become a necessity product for families around the world.",
        canonical: 'http://indofoodinternational.com/',
        meta: {
            charset: 'utf-8',
            name: {
                keywords: 'react,meta,document,html,tags,Indofood,Food,Indomie,International,Sarimi,Chiki,Nici,Popmie,Indonesia,Flavour,Flavoured,By,The,World,firstpacific, first, pasific, indomilk, kevin, sietho, IOD, iod, Tango, orangtua, oreo, sasa, supermie, miesedap, mie, sedap, australia, nongshin, singapura, singapore, india, africa, nigeria, sawaz, sawake, kenya, 1945, world, online, order, i2i, maruchan, nissin, hot, ramen, gaga, lucky, waiwai, noodlel, ibuki, torikara, torikatsu, tori, garpu, sendok, yummy, Indomaret, indmarco, maroco, japan, jepang, korea, nippon,mama'
            }
        }
    }

    return (

        <div className='col-12 pt-5'>
            <Header />
            <div className="pt-4  vh-100 ">
                <Hero />
                <Blog />
                <Glance />
                <Banner />
                <Footer />


            </div>


        </div>
    );
}

export default LandingPage;