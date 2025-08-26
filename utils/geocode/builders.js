const clean = (s) => (typeof s === 'string' ? s.trim() : '');
const truthy = (...xs) => xs.filter(x => !!clean(x));

function normalizeCityLabel(city) {
  const v = clean(city);
  // ubah "KAB./KABUPATEN" → "Kab.", "KOTA" → "Kota"
  if (/^KAB(\.|UPATEN)?\b/i.test(v)) return v.replace(/^KAB(\.|UPATEN)?\b/i, 'Kab.');
  if (/^KOTA\b/i.test(v)) return v.replace(/^KOTA\b/i, 'Kota');
  return v;
}

function stripKabKota(city) {
  return clean(city)
    .replace(/^KAB(\.|UPATEN)?\s*/i, '')
    .replace(/^KOTA\s*/i, '');
}

function buildStructuredParams(parts) {
  // parts: {street, village, district, city, state, postcode}
  const street = truthy(parts.street, parts.village).join(', ');
  return {
    street,
    city: parts.city,
    state: parts.state,
    postcode: parts.postcode,
    country: 'Indonesia',
    format: 'jsonv2',
    limit: 1,
    addressdetails: 1,
    countrycodes: 'id',
    'accept-language': 'id',
  };
}

function buildFreeformParams(segments) {
  const q = truthy(...segments, 'Indonesia').join(', ');
  return {
    q,
    format: 'jsonv2',
    limit: 1,
    addressdetails: 1,
    countrycodes: 'id',
    'accept-language': 'id',
  };
}
module.exports = { normalizeCityLabel, stripKabKota, buildStructuredParams, buildFreeformParams };