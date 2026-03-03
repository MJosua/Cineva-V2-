import { FaArrowTrendUp, FaArrowTrendDown } from "react-icons/fa6";
import Axios from "axios"; // Correct import statement for Axios
import { API_URL } from "../../config";
import { useState, useEffect } from "react";

function Top5DistributorComponent({ truncateText, userToken, seasonOut, formatNumberWithDots, optiontype, week, datetype }) {

    const [topdistributor, setTopdistributor] = useState([]);

    const getTopdistributor = () => {
        Axios.get(`${API_URL}/spectator/top_dist/${optiontype}?upto=10`, {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        })
            .then((res) => {
                setTopdistributor(res.data);
                // console.log("getTopdistributor", res.data)
            })
            .catch((err) => {
                seasonOut();
            });
    };


    useEffect(() => {
        getTopdistributor();
    }, [optiontype]);


    return (

        <div className="card w-100 h-100 border_radius_10px shadow-sm pt-2">
            <div className="container-fluid">
                <div className="row">

                    <div className="col-12  grey_text text-start d-flex align-items-center " style={{ fontSize: "10px" }}>

                        <table className="table grey_text" >
                            <tr >
                                <th>
                                    No
                                </th>
                                <th className="text-start">
                                    Distributor
                                </th>
                                <th className="text-start">
                                    Country
                                </th>
                                <th className="text-start">
                                    Volume
                                </th>
                            </tr>
                            {topdistributor.map((dist, idx) => (

                                <tr key={idx}>
                                    <td>
                                        {idx + 1}
                                    </td>
                                    <td>{truncateText(dist.company_name, 30)}</td>
                                    <td className="text-start">
                                        {dist.txt}
                                    </td>
                                    <td className="text-end">
                                        {formatNumberWithDots(dist.sales)}
                                    </td>
                                </tr>



                            )
                            )}
                        </table>

                    </div>
                </div>
            </div>
        </div>
    )
}

export default Top5DistributorComponent