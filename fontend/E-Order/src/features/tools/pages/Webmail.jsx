import { Button, Spinner } from "@chakra-ui/react";
import { useEffect, useState } from "react";

function Webmail() {

    const [loading, setLoading] = useState(true);

    const handleRedirect = () => {
        window.location.href = "https://www.indomindanao.com/webmail";
    };

    useEffect(() => {
        handleRedirect();
    }, [])

    return (

        <div className="vh-100 vw-100 d-flex justify-content-center align-items-center">
            {loading ?
                <Spinner
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="gray.200"
                    color="blue.500"
                    size="xl"
                />
                :
                <div className="d-flex justify-content-center align-items-center flex-column">
                    <div>
                        <span>
                            Ups! Something went wrong, maybe your link is expired or doesn&apos;t exist.
                        </span>
                    </div>
                    <div className="mt-4">
                        <Button
                            onClick={() => {
                                window.location.href = "/";
                            }}
                            colorScheme="orange"
                        >
                            Go Back
                        </Button>
                    </div>
                </div>
            }
        </div>

    )
}

export default Webmail




