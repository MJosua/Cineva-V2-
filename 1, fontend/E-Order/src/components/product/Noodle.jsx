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

                <div className="img-noodle h-100 w-100" >

                </div>
            </div>

            <div className="h-50 mt-5">
                <div className="container">
                    <div className="row">
                        <div className="col-4">
                            <div className="d-flex justify-content-center fs-1 mt-2 responsive-judul fw-bold text-danger">
                                Noodles
                            </div>
                        </div>
                        <div className="col-8 pe-5 text-start responsive-isi">
                            <div className=" border-bottom pb-5 border-danger fw-bold">
                            Noodles Division today operates 31 factories capable of producing over 34 billion packs annually to supply ever-growing demands, Noodles Division's products can be found everywhere in Indonesia, as well as over 100 countries worldwide. Indomie, which is one of Indonesia's most iconic brands, as well as Sarimi, Supermi, and Pop Mie, have been the brands of choice of the Indonesians for so many years. 
                            </div>

                           

                            <div className=" border-bottom pb-5 border-danger ">
                                <div className="text-danger fs-3 responsive-judul">
                                    Indomie
                                </div>
                                Indomie, a classic instant noodle brand, has been around since 1982 and is now available in many countries. Don't miss out on all the delicious flavors! 
                                
                                <div 
                                
                                onClick={() => handleClick('www.indomie.com')}

                                className="text-primary mt-2 responsive-cta pointer">
                                    http://www.indomie.com
                                </div>
                            </div>

                            <div className=" border-bottom pb-5 border-danger">
                                <div className="text-danger fs-3 responsive-judul">
                                    Pop Mie
                                </div>
                                Pop Mie is a practical form of instant noodles that is ready to keep you company at any time. Just add hot water and wait three minutes, and you're ready to enjoy! 
                                <div 
                                
                                onClick={() => handleClick('www.popmie.com')}


                                className="text-primary mt-2 responsive-cta pointer">
                                    http://www.popmie.com
                                </div>
                            </div>

                            <div className=" border-bottom pb-5 border-danger">
                                <div className="text-danger fs-3 responsive-judul">
                                    Supermi
                                </div>
                                Supermi was introduced in 1968 and is one of the pioneer of instant noodles in Indonesia, which until now still exists to add the warmth of family.
                                <div 
                                
                                onClick={() => handleClick('www.supermi.co.id')}

                                className="text-primary mt-2 responsive-cta pointer">
                                    http://www.supermi.co.id
                                </div>
                            </div>
                            <div className=" border-bottom pb-5 border-danger">
                                <div className="text-danger fs-3 responsive-judul pointer">
                                    Sarimi
                                </div>
                                Sarimi is another product of Indofood that has long been providing delights for the Indonesian palate. Known for itsâ€™ bold taste and strong aroma, loved by everyone.
                                <div className="text-primary mt-2 responsive-cta pointer"
                                
                                onClick={() => handleClick('www.indofood.com/product/sarimi')}

                                >
                                    https://www.indofood.com/product/sarimi
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



