import React from 'react';
import { useLocation } from "react-router-dom"


function Proforma_invoice() {
    const location = useLocation();
    const meta = {
        title: `${location.pathname} page Indofood`,
        description: `Page of ${location.pathname} from Indofood`,
        canonical: `https://www.indofoodinternational.com/e-order${location.pathname}`,
        meta: {
          charset: 'utf-8',
          name: {
            keywords: 'react,meta,document,html,tags'
          }
        }
      };
    return (


        <div style={{ width: "100vw", paddingLeft: "130px", paddingRight: "130px", fontFamily: 'Space Mono' }}>
            <div style={{ width: "50%", float: "left", textAlign: "start" }} >
                Logo1
            </div>
            <div style={{ width: "50%", float: "left", textAlign: "end" }} >
                Logo2
            </div>
            <div style={{ width: "100%", textAlign: "center" }}>
                Proforma Invoice
            </div>
            <div style={{ width: "50%", float: "left" }}>

                <table>
                    <tr>
                        <th style={{ textAlign: "start", width: "25%" }}>Consignes</th>
                        <th>:</th>
                        <th style={{ textAlign: "start", width: "25%" }}>Isi</th>


                    </tr>

                    <tr>
                        <th style={{ textAlign: "start", width: "25%" }}>Notify Party 1st</th>
                        <th>:</th>
                        <th style={{ textAlign: "start", width: "25%" }}>Isi</th>


                    </tr>

                    <tr>
                        <th style={{ textAlign: "start", width: "25%" }}>Notify Party 2nd</th>
                        <th>:</th>
                        <th style={{ textAlign: "start", width: "25%" }}>Isi</th>


                    </tr>

                    <tr>
                        <th style={{ textAlign: "start", width: "25%" }}>Port of Shipment</th>
                        <th>:</th>
                        <th style={{ textAlign: "start", width: "25%" }}>Isi</th>


                    </tr>

                    <tr>
                        <th style={{ textAlign: "start", width: "25%" }}>Port of Discharge</th>
                        <th>:</th>
                        <th style={{ textAlign: "start", width: "25%" }}>Isi</th>


                    </tr>

                    <tr>
                        <th style={{ textAlign: "start", width: "25%" }}>Final Destination</th>
                        <th>:</th>
                        <th style={{ textAlign: "start", width: "25%" }}>Isi</th>


                    </tr>

                </table>

            </div>

            <div style={{ width: "50%", float: "left" }}>

                <table>


                    <tr>
                        <th style={{ textAlign: "start", width: "25%" }}>Date</th>
                        <th>:</th>
                        <th style={{ textAlign: "start", width: "25%" }}>Isi</th>

                    </tr>

                    <tr>
                        <th style={{ textAlign: "start", width: "25%" }}>Proforma Inv No.</th>
                        <th>:</th>
                        <th style={{ textAlign: "start", width: "25%" }}>Isi</th>

                    </tr>

                    <tr>
                        <th style={{ textAlign: "start", width: "25%" }}>Bill to Party.</th>
                        <th>:</th>
                        <th style={{ textAlign: "start", width: "25%" }}>Isi</th>

                    </tr>

                    
                    <tr>
                        <th style={{ textAlign: "start", width: "25%" }}>Buyer's Order No.</th>
                        <th>:</th>
                        <th style={{ textAlign: "start", width: "25%" }}>Isi</th>

                    </tr>

                    
                    <tr>
                        <th style={{ textAlign: "start", width: "25%" }}>Term of Payment</th>
                        <th>:</th>
                        <th style={{ textAlign: "start", width: "25%" }}>Isi</th>

                    </tr>

                    <tr>
                        <th style={{ textAlign: "start", width: "25%" }}>Tentative</th>
                        <th>:</th>
                        <th style={{ textAlign: "start", width: "25%" }}>Isi</th>

                    </tr>


                </table>

            </div>

        </div>


    )
}

export default Proforma_invoice