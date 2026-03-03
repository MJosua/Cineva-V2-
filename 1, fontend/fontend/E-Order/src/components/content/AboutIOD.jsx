import React,{ useState } from 'react';
import Axios from 'axios';
import { API_URL } from "../../config";


function AboutIOD() {




    return (
        <div className="px-md-5 px-1 mx-md-5 mx-0 py-3">
            <div className="px-md-5 px-1 mx-md-5 mx-0">
                <div className="text-danger fs-1 fw-bold py-4">
                    International Operations Division

                </div>
                <div className="fs-5 text-secondary">

                    The International Operations Division (IOD) is the overseas division of PT Indofood CBP Sukses Makmur Tbk. It started in the early 1990s by exporting products out of Indonesia to different parts of the world. Today, its operations include managing the overseas business across the globe. Currently, our products are available in over 100 countries worldwide, bringing happiness and value to millions of consumers around the world.
                    <br></br><br></br>
                    We offer a wide range of products, which include instant noodles, sauces and food seasonings, cooking oil, dairy, snacks, and nutrition-packed food products. Our products are recognized for their quality, delicious taste and are Halal Certified.
                    It is our vision to turn our Indofood products to become a necessity product for families around the world.
                    <br></br><br></br>
                    We welcome the opportunities to expand our products and network across the world. For further inquiries and more information, please contact us at
                    &nbsp;
                    <span className="fw-bold">
                        international@icbp.indofood.co.id
                    </span>.
                </div>
            </div>
        </div>
    );
}

export default AboutIOD




