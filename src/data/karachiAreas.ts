export interface KarachiArea {
  id: string;
  name: string;
  zone: string;
  lat: number;
  lng: number;
}

// Restaurant anchor: Hotel Excelsior, Opposite Atrium Mall, Saddar, Karachi
export const RESTAURANT_COORDS = {
  lat: 24.8531,
  lng: 67.0247,
  address: 'Hotel Excelsior, Opposite Atrium Mall, Saddar, Karachi, Pakistan',
  phoneDisplay: '03308880773',
  whatsappE164: '923308880773',
  timings: 'Daily 12:00 PM – 12:00 AM',
  mapsUrl: 'https://maps.app.goo.gl/c4rm7uh2KScfwVgV6',
};

export const KARACHI_AREAS: KarachiArea[] = [
  { id: 'saddar', name: 'Saddar / Atrium Mall', zone: 'Karachi South', lat: 24.8535, lng: 67.0252 },
  { id: 'civil-lines', name: 'Civil Lines', zone: 'Karachi South', lat: 24.8475, lng: 67.0298 },
  { id: 'burns-road', name: 'Burns Road', zone: 'Karachi South', lat: 24.8562, lng: 67.0159 },
  { id: 'ii-chundrigar', name: 'I.I. Chundrigar Road', zone: 'Karachi South', lat: 24.8505, lng: 67.0085 },
  { id: 'kharadar', name: 'Kharadar / Bolton Market', zone: 'Karachi South', lat: 24.8529, lng: 66.9994 },
  { id: 'bath-island', name: 'Bath Island', zone: 'Karachi South', lat: 24.8286, lng: 67.0322 },
  { id: 'clifton-1-2', name: 'Clifton Block 1 & 2', zone: 'Clifton', lat: 24.8087, lng: 67.0268 },
  { id: 'clifton-4-5', name: 'Clifton Block 4 & 5 (Boat Basin)', zone: 'Clifton', lat: 24.8195, lng: 67.0295 },
  { id: 'clifton-7-8-9', name: 'Clifton Block 7, 8 & 9', zone: 'Clifton', lat: 24.8245, lng: 67.0418 },
  { id: 'sea-view', name: 'Sea View / Do Darya', zone: 'Clifton', lat: 24.7924, lng: 67.0389 },
  { id: 'gizri', name: 'Gizri / Delhi Colony', zone: 'Karachi South', lat: 24.8322, lng: 67.0481 },
  { id: 'dha-1', name: 'DHA Phase 1', zone: 'DHA', lat: 24.8298, lng: 67.0642 },
  { id: 'dha-2', name: 'DHA Phase 2', zone: 'DHA', lat: 24.8364, lng: 67.0715 },
  { id: 'dha-4', name: 'DHA Phase 4', zone: 'DHA', lat: 24.8203, lng: 67.0612 },
  { id: 'dha-5', name: 'DHA Phase 5', zone: 'DHA', lat: 24.8045, lng: 67.0532 },
  { id: 'dha-6', name: 'DHA Phase 6', zone: 'DHA', lat: 24.7962, lng: 67.0721 },
  { id: 'dha-7', name: 'DHA Phase 7', zone: 'DHA', lat: 24.8091, lng: 67.0819 },
  { id: 'dha-8', name: 'DHA Phase 8', zone: 'DHA', lat: 24.7825, lng: 67.0854 },
  { id: 'defence-view', name: 'Defence View / Qayyumabad', zone: 'Korangi Road', lat: 24.8398, lng: 67.0792 },
  { id: 'garden-east', name: 'Garden East', zone: 'Karachi East', lat: 24.8726, lng: 67.0326 },
  { id: 'garden-west', name: 'Garden West', zone: 'Karachi South', lat: 24.8712, lng: 67.0188 },
  { id: 'soldier-bazaar', name: 'Soldier Bazaar', zone: 'Karachi East', lat: 24.8732, lng: 67.0402 },
  { id: 'guru-mandir', name: 'Guru Mandir / Numaish', zone: 'Karachi Central', lat: 24.8774, lng: 67.0399 },
  { id: 'pechs-2', name: 'PECHS Block 2 (Tariq Road)', zone: 'Karachi East', lat: 24.8705, lng: 67.0621 },
  { id: 'pechs-6', name: 'PECHS Block 6 (Nursery)', zone: 'Karachi East', lat: 24.8639, lng: 67.0745 },
  { id: 'bahadurabad', name: 'Bahadurabad', zone: 'Karachi East', lat: 24.8825, lng: 67.0684 },
  { id: 'sharfabad', name: 'Sharfabad / Dhoraji', zone: 'Karachi East', lat: 24.8857, lng: 67.0751 },
  { id: 'karsaz', name: 'Karsaz / National Stadium', zone: 'Karachi East', lat: 24.8926, lng: 67.0894 },
  { id: 'shahrah-e-faisal', name: 'Shahrah-e-Faisal (Baloch Colony)', zone: 'Karachi East', lat: 24.8615, lng: 67.0875 },
  { id: 'gulshan-iqbal', name: 'Gulshan-e-Iqbal (All Blocks)', zone: 'Karachi East', lat: 24.9181, lng: 67.0971 },
  { id: 'hassan-square', name: 'Hassan Square / Civic Centre', zone: 'Karachi East', lat: 24.9012, lng: 67.0785 },
  { id: 'gulistan-e-johar', name: 'Gulistan-e-Johar (All Blocks)', zone: 'Karachi East', lat: 24.9204, lng: 67.1342 },
  { id: 'liaquatabad', name: 'Liaquatabad / Karimabad', zone: 'Karachi Central', lat: 24.9068, lng: 67.0462 },
  { id: 'nazimabad', name: 'Nazimabad (Block 1–5)', zone: 'Karachi Central', lat: 24.9142, lng: 67.0308 },
  { id: 'north-nazimabad', name: 'North Nazimabad (Block A–N)', zone: 'Karachi Central', lat: 24.9385, lng: 67.0439 },
  { id: 'fb-area', name: 'Federal B. Area (FB Area)', zone: 'Karachi Central', lat: 24.9324, lng: 67.0672 },
  { id: 'buffer-zone', name: 'Buffer Zone', zone: 'Karachi Central', lat: 24.9612, lng: 67.0615 },
  { id: 'north-karachi', name: 'North Karachi', zone: 'Karachi Central', lat: 24.9802, lng: 67.0675 },
  { id: 'surjani-town', name: 'Surjani Town', zone: 'Karachi West', lat: 25.0258, lng: 67.0621 },
  { id: 'scheme-33', name: 'Scheme 33 / Safoora Goth', zone: 'Karachi East', lat: 24.9574, lng: 67.1478 },
  { id: 'shah-faisal', name: 'Shah Faisal Colony', zone: 'Korangi', lat: 24.8774, lng: 67.1492 },
  { id: 'malir-cantt', name: 'Malir Cantt', zone: 'Malir', lat: 24.9355, lng: 67.2072 },
  { id: 'malir-halt', name: 'Malir Halt / Model Colony', zone: 'Malir', lat: 24.8958, lng: 67.1814 },
  { id: 'korangi', name: 'Korangi Crossing / Industrial Area', zone: 'Korangi', lat: 24.8351, lng: 67.1298 },
  { id: 'landhi', name: 'Landhi', zone: 'Korangi', lat: 24.8452, lng: 67.1945 },
  { id: 'lyari', name: 'Lyari', zone: 'Karachi South', lat: 24.8658, lng: 66.9935 },
  { id: 'site', name: 'S.I.T.E. Industrial Area', zone: 'Karachi West', lat: 24.9018, lng: 66.9912 },
  { id: 'orangi-town', name: 'Orangi Town', zone: 'Karachi West', lat: 24.9465, lng: 66.9885 },
  { id: 'kemari', name: 'Kemari / Manora Pier', zone: 'Karachi West', lat: 24.8191, lng: 66.9794 },
];

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function findNearestKarachiArea(lat: number, lng: number): { area: KarachiArea; roadDistanceKm: number } {
  let nearest = KARACHI_AREAS[0];
  let minStraight = Infinity;
  for (const area of KARACHI_AREAS) {
    const d = haversineKm(lat, lng, area.lat, area.lng);
    if (d < minStraight) {
      minStraight = d;
      nearest = area;
    }
  }
  const actualFromRestaurant = haversineKm(RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng, lat, lng);
  const roadDistanceKm = Math.max(1.2, Number((actualFromRestaurant * 1.28).toFixed(1)));
  return { area: nearest, roadDistanceKm };
}
