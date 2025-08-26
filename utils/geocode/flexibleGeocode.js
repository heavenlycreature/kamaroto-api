// geocode/flexibleGeocode.js
const { getWithRetry } = require('./nominatim.js');
const {
  normalizeCityLabel, stripKabKota,
  buildStructuredParams, buildFreeformParams
} = require('./builders.js');

/**
 * payload bisa owner* atau business* (beri prefix), contoh:
 *  {
 *    address_detail, address_village_name, address_district_name,
 *    address_regency_name, address_province_name, address_postal_code
 *  }
 */
async function geocodeAddressFlexible(payload) {
  const detail   = payload.address_detail;
  const village  = payload.address_village_name;
  const district = payload.address_district_name;
  const cityRaw  = payload.address_regency_name;
  const province = payload.address_province_name;
  const postcode = payload.address_postal_code;

  const cityLabel   = normalizeCityLabel(cityRaw);
  const cityPlain   = stripKabKota(cityLabel);

  // 1) STRATEGI STRUCTURED (paling akurat untuk data Indonesia)
  const structuredVariants = [
    { street: detail, village, district, city: cityLabel, state: province, postcode },
    { street: detail, village, district, city: cityPlain, state: province, postcode },
    { street: detail, village, district, city: cityPlain, state: province },           // tanpa postcode
    { street: detail, district, city: cityPlain, state: province, postcode },          // tanpa village
  ];

  for (const v of structuredVariants) {
    const params = buildStructuredParams(v);
    const res = await getWithRetry('/search', params);
    const data = res?.data;
    if (Array.isArray(data) && data.length > 0)
      return { latitude: +data[0].lat, longitude: +data[0].lon, provider: 'nominatim', variant: 'structured' };
  }

  // 2) STRATEGI FREE-FORM (fallback)
  const freeformVariants = [
    [detail, village, district, cityLabel, province, postcode],
    [detail, village, district, cityPlain, province, postcode],
    [detail, district, cityPlain, province, postcode],
    [district, cityPlain, province, postcode],
    [cityPlain, province, postcode],
  ];

  for (const seg of freeformVariants) {
    const params = buildFreeformParams(seg);
    const res = await getWithRetry('/search', params);
    const data = res?.data;
    if (Array.isArray(data) && data.length > 0)
      return { latitude: +data[0].lat, longitude: +data[0].lon, provider: 'nominatim', variant: 'freeform' };
  }

  return null;
}

module.exports = { geocodeAddressFlexible };