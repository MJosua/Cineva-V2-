import React, { useState } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, Pane } from "react-leaflet";
import { countries } from "../Map/geojson";
import L from "leaflet";
import { renderToString } from "react-dom/server";
import { Image } from "@chakra-ui/react";
import { Spinner } from "@chakra-ui/react";
import Axios from 'axios';
import { API_URL } from "../../config";
function OrderVolumeByCountryComponent({ userToken, seasonOut, formatNumberWithDots, optiontype, week, datetype }) {
    function truncateText(text, maxLength) {
        // Split the text into words
        const words = text.split(' ');

        // Initialize an empty string to store the truncated text
        let truncatedText = '';

        // Loop through each word
        for (const word of words) {
            // Check if adding the current word will exceed the maxLength
            if ((truncatedText + word).length > maxLength) {
                break; // Stop if adding the current word exceeds maxLength
            }

            // Add the word to the truncatedText
            truncatedText += word + ' ';

            // If adding this word exceeds maxLength, don't include it and break
            if (truncatedText.length > maxLength) {
                truncatedText = truncatedText.trim();
                break;
            }
        }

        return truncatedText.trim();
    }
    const [loading, setLoading] = React.useState(true);
    let param = " ";
    const [coordinate, setCoordinate] = useState([])
    const getCoordinate = () => {
        Axios.get(API_URL + `/spectator/coordinate/ALL`, {
        })
            .then((res) => {
                setCoordinate(res.data);
                setLoading(false);
                // console.log(res.data);
            })
            .catch((err) => {
            });
    };
    React.useEffect(() => {
        getCoordinate();
    }, []);
    const [topcountry, setTopcountry] = useState([])
    const getTopcountry = () => {
        Axios.get(API_URL + `/spectator/top-country/${optiontype}?upto=10`, {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        })
            .then((res) => {
                setTopcountry(res.data);
                // console.log("topCountry", res.data);
                setLoading(false);
            })
            .catch((err) => {
            });
    };
    React.useEffect(() => {
        getCoordinate();
        getTopcountry();
    }, [optiontype]);


    const newfeatures = countries.features;


    const specificCountriesset = coordinate
        .filter(coord => (coord.category === 'PCL' || coord.category === 'IOD') && coord.rm_email != '')
        .map((coord) => ({
            country: coord.country_desc,
        }));


    const formattedStringspecificCountriesset =
        specificCountriesset.map((item) => `${item.country}`).join(", ");

    const specificCountries = formattedStringspecificCountriesset.split(', ');


    const oldcountries = {
        type: countries.type,
        features: newfeatures.filter((feature) =>
            specificCountries.includes(feature.properties.name)
        )
    };

    const specificNotYetCountriesset = coordinate
        .filter(coord => coord.category === 'Target Country' && coord.longitude != '')
        .map((coord) => ({
            country: coord.country_desc,
        }));

    const formattedStringspecificNotYetCountriesset =
        specificNotYetCountriesset
            .map((item) => `${item.country}`).join(", ");
    const specificNotYetCountries = formattedStringspecificNotYetCountriesset.split(', ');



    const newcountries = {
        type: countries.type,
        features: newfeatures.filter((feature) =>
            specificNotYetCountries.includes(feature.properties.name)
        )
    };

    const topCountriesset = coordinate
        .filter(
            coord => coord.length > 2
                &&
                coord.rm_email !== ''
        )
        .map(coord => ({
            country: coord.country_desc
        }));

    const formattedStringTopCountriesset =
        topCountriesset.map((item) => `${item.country}`).join(", ");

    const TopCountries = formattedStringTopCountriesset.split(', ');


    const Topcountries = {
        type: countries.type,
        features: newfeatures.filter((feature) =>
            TopCountries.includes(feature.properties.name)
        )
    };

    const top2Countriesset = coordinate
        .filter(
            coord => coord.length > 4
            &&
                coord.rm_email !== ''
        )
        .map(coord => ({
            country: coord.country_desc
        }));

    const formattedStringTop2Countriesset =
        top2Countriesset.map((item) => `${item.country}`).join(", ");

    const Top2Countries = formattedStringTop2Countriesset.split(', ');


    const Top2countries = {
        type: countries.type,
        features: newfeatures.filter((feature) =>
            Top2Countries.includes(feature.properties.name)
        )
    };

    const top3Countriesset = coordinate
        .filter(
            coord => coord.length > 8
            &&
                coord.rm_email !== ''
        )
        .map(coord => ({
            country: coord.country_desc
        }));

    const formattedStringTop3Countriesset =
        top3Countriesset.map((item) => `${item.country}`).join(", ");

    const Top3Countries = formattedStringTop3Countriesset.split(', ');


    const Top3countries = {
        type: countries.type,
        features: newfeatures.filter((feature) =>
            Top3Countries.includes(feature.properties.name)
        )
    };



    const geoJSONStyle = {
        fillColor: "#C8D9FF", // Fill color for polygons
        color: 'white',       // Outline color for polygons
        weight: 0.6,          // Outline thickness
        opacity: 0.8,         // Outline opacity
        fillOpacity: 1     // Fill opacity
    };

    const geoJSONStyle2 = {
        // Your custom style for the second set of markers
        fillColor: '#153884',
        color: 'white',
        weight: 0.5,
        opacity: 0.8,
        fillOpacity: 1,
    };

    const geoJSONStyle3 = {
        // Your custom style for the second set of markers
        fillColor: '#2251AF',
        color: 'white',
        weight: 0.5,
        opacity: 0.8,
        fillOpacity: 0.5,
    };

    const geoJSONStyle4 = {
        // Your custom style for the second set of markers
        fillColor: '#6992EC',
        color: 'white',
        weight: 0.8,
        opacity: 0.8,
        fillOpacity: 0.3,
    };

    const geoJSONStyle0 = {
        // Your custom style for the second set of markers
        fillColor: '#DDDDDD',
        color: 'white',
        weight: 0.3,
        opacity: 1,
        fillOpacity: 1,
    };
    
    return (
        <div className="container-fluid px-0">
            <div className="card border_radius_10px shadow-sm">
                <div className="row px-2 ">
                    <div className="col-7 mb-2 d-flex align-items-center">
                        <div className="card border_radius_10px shadow-inset py-1 px-1 d-flex justify-content-center" style={{ width: "100%", height: "180px", }}>
                            {loading ? (
                                <>
                                    <div className=" pt-5 pb-5 m-5 p-5 d-flex justify-content-center align-items-center row pt-5">
                                        <Spinner
                                            className="d-flex justify-content-center "
                                            thickness="10px"
                                            speed="0.65s"
                                            emptyColor="gray.200"
                                            color="blue.500"
                                            size="xl"
                                            spacing={4}
                                        />

                                    </div>
                                </>
                            ) : (
                                <>
                                    <MapContainer

                                        className="rounded border_radius_10px d-flex justify-content-center d-flex petadireporting" center={[45.7893, 10.9213]}
                                        minZoom={0}
                                        zoom={0}
                                        maxZoom={0}
                                        dragging={false}
                                        zoomControl={false}
                                        style={{ backgroundColor: "white" }}
                                        id="mapid_small"
                                        maxBounds={[
                                            [-90, -180], // Southwest corner of the world
                                            [90, 180],   // Northeast corner of the world
                                        ]}
                                    >
                                        <TileLayer
                                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                                            url="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN8+g8AAmsB5o9JN0AAAAASUVORK5CYII="
                                            className="black-and-white-tiles"
                                        />


                                        <GeoJSON
                                            key="my-geojson"
                                            data={oldcountries}
                                            style={geoJSONStyle}
                                        />



                                        <GeoJSON
                                            key="my-geojson2"
                                            data={newcountries}
                                            style={geoJSONStyle0}
                                        />

                                        <GeoJSON
                                            key="top"
                                            data={Topcountries}
                                            style={geoJSONStyle2}
                                        />

                                        <GeoJSON
                                            key="top2"
                                            data={Top3countries}
                                            style={geoJSONStyle3}
                                        />

                                        <GeoJSON
                                            key="top3"
                                            data={Top2countries}
                                            style={geoJSONStyle4}
                                        />

                                    </MapContainer>
                                </>
                            )}



                        </div>
                    </div>

                    <div className="col-5 px-0 pt-1  ">
                        <table className="table grey_text" style={{ fontSize: "10px" }}>
                            <tr >
                                <th className="text-start">
                                    No
                                </th>
                                <th className="text-start">
                                    Country
                                </th>
                                <th className="text-start">
                                    Volume
                                </th>
                            </tr>

                            {topcountry.map((dist, idx) => (

                                <tr key={idx} style={{ fontSize: "10px" }} className="text-start text-dark">
                                    <td>
                                        {idx + 1}
                                    </td>
                                    <td>{dist.country_name}</td>
                                    <td className="text-start">
                                        {formatNumberWithDots(dist.sales)}
                                    </td>
                                </tr>



                            )
                            )}
                        </table>

                    </div>
                </div>
            </div>

        </div >
    )
}

export default OrderVolumeByCountryComponent