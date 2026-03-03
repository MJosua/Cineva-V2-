import { Button } from "@chakra-ui/react";

function CsvOrder() {
    return (
        <div className="row ">


            {/* =============================================step1========================================= */}
            <div className="col-4">
                <div className="row">
                    <div className="col-12 fw-bold d-flex justify-content-start">
                        Step 1 *
                    </div>
                    <div className="col-12 fw-bold d-flex justify-content-start">
                        Download Template
                    </div>
                    <div className="col-12 fw-bold d-flex justify-content-start mb-3">
                        <Button
                            size="sm"
                            colorScheme="green"
                            width="150px"

                        >
                            Download

                        </Button>
                    </div>
                </div>
            </div>


            {/* =============================================step2========================================= */}
            <div className="col-4">
                <div className="row">
                    <div className="col-12 fw-bold d-flex justify-content-start">
                        Step 2 *
                    </div>
                    <div className="col-12 fw-bold d-flex justify-content-start">
                        Upload CSV/Excel
                    </div>
                    <div className="col-12 fw-bold d-flex justify-content-start mb-3">
                        <Button
                            size="sm"
                            colorScheme="yellow"
                            width="150px"
                        >
                            Upload

                        </Button>
                    </div>

                </div>
            </div>

            {/* =============================================step3========================================= */}
            <div className="col-4">
                <div className="row">
                    <div className="col-12 fw-bold d-flex justify-content-start">
                        Step 3 *
                    </div>
                    <div className="col-12 fw-bold d-flex justify-content-start">
                        Generate Table
                    </div>
                    <div className="col-12 fw-bold d-flex justify-content-start mb-3">
                        <Button
                            size="sm"
                            colorScheme="blue"
                            width="150px"
                        >
                            Generate

                        </Button>
                    </div>
                </div>
            </div>

            <div className="col-12">

                <hr>
                </hr>

            </div>

            <div className="col-12 table-fixed w-100">
                <div className="table table-bordered table-stripped">
                    <thead>
                        <tr>
                            <th>
                                No
                            </th>
                            <th>
                                PO Buyer
                            </th>
                            <th>
                                Port
                            </th>
                            <th>
                                Ship to Party
                            </th>
                            <th>
                                Container Size
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                1
                            </td>
                            <td>
                                IPOH25562
                            </td>
                            <td>
                                ZuhayLiYey
                            </td>
                            <td>
                                ZuhayLiYey StP
                            </td>
                        </tr>
                    </tbody>
                </div>
            </div>

        </div>
    )
}

export default CsvOrder;




