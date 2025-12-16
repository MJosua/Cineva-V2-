import React, { useState, useEffect } from "react";

const FlipBoxUSA = () => {
  const images = [
    "/image/event/aset/information.png",
    "/image/event/aset/informationg2.png",
    "/image/event/aset/information3.png",
    "/image/event/aset/informationg2.png",

  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000); // Flip every 3 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="scene">
      <div
        className="box"
        style={{ transform: `rotateX(${currentIndex * 90}deg)` }} // Rotate to show each face vertically
      >
        {images.map((image, index) => (
          <div key={index} className={`box-face face-${index + 1}`}>
            <img src={image} alt={`Slide ${index + 1}`} className=" user-select-none user-drag-none box-image" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default FlipBoxUSA;
