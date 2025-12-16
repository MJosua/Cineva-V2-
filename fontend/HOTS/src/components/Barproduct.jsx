import React from "react";
import { useLocation, useNavigate } from "react-router-dom";


const Banner = () => {
    const navigate = useNavigate();
    const location = useLocation();
    return (
        <div className="bg-danger w-100 py-2 d-flex justify-content-center responsive-more mt-5">

            <div className="link-light px-4 me-3 user-select-none d-none d-md-block"
                onClick={() =>
                    navigate('/product/noodle')

                }
            >
                <span className="product-pointer"
                    style={location.pathname.includes('/noodle') ? { borderBottom: '3px solid white' } : {}}
                >
                    Noodles
                </span>
            </div>

            <div className="link-light  px-4 me-3 user-select-none d-none d-md-block"
                onClick={() =>
                    navigate('/product/dairy')

                }

            >
                <span className="product-pointer"
                    style={location.pathname.includes('/dairy') ? { borderBottom: '3px solid white' } : {}}
                >
                    Dairy
                </span>
            </div>

            <div className="link-light  px-4 me-3 user-select-none d-none d-md-block"
                onClick={() =>
                    navigate('/product/snack')

                }
            >
                <span className="product-pointer"
                    style={location.pathname.includes('/snack') ? { borderBottom: '3px solid white' } : {}}
                >
                    Snacks
                </span>
            </div>

            <div className="link-light  px-4 me-3 user-select-none d-none d-md-block"
                onClick={() =>
                    navigate('/product/seasoning')

                }
            >
                <span className="product-pointer"
                    style={location.pathname.includes('/seasoning') ? { borderBottom: '3px solid white' } : {}}
                >
                Seasonings
                </span>
            </div>

            <div className="link-light  px-4 me-3 user-select-none d-none d-md-block"
                onClick={() =>
                    navigate('/product/healthyfood')

                }
            >
                 <span className="product-pointer"
                    style={location.pathname.includes('/healthyfood') ? { borderBottom: '3px solid white' } : {}}
                >
                Nutrition & Special Foods
                </span>
            </div>

        </div>


    );
}

export default Banner;

