import React from "react";
import Banner from "../banner";
import Footer from "../footer";

function Noodlepage() {
    const handleClick = (link) => {

        const fullLink = `https://${link}`;

        // Use window.open() to open the link in a new page
        window.open(fullLink, '_blank');
    };
    return (



        <div className="w-100 vh-100">


            <div className="banner-product w-100">

                <div className="img-healthy h-100 w-100">

                </div>
            </div>

            <div className="h-50 mt-5">
                <div className="container">
                    <div className="row">
                        <div className="col-4">
                            <div className="d-flex justify-content-center fs-1 mt-2 responsive-judul fw-bold text-danger">
                                Nutrition & Special Food
                            </div>
                        </div>
                        <div className="col-8 pe-5 text-start responsive-isi">
                            <div className=" border-bottom pb-5 border-danger fw-bold">
                                Indofood CBP's Nutrition & Special Foods Division helps children grow and develop by providing them with nutritious food products, including infant and toddler foods.
                            </div>

                            <div className=" border-bottom pb-5 border-danger ">
                                <div className="text-danger fs-3 responsive-judul">
                                    Promina
                                </div>
                                Natural, balanced nutrition for your baby.

                                A supplementary food for breast milk, produced from natural ingredients and enriched with complete nutrients to support your baby's and toddler's growth.
                                <div

                                    onClick={() => handleClick('www.promina.co.id')}

                                    className="text-primary mt-2 responsive-cta pointer">
                                    https://www.promina.co.id/  
                                </div>
                            </div>

                            
                        </div>


                    </div>
                </div>
                <Banner />
                <Footer />
            </div>
        </div>

    );

}

export default Noodlepage;