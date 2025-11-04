// Latin American countries
export const COUNTRIES = [
  // Mexico & Central America
  "Mexico",
  "Guatemala",
  "Belize",
  "El Salvador",
  "Honduras",
  "Nicaragua",
  "Costa Rica",
  "Panama",
  
  // Caribbean
  "Cuba",
  "Dominican Republic",
  "Puerto Rico",
  "Haiti",
  "Jamaica",
  "Trinidad and Tobago",
  "Guadeloupe",
  "Martinique",
  "Bahamas",
  "Barbados",
  "Saint Lucia",
  "Grenada",
  "Saint Vincent and the Grenadines",
  "Antigua and Barbuda",
  "Dominica",
  "Saint Kitts and Nevis",
  
  // South America
  "Colombia",
  "Venezuela",
  "Guyana",
  "Suriname",
  "French Guiana",
  "Ecuador",
  "Peru",
  "Brazil",
  "Bolivia",
  "Paraguay",
  "Chile",
  "Argentina",
  "Uruguay",
];

export function searchCountries(query: string, limit = 10): string[] {
  if (!query || query.length < 2) {
    return [];
  }

  const lowerQuery = query.toLowerCase();
  
  return COUNTRIES
    .filter(country => 
      country.toLowerCase().includes(lowerQuery)
    )
    .slice(0, limit);
}
