module.exports = {
  PORT: process.env.PORT || 9999,
  API_URL: process.env.API_URL || 
           (process.env.NODE_ENV === 'production' ? process.env.PROD_BE_URL_HOTS : process.env.DEV_BE_URL_HOTS) || 
           "",
  PARAM: process.env.PARAM,
};