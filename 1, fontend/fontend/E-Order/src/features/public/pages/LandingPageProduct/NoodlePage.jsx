import React from "react";

import Header from "../../../../components/layout/header.jsx";
import { useLocation } from "react-router-dom"

import NoodlePage from "../../../../components/product/Noodle";

import Barproduct from "../../../../components/product/Barproduct.jsx";

function LandingPage() {
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
    <div className="col-12">

      <Header />

      <div className="pt-4">
        <Barproduct />
        <NoodlePage />
      </div>
    </div>
  );
}

export default LandingPage;





