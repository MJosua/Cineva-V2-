// function.jsx
function createFlavorLookup(flavours, flavor) {
    return flavours.reduce((lookup, flavor) => {
        lookup[flavor.product_code] = flavor;
        return lookup;
    }, {});
}

export default createFlavorLookup;