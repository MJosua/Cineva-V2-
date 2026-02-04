import React from "react";
import { Text, Box } from "@chakra-ui/react"
// import { CiLocationOn } from 'react-icons/ci'
// import { useLocation } from "react-router-dom";


import { useSelector } from 'react-redux';

const DeliverToComponent = () => {

    
    // let getCountry = JSON.parse(userData)
    // const country_name = getUserData.country_desc


    const { country_desc } = useSelector((state) => {
        return {
            country_desc: state.userReducer.country_desc
        }
    });


    return (
        // <div className="container">
        <span className=" d-flex deliver-to">
        
            <span style={{marginTop:"2px"}} className="">
                <svg className="Icon_material-location-on   " viewBox="7.5 3 15 21.429">
                    <path id="Icon_material-location-on"
                        d="M 15 3 C 10.85357093811035 3 7.5 6.35357141494751 7.5 10.5 C 7.5 16.125 15 24.4285717010498 15 24.4285717010498 C 15 24.4285717010498 22.5 16.125 22.5 10.5 C 22.5 6.35357141494751 19.14642715454102 3 15 3 Z M 15 13.1785717010498 C 13.52142906188965 13.1785717010498 12.3214282989502 11.97857189178467 12.3214282989502 10.5 C 12.3214282989502 9.021429061889648 13.52142906188965 7.821429252624512 15 7.821429252624512 C 16.47857284545898 7.821429252624512 17.67856979370117 9.021429061889648 17.67856979370117 10.5 C 17.67856979370117 11.97857189178467 16.47857284545898 13.1785717010498 15 13.1785717010498 Z">
                    </path>
                </svg>
            </span>
            <span className=" px-1">
                <Text className=" text-muted fw-bold d-flex justify-content-start" fontSize='lg'>
                    {
                        "Deliver to" + " " +
                        country_desc
                    }
                </Text>
            </span>
        </span>

        // </div>
    )

};

export default DeliverToComponent;



