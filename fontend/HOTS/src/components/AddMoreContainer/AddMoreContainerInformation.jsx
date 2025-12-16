import {
    Select,

} from "@chakra-ui/react";
import { API_URL } from "../../config";
import { AiFillFile, AiOutlineDelete } from "react-icons/ai";
import Axios from "axios";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useData } from "../CheckToken/FetchData/DataContext";

function AddMoreContainerInformation({
    stuffingWeeks,
    setStuffingWeeks,
    userToken,
    containerOrdersInformation,
    setContainerOrdersInformation

}) {

    const { user } = useSelector((state) => {
        return {
            user: state.userReducer.user,
        }
    });

    const { stuffingWeeksList } = useData();
    console.log("stuffingWeeksList asdasd", stuffingWeeksList)
    const toLocalDateString = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        // WAIT until API data is loaded
        if (!stuffingWeeksList?.weeksList || stuffingWeeksList.weeksList.length === 0) {
            return; // do nothing until weeks exist
        }

        // Set the stuffingWeeks list for the component
        setStuffingWeeks(stuffingWeeksList.weeksList);

        const newOrders = { ...containerOrdersInformation };
        const defaultweek = stuffingWeeksList.weeksList[0];

        // Only set defaults if they are empty
        if (!newOrders.delv_week || !newOrders.delv_year) {
            newOrders.delv_week = defaultweek.week;
            newOrders.delv_week_id = defaultweek.id;
            newOrders.delv_week_desc = `Week ${defaultweek.week} (${defaultweek.startingDate} - ${defaultweek.endingDate})`;
            newOrders.delv_year = defaultweek.year;

            const formattedDate = toLocalDateString(defaultweek.startingDate);
            newOrders.stuffing_date = formattedDate;

            setContainerOrdersInformation(newOrders);
        }
    }, [stuffingWeeksList]);  // <-- Important!




    const handleStuffingWeekChange = (delv_week, delv_week_desc, delv_year, delv_week_id, stuffing_date) => {
        console.log("testStuffiongWeekChange", delv_week_id)
        const newOrders = { ...containerOrdersInformation };
        if (newOrders) {
            newOrders.delv_week = delv_week;
            newOrders.delv_week_desc = delv_week_desc;
            newOrders.delv_year = delv_year;
            newOrders.delv_week_id = delv_week_id;


            const formattedDate = toLocalDateString(stuffing_date);
            console.log("formattedDate", formattedDate)

            newOrders.stuffing_date = formattedDate;

            setContainerOrdersInformation(newOrders);
        }
    };



    return (
        <div className="row">
            <div className="card-body border shadow shadow-sm top_card_order_page">
                <div className="row px-2">
                    <div className="d-flex ratakiri grey_text_bold fs-6  col-12 col-md-2 pt-1">
                        Stuffing Week&nbsp;
                    </div>

                    <div className="d-flex  col-md-8 col-12 ps-md-0 ps-3">
                        <Select
                            className="grey_text fs-6"
                            size="sm"
                            onChange={(e) => {
                                const selectedOption = e.target.options[e.target.selectedIndex];
                                const delv_week = selectedOption.getAttribute('data-week');
                                const delv_week_desc = selectedOption.getAttribute('data-week-desc');
                                const delv_year = selectedOption.getAttribute('data-year');
                                const delv_week_id = selectedOption.getAttribute('data-week-id');
                                const stuffing_date = selectedOption.getAttribute('stuffing_date');
                                handleStuffingWeekChange(delv_week, delv_week_desc, delv_year, delv_week_id, stuffing_date);
                            }}
                            value={containerOrdersInformation?.delv_week_id}
                        >

                            {stuffingWeeks.length === 0 ?
                                <option className="text-seondary text-italic">
                                    Data Loading...
                                </option>
                                :
                                <>
                                </>
                            }

                            {stuffingWeeks
                                // .filter(stuffing => {
                                //     const endingDate = new Date(stuffing.endingDate);
                                //     const futureDate = new Date();
                                //     console.log("futureDate", futureDate)
                                //     //problem week pilih apa dapet apa. mundur satu
                                //     // futureDate.setDate(futureDate.getDate() + 35);
                                //     futureDate.setDate(futureDate.getDate());
                                //     return endingDate >= futureDate;
                                // })
                                // .slice(0, 15)
                                .map((stuffing) => (
                                    <option key={stuffing.id}

                                        value={stuffing.id}
                                        data-week-desc={`Week ${stuffing.week} (${stuffing.startingDate} - ${stuffing.endingDate})`}
                                        data-year={stuffing.year}
                                        data-week={stuffing.week}
                                        data-week-id={stuffing.id}
                                        stuffing_date={stuffing.startingDate}
                                    >
                                        {`Week ${stuffing.week} (${stuffing.startingDate} - ${stuffing.endingDate})`}
                                    </option>
                                ))}

                        </Select>
                    </div>
                </div>


            </div>



        </div>
    )
}
export default AddMoreContainerInformation