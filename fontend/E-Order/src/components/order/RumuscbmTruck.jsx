import { useMemo } from "react";
import { calculateTruckCBM } from "../../utils/cbmCalculator";

const RumuscbmTruck = ({ order, flavours }) => {
  const flavourLookup = useMemo(() => {
    return flavours.reduce((acc, f) => {
      acc[f.product_code] = f;
      return acc;
    }, {});
  }, [flavours]);

  const cbm = useMemo(
    () => calculateTruckCBM(order, flavourLookup),
    [order, flavourLookup]
  );

  if (!cbm) return null;

  return (
    <div className="container_summary_text fw-bold d-flex justify-content-center border border_radius_10px row my-1 px-3">
      {cbm} CBM
    </div>
  );
};

export { RumuscbmTruck };




