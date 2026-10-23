import { Select } from "@chakra-ui/react"

function LimiterComponent({
    limit,
    setLimit,

}) {
    return (
        <div className="col-12  py-1  mt-2">
            <div className="container">
                <div className="row  text-primary ">
                    <div className="row d-flex justify-content-end">
                        <div className="col px-0 d-flex text-secondary align-items-center justify-content-end pe-2">
                            Show by
                        </div>
                        <div className="col px-0 d-flex text-secondary">

                            <Select value={limit}
                                size="sm"
                                onChange={(e) => setLimit(e.target.value)}
                            >
                                <option value="10">
                                    10
                                </option>
                                <option value="25">
                                    25
                                </option>
                                <option value="100">
                                    100
                                </option>
                                <option value="100">
                                    500
                                </option>
                                <option value="100">
                                    1000
                                </option>

                            </Select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default LimiterComponent