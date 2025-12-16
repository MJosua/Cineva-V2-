import React from "react";
import { useNavigate } from "react-router-dom";



const LogoBar = () => {

    const navigate = useNavigate;

    return (
        <div className=" 
            container-fluid 
            bg-danger 
            py-3 pt-4 
            d-flex 
            justify-content-center">
            <img
                className="px-2"
                src={require('../assets/ui/logo_indofoodCBP_white.png')}
                width="30%"
                alt='content'
            />

        </div>
    )
}

export default LogoBar;