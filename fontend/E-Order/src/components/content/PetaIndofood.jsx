import React, { useState } from "react";
import "leaflet/dist/leaflet.css";
import icon from 'leaflet/dist/images/marker-icon.png';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, Pane } from "react-leaflet";
import { countries } from "../media/Map/geojson";
import L from "leaflet";
import { renderToString } from "react-dom/server";
import { FaMapMarker, FaAmazon } from "react-icons/fa";
import { Image } from "@chakra-ui/react";
import { Spinner } from "@chakra-ui/react";
import Axios from 'axios';
import { API_URL } from "../../config";

function App() {

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


    const newfeatures = countries.features;

    const specificCountriesset = coordinate
        .filter(coord => (coord.category === 'PCL' || coord.category === 'IOD') && coord.rm_email != '')
        .map((coord) => ({
            country: coord.country_desc,
        }));


    const formattedStringspecificCountriesset =
        specificCountriesset.map((item) => `${item.country}`).join(", ");
    const specificCountries = formattedStringspecificCountriesset.split(', ');
    const specificNotYetCountriesset = coordinate
        .filter(coord => coord.category === 'Target Country' && coord.longitude != '')
        .map((coord) => ({
            country: coord.country_desc,
        }));
    const formattedStringspecificNotYetCountriesset =
        specificNotYetCountriesset
            .map((item) => `${item.country}`).join(", ");
    const specificNotYetCountries = formattedStringspecificNotYetCountriesset.split(', ');


    const oldcountries = {
        type: countries.type,
        features: newfeatures.filter((feature) =>
            specificCountries.includes(feature.properties.name)
        )
    };

    const newcountries = {
        type: countries.type,
        features: newfeatures.filter((feature) =>
            specificNotYetCountries.includes(feature.properties.name)
        )
    };

    const handleMouseOver = (e) => {
        const layer = e.target;
        layer.setStyle({ fillColor: 'red', weight: 0.6 });
    };

    const handleMouseOut = (e) => {
        const layer = e.target;
        layer.setStyle({ fillColor: 'yellow', weight: 0.1 });
    };

    const geoJSONStyle = {
        fillColor: 'yellow', // Fill color for polygons
        color: 'red',      // Outline color for polygons
        weight: 0.1,         // Outline thickness
        opacity: 0.4,        // Outline opacity
        fillOpacity: 0.2   // Fill opacity
    };

    const geoJSONStyle2 = {
        // Your custom style for the second set of markers
        fillColor: 'grey',
        color: 'yellow',
        weight: 0.1,
        opacity: 0.1,
        fillOpacity: 0.3,
    };

    const customMarkerPane = "customMarkerPane";

    const markerPositions = coordinate
        .filter(coord => coord.category === 'xx')
        .map((coord) => ({
            position: { lat: coord.latitude, lng: coord.longitude },
            name: coord.rm_name,
            email: coord.rm_email,
            country: coord.country_desc,

        }));


    const markerPositionIOD = coordinate
        .filter(coord =>
            (coord.category === 'PCL' || coord.category === 'IOD' && coord.latitude != null)
            
            
        )
        .map((coord) => ({
            position: { lat: coord.latitude, lng: coord.longitude },
            name: coord.rm_name,
            email: coord.rm_email,
            country: coord.country_desc,

        }));

    const markerPositions2 = coordinate
        .filter(coord => coord.category === 'Target Country' && coord.longitude != "")
        .map((coord) => ({
            position: { lat: coord.latitude, lng: coord.longitude },
            name: coord.rm_name,
            email: coord.rm_email,
            country: coord.country_desc,

        }));


    const customIcon =
        L.
            divIcon({
                className: "text-primary leaflet-icon",
                html: renderToString(<FaMapMarker />), // Use renderToString to convert React component to HTML
            });

    const customIcon2 =
        L.
            divIcon({
                className: "text-secondary leaflet-icon custom-icon-size",
                html: renderToString(<FaMapMarker />), // Use renderToString to convert React component to HTML
            });

    const customIconBlue =
        L.
            divIcon({
                className: "text-danger leaflet-icon",
                html: renderToString(<FaMapMarker />), // Use renderToString to convert React component to HTML
            });

    return (
        <div className="App px-0 px-md-5 mx-0 mx-md-5 rounded mt-5 vh-100 ">
            <div className="px-1 px-md-5 h-100">
                <div className="d-flex justify-content-center h-100">





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
                            <MapContainer className="rounded petaindofood" center={[0.7893, 10.9213]}
                                minZoom={2}
                                zoom={3}
                                maxZoom={6}


                                id="mapid"
                                maxBounds={[
                                    [-90, -180], // Southwest corner of the world
                                    [90, 180],   // Northeast corner of the world
                                ]}
                            >
                                <TileLayer
                                    attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                {markerPositions.map((marker, index) => (
                                    <Marker
                                        key={index}
                                        position={marker.position}
                                        icon={customIcon}
                                    >
                                        <Popup>
                                            <div className="px-0 " >
                                                <div className="px-0 text-start fs-5 fw-bold row">
                                                    <div className="col-1 d-flex align-items-center">
                                                        <Image
                                                            src={"/image/CountryFlag/" + marker.country + ".png"} // Adjust the image source path as needed
                                                            width="24px"
                                                            borderRadius="full"
                                                            className=" position-absolute"
                                                            fallbackSrc="/image/emptyplate.PNG"
                                                        />
                                                    </div>
                                                    <div className="col-10 ps-3">{marker.country}</div>

                                                </div>
                                                <div className="border-top pt-1 fw-bold">{marker.name}</div>
                                                <div className="">{marker.email}</div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}

                                {markerPositionIOD.map((marker, index) => (
                                    <Marker key={index} position={marker.position} icon={customIconBlue}>
                                        <Popup>
                                            <div className="px-0">
                                                <div className="px-0 text-start fs-5 fw-bold row">
                                                    <div className="col-1 d-flex align-items-center">
                                                        <Image
                                                            src={`/image/CountryFlag/${marker.country}.png`}
                                                            width="24px"
                                                            borderRadius="full"
                                                            className="position-absolute"
                                                            fallbackSrc="/image/emptyplate.PNG"
                                                        />
                                                    </div>
                                                    <div className="col-10 ps-3">{marker.country}</div>
                                                </div>
                                                <div className="border-top pt-1 fw-bold">{marker.name}</div>
                                                <div className="">{marker.email}</div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}

                                {markerPositions2.map((marker, index) => (
                                    <Marker key={index} position={marker.position} icon={customIcon2} >
                                        <Popup>
                                            <div className="px-0">
                                                <div className="px-0 text-start fs-5 fw-bold row">
                                                    <div className="col-1 d-flex align-items-center">
                                                        <Image
                                                            src={`/image/CountryFlag/${marker.country}.png`}
                                                            width="24px"
                                                            borderRadius="full"
                                                            className="position-absolute"
                                                        />
                                                    </div>
                                                    <div className="col-10 ps-3">{marker.country}</div>
                                                </div>
                                                <div className="border-top pt-1 fw-bold">{marker.name}</div>
                                                <div className="">{marker.email}</div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}


                                <GeoJSON
                                    key="my-geojson"
                                    data={oldcountries}
                                    style={geoJSONStyle}
                                    onEachFeature={(feature, layer) => {
                                        layer.on({
                                            mouseover: handleMouseOver,
                                            mouseout: handleMouseOut,
                                        });
                                    }}
                                />

                                <GeoJSON
                                    key="my-geojson2"
                                    data={newcountries}
                                    style={geoJSONStyle2}
                                    onEachFeature={(feature, layer) => {

                                    }}
                                />

                            </MapContainer>
                        </>
                    )}






                </div>
            </div>
        </div>
    );
}

export default App;






