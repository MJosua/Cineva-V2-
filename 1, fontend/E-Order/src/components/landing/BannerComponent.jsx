import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Axios from "axios";
import { useDispatch } from "react-redux";
import { API_URL } from "../../config";
import { seasonOut, logoutAction, loginAction } from "../../action/userAction";

import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import { Carousel } from 'react-responsive-carousel';

import {
    Card,
    // CardHeader,
    CardBody,
    // CardFooter,
    // Heading,
    // StackDivider,
    // Stack,
    // Box, 
    Image

} from '@chakra-ui/react';
import { useData } from "../auth/CheckToken/FetchData/DataContext";

const BannerComponent = () => {
    //require props. turn it on when ready

    const [itemData, setItemData] = useState([]);

    const [loading, setLoading] = useState(true);
    const dispatch = useDispatch();



    const { bannerList } = useData();

    React.useEffect(() => {
        setItemData(bannerList);
        setLoading(false);

    }, [bannerList]);

    return (
        // <div className="container">

        <div className="col-12 w-100 ">

            <Card className="border shadow">



                <CardBody className="dashboard_carousel">
                    <Carousel autoPlay={true}
                        infiniteLoop={true}
                        showThumbs={false}
                        interval={2000}
                        transitionTime={1}

                    >

                        {itemData.map((item, index) => (
                            <div key={index}>
                                <Image
                                    // key={state.product.code}
                                    className="gambarbanner"
                                    src={`${API_URL}/image${itemData[index].img_url}`}
                                    crossOrigin="anonymous"
                                    objectFit='cover'
                                >
                                </Image>
                            </div>
                        ))}








                    </Carousel>
                </CardBody>
            </Card>
        </div>
        // </div>
    )
}
export default BannerComponent;




