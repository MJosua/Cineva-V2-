import React, { useState, useEffect } from 'react';

const Rumuscbm = ({
    containerOrders,
    flavours,
    container
}) => {
    const [C1, setC1] = useState(0);
    const [C2, setC2] = useState(0);
    const [C3, setC3] = useState(0);

    const flavorLookup = flavours.reduce((lookup, flavor) => {
        lookup[flavor.product_code] = flavor;
        return lookup;
    }, {});

    const flavour1Details = flavorLookup[container.Flavour[0].sku];
    const flavour2Details = container.Flavour[1] ? flavorLookup[container.Flavour[1].sku] : "";
    const flavour3Details = container.Flavour[2] ? flavorLookup[container.Flavour[2].sku] : "";


    const flavour1 = container.Flavour[0];
    const flavour2 = container.Flavour[1];
    const flavour3 = container.Flavour[2];



    const [CBM, setCBM] = useState(0);


    useEffect(() => {
        if (
            flavour1Details && flavour1.sku !== "-1"
            &&
            (!flavour2Details || flavour2.sku === "-1")
        ) {
            const updatedC1 =
                flavour1.qty *
                (((flavour1Details.ctn_height + 1) *
                    (flavour1Details.ctn_length + 1) *
                    (flavour1Details.ctn_width + 1)) /
                    1000000000);
            setC1(updatedC1);
            const updatedCBM1 = Math.floor(C1 * 100) / 100
            var roundedString = updatedCBM1.toFixed(1);
            var rounded = Number(roundedString);
            setCBM(rounded);
        }
        else if (
            flavour1Details && flavour1.sku !== "-1"
            &&
            flavour2Details && flavour2.sku !== "-1"
            &&
            (!flavour3Details || flavour3.sku === "-1")
        ) {
            const updatedC1 =
                flavour1.qty *
                (((flavour1Details.ctn_height + 1) *
                    (flavour1Details.ctn_length + 1) *
                    (flavour1Details.ctn_width + 1)) /
                    1000000000);

            setC1(updatedC1);
            const updatedCBM1 = Math.floor(C1 * 100) / 100

            const updatedC2 =
                flavour2.qty *
                (((flavour2Details.ctn_height + 1) *
                    (flavour2Details.ctn_length + 1) *
                    (flavour2Details.ctn_width + 1)) /
                    1000000000);

            setC2(updatedC2);
            const updatedCBM2 = Math.floor(C2 * 100) / 100
            const totalCBM = updatedCBM1 + updatedCBM2

            var roundedString = totalCBM.toFixed(1);
            var rounded = Number(roundedString);
            setCBM(rounded);
        }
        else if (
            flavour1Details && flavour1.sku !== "-1"
            &&
            flavour2Details && flavour2.sku !== "-1"
            &&
            flavour3Details && flavour3.sku !== "-1"
        ) {
            const updatedC1 =
                flavour1.qty *
                (((flavour1Details.ctn_height + 1) *
                    (flavour1Details.ctn_length + 1) *
                    (flavour1Details.ctn_width + 1)) /
                    1000000000);


            setC1(updatedC1);
            const updatedCBM1 = Math.floor(C1 * 100) / 100

            const updatedC2 =
                flavour2.qty *
                (((flavour2Details.ctn_height + 1) *
                    (flavour2Details.ctn_length + 1) *
                    (flavour2Details.ctn_width + 1)) /
                    1000000000);


            setC2(updatedC2);
            const updatedCBM2 = Math.floor(C2 * 100) / 100

            const updatedC3 =
                flavour3.qty *
                (((flavour3Details.ctn_height + 1) *
                    (flavour3Details.ctn_length + 1) *
                    (flavour3Details.ctn_width + 1)) /
                    1000000000);


            setC3(updatedC3);
            const updatedCBM3 = Math.floor(C3 * 100) / 100
            console.log("updatedCBM1",updatedCBM1)
            console.log("updatedCBM2",updatedCBM2)
            console.log("updatedCBM3",updatedCBM3)

            const totalCBM = Math.floor((updatedCBM1 + updatedCBM2 + updatedCBM3) * 10) / 10
            console.log("totalCBM",totalCBM)
            var roundedString = totalCBM.toFixed(1);
            var rounded = Number(roundedString);
            setCBM(rounded);
        } else {
            setCBM(0);
        }
    }

        , [containerOrders]);

    return (
        <>
            {CBM != 0 ? (
                <>
                    <div className="container_summary_text fw-bold d-flex justify-content-center border border_radius_10px row my-1 px-3">
                        {`${CBM} CBM`}
                    </div>
                </>
            )
                :
                (
                    <>
                    </>
                )}
        </>
    );
};

export default Rumuscbm

const RumuscbmTruck = ({
    containerOrders,
    flavours,
    container
}) => {

    const [CBM, setCBM] = useState(0);
    const flavorLookup = flavours.reduce((lookup, flavor) => {
        lookup[flavor.product_code] = flavor;
        return lookup;
    }, {});

    const flavors = container.flavors || [];


    useEffect(() => {
        let totalCBM = 0;

        flavors.forEach((flavor, index) => {
            const flavorDetails = flavorLookup[flavor.sku];

            if (flavorDetails && flavor.sku !== "-1") {
                const updatedC = flavor.qty *
                    (((flavorDetails.ctn_height + 1) *
                        (flavorDetails.ctn_length + 1) *
                        (flavorDetails.ctn_width + 1)) /
                        1000000000);

                totalCBM += Math.floor(updatedC * 100) / 100;
            }
        });

        // Round and set the total CBM
        const roundedCBM = Math.floor(totalCBM * 10) / 10;
        setCBM(roundedCBM);
    }, [containerOrders, flavors, flavorLookup]);


    return (
        <>
            {CBM != 0 ? (
                <>
                    <div className="container_summary_text fw-bold d-flex justify-content-center border border_radius_10px row my-1 px-3">
                        {`${CBM} CBM`}
                    </div>
                </>
            )
                :
                (
                    <>
                    </>
                )}
        </>
    );
};

export { RumuscbmTruck }