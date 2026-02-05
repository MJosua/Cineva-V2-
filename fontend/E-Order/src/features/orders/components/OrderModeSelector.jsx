import React from "react";
import { Image } from "@chakra-ui/react";

const OrderModeSelector = ({
    transport,
    mode,
    handleModeChange,
    company_id,
    spc_condition_details
}) => {
    return (
        <div className="col-12 mb-4">
            <div className="row">
                {/* CONTAINER BUTTON */}
                <div className={((transport === 1 || transport === 3) ? "col-auto " : "d-none")}>
                    <div className="d-flex">
                        <div
                            style={{ minWidth: "150px", height: "48px" }}
                            className={
                                "btn btn-outline-indofood-biru py-2 border_radius_10px fw-bold " +
                                ((transport === 1 || transport === 3) ? "" : "d-none") +
                                (mode === "Container" ? " active " : "")
                            }
                            onClick={() => handleModeChange("Container")}
                        >
                            <div className="row">
                                <div className="col-3 h-100">
                                    <div className="d-flex justify-content-start align-items-center" style={{ minWidth: "60px" }}>
                                        <Image
                                            src={`/image/po.PNG`}
                                            width="auto"
                                            height={"30px"}
                                            fallbacksrc="https://www.indofoodinternational.com/e-order/static/media/emptyplate.abe823f0ddff30c4a1fa.PNG"
                                        />
                                    </div>
                                </div>
                                <div className={`col-9 d-flex align-items-center justify-content-start ${company_id === 147 || company_id === 381 ? "ps-1" : "ps-4"}`}>
                                    {(company_id === 147 || company_id === 381) ?
                                        <span>Container Indonesia</span>
                                        :
                                        <span>Container</span>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TRUCK BUTTON */}
                <div className="col-auto">
                    {(transport === 1 || !transport || transport === 0 ?
                        " " :
                        <div
                            style={{ minWidth: "150px", height: "48px" }}
                            className={
                                "btn btn-outline-indofood-biru py-2 border_radius_10px fw-bold " +
                                (mode === "Trucking" ? " active " : "")
                            }
                            onClick={() => handleModeChange("Trucking")}
                        >
                            <div className="row h-100">
                                <div className="col-3 h-100">
                                    <div className="d-flex justify-content-start align-items-center" style={{ minWidth: "60px" }}>
                                        <Image
                                            src={`/image/truck.png`}
                                            width="auto"
                                            height={"30px"}
                                            fallbacksrc="https://www.indofoodinternational.com/e-order/static/media/emptyplate.abe823f0ddff30c4a1fa.PNG"
                                        />
                                    </div>
                                </div>
                                <div className="col-9 h-100 d-flex align-items-center justify-content-center ps-2">
                                    {(() => {
                                        // Dynamic Label Logic
                                        const specialLabel = spc_condition_details?.find(c => c.id === 22)?.value;
                                        return specialLabel ? <span>{specialLabel}</span> : <span>Truck</span>;
                                    })()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderModeSelector;
