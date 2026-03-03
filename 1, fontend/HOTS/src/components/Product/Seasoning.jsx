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

                <div className="img-bumbu h-100 w-100">

                </div>
            </div>

            <div className="h-50 mt-5">
                <div className="container">
                    <div className="row">
                        <div className="col-4">
                            <div className="d-flex justify-content-center fs-1 mt-2 responsive-judul fw-bold text-danger">
                                Seasonings
                            </div>
                        </div>
                        <div className="col-8 pe-5 text-start responsive-isi">
                            <div className=" border-bottom pb-5 border-danger fw-bold">
                            Indofood CBP’s Food Seasonings Division is one of Indonesia’s leading culinary products manufacturers. It produces a broad range of culinary products, including recipe mixes, soy sauce, chili sauce, tomato sauce and stock soup under the Indofood and Indofood Racik brands.
                             </div>

                            <div className=" border-bottom pb-5 border-danger ">
                                <div className="text-danger fs-3 responsive-judul">
                                Indofood Chili Sauce 
                                </div>
                                Indofood Chili sauce have most variant that is perfect match to each cuisine, made from fresh chili and no artificial colouring. A good companion for dipping sauce as well as topping. 
                                 {/* <div

                                    onClick={() => handleClick('www.indomie.com')}

                                    className="text-primary mt-2 responsive-cta pointer">
                                    http://www.indomie.com
                                </div> */}
                            </div>

                            <div className=" border-bottom pb-5 border-danger">
                                <div className="text-danger fs-3 responsive-judul">
                                Indofood Soy Sauce 
                                </div>
                                Indofood Soy Sauce made by natural fermented and without adding chemical materials that created sweet and savoury taste with blackish brown colour without adding MSG, preservatives, nor artificial colour. Indofood Soy Sauce is the right ingredient go add more taste into your favourite food recipe. 
                                 {/* <div

                                    onClick={() => handleClick('www.popmie.com')}


                                    className="text-primary mt-2 responsive-cta pointer">
                                    http://www.popmie.com
                                </div> */}
                            </div>

                            <div className=" border-bottom pb-5 border-danger">
                                <div className="text-danger fs-3 responsive-judul">
                                Instant Seasoning 
                                </div>
                                Indofood Instant Seasoning offers you an easy and instant meals which keeps the authentic flavour of natural spices, makes you become a top chef in your own kitchen. 
                                 {/* <div

                                    onClick={() => handleClick('www.supermi.co.id')}

                                    className="text-primary mt-2 responsive-cta pointer">
                                    http://www.supermi.co.id
                                </div> */}
                            </div>
                            <div className=" border-bottom pb-5 border-danger">
                                <div className="text-danger fs-3 responsive-judul pointer">
                                Racik Seasoning 
                                </div>
                                Racik Seasoning with powder format offers an easiness way to cooking menu dishes with consistency of delicious taste. Racik Seasoning is the best partner for mom to provide daily favourite menu dishes. 
                                 {/* <div className="text-primary mt-2 responsive-cta pointer"

                                    onClick={() => handleClick('www.supermi.co.id')}

                                >
                                    http://www.supermi.co.id
                                </div> */}
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