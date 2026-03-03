import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Hero() {
  const [bgClass, setBgClass] = useState('img-noodle');
  const [activeButtonIndex, setActiveButtonIndex] = useState(0);
  const [moreLink, setMoreLink] = useState('/');
  const [isMouseOver, setIsMouseOver] = useState(false);
  const navigate = useNavigate();

  const buttonValues = [' 1', ' 2', ' 3', '4', '5'];

  const content = [
    {
      title: 'Noodle',
      text:
        "Noodles Division today operates 31 factories capable of producing over 34 billion packs annually to supply ever-growing demands, Noodles Division's products can be found everywhere in Indonesia, as well as over 100 countries worldwide. Indomie, which is one of Indonesia's most iconic brands, as well as Sarimi, Supermi, and Pop Mie, have been the brands of choice of the Indonesians for so many years.",
      moreLink: '/product/Noodle',
    },
    {
      title: 'Dairy',
      text:
        "Indofood CBPâ€™s Dairy Division is a major producer of milk products in Indonesia. It makes a wide range of products, such as ultra-high temperature (UHT) milk, sterilized bottled milk, sweetened condensed creamer (SCC), evaporated milk, pasteurized liquid milk, UHT multi-cereal milk, milk-flavoured drinks, powdered milk, ice cream and butter. ",
      moreLink: '/product/Dairy',
    },
    {
      title: 'Snack',
      text:
        "Indofood's Snack Foods Division is a leading producer of both Western-style and traditional snacks in Indonesia. The division produces a wide range of snacks, including potato chips, cassava chips, corn snacks, soybean snacks, and extruded snacks. These snacks are marketed under the brands Chitato, Chitato Lite, Qtela, Chiki, Maxicorn, and Jetz.",
      moreLink: '/product/Snack',
    },
    {
      title: 'Seasonings',
      text:
        "Indofood CBPâ€™s Food Seasonings Division is one of Indonesiaâ€™s leading culinary products manufacturers. It produces a broad range of culinary products, including recipe mixes, soy sauce, chili sauce, tomato sauce and stock soup under the Indofood and Indofood Racik brands.",
      moreLink: '/product/Snack',
    },
    {
      title: 'Nutrition & Special Food',
      text:
      "Indofood CBP's Nutrition & Special Foods Division helps children grow and develop by providing them with nutritious food products, including infant and toddler foods.",
      moreLink: '/product/Snack',
    },
  ];

  const handleClick = () => {
    setActiveButtonIndex((prevIndex) => (prevIndex + 1) % buttonValues.length);
  };

  const handleMoreButtonClick = () => {
    navigate(moreLink); // Navigate to the corresponding route
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isMouseOver) {
        handleClick();
      }
    }, 6300); // Adjust the interval time (in milliseconds) as needed

    return () => {
      clearInterval(timer);
    };
  }, [isMouseOver]);

  useEffect(() => {
    const nextBgClass = `img-${content[activeButtonIndex].title.toLowerCase().replace(/&|\s/g, '')}`;
    setBgClass(nextBgClass);
    setMoreLink(content[activeButtonIndex].moreLink);
  }, [activeButtonIndex]);

  const handleMouseEnter = () => {
    setIsMouseOver(true);
  };

  const handleMouseLeave = () => {
    setIsMouseOver(false);
  };

  return (

    <div className="col-12 h-100 w-100 pt-4 pb-3">
      <div className={`h-100 w-100 px-4 px-lg-5`}>
        <div className={`h-100 w-100 bg-atas ${bgClass} rounded-35`}></div>

      </div>
      <div className=" h-100 overflow-hidden pointer" onClick={handleClick} onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}>

        <div className="col-9 col-xl-5 col-lg-6 h-50  align-items-end position-absolute bottom-0 mb-5 modal-hero pb-md-0 pb-5 d-none d-md-flex">

          <div className=" bg-red-opacity-75 h-100 w-100 bottom text-light mb-md-0 mb-5 px-4 px-lg-5 py-3 ">
            <div className="h-25 ps-3">
              <div className="text-left d-flex justify-content-start fw-bold menutext_heavy ps-0 ps-lg-5 responsive-judul user-select-none">
                {content[activeButtonIndex].title}
              </div>
            </div>
            <div className="h-50 minus-mt-15 ps-3">
              <div className="text-justify d-flex justify-content-start responsive-isi ps-0 ps-lg-5">
                {content[activeButtonIndex].text}
              </div>
            </div>
            <div className="h-25 d-flex align-items-center ps-0 ps-md-5">
              <div onClick={handleMoreButtonClick} className="btn btn-outline-light responsive-cta rounded-pill pb-2 pt-1 px-5 ms-3 mt-5 ">
                MORE
              </div>
            </div>
          </div>



        </div>

        <div className="col-9 col-xl-5 col-lg-6 h-75 d-flex align-items-end position-absolute bottom-0 mb-5 modal-hero pb-md-0 pb-5 d-block d-md-none">



          <div className=" bg-red-opacity-75 h-75 w-100 bottom text-light mb-md-0 mb-5 px-4 px-lg-5 py-3 ">
            <div className="ps-3">
              <div className="text-left d-flex justify-content-start fw-bold menutext_heavy ps-0 ps-lg-5 responsive-judul user-select-none">
                {content[activeButtonIndex].title}
              </div>
            </div>
            <div className="h-50 mt-2 minus-mt-15 ps-3">
              <div className="text-justify d-flex responsive-isi ps-0 ps-lg-5">
              {content[activeButtonIndex].text}
              </div>
            </div>
            <div className="h-25 mt-4 d-flex align-items-center ps-0 ps-md-5">
              <div onClick={handleMoreButtonClick} className="btn btn-outline-light responsive-cta rounded-pill pb-2 pt-1 px-5 ms-3 mt-5 ">
                MORE
              </div>
            </div>
          </div>

        </div>

        <div className="col-9 col-xl-5 col-lg-6 h-75 d-flex align-items-end position-absolute bottom-0 mb-5 modal-hero pb-md-0 pb-5 d-block d-md-none">



          <div className=" bg-red-opacity-75 h-75 w-100 bottom text-light mb-md-0 mb-5 px-4 px-lg-5 py-3 ">
            <div className="ps-3">
              <div className="text-left d-flex justify-content-start fw-bold menutext_heavy ps-0 ps-lg-5 responsive-judul user-select-none">
                {content[activeButtonIndex].title}
              </div>
            </div>
            <div className="h-50 mt-2 minus-mt-15 ps-3">
              <div className="text-justify d-flex responsive-isi ps-0 ps-lg-5">
                {content[activeButtonIndex].text}
              </div>
            </div>
            <div className="h-25 mt-4 d-flex align-items-center ps-0 ps-md-5">
              <div onClick={handleMoreButtonClick} className="btn btn-outline-light responsive-cta rounded-pill pb-2 pt-1 px-5 ms-3 mt-5 ">
                MORE
              </div>
            </div>
          </div>

        </div>

        <div className="col-9 col-xl-5 col-lg-6 h-75 d-flex align-items-end position-absolute bottom-0 mb-5 modal-hero pb-md-0 pb-5 d-block d-md-none">



          <div className=" bg-red-opacity-75 h-75 w-100 bottom text-light mb-md-0 mb-5 px-4 px-lg-5 py-3 ">
            <div className="ps-3">
              <div className="text-left d-flex justify-content-start fw-bold menutext_heavy ps-0 ps-lg-5 responsive-judul user-select-none">
                {content[activeButtonIndex].title}
              </div>
            </div>
            <div className="h-50 mt-2 minus-mt-15 ps-3">
              <div className="text-justify d-flex responsive-isi ps-0 ps-lg-5">
                {content[activeButtonIndex].text}
              </div>
            </div>
            <div className="h-25 mt-4 d-flex align-items-center ps-0 ps-md-5">
              <div onClick={handleMoreButtonClick} className="btn btn-outline-light responsive-cta rounded-pill pb-2 pt-1 px-5 ms-3 mt-5 ">
                MORE
              </div>
            </div>
          </div>

        </div>

        <div className="col-3 col-xl-7 col-lg-6  h-100 d-flex align-items-end position-absolute bottom-0 rght-0 mb-5 px-5 justify-content-end d-flex me-5 modal-hero pb-md-0 pb-5  end-0">

          <button onClick={handleClick} className="position-absolute fs-1 fw-bold text-light right-0 outline border-bottom border-light">{buttonValues[activeButtonIndex]} <span className="fs-4">/ 5 &nbsp;&nbsp;&nbsp;&nbsp;</span></button>

        </div>
      </div>
    </div>

  );
}

export default Hero;




