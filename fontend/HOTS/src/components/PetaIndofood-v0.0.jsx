import React, { useState} from "react";
import "leaflet/dist/leaflet.css";
import icon from 'leaflet/dist/images/marker-icon.png';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, Pane } from "react-leaflet";
import { countries } from "./Map/geojson";
import L from "leaflet";
import { renderToString } from "react-dom/server";
import { FaMapMarker, FaAmazon } from "react-icons/fa";
import { Image } from "@chakra-ui/react";

import Axios from 'axios';
import { API_URL } from "../config";

function App() {

    let param = 1;
    const [coordinate, setCoordinate] = useState([])
    const getCoordinate = () => {
        Axios.get(API_URL + `/spectator/coordinate/${param}`, {
        })
            .then((res) => {
                setCoordinate(res.data);
                // console.log("test",coordinate);

            })
            .catch((err) => {
                console.log("GAGAL",err);
            });
    };

    React.useEffect(() => {
        getCoordinate();
    
      }, []);


    //   const specificCountries = coordinate.map((coord) => ({
    //     // Map coordinates to specificCountries format
    //     // Example: Assuming coordinates have a 'country' property
    //     country: coord.country,
    //     // Add other properties as needed
    // }));

    const newfeatures = countries.features;

    const specificCountries = [
        "Australia",
        "Bahrain",
        "Brunei Darussalam",
        "Cambodia",
        "Canada",
        "Cape Verde",
        "China",
        "Cook Islands",
        "Croatia",
        "Cyprus",
        "Fiji",
        "France",
        "French Polynesia",
        "Gabon",
        "Germany",
        "Grenada",
        "Guam",
        "Guinea",
        "Hong Kong",
        "Hungary",
        "India",
        "Iraq",
        "Italy",
        "Jamaica",
        "Japan",
        "Jordan",
        "Kenya",
        "Kiribati",
        "Kosovo",
        "Kuwait",
        "Liberia",
        "Malaysia",
        "Maldives",
        "Malta",
        "Mauritius",
        "Mayotte",
        "Mongolia",
        "Myanmar",
        "Namibia",
        "Nauru",
        "Netherlands",
        "New Caledonia",
        "New Zealand",
        "Oman",
        "Papua New Guinea",
        "Philippines",
        "Poland",
        "Qatar",
        "Samoa",
        "Saudi Arabia",
        "Senegal",
        "Sierra Leone",
        "Singapore",
        "Solomon Islands",
        "Somalia",
        "South Africa",
        "South Korea",
        "Spain",
        "Suriname",
        "Sweden",
        "Taiwan",
        "Timor-Leste",
        "Togo",
        "Tonga",
        "United Arab Emirates",
        "United Kingdom",
        "United States of America",
        "Vanuatu",
        "Vietnam",
        "Zambia",
        "Zimbabwe",
        "Afghanistan",
        "American Samoa",
        "Angola",
        "Bangladesh",
        "Brazil",
        "Djibouti",
        "Dominican Republic",
        "Gambia",
        "Ghana",
        "Guyana",
        "Haiti",
        "Indonesia",
        "Côte d'Ivoire",
        "Kazakhstan",
        "Madagascar",
        "Malawi",
        "Mali",
        "Mexico",
        "Nepal",
        "Peru",
        "Democratic Republic of the Congo",
        "Russia",
        "Republic of Serbia",
        "Seychelles",
        "South Sudan",
        "Sri Lanka",
        "Thailand",
        "Trinidad and Tobago",
        "Uzbekistan",
        "Yemen",
        "Palestine",
        "Sudan",
        "Lebanon",
        "Libya",
        'Egypt',
        'Turkey',
        "Norway",



    ]; // Add all the country names you want to keep

    const specificNotYetCountries = [
        "Pakistan",
        "Nigeria",
        "Ethiopia",
        "Republic of the Congo",
        "Guinea Bissau",
        "Ivory Coast",
        "Macedonia",
        "Bulgaria",
        "Montenegro",
        "Bosnia and Herzegovina",
        "Romania",
        "Uganda",
        'Morocco',
        'Tunisia',
        'Mauritania',
        "Rwanda",
        "United Republic of Tanzania",
        "Greenland",
        "Iran",
        "Colombia",
        "Argentina",
        "Algeria",
        "Ukraine",
        "Mozambique",
        "Venezuela",
        "Cameroon",
        "Niger",
        "North Korea",
        "Burkina Faso",
        "Syria",
        "Chile",
        "Chad",
        "Ecuador",
        "Guatemala",
        "Benin",
        "Burundi",
        "Bolivia",
        "Belgium",
        "Cuba",
        "Honduras",
        "Czech Republic",
        "Azerbaijan",
        "Greece",
        "Portugal",
        "Tajikistan",
        "Belarus",
        "Israel",
        "Austria",
        "Switzerland",
        "Laos",
        "Nicaragua",
        "Paraguay",
        "Kyrgyzstan",
        "Turkmenistan",
        "El Salvador",
        "Denmark",
        "Slovakia",
        "Central African Republic",
        "Finland",
        "Costa Rica",
        "Ireland",
        "Panama",
        "Eritrea",
        "Georgia",
        "Moldova",
        "Uruguay",
        "Puerto Rico",
        "Albania",
        "Armenia",
        "Lithuania",
        "Botswana",
        "Lesotho",
        "Guinea-Bissau",
        "Slovenia",
        "Latvia",
        "Equatorial Guinea",
        "Estonia",
        "Swaziland",
        "Comoros",
        "Bhutan",
        "Macau",
        "Luxembourg",
        "Western Sahara",
        "Micronesia",
        "Bahamas",
        "Belize",
        "Guadeloupe",
        "Iceland",
        "Martinique",
        "French Guiana",
        "Barbados",
        "São Tomé and Príncipe",
        "Saint Lucia",
        "Jersey",
        "Aruba",
        "Saint Vincent and the Grenadines",
    ];

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

    const markerPositions = [



        // Add more markers with names as needed

    ];

    const markerPositionIOD = [
        // { position: [-0.789275, 113.921327], name: "Indofood Local Store", email: " Indofood.com	", country: "Indonesia" },
        { position: [-25.274398, 133.775136], name: "William Ho	", email: "	william.ho@icbp.indofood.co.id	", country: "Australia" },
        { position: [25.930414, 50.637772], name: "Hendry Ang	", email: "marcus.gunawan@icbp.indofood.co.id	", country: "Bahrain" },
        { position: [4.535277, 114.727669], name: "Jennifer J	", email: "j.jennifer@icbp.indofood.co.id	", country: "Brunei Darussalam" },
        { position: [12.565679, 104.990963], name: "Yohanes Wijoyo	", email: "yohanes.wijoyo@icbp.indofood.co.id	", country: "Cambodia" },
        { position: [56.130366, -106.346771], name: "Eddy Soekor	", email: "IndofoodCanada@indofood.ca	", country: "Canada" },
        { position: [16.002082, -24.013197], name: "Widyawan Pradhana	", email: "widyawan.pradhana@icbp.co.id	", country: "Cape Verde" },
        { position: [35.86166, 104.195397], name: "Leoine Madeline	", email: "leoine.madeline@icbp.indofood.co.id	", country: "China" },
        { position: [-21.236736, -159.777671], name: "Yuan Surya	", email: "yuan.surya@icbp.indofood.co.id	", country: "Cook Islands" },
        { position: [45.1, 15.2], name: "Young Yu	", email: "young.yu@icbp.indofood.co.id	", country: "Croatia" },
        { position: [35.126413, 33.429859], name: "Young Yu	", email: "young.yu@icbp.indofood.co.id	", country: "Cyprus" },
        { position: [-16.578193, 179.414413], name: "Yuan Surya	", email: "yuan.surya@icbp.indofood.co.id	", country: "Fiji" },
        { position: [46.227638, 2.213749], name: "Young Yu	", email: "young.yu@icbp.indofood.co.id	", country: "France" },
        { position: [-17.679742, -149.406843], name: "Yuan Surya	", email: "yuan.surya@icbp.indofood.co.id	", country: "French Polynesia" },
        { position: [-0.803689, 11.609444], name: "Yuniwati	", email: "yuniwati@icbp.indofood.co.id	", country: "Gabon" },
        { position: [51.165691, 10.451526], name: "Young Yu	", email: "young.yu@icbp.indofood.co.id	", country: "Germany" },
        { position: [12.262776, -61.604171], name: "Marcus Gunawan	", email: "marcus.gunawan@icbp.indofood.co.id	", country: "Grenada" },
        { position: [13.444304, 144.793731], name: "Yuan Surya	", email: "yuan.surya@icbp.indofood.co.id	", country: "Guam" },
        { position: [9.945587, -9.696645], name: "Widyawan Pradhana	", email: "widyawan.pradhana@icbp.co.id	", country: "Guinea" },
        { position: [22.396428, 114.109497], name: "Wirawan Sarsito	", email: "wirawan.sarsito@icbp.indofood.co.id	", country: "Hong Kong" },
        { position: [47.162494, 19.503304], name: "Young Yu	", email: "young.yu@icbp.indofood.co.id	", country: "Hungary" },
        { position: [20.593684, 78.96288], name: "Mega Kartawira	", email: "mega.kartawira@icbp.indofood.co.id	", country: "India" },
        { position: [33.223191, 43.679291], name: "Hendry Ang	", email: "hendry.ang@indofood.co.id	", country: "Iraq" },
        { position: [41.87194, 12.56738], name: "Young Yu	", email: "young.yu@icbp.indofood.co.id	", country: "Italy" },
        { position: [18.109581, -77.297508], name: "Marcus Gunawan	", email: "marcus.gunawan@icbp.indofood.co.id	", country: "Jamaica" },
        { position: [36.204824, 138.252924], name: "Malvin Harsobisono	", email: "malvin.harsobisono@icbp.indofood.co.id	", country: "Japan" },
        { position: [30.585164, 36.238414], name: "Hendry Ang	", email: "hendry.ang@indofood.co.id	", country: "Jordan" },
        { position: [-0.023559, 37.906193], name: "Widyawan Pradhana	", email: "widyawan.pradhana@icbp.co.id	", country: "Kenya" },
        { position: [-3.370417, -168.734039], name: "Yuan Surya	", email: "yuan.surya@icbp.indofood.co.id	", country: "Kiribati" },
        { position: [42.602636, 20.902977], name: "Milica Vukovic	", email: "milica.vukovic@icbp.indofood.co.id	", country: "Kosovo" },
        { position: [29.31166, 47.481766], name: "Hendry Ang	", email: "marcus.gunawan@icbp.indofood.co.id	", country: "Kuwait" },
        { position: [6.428055, -9.429499], name: "Yuniwati	", email: "yuniwati@icbp.indofood.co.id	", country: "Liberia" },
        { position: [4.210484, 101.975766], name: "Yohanes Wijoyo	", email: "yohanes.wijoyo@icbp.indofood.co.id	", country: "Malaysia" },
        { position: [3.202778, 73.22068], name: "Erwin Djunaidi	", email: "erwin.djunaidi@indomilk.com 	", country: "Maldives" },
        { position: [35.937496, 14.375416], name: "Young Yu	", email: "young.yu@icbp.indofood.co.id	", country: "Malta" },
        { position: [-20.348404, 57.552152], name: "Yuniwati	", email: "yuniwati@icbp.indofood.co.id	", country: "Mauritius" },
        { position: [-12.8275, 45.166244], name: "Widyawan Pradhana	", email: "widyawan.pradhana@icbp.co.id	", country: "Mayotte" },
        { position: [46.862496, 103.846656], name: "Mega Kartawira	", email: "mega.kartawira@icbp.indofood.co.id	", country: "Mongolia" },
        { position: [21.913965, 95.956223], name: "Marcus Gunawan	", email: "marcus.gunawan@icbp.indofood.co.id	", country: "Myanmar" },
        { position: [-22.95764, 18.49041], name: "Yuniwati	", email: "yuniwati@icbp.indofood.co.id	", country: "Namibia" },
        { position: [-0.522778, 166.931503], name: "Yuan Surya	", email: "yuan.surya@icbp.indofood.co.id	", country: "Nauru" },
        { position: [52.132633, 5.291266], name: "Young Yu	", email: "young.yu@icbp.indofood.co.id	", country: "Netherlands" },
        { position: [-20.904305, 165.618042], name: "Yuan Surya	", email: "yuan.surya@icbp.indofood.co.id	", country: "New Caledonia" },
        { position: [-40.900557, 174.885971], name: "Irene Prasetio	", email: "irene.prasetio@icbp.indofood.co.id	", country: "New Zealand" },
        { position: [21.512583, 55.923255], name: "Hendry Ang	", email: "marcus.gunawan@icbp.indofood.co.id	", country: "Oman" },
        { position: [-6.314993, 143.95555], name: "Yuan Surya	", email: "yuan.surya@icbp.indofood.co.id	", country: "Papua New Guinea" },
        { position: [12.879721, 121.774017], name: "Yoga Adhisatya	", email: "filemon.adhisatya@icbp.indofood.co.id	", country: "Philippines" },
        { position: [51.919438, 19.145136], name: "Young Yu	", email: "young.yu@icbp.indofood.co.id	", country: "Poland" },
        { position: [25.354826, 51.183884], name: "Hendry Ang	", email: "marcus.gunawan@icbp.indofood.co.id	", country: "Qatar" },
        { position: [-13.759029, -172.104629], name: "Yuan Surya	", email: "yuan.surya@icbp.indofood.co.id	", country: "Samoa" },
        { position: [23.885942, 45.079162], name: "Hendry Ang	", email: "hendry.ang@indofood.co.id	", country: "Saudi Arabia" },
        { position: [14.497401, -14.452362], name: "Yuniwati	", email: "yuniwati@icbp.indofood.co.id	", country: "Senegal" },
        { position: [8.460555, -11.779889], name: "Widyawan Pradhana	", email: "widyawan.pradhana@icbp.co.id	", country: "Sierra Leone" },
        { position: [1.352083, 103.819836], name: "Malvin Harsobisono	", email: "malvin.harsobisono@icbp.indofood.co.id	", country: "Singapore" },
        { position: [-9.64571, 160.156194], name: "Yuan Surya	", email: "yuan.surya@icbp.indofood.co.id	", country: "Solomon Islands" },
        { position: [5.152149, 46.199616], name: "Yuniwati	", email: "yuniwati@icbp.indofood.co.id	", country: "Somalia" },
        { position: [-30.559482, 22.937506], name: "Widyawan Pradhana	", email: "widyawan.pradhana@icbp.co.id	", country: "South Africa" },
        { position: [35.907757, 127.766922], name: "Young Yu	", email: "young.yu@icbp.indofood.co.id	", country: "South Korea" },
        { position: [40.463667, -3.74922], name: "Young Yu	", email: "young.yu@icbp.indofood.co.id	", country: "Spain" },
        { position: [3.919305, -56.027783], name: "Marcus Gunawan	", email: "marcus.gunawan@icbp.indofood.co.id	", country: "Suriname" },
        { position: [60.128161, 18.643501], name: "Young Yu	", email: "young.yu@icbp.indofood.co.id	", country: "Sweden" },
        { position: [23.69781, 120.960515], name: "Jennifer J	", email: "j.jennifer@icbp.indofood.co.id	", country: "Taiwan" },
        { position: [-8.874217, 125.727539], name: "Harry Agussa	", email: "harry.agussa@icbp.indofood.co.id	", country: "Timor-Leste" },
        { position: [8.619543, 0.824782], name: "Widyawan Pradhana	", email: "widyawan.pradhana@icbp.co.id	", country: "Togo" },
        { position: [-21.178986, -175.198242], name: "Yuan Surya	", email: "yuan.surya@icbp.indofood.co.id	", country: "Tonga" },
        { position: [23.424076, 53.847818], name: "Hendry Ang	", email: "marcus.gunawan@icbp.indofood.co.id	", country: "United Arab Emirates" },
        { position: [55.378051, -3.435973], name: "Young Yu	", email: "young.yu@icbp.indofood.co.id	", country: "United Kingdom" },
        { position: [37.09024, -95.712891], name: "Harry Sutardji; Nugroho Iskandar; Irene Prasetio	", email: "indofoodusa@yahoo.com	", country: "United States" },
        { position: [-15.376706, 166.959158], name: "Yuan Surya	", email: "yuan.surya@icbp.indofood.co.id	", country: "Vanuatu" },
        { position: [14.058324, 108.277199], name: "Dio Alann Susanto	", email: "dio.susanto@icbp.indofood.co.id	", country: "Vietnam" },
        { position: [-13.133897, 27.849332], name: "Widyawan Pradhana	", email: "widyawan.pradhana@icbp.co.id	", country: "Zambia" },
        { position: [-19.015438, 29.154857], name: "Widyawan Pradhana	", email: "widyawan.pradhana@icbp.co.id	", country: "Zimbabwe" },
        { position: [33.93911, 67.709953], name: "Marcus Gunawan	", email: "marcus.gunawan@icbp.indofood.co.id	", country: "Afghanistan" },
        { position: [-14.270972, -170.132217], name: "Yuan Surya	", email: "yuan.surya@icbp.indofood.co.id	", country: "American Samoa" },
        { position: [-11.202692, 17.873887], name: "Widyawan Pradhana	", email: "widyawan.pradhana@icbp.co.id	", country: "Angola" },
        { position: [23.684994, 90.356331], name: "Marcus Gunawan	", email: "marcus.gunawan@icbp.indofood.co.id	", country: "Bangladesh" },
        { position: [-14.235004, -51.92528], name: "Marcus Gunawan	", email: "marcus.gunawan@icbp.indofood.co.id	", country: "Brazil" },
        { position: [11.825138, 42.590275], name: "Widyawan Pradhana	", email: "widyawan.pradhana@icbp.co.id	", country: "Djibouti" },
        { position: [18.735693, -70.162651], name: "Marcus Gunawan	", email: "marcus.gunawan@icbp.indofood.co.id	", country: "Dominican Republic" },
        { position: [13.443182, -15.310139], name: "Widyawan Pradhana	", email: "widyawan.pradhana@icbp.co.id	", country: "Gambia" },
        { position: [7.946527, -1.023194], name: "Yuniwati	", email: "yuniwati@icbp.indofood.co.id	", country: "Ghana" },
        { position: [4.860416, -58.93018], name: "Marcus Gunawan	", email: "marcus.gunawan@icbp.indofood.co.id	", country: "Guyana" },
        { position: [18.971187, -72.285215], name: "Marcus Gunawan	", email: "marcus.gunawan@icbp.indofood.co.id	", country: "Haiti" },
        { position: [7.539989, -5.54708], name: "Yuniwati	", email: "yuniwati@icbp.indofood.co.id	", country: "Côte d'Ivoire" },
        { position: [48.019573, 66.923684], name: "Malvin Harsobisono	", email: "malvin.harsobisono@icbp.indofood.co.id	", country: "Kazakhstan" },
        { position: [-18.766947, 46.869107], name: "Widyawan Pradhana	", email: "widyawan.pradhana@icbp.co.id	", country: "Madagascar" },
        { position: [-13.254308, 34.301525], name: "Yuniwati	", email: "yuniwati@icbp.indofood.co.id	", country: "Malawi" },
        { position: [17.570692, -3.996166], name: "Widyawan Pradhana	", email: "widyawan.pradhana@icbp.co.id	", country: "Mali" },
        { position: [23.634501, -102.552784], name: "Nugroho Iskandar	", email: "indofoodusa@yahoo.com	", country: "Mexico" },
        { position: [28.394857, 84.124008], name: "Marcus Gunawan	", email: "marcus.gunawan@icbp.indofood.co.id	", country: "Nepal" },
        { position: [-9.189967, -75.015152], name: "Marcus Gunawan	", email: "marcus.gunawan@icbp.indofood.co.id	", country: "Peru" },
        { position: [-4.038333, 21.758664], name: "Widyawan Pradhana	", email: "widyawan.pradhana@icbp.co.id	", country: "Democratic Republic of the Congo" },
        { position: [61.52401, 105.318756], name: "Mega Kartawira	", email: "mega.kartawira@icbp.indofood.co.id	", country: "Russia" },
        { position: [44.016521, 21.005859], name: "Young Yu	", email: "young.yu@icbp.indofood.co.id	", country: "Serbia" },
        { position: [-4.679574, 55.491977], name: "Widyawan Pradhana	", email: "widyawan.pradhana@icbp.co.id	", country: "Seychelles" },
        { position: [7.8626845, 29.6949232], name: "Yuniwati	", email: "yuniwati@icbp.indofood.co.id	", country: "South Sudan" },
        { position: [7.873054, 80.771797], name: "Marcus Gunawan	", email: "marcus.gunawan@icbp.indofood.co.id	", country: "Sri Lanka" },
        { position: [15.870032, 100.992541], name: "Marcus Gunawan	", email: "marcus.gunawan@icbp.indofood.co.id	", country: "Thailand" },
        { position: [10.691803, -61.222503], name: "Marcus Gunawan	", email: "marcus.gunawan@icbp.indofood.co.id	", country: "Trinidad and Tobago" },
        { position: [41.377491, 64.585262], name: "Malvin Harsobisono	", email: "malvin.harsobisono@icbp.indofood.co.id	", country: "Uzbekistan" },
        { position: [60.472024, 8.468946], name: "Young Yu	", email: "young.yu@icbp.indofood.co.id	", country: "Norway" },
        { position: [-21.115141, 55.536384], name: "Widyawan Pradhana	", email: "widyawan.pradhana@icbp.co.id	", country: "Reunion" },
        { position: [26.3351, 17.228331], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Libya" },
        { position: [26.820553, 30.802498], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Egypt" },
        { position: [12.862807, 30.217636], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Sudan" },

    ];

    const markerPositions2 = [

        { position: [15.552727, 48.516388], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Yemen" },
        { position: [31.952162, 35.233154], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Palestine" },
        { position: [33.854721, 35.862285], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Lebanon" },
        { position: [38.963745, 35.243322], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Turkey" },
        { position: [31.791702, -7.09262], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Morocco" },
        { position: [33.886917, 9.537499], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Tunisia" },
        { position: [21.00789, -10.940835], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Mauritania" },
        { position: [41.608635, 21.745275], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "North Macedonia" },
        { position: [45.943161, 24.96676], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Romania" },
        { position: [43.915886, 17.679076], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Bosnia and Herzegovina" },
        { position: [42.733883, 25.48583], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Bulgaria" },
        { position: [42.708678, 19.37439], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Montenegro" },
        { position: [1.373333, 32.290275], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Uganda" },
        { position: [-1.940278, 29.873888], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Rwanda" },
        { position: [-6.369028, 34.888822], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Tanzania" },
        { position: [30.375321, 69.345116], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Pakistan" },
        { position: [9.081999, 8.675277], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Nigeria" },
        { position: [9.145, 40.489673], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Ethiopia" },
        { position: [-0.228021, 15.827659], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Congo" },
        { position: [32.427908, 53.688046], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Iran" },
        { position: [4.570868, -74.297333], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Colombia" },
        { position: [-38.416097, -63.616672], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Argentina" },
        { position: [28.033886, 1.659626], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Algeria" },
        { position: [48.379433, 31.16558], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Ukraine" },
        { position: [-18.665695, 35.529562], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Mozambique" },
        { position: [6.42375, -66.58973], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Venezuela" },
        { position: [7.369722, 12.354722], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Cameroon" },
        { position: [17.607789, 8.081666], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Niger" },
        { position: [40.339852, 127.510093], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "North Korea" },
        { position: [12.238333, -1.561593], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Burkina Faso" },
        { position: [34.802075, 38.996815], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Syria" },
        { position: [-35.675147, -71.542969], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Chile" },
        { position: [15.454166, 18.732207], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Chad" },
        { position: [-1.831239, -78.183406], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Ecuador" },
        { position: [15.783471, -90.230759], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Guatemala" },
        { position: [9.30769, 2.315834], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Benin" },
        { position: [-3.373056, 29.918886], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Burundi" },
        { position: [-16.290154, -63.588653], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Bolivia" },
        { position: [50.503887, 4.469936], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Belgium" },
        { position: [21.521757, -77.781167], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Cuba" },
        { position: [15.199999, -86.241905], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Honduras" },
        { position: [49.817492, 15.472962], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Czech Republic" },
        { position: [40.143105, 47.576927], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Azerbaijan" },
        { position: [39.074208, 21.824312], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Greece" },
        { position: [39.399872, -8.224454], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Portugal" },
        { position: [38.861034, 71.276093], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Tajikistan" },
        { position: [53.709807, 27.953389], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Belarus" },
        { position: [31.046051, 34.851612], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Israel" },
        { position: [47.516231, 14.550072], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Austria" },
        { position: [46.818188, 8.227512], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Switzerland" },
        { position: [19.85627, 102.495496], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Laos" },
        { position: [12.865416, -85.207229], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Nicaragua" },
        { position: [-23.442503, -58.443832], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Paraguay" },
        { position: [41.20438, 74.766098], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Kyrgyzstan" },
        { position: [38.969719, 59.556278], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Turkmenistan" },
        { position: [13.794185, -88.89653], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "El Salvador" },
        { position: [56.26392, 9.501785], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Denmark" },
        { position: [48.669026, 19.699024], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Slovakia" },
        { position: [6.611111, 20.939444], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Central African Republic" },
        { position: [61.92411, 25.748151], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Finland" },
        { position: [9.748917, -83.753428], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Costa Rica" },
        { position: [53.41291, -8.24389], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Ireland" },
        { position: [8.537981, -80.782127], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Panama" },
        { position: [15.179384, 39.782334], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Eritrea" },
        { position: [42.315407, 43.356892], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Georgia" },
        { position: [47.411631, 28.369885], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Moldova" },
        { position: [-32.522779, -55.765835], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Uruguay" },
        { position: [18.220833, -66.590149], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Puerto Rico" },
        { position: [41.153332, 20.168331], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Albania" },
        { position: [40.069099, 45.038189], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Armenia" },
        { position: [55.169438, 23.881275], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Lithuania" },
        { position: [-22.328474, 24.684866], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Botswana" },
        { position: [-29.609988, 28.233608], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Lesotho" },
        { position: [11.803749, -15.180413], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Guinea-Bissau" },
        { position: [46.151241, 14.995463], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Slovenia" },
        { position: [56.879635, 24.603189], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Latvia" },
        { position: [1.650801, 10.267895], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Equatorial Guinea" },
        { position: [58.595272, 25.013607], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Estonia" },
        { position: [-26.522503, 31.465866], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Swaziland" },
        { position: [-11.875001, 43.872219], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Comoros" },
        { position: [27.514162, 90.433601], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Bhutan" },
        { position: [22.198745, 113.543873], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Macau" },
        { position: [49.815273, 6.129583], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Luxembourg" },
        { position: [24.215527, -12.885834], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Western Sahara" },
        { position: [7.425554, 150.550812], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Micronesia" },
        { position: [25.03428, -77.39628], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Bahamas" },
        { position: [17.189877, -88.49765], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Belize" },
        { position: [16.995971, -62.067641], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Guadeloupe" },
        { position: [64.963051, -19.020835], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Iceland" },
        { position: [14.641528, -61.024174], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Martinique" },
        { position: [3.933889, -53.125782], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "French Guiana" },
        { position: [13.193887, -59.543198], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Barbados" },
        { position: [0.18636, 6.613081], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "São Tomé and Príncipe" },
        { position: [13.909444, -60.978893], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Saint Lucia" },
        { position: [49.214439, -2.13125], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Jersey" },
        { position: [12.52111, -69.968338], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Aruba" },
        { position: [12.984305, -61.287228], name: "Indofood International	", email: "International@icbp.indofood.co.id	", country: "Saint Vincent and the Grenadines" },



    ];

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
        <div className="App px-0 px-md-5 mx-0 mx-md-5 rounded my-5 vh-100 ">
            <div className="px-1 px-md-5 h-100">
                <div className="d-flex justify-content-center h-100">
                    <MapContainer className="rounded" center={[0.7893, 10.9213]}
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




                </div>
            </div>
        </div>
    );
}

export default App;
