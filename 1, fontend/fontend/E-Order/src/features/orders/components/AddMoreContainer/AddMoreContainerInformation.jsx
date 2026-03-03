import {
    Select,
} from "@chakra-ui/react";
import { API_URL } from "../../../../config";
import { AiFillFile, AiOutlineDelete } from "react-icons/ai";
import Axios from "axios";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useData } from "../../../auth/components/CheckToken/FetchData/DataContext";

function AddMoreContainerInformation({
    stuffingWeeks,
    setStuffingWeeks,
    userToken,
    containerOrdersInformation,
    setContainerOrdersInformation
}) {

    const user = useSelector((state) => state.userReducer.user);
    const { stuffingWeeksList } = useData();

    const toLocalDateString = (date) => {
        if (!date) return null;
        const d = new Date(date);
        if (isNaN(d)) return null;

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    /* =====================================================
     * DEFAULT INITIALIZATION (FIXED)
     * ===================================================== */
    useEffect(() => {
        if (!stuffingWeeksList?.weeksList || stuffingWeeksList.weeksList.length === 0) {
            return;
        }

        setStuffingWeeks(stuffingWeeksList.weeksList);

        const newOrders = { ...containerOrdersInformation };
        const defaultweek = stuffingWeeksList.weeksList[0];

        // ðŸ”¥ FIX: guard on stuffing_date, NOT delv_week
        if (!newOrders.stuffing_date) {
            newOrders.delv_week = defaultweek.week;
            newOrders.delv_week_id = defaultweek.id;
            newOrders.delv_week_desc = `Week ${defaultweek.week} (${defaultweek.startingDate} - ${defaultweek.endingDate})`;
            newOrders.delv_year = defaultweek.year;

            const formattedDate = toLocalDateString(defaultweek.startingDate);
            newOrders.stuffing_date = formattedDate;

            setContainerOrdersInformation(newOrders);
        }
    }, [stuffingWeeksList]); // intentionally ONLY this dependency

    /* =====================================================
     * SELECT CHANGE HANDLER (FIXED)
     * ===================================================== */
    const handleStuffingWeekChange = (
        delv_week,
        delv_week_desc,
        delv_year,
        delv_week_id,
        stuffing_date
    ) => {
        const newOrders = { ...containerOrdersInformation };

        newOrders.delv_week = delv_week;
        newOrders.delv_week_desc = delv_week_desc;
        newOrders.delv_year = delv_year;
        newOrders.delv_week_id = delv_week_id;

        const formattedDate = toLocalDateString(stuffing_date);
        newOrders.stuffing_date = formattedDate;

        setContainerOrdersInformation(newOrders);
    };

    return (
        <div className="row">
            <div className="card-body border shadow shadow-sm top_card_order_page">
                <div className="row px-2">
                    <div className="d-flex ratakiri grey_text_bold fs-6 col-12 col-md-2 pt-1">
                        Stuffing Week&nbsp;
                    </div>

                    <div className="d-flex col-md-8 col-12 ps-md-0 ps-3">
                        <Select
                            className="grey_text fs-6"
                            size="sm"
                            value={containerOrdersInformation?.delv_week_id}
                            onChange={(e) => {
                                const selectedOption = e.target.options[e.target.selectedIndex];

                                const delv_week = selectedOption.getAttribute('data-week');
                                const delv_week_desc = selectedOption.getAttribute('data-week-desc');
                                const delv_year = selectedOption.getAttribute('data-year');
                                const delv_week_id = selectedOption.getAttribute('data-week-id');

                                // ðŸ”¥ FIX: proper data-* attribute
                                const stuffing_date = selectedOption.getAttribute('data-stuffing-date');

                                handleStuffingWeekChange(
                                    delv_week,
                                    delv_week_desc,
                                    delv_year,
                                    delv_week_id,
                                    stuffing_date
                                );
                            }}
                        >

                            {stuffingWeeks.length === 0 && (
                                <option className="text-secondary text-italic">
                                    Data Loading...
                                </option>
                            )}

                            {stuffingWeeks.map((stuffing) => (
                                <option
                                    key={stuffing.id}
                                    value={stuffing.id}
                                    data-week={stuffing.week}
                                    data-week-id={stuffing.id}
                                    data-year={stuffing.year}
                                    data-week-desc={`Week ${stuffing.week} (${stuffing.startingDate} - ${stuffing.endingDate})`}
                                    data-stuffing-date={stuffing.startingDate}  // ðŸ”¥ FIX
                                >
                                    {`Week ${stuffing.week} (${stuffing.startingDate} - ${stuffing.endingDate})`}
                                </option>
                            ))}

                        </Select>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddMoreContainerInformation;





