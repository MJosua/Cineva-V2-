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


            <div className="banner-product w-100" >

                <div className="img-dairy h-100 w-100">

                </div>
            </div>

            <div className="h-50 mt-5">
                <div className="container">
                    <div className="row">
                        <div className="col-4">
                            <div className="d-flex justify-content-center fs-1 mt-2 responsive-judul fw-bold text-danger">
                                Dairy
                            </div>
                        </div>
                        <div className="col-8 pe-5 text-start responsive-isi">
                            <div className=" border-bottom pb-5 border-danger fw-bold">
                            Indofood CBP’s Dairy Division is a major producer of milk products in Indonesia. It makes a wide range of products, such as ultra-high temperature (UHT) milk, sterilized bottled milk, sweetened condensed creamer (SCC), evaporated milk, pasteurized liquid milk, UHT multi-cereal milk, <span className="">milk-flavoured</span> drinks, powdered milk, ice cream and butter. The division is known for its high-quality products and brands, such as Indomilk, Cap Enaak and Orchid Butter. 
                             </div>

                            <div className=" border-bottom pb-5 border-danger ">
                                <div className="text-danger fs-3 responsive-judul">
                                Indomilk
                                </div>
                                Indomilk offers a wide variety of delicious and nutritious milk products, provides quality products that maintain freshness and goodness. The selection of Indomilk cow's milk quality is only the best with the highest standards in the production process. <div 
                                
                                onClick={() => handleClick('www.indomilk.com/en')}

                                className="text-primary mt-2 responsive-cta pointer">
                                   https://www.indomilk.com/en  
                                </div>
                            </div>

                            <div className=" border-bottom pb-5 border-danger">
                                <div className="text-danger fs-3 responsive-judul">
                                Cap Enaak 
                                </div>
                                Cap Enaak is just the right choice if you’re looking for a delicious condensed. Full of goodness and nutrition with its distinctive taste, it appeals to everyone. For years, children to adults have enjoyed it.  <div 
                                
                                onClick={() => handleClick('www.indofood.com/product/cap-enak/product')}


                                className="text-primary mt-2 responsive-cta pointer">
                                  https://www.indofood.com/product/cap-enak/product  
                                </div>
                            </div>

                            <div className=" border-bottom pb-5 border-danger">
                                <div className="text-danger fs-3 responsive-judul">
                                Orchid Butter 
                                </div>
                                Made from pure milk fat, Orchid Butter has an extra delicious taste enriched with vitamins A & E. Suitable for cakes, bread, biscuits, or any of your <span className="">favourite</span> recipes.<div 
                                
                                onClick={() => handleClick('www.indofood.com/product/orchid-butter/product')}

                                className="text-primary mt-2 responsive-cta pointer">
                                    https://www.indofood.com/product/orchid-butter/product  
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