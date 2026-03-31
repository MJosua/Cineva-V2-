import React from "react";
import { useNavigate } from "react-router-dom";
import logoIndofood from '../assets/ui/logo_indofoodCBP_white.png';

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
                src={logoIndofood}
                width="30%"
                alt='content'
            />

        </div>
    )
}

export default LogoBar;



