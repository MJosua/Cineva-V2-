import { useMemo } from "react";
import { Tooltip } from "@chakra-ui/react";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { calculateContainerCBM, formatCBMForDisplay } from "../../../utils/cbmCalculator";

const RumuscbmContainer = ({ container, flavours, allowedCBM }) => {
  const flavourLookup = useMemo(() => {
    return flavours.reduce((acc, f) => {
      acc[f.product_code] = f;
      return acc;
    }, {});
  }, [flavours]);

  const cbm = calculateContainerCBM(container, flavourLookup);



  return (
    <div className="container_summary_text fw-bold d-flex justify-content-center align-items-center border border_radius_10px my-1 px-3">
      <span>{formatCBMForDisplay(cbm) || 0} CBM</span>

      {allowedCBM && (
        <Tooltip label={`Max: ${allowedCBM} Except same container Load Size`} hasArrow>
          <span
            className="ms-2 d-flex align-items-center"
            style={{ cursor: "pointer" }}
          >
            <AiOutlineInfoCircle size={14} />
          </span>
        </Tooltip>
      )}
    </div>

  );
};

export default RumuscbmContainer;




