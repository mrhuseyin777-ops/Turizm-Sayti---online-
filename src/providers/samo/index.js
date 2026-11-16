// SAMO-tour Online operatorları (Summer Tour, Kompas, Funsun/FS Travel): konfiqurasiya,
// "operatorun saytında yoxla" deeplink-i və real adapter skeleti. Bax: docs/OPERATORS-SAMO.md
const { operators, destinationCountry, getOperator, currencyCodeById } = require('./operators');
const { buildOperatorSearchUrl, isAllowedOperatorUrl, samoDate } = require('./deeplink');
const {
  createSamoProvider, normalizeSamoItem, normalizeSamoItems, safeFetch, readSamoEnv, resolveStatus, mapBoard, SamoError,
} = require('./samoProvider');

module.exports = {
  operators, destinationCountry, getOperator, currencyCodeById,
  buildOperatorSearchUrl, isAllowedOperatorUrl, samoDate,
  createSamoProvider, normalizeSamoItem, normalizeSamoItems, safeFetch, readSamoEnv, resolveStatus, mapBoard, SamoError,
};
