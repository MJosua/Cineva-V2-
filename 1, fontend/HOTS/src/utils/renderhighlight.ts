import React from "react";
import { highlightSearchTerm } from "./searchUtils";


export const renderHighlightedText = (text: string = "", searchValue: string = "") => {
    return React.createElement("span", {
      dangerouslySetInnerHTML: {
        __html: highlightSearchTerm
        (text, searchValue),
      },
    });
  };
  