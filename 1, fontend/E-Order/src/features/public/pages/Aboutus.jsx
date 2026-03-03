import React from 'react';
import DocumentMeta from 'react-document-meta'
import Header from "../../../components/layout/header.jsx";
import Footer from "../../../components/layout/footer.jsx";

import AboutIOD from '../../../components/content/AboutIOD.jsx';
import PetaIndofood from '../../../components/content/PetaIndofood.jsx';


function Aboutus() {
    const meta = {
        title: 'About International Operations Division (IOD)',
        description: "'E-Order, about International Operations Division (IOD) The International Operations Division (IOD) manages the global export of Indofood's branded products. Since (year), IOD has exported to over 73 countries. Our vision is turning Indofood Products to become a necessity for every family around the world and our mission is to ensure the affordability, desirability, and availability of Indofood products worldwide.",
        canonical: 'http://indofoodinternational.com/aboutiod',
        meta: {
            charset: 'utf-8',
            name: {
                keywords: 'react,meta,document,html,tags'
            }
        }
    }
    return (
        <>
            <DocumentMeta {...meta} />
            <Header />

            <div className="h-100 w-100">

                <div className=" pt-5 vh-100  ">

                    <div className="pt-4  h-100 ">

                        <AboutIOD />
                        <PetaIndofood />
                        <Footer />


                    </div>
                </div>

            </div >
        </>

    );
}

export default Aboutus




