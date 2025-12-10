import { Image, Input, InputGroup, InputRightElement } from "@chakra-ui/react"
import { FaSearch } from "react-icons/fa";
function Truckperpackcomponent({ orderVolume,formatNumberWithDots,optiontype }) {
    return (
        <div className="row">
            <div className="col-12 px-4 pt-3 mb-4 ">
                <div className="pe-2">

                </div>
            </div>
            <div className="col-4 ">
                <div className="row">

                    <div className="col-12 d-flex justify-content-center">
                        <Image
                            src="/image/40hc.png"

                            width="100%"
                            maxWidth="55px"
                            maxHeight="55px"


                            fallbacksrc="https://www.indofoodinternational.com/e-order/static/media/emptyplate.abe823f0ddff30c4a1fa.PNG"
                        />
                    </div>

                    <div className="col-12 grey_text_16px">
                        {

                            orderVolume.cont_40hc} Container{
                            !orderVolume.cont_40hc ?
                                ""
                                :
                                (orderVolume.cont_40hc).length > 1 ? "s" : ""

                        }

                    </div>

                    <div className="col-12 grey_text_normal_12px">
                    {formatNumberWithDots(orderVolume.cont_40hc_qty)} {optiontype}{orderVolume.cont_40hc_qty ? 
                        ((orderVolume.cont_40hc_qty).length > 1 ? "s" : "")
                        :
                        "" 
                        } 


                    </div>

                </div>
            </div>

            <div className="col-4">
                <div className="row">
                    <div className="col-12 d-flex justify-content-center">
                        <Image
                            src="/image/20ft.png"

                            width="100%"
                            maxWidth="55px"
                            maxHeight="55px"


                            fallbacksrc="https://www.indofoodinternational.com/e-order/static/media/emptyplate.abe823f0ddff30c4a1fa.PNG"
                        />
                    </div>

                    <div className="col-12 grey_text_16px">
                        {orderVolume.cont_20} Container
                        {
                            !orderVolume.cont_20 ?
                                ""
                                :
                                (orderVolume.cont_20).length > 1 ? "s" : ""
                        }

                    </div>

                    <div className="col-12 grey_text_normal_12px">
                       {formatNumberWithDots(orderVolume.cont_20_qty)} {optiontype}{orderVolume.cont_20_qty ? 
                        ((orderVolume.cont_20_qty).length > 1 ? "s" : "")
                        :
                        "" 
                        } 
                    </div>

                </div>
            </div>

            <div className="col-4">
                <div className="row">
                    <div className="col-12 d-flex justify-content-center">
                        <Image
                            src="/image/truck.png"

                            width="100%"
                            minHeight="60px"
                            maxWidth="75px"
                            maxHeight="75px"
                            fallbacksrc="https://www.indofoodinternational.com/e-order/static/media/emptyplate.abe823f0ddff30c4a1fa.PNG"
                        />
                    </div>

                    <div className="col-12 grey_text_16px">
                        {formatNumberWithDots(orderVolume.truck)} Truck
                        {orderVolume.truck ? 
                        ((orderVolume.truck).length > 1 ? "s" : "")
                        :
                        "" 
                        } 

                    </div>

                    <div className="col-12 grey_text_normal_12px">
                       {formatNumberWithDots(orderVolume.truck_qty) || 0} {optiontype}{orderVolume.truck_qty ? 
                        ((orderVolume.truck_qty).length > 1 ? "s" : "")
                        :
                        "" 
                        } 
                    </div>

                </div>
            </div>

        </div>
    )
}
export default Truckperpackcomponent