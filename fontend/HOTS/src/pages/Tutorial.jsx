import { useNavigate } from "react-router-dom"
import { useLocation } from "react-router-dom"
import {
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Box
} from '@chakra-ui/react'


import Sidebar from "../components/Sidebar";


function Tutorial() {
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
    const navigate = useNavigate();
    const data = [
        {
            judul: "1. Login to e-order", judulvideo: "e-order - Login to e-order.mp4",
            isi: "https://drive.google.com/file/d/1UDVHb7HNhJ3uWNHFKnxnkST3WNw27Jii/preview",
        },
        {
            judul: "2. How to Place an Order", judulvideo: "e-order - How to Place an Order.mp4",
            isi: "https://drive.google.com/file/d/1fg8XYFn4mvnsL_lhOvtbXa30-0jfShXi/preview",
        },
        { judul: "3. Forgot Password", judulvideo: "e-order - Forget Password.mp4", 
        isi: "https://drive.google.com/file/d/1byCaFwjjaOHOFwkMxoSkxo8xnEAiUNbQ/preview", },


    ];
    const sortedData = data.sort((a, b) => {
        const judulA = a.judul.toLowerCase().trim();
        const judulB = b.judul.toLowerCase().trim();
        if (judulA < judulB) return -1;
        if (judulA > judulB) return 1;
        return 0;
    });
    return (
        <div>
            {/* navbar */}

            <div>
                <div className="py-5 mt-2 stick-left">
                    <div className="row">
                        <div className="col-6 col-sm-12"></div>
                        <div className="col-6 col-sm-12">
                              <Sidebar />
                        </div>
                    </div>
                </div>

                <div className="py-5 w-100">
                    {/* CONTENT BELOW */}

                    <div className=" col-md-11 col-12 mt-3 padding_start_custom ">
                        <div className="pb-5 pt-4 ">
                            <div>
                                <div className="row user-select-none">

                                    <div className="col-12 text-secondary d-flex  pt-1 ps-4 ps-md-0">
                                        <span
                                            onClick={() => navigate("/e-order/dashboard")}
                                            className="pointer grey_text_normal_20px">
                                            e-order /&nbsp;
                                        </span>
                                        <span
                                            onClick={() => navigate("/e-order/help")}
                                            className="pointer grey_text_normal_20px">
                                            Help
                                        </span>
                                        <span className="grey_text_20px">
                                            &nbsp;/ Tutorial
                                        </span>
                                    </div>
                                </div>
                                <div className="row pt-4 ps-4">
                                    <div className="col-12 ">
                                        {sortedData
                                            .map((data, idx) => (
                                                <>
                                                    <div className="col-12 ">
                                                        <Accordion key={idx} allowMultiple >
                                                            <AccordionItem className="border shadow shadow-sm py-3 row w-100  help_buttons position-relative mb-4">
                                                                <h2>
                                                                    <AccordionButton>
                                                                        <Box as="span" flex='1' textAlign='left' className="d-flex fw-bold fs-5 justify-content-start text-secondary">
                                                                            {data.judul}
                                                                        </Box>
                                                                        <AccordionIcon />
                                                                    </AccordionButton>
                                                                </h2>
                                                                <AccordionPanel className="" pb={4} textAlign='left'>
                                                                    <div >
                                                                        <div  
                                                                        className="ps-4"
                                                                        >
                                                                            <div className="tutorialvideo-iframe">
                                                                                <iframe
                                                                                    src={data.isi}
                                                                                    width="100%"
                                                                                    frameborder="0"
                                                                                    scrolling="no"
                                                                                    allowfullscreen
                                                                                    title={data.judulvideo}
                                                                                    className="tutorialvideo"
                                                                                >
                                                                                </iframe>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </AccordionPanel>
                                                            </AccordionItem>

                                                        </Accordion>
                                                    </div >
                                                </>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
}

export default Tutorial