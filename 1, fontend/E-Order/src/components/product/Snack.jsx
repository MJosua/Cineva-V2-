import React from "react";
import Banner from "../landing/banner.jsx";
import Footer from "../layout/footer.jsx";

function Noodlepage() {
    const handleClick = (link) => {

        const fullLink = `https://${link}`;

        // Use window.open() to open the link in a new page
        window.open(fullLink, '_blank');
    };
    return (



        <div className="w-100 vh-100">


            <div className="banner-product w-100">

                <div className="img-snack h-100 w-100">

                </div>
            </div>

            <div className="h-50 mt-5">
                <div className="container">
                    <div className="row">
                        <div className="col-4">
                            <div className="d-flex justify-content-center fs-1 mt-2 responsive-judul fw-bold text-danger">
                                Snack
                            </div>
                        </div>
                        <div className="col-8 pe-5 text-start responsive-isi">
                            <div className=" border-bottom pb-5 border-danger fw-bold">
                            Indofood's Snack Foods Division is a leading producer of both Western-style and traditional snacks in Indonesia. The division produces a wide range of snacks, including potato chips, cassava chips, corn snacks, soybean snacks, and extruded snacks. These snacks are marketed under the brands Chitato, Chitato Lite, Qtela, Chiki, Maxicorn, and Jetz. 
                            </div>

                            <div className=" border-bottom pb-5 border-danger ">
                                <div className="text-danger fs-3 responsive-judul">
                                    Chitato
                                </div>
                                Chitato products are the catalysts that encourage consumers to live life fearlessly. The real fresh potato with crunchiness like no other, and the wavy cut that preserve the flavour. The bold taste and texture trigger them, so they don't hold back and can keep riding the wave of life. Chitato gives them a rich variety of full sensation products that opens up to a wealth of experiences. 
                                <div

                                    onClick={() => handleClick('www.chitato.com/Home.aspx  ')}

                                    className="text-primary mt-2 responsive-cta pointer">
                                    https://www.chitato.com/Home.aspx
                                </div>
                            </div>

                            <div className=" border-bottom pb-5 border-danger">
                                <div className="text-danger fs-3 responsive-judul">
                                    Chitato Lite
                                </div>
                                Chitato Lite, made from selected real potatoes thinly sliced, brings a crunchier sensation in every bite. Lite up every moment of your life with Chitato Lite. 
                                 <div

                                    onClick={() => handleClick('www.indofood.com/product/chitato-lite/product ')}


                                    className="text-primary mt-2 responsive-cta pointer">
                                    https://www.indofood.com/product/chitato-lite/product
                                </div>
                            </div>

                            <div className=" border-bottom pb-5 border-danger">
                                <div className="text-danger fs-3 responsive-judul">
                                    Qtela
                                </div>
                                Qtela is made from selected traditional and high-quality raw materials and packaged in a modern way. Qtela has 2 variants namely Cassava Chips and Tempe Chips. Thin and crispy texture combined with special taste is perfect for all moments of gathering with friends or family. 
                                <div

                                    onClick={() => handleClick('www.indofood.com/product/qtela/product  ')}

                                    className="text-primary mt-2 responsive-cta pointer">
                                    https://www.indofood.com/product/qtela/product
                                </div>
                            </div>
                            <div className=" border-bottom pb-5 border-danger">
                                <div className="text-danger fs-3 responsive-judul pointer">
                                Chiki
                                </div>
                                For years now, Chiki, has been the pioneer and our favourite snack for a long time with a crisp and melted texture in the mouth and makes your day more cheerful. 
                                <div className="text-primary mt-2 responsive-cta pointer"

                                    onClick={() => handleClick('www.indofood.com/product/chiki/product  ')}

                                >
                                    https://www.indofood.com/product/chiki/product  
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



