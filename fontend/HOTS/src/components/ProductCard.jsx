import React from "react";
import {

    Box,
    Text
} from '@chakra-ui/react'
import { useNavigate } from "react-router-dom";

const ProductCard = () => {
    const navigate = useNavigate()

    return (
        <div className=" mb-3">
            <Box className=" card card-body btn border  "
                onClick={(e) => navigate('/e-order/product')}>
                <div className="row ">
                    <div className="col-3" >
                        <img className=""
                            src={require('../assets/images/indomie-mi-goreng-special.png')}
                            width='100%' alt="container" />
                    </div>
                    <div className="col-9 text-start pe-1" >
                        <h5 className="card-title  fw-bold">
                            Indomie Goreng China
                        </h5>
                        <h6 className="card-subtitle mb-1">
                            Instant Noodle
                        </h6>
                        <h6 className="card-subtitle mb-1">
                            153509
                        </h6>
                        <h6 className="card-subtitle mb-1
                            text-muted">
                            car @ 40pcs
                        </h6>
                    </div>
                </div>
            </Box>
        </div>
    )
}

export default ProductCard;
