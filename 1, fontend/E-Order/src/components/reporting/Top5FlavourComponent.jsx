import Axios from "axios"; // Correct import statement for Axios
import { API_URL } from "../../config";
import { useState, useEffect } from "react";

function Top5FlavourComponent({ userToken, seasonOut, formatNumberWithDots, optiontype, week, datetype }) {

    const [topflavour, setTopflavour] = useState();

    const getTopFlavour = () => {
        Axios.get(`${API_URL}/spectator/top_flavour/${optiontype}`, {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        })
            .then((res) => {
                setTopflavour(res.data);
                console.log("ini.Flavour", res.data)
            })
            .catch((err) => {
            });
    };

    useEffect(() => {
        getTopFlavour();
    }, [optiontype]
    )

    return (
        <div className="card w-100 h-100 pt-2 text-grey text-start shadow-sm border_radius_10px ">
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12 grey_text_12px mb-2">
                        TOP 5 FLAVOUR
                    </div>
                    <div className="col-12 grey_text text-start d-flex align-items-center" style={{ fontSize: "10px" }}>
                        <table className=" table"  >
                            <tr  >
                                <td  >
                                    1.
                                </td>
                                <td  >
                                    GSS
                                </td>
                                <td className="text-end"  >
                                    411.440
                                </td>
                            </tr>
                            <tr  >
                                <td  >
                                    1.
                                </td>
                                <td  >
                                    GSS
                                </td>
                                <td className="text-end"  >
                                    411.440
                                </td>
                            </tr>
                            <tr  >
                                <td  >
                                    1.
                                </td>
                                <td  >
                                    GSS
                                </td>
                                <td className="text-end"  >
                                    411.440
                                </td>
                            </tr>
                            <tr  >
                                <td  >
                                    1.
                                </td>
                                <td  >
                                    GSS
                                </td>
                                <td className="text-end"  >
                                    411.440
                                </td>
                            </tr>
                            <tr  >
                                <td  >
                                    1.
                                </td>
                                <td  >
                                    GSS
                                </td>
                                <td className="text-end"  >
                                    411.440
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Top5FlavourComponent




