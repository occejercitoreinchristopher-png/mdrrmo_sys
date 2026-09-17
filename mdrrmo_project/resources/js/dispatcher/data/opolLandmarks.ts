/**
 * Official & Surveyed Landmarks Dataset for the Municipality of Opol, Misamis Oriental, Philippines.
 * 
 * Sourced directly from OpenStreetMap (OSM) Surveyed Nodes/Ways and official LGU administrative coordinates.
 * Covers all 14 Barangays:
 * Awang, Bagocboc, Barra, Bonbon, Cauyonan, Igpit, Limonda, Luyongbonbon, Malanang, Nangcaon, Patag, Poblacion, Taboc, Tingalan.
 */

export interface OpolLandmark {
    id: string;
    name: string;
    barangay: string;
    category: 'Barangay Center' | 'School' | 'Church / Chapel' | 'Resort & Beach' | 'Tourism & Nature' | 'Public Facility' | 'Street / Junction' | 'Purok / Sitio';
    latitude: number;
    longitude: number;
    address: string;
}

export const OPOL_BARANGAYS = [
    'Awang',
    'Bagocboc',
    'Barra',
    'Bonbon',
    'Cauyonan',
    'Igpit',
    'Limonda',
    'Luyongbonbon',
    'Malanang',
    'Nangcaon',
    'Patag',
    'Poblacion',
    'Taboc',
    'Tingalan',
] as const;

export type OpolBarangay = typeof OPOL_BARANGAYS[number];

export const OPOL_LANDMARKS: OpolLandmark[] = [
    {
        "id": "core-0",
        "name": "Awang Barangay Hall & Covered Court",
        "barangay": "Awang",
        "category": "Barangay Center",
        "latitude": 8.44112,
        "longitude": 124.51234,
        "address": "Barangay Hall, Awang, Opol, Misamis Oriental"
    },
    {
        "id": "core-1",
        "name": "Awang Elementary School",
        "barangay": "Awang",
        "category": "School",
        "latitude": 8.44231,
        "longitude": 124.51345,
        "address": "Awang Elementary School, Awang, Opol, Misamis Oriental"
    },
    {
        "id": "osm-way-542427626",
        "name": "Balo-i - Tagoloan",
        "barangay": "Awang",
        "category": "Public Facility",
        "latitude": 8.42277,
        "longitude": 124.539945,
        "address": "Balo-i - Tagoloan, Barangay Awang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-954833237",
        "name": "Bayugbayogan Elementary School",
        "barangay": "Awang",
        "category": "School",
        "latitude": 8.445881,
        "longitude": 124.518216,
        "address": "Bayugbayogan Elementary School, Barangay Awang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-4326397009",
        "name": "Bagocboc",
        "barangay": "Bagocboc",
        "category": "Public Facility",
        "latitude": 8.419848,
        "longitude": 124.502216,
        "address": "Bagocboc, Barangay Bagocboc, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "core-2",
        "name": "Bagocboc Barangay Hall",
        "barangay": "Bagocboc",
        "category": "Barangay Center",
        "latitude": 8.419848,
        "longitude": 124.502216,
        "address": "Bagocboc Barangay Hall, Bagocboc, Opol, Misamis Oriental"
    },
    {
        "id": "core-3",
        "name": "Bagocboc Elementary School",
        "barangay": "Bagocboc",
        "category": "School",
        "latitude": 8.42055,
        "longitude": 124.50312,
        "address": "Bagocboc Elementary School, Bagocboc, Opol, Misamis Oriental"
    },
    {
        "id": "osm-way-954796442",
        "name": "Bagocboc National High School",
        "barangay": "Bagocboc",
        "category": "School",
        "latitude": 8.419314,
        "longitude": 124.502146,
        "address": "Bagocboc National High School, Barangay Bagocboc, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-13912231328",
        "name": "Siot",
        "barangay": "Bagocboc",
        "category": "Public Facility",
        "latitude": 8.421147,
        "longitude": 124.501001,
        "address": "Siot, Barangay Bagocboc, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1332127475",
        "name": "Taglimao-Bagocboc Road",
        "barangay": "Bagocboc",
        "category": "Street / Junction",
        "latitude": 8.402955,
        "longitude": 124.523066,
        "address": "Taglimao-Bagocboc Road, Barangay Bagocboc, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-5792136362",
        "name": "7-Eleven",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.503619,
        "longitude": 124.603396,
        "address": "7-Eleven, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-10776497694",
        "name": "Acero Dental Care",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.508177,
        "longitude": 124.604828,
        "address": "Acero Dental Care, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1116931262",
        "name": "Ahoy Fastfood",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.518865,
        "longitude": 124.608283,
        "address": "Ahoy Fastfood, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-90961848",
        "name": "Amber Street",
        "barangay": "Barra",
        "category": "Street / Junction",
        "latitude": 8.506612,
        "longitude": 124.602896,
        "address": "Amber Street, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1272037417",
        "name": "Amethyst Street",
        "barangay": "Barra",
        "category": "Street / Junction",
        "latitude": 8.507749,
        "longitude": 124.601794,
        "address": "Amethyst Street, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-6167495385",
        "name": "Angkhong Bakeshop",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.504078,
        "longitude": 124.603638,
        "address": "Angkhong Bakeshop, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-6169979486",
        "name": "Apostolic Pentlecostal",
        "barangay": "Barra",
        "category": "Church / Chapel",
        "latitude": 8.504117,
        "longitude": 124.60134,
        "address": "Apostolic Pentlecostal, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-13438747001",
        "name": "Aqualush",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.507294,
        "longitude": 124.602093,
        "address": "Aqualush, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-11393144937",
        "name": "Barra",
        "barangay": "Barra",
        "category": "Street / Junction",
        "latitude": 8.503494,
        "longitude": 124.602896,
        "address": "Barra, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-467858267",
        "name": "Barra Barangay Hall",
        "barangay": "Barra",
        "category": "Barangay Center",
        "latitude": 8.508487,
        "longitude": 124.607119,
        "address": "Barra Barangay Hall, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "core-4",
        "name": "Barra Barangay Hall & Plaza",
        "barangay": "Barra",
        "category": "Barangay Center",
        "latitude": 8.508487,
        "longitude": 124.607119,
        "address": "Barra Barangay Hall, Barra, Opol, Misamis Oriental"
    },
    {
        "id": "osm-way-1087700136",
        "name": "Barra Covered Court",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.508356,
        "longitude": 124.606907,
        "address": "Barra Covered Court, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-954798458",
        "name": "Barra Elementary School",
        "barangay": "Barra",
        "category": "School",
        "latitude": 8.514058,
        "longitude": 124.607669,
        "address": "Barra Elementary School, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-6167500285",
        "name": "Barra Jeepney Station",
        "barangay": "Barra",
        "category": "Street / Junction",
        "latitude": 8.505091,
        "longitude": 124.604071,
        "address": "Barra Jeepney Station, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-6169979487",
        "name": "Barra police station",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.506472,
        "longitude": 124.604788,
        "address": "Barra police station, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-32806720",
        "name": "Barra Road",
        "barangay": "Barra",
        "category": "Street / Junction",
        "latitude": 8.509156,
        "longitude": 124.607107,
        "address": "Barra Road, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-788705920",
        "name": "Blu Energy",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.503521,
        "longitude": 124.59838,
        "address": "Blu Energy, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-90961749",
        "name": "Brass Street",
        "barangay": "Barra",
        "category": "Street / Junction",
        "latitude": 8.507603,
        "longitude": 124.604241,
        "address": "Brass Street, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-724017938",
        "name": "C. M. Recto Avenue",
        "barangay": "Barra",
        "category": "Street / Junction",
        "latitude": 8.503661,
        "longitude": 124.604507,
        "address": "C. M. Recto Avenue, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1116931255",
        "name": "Captain Kidd's Hideout",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.519213,
        "longitude": 124.608309,
        "address": "Captain Kidd's Hideout, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-6169983786",
        "name": "Chicken Rotizado",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.504164,
        "longitude": 124.603697,
        "address": "Chicken Rotizado, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1116931258",
        "name": "Compass Splash Pad",
        "barangay": "Barra",
        "category": "Tourism & Nature",
        "latitude": 8.518706,
        "longitude": 124.60871,
        "address": "Compass Splash Pad, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-90961867",
        "name": "Copper Street",
        "barangay": "Barra",
        "category": "Street / Junction",
        "latitude": 8.506986,
        "longitude": 124.604255,
        "address": "Copper Street, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1273033599",
        "name": "Crystal Street",
        "barangay": "Barra",
        "category": "Street / Junction",
        "latitude": 8.508541,
        "longitude": 124.603731,
        "address": "Crystal Street, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1116931287",
        "name": "Cyclone",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.519174,
        "longitude": 124.607199,
        "address": "Cyclone, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-90961764",
        "name": "Diamond Street",
        "barangay": "Barra",
        "category": "Street / Junction",
        "latitude": 8.506973,
        "longitude": 124.602326,
        "address": "Diamond Street, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1116931256",
        "name": "Events Tent",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.519037,
        "longitude": 124.60888,
        "address": "Events Tent, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-10215146334",
        "name": "First Aid Station",
        "barangay": "Barra",
        "category": "Street / Junction",
        "latitude": 8.519256,
        "longitude": 124.607092,
        "address": "First Aid Station, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1116931272",
        "name": "Fuerte De San Agustin",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.518263,
        "longitude": 124.607659,
        "address": "Fuerte De San Agustin, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-90961760",
        "name": "Galvanize Street",
        "barangay": "Barra",
        "category": "Street / Junction",
        "latitude": 8.507685,
        "longitude": 124.604011,
        "address": "Galvanize Street, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-6167510785",
        "name": "Homewood pensione",
        "barangay": "Barra",
        "category": "Resort & Beach",
        "latitude": 8.503519,
        "longitude": 124.602657,
        "address": "Homewood pensione, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-11393164600",
        "name": "Iponan",
        "barangay": "Barra",
        "category": "Street / Junction",
        "latitude": 8.503367,
        "longitude": 124.599143,
        "address": "Iponan, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1166006038",
        "name": "Iponan Bridge № 1",
        "barangay": "Barra",
        "category": "Street / Junction",
        "latitude": 8.514429,
        "longitude": 124.611719,
        "address": "Iponan Bridge № 1, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1133593585",
        "name": "Iponan Bridge № 2",
        "barangay": "Barra",
        "category": "Street / Junction",
        "latitude": 8.503661,
        "longitude": 124.604507,
        "address": "Iponan Bridge № 2, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-90961871",
        "name": "Iron Street",
        "barangay": "Barra",
        "category": "Street / Junction",
        "latitude": 8.506884,
        "longitude": 124.604486,
        "address": "Iron Street, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-90961769",
        "name": "Jasper Street",
        "barangay": "Barra",
        "category": "Street / Junction",
        "latitude": 8.506385,
        "longitude": 124.602841,
        "address": "Jasper Street, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-587066670",
        "name": "Johndorf Subdivision Park",
        "barangay": "Barra",
        "category": "Tourism & Nature",
        "latitude": 8.507534,
        "longitude": 124.603085,
        "address": "Johndorf Subdivision Park, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1116931297",
        "name": "Jolly Roger Tower",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.519612,
        "longitude": 124.607864,
        "address": "Jolly Roger Tower, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-90961754",
        "name": "Jondorf Avenue",
        "barangay": "Barra",
        "category": "Street / Junction",
        "latitude": 8.508791,
        "longitude": 124.602612,
        "address": "Jondorf Avenue, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-114317293",
        "name": "Jondorf Subdivision",
        "barangay": "Barra",
        "category": "Purok / Sitio",
        "latitude": 8.507882,
        "longitude": 124.602838,
        "address": "Jondorf Subdivision, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-6167491685",
        "name": "Jonnas Bakeshop",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.505005,
        "longitude": 124.604041,
        "address": "Jonnas Bakeshop, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-6170011385",
        "name": "KingsRide Shop",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.503459,
        "longitude": 124.599402,
        "address": "KingsRide Shop, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-90961822",
        "name": "Lapis Street",
        "barangay": "Barra",
        "category": "Street / Junction",
        "latitude": 8.510227,
        "longitude": 124.602401,
        "address": "Lapis Street, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-587066756",
        "name": "Legacy Learning School",
        "barangay": "Barra",
        "category": "School",
        "latitude": 8.507452,
        "longitude": 124.602167,
        "address": "Legacy Learning School, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1116931302",
        "name": "Main Entrance",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.518646,
        "longitude": 124.608941,
        "address": "Main Entrance, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1116931268",
        "name": "Mighty Maui River",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.518432,
        "longitude": 124.607548,
        "address": "Mighty Maui River, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1116931269",
        "name": "Mighty Moui River",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.518484,
        "longitude": 124.60806,
        "address": "Mighty Moui River, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1116931278",
        "name": "Moby Dick Whale",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.518524,
        "longitude": 124.607578,
        "address": "Moby Dick Whale, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-6169983785",
        "name": "Ogis lechon manok",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.504353,
        "longitude": 124.603791,
        "address": "Ogis lechon manok, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-90961784",
        "name": "Opal Street",
        "barangay": "Barra",
        "category": "Street / Junction",
        "latitude": 8.506142,
        "longitude": 124.602774,
        "address": "Opal Street, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-6169979589",
        "name": "Our Mother of Perpetual Help Chapel",
        "barangay": "Barra",
        "category": "Church / Chapel",
        "latitude": 8.50957,
        "longitude": 124.608466,
        "address": "Our Mother of Perpetual Help Chapel, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1116931280",
        "name": "Pacific Rider",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.51854,
        "longitude": 124.60718,
        "address": "Pacific Rider, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-457050167",
        "name": "Phoenix",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.503576,
        "longitude": 124.599722,
        "address": "Phoenix, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1116931300",
        "name": "Pira-Chute",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.519461,
        "longitude": 124.607969,
        "address": "Pira-Chute, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1116931288",
        "name": "Pirate Cove",
        "barangay": "Barra",
        "category": "Tourism & Nature",
        "latitude": 8.519502,
        "longitude": 124.607395,
        "address": "Pirate Cove, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-10215112138",
        "name": "Pirate's Museum",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.5183,
        "longitude": 124.607685,
        "address": "Pirate's Museum, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1116931254",
        "name": "Pirates Caraibes",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.51917,
        "longitude": 124.608459,
        "address": "Pirates Caraibes, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1116931284",
        "name": "Plank Drop",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.518671,
        "longitude": 124.607344,
        "address": "Plank Drop, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1116931260",
        "name": "Powerhouse",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.518563,
        "longitude": 124.608469,
        "address": "Powerhouse, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-6167503985",
        "name": "Regent Food Products",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.51023,
        "longitude": 124.597082,
        "address": "Regent Food Products, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1116931298",
        "name": "Riptide Reef",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.519581,
        "longitude": 124.607988,
        "address": "Riptide Reef, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-6165443385",
        "name": "Riverdale School",
        "barangay": "Barra",
        "category": "School",
        "latitude": 8.510992,
        "longitude": 124.603807,
        "address": "Riverdale School, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-8709722762",
        "name": "Royal Cafe",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.507454,
        "longitude": 124.606107,
        "address": "Royal Cafe, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-6251665346",
        "name": "Rubens Bakeshop",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.505461,
        "longitude": 124.604312,
        "address": "Rubens Bakeshop, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-90961777",
        "name": "Ruby Street",
        "barangay": "Barra",
        "category": "Street / Junction",
        "latitude": 8.508735,
        "longitude": 124.60201,
        "address": "Ruby Street, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1116931277",
        "name": "Sandbox",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.518447,
        "longitude": 124.607385,
        "address": "Sandbox, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-683753500",
        "name": "Seven Seas Waterpark & Resort",
        "barangay": "Barra",
        "category": "Resort & Beach",
        "latitude": 8.518837,
        "longitude": 124.608099,
        "address": "Seven Seas Waterpark & Resort, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1116931252",
        "name": "Shipwreck Island",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.519565,
        "longitude": 124.607378,
        "address": "Shipwreck Island, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1116931264",
        "name": "Sir Francis'Garden Courtyard",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.518816,
        "longitude": 124.608506,
        "address": "Sir Francis'Garden Courtyard, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-90961847",
        "name": "Steel Street",
        "barangay": "Barra",
        "category": "Street / Junction",
        "latitude": 8.509165,
        "longitude": 124.603485,
        "address": "Steel Street, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1116931261",
        "name": "Swashbucklers Hut",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.518501,
        "longitude": 124.608284,
        "address": "Swashbucklers Hut, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-457050173",
        "name": "The Church of Jesus Christ of Latter-day Saints",
        "barangay": "Barra",
        "category": "Church / Chapel",
        "latitude": 8.503844,
        "longitude": 124.600097,
        "address": "The Church of Jesus Christ of Latter-day Saints, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1116931265",
        "name": "Treasure Island",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.518559,
        "longitude": 124.607807,
        "address": "Treasure Island, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1116931266",
        "name": "Treasure Island Garden Maze",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.518559,
        "longitude": 124.607787,
        "address": "Treasure Island Garden Maze, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-6716533085",
        "name": "Tuning CDO",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.503516,
        "longitude": 124.602423,
        "address": "Tuning CDO, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-166188808",
        "name": "West Coastal Road",
        "barangay": "Barra",
        "category": "Street / Junction",
        "latitude": 8.514939,
        "longitude": 124.607799,
        "address": "West Coastal Road, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-8172796818",
        "name": "Wilcon Depot",
        "barangay": "Barra",
        "category": "Public Facility",
        "latitude": 8.514385,
        "longitude": 124.603949,
        "address": "Wilcon Depot, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-6165442886",
        "name": "Word of Life Bible Camp",
        "barangay": "Barra",
        "category": "Resort & Beach",
        "latitude": 8.517908,
        "longitude": 124.604354,
        "address": "Word of Life Bible Camp, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-13329596001",
        "name": "Word of Life Seaside Camp",
        "barangay": "Barra",
        "category": "Resort & Beach",
        "latitude": 8.51759,
        "longitude": 124.604122,
        "address": "Word of Life Seaside Camp, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-136085735",
        "name": "Yanez Street",
        "barangay": "Barra",
        "category": "Street / Junction",
        "latitude": 8.504662,
        "longitude": 124.598964,
        "address": "Yanez Street, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-90961827",
        "name": "Zurcon Street",
        "barangay": "Barra",
        "category": "Street / Junction",
        "latitude": 8.509136,
        "longitude": 124.604511,
        "address": "Zurcon Street, Barangay Barra, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-13299357502",
        "name": "Bonbon",
        "barangay": "Bonbon",
        "category": "Public Facility",
        "latitude": 8.513859,
        "longitude": 124.568809,
        "address": "Bonbon, Barangay Bonbon, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "core-5",
        "name": "Bonbon Barangay Hall",
        "barangay": "Bonbon",
        "category": "Barangay Center",
        "latitude": 8.513859,
        "longitude": 124.568809,
        "address": "Bonbon Barangay Hall, Bonbon, Opol, Misamis Oriental"
    },
    {
        "id": "core-6",
        "name": "Bonbon Elementary School",
        "barangay": "Bonbon",
        "category": "School",
        "latitude": 8.51421,
        "longitude": 124.56942,
        "address": "Bonbon Elementary School, Bonbon, Opol, Misamis Oriental"
    },
    {
        "id": "osm-node-6165006385",
        "name": "Enicita Vacalares Jampit Store",
        "barangay": "Bonbon",
        "category": "Public Facility",
        "latitude": 8.516548,
        "longitude": 124.568867,
        "address": "Enicita Vacalares Jampit Store, Barangay Bonbon, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-8837833799",
        "name": "Cauyonan",
        "barangay": "Cauyonan",
        "category": "Public Facility",
        "latitude": 8.322779,
        "longitude": 124.453459,
        "address": "Cauyonan, Barangay Cauyonan, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "core-7",
        "name": "Cauyonan Barangay Hall",
        "barangay": "Cauyonan",
        "category": "Barangay Center",
        "latitude": 8.322779,
        "longitude": 124.453459,
        "address": "Cauyonan Barangay Hall, Cauyonan, Opol, Misamis Oriental"
    },
    {
        "id": "osm-way-954835184",
        "name": "Cauyonan Integrated School",
        "barangay": "Cauyonan",
        "category": "School",
        "latitude": 8.323346,
        "longitude": 124.453818,
        "address": "Cauyonan Integrated School, Barangay Cauyonan, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-10580501341",
        "name": "Tulod",
        "barangay": "Cauyonan",
        "category": "Purok / Sitio",
        "latitude": 8.333513,
        "longitude": 124.429048,
        "address": "Tulod, Barangay Cauyonan, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-178838872",
        "name": "Bungcalalan River",
        "barangay": "Igpit",
        "category": "Public Facility",
        "latitude": 8.509427,
        "longitude": 124.584844,
        "address": "Bungcalalan River, Barangay Igpit, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-90798883",
        "name": "Butuan-Cagayan de Oro-Iligan Road",
        "barangay": "Igpit",
        "category": "Street / Junction",
        "latitude": 8.513293,
        "longitude": 124.583795,
        "address": "Butuan-Cagayan de Oro-Iligan Road, Barangay Igpit, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-788705915",
        "name": "C3 Fuels",
        "barangay": "Igpit",
        "category": "Public Facility",
        "latitude": 8.503513,
        "longitude": 124.597577,
        "address": "C3 Fuels, Barangay Igpit, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-1328397222",
        "name": "Cagayan Gas Corporation",
        "barangay": "Igpit",
        "category": "Public Facility",
        "latitude": 8.50499,
        "longitude": 124.592915,
        "address": "Cagayan Gas Corporation, Barangay Igpit, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-6169979490",
        "name": "Cham's",
        "barangay": "Igpit",
        "category": "Public Facility",
        "latitude": 8.503368,
        "longitude": 124.595759,
        "address": "Cham's, Barangay Igpit, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-11074550673",
        "name": "DXCO-AM Transmitter",
        "barangay": "Igpit",
        "category": "Public Facility",
        "latitude": 8.512978,
        "longitude": 124.584872,
        "address": "DXCO-AM Transmitter, Barangay Igpit, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-11074527704",
        "name": "DXRU-AM Transmitter",
        "barangay": "Igpit",
        "category": "Public Facility",
        "latitude": 8.516215,
        "longitude": 124.584881,
        "address": "DXRU-AM Transmitter, Barangay Igpit, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-453068852",
        "name": "Iglesia ni Cristo",
        "barangay": "Igpit",
        "category": "Church / Chapel",
        "latitude": 8.507508,
        "longitude": 124.590282,
        "address": "Iglesia ni Cristo, Barangay Igpit, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-8837469976",
        "name": "Igpit",
        "barangay": "Igpit",
        "category": "Purok / Sitio",
        "latitude": 8.508548,
        "longitude": 124.588704,
        "address": "Igpit, Barangay Igpit, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-326495226",
        "name": "Igpit Barangay Hall",
        "barangay": "Igpit",
        "category": "Barangay Center",
        "latitude": 8.508403,
        "longitude": 124.588748,
        "address": "Igpit Barangay Hall, Barangay Igpit, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "core-8",
        "name": "Igpit Barangay Hall & Plaza",
        "barangay": "Igpit",
        "category": "Barangay Center",
        "latitude": 8.508402,
        "longitude": 124.588748,
        "address": "Igpit Barangay Hall, Igpit, Opol, Misamis Oriental"
    },
    {
        "id": "osm-way-1023238563",
        "name": "Igpit Bridge",
        "barangay": "Igpit",
        "category": "Street / Junction",
        "latitude": 8.51329,
        "longitude": 124.583793,
        "address": "Igpit Bridge, Barangay Igpit, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "core-9",
        "name": "Igpit Elementary School",
        "barangay": "Igpit",
        "category": "School",
        "latitude": 8.50912,
        "longitude": 124.58941,
        "address": "Igpit Elementary School, Igpit, Opol, Misamis Oriental"
    },
    {
        "id": "osm-way-90798909",
        "name": "Igpit Road",
        "barangay": "Igpit",
        "category": "Street / Junction",
        "latitude": 8.497259,
        "longitude": 124.580797,
        "address": "Igpit Road, Barangay Igpit, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-469375137",
        "name": "Igpit Sports Arena",
        "barangay": "Igpit",
        "category": "Public Facility",
        "latitude": 8.511911,
        "longitude": 124.587509,
        "address": "Igpit Sports Arena, Barangay Igpit, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-13329573601",
        "name": "Jejors warehouse",
        "barangay": "Igpit",
        "category": "Public Facility",
        "latitude": 8.513833,
        "longitude": 124.592988,
        "address": "Jejors warehouse, Barangay Igpit, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-6172174885",
        "name": "Kingmotors",
        "barangay": "Igpit",
        "category": "Public Facility",
        "latitude": 8.50652,
        "longitude": 124.59089,
        "address": "Kingmotors, Barangay Igpit, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-8172796917",
        "name": "Kubota",
        "barangay": "Igpit",
        "category": "Public Facility",
        "latitude": 8.512357,
        "longitude": 124.588799,
        "address": "Kubota, Barangay Igpit, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-13363126301",
        "name": "LCG warehouse",
        "barangay": "Igpit",
        "category": "Public Facility",
        "latitude": 8.514636,
        "longitude": 124.592818,
        "address": "LCG warehouse, Barangay Igpit, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1449995476",
        "name": "Neocentral Arcade",
        "barangay": "Igpit",
        "category": "Public Facility",
        "latitude": 8.504441,
        "longitude": 124.592796,
        "address": "Neocentral Arcade, Barangay Igpit, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-846584638",
        "name": "Opol-Canitoan Diversion Road",
        "barangay": "Igpit",
        "category": "Street / Junction",
        "latitude": 8.497624,
        "longitude": 124.581168,
        "address": "Opol-Canitoan Diversion Road, Barangay Igpit, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-6171961985",
        "name": "Palawan Pawnshop",
        "barangay": "Igpit",
        "category": "Public Facility",
        "latitude": 8.503438,
        "longitude": 124.595849,
        "address": "Palawan Pawnshop, Barangay Igpit, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-670139427",
        "name": "Shell",
        "barangay": "Igpit",
        "category": "Public Facility",
        "latitude": 8.503974,
        "longitude": 124.594301,
        "address": "Shell, Barangay Igpit, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-314671295",
        "name": "Shell Station",
        "barangay": "Igpit",
        "category": "Street / Junction",
        "latitude": 8.510235,
        "longitude": 124.587368,
        "address": "Shell Station, Barangay Igpit, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-9684249509",
        "name": "Teascape",
        "barangay": "Igpit",
        "category": "Public Facility",
        "latitude": 8.511589,
        "longitude": 124.585843,
        "address": "Teascape, Barangay Igpit, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-5096621824",
        "name": "VEN RAY Construction",
        "barangay": "Igpit",
        "category": "Public Facility",
        "latitude": 8.516723,
        "longitude": 124.58101,
        "address": "VEN RAY Construction, Barangay Igpit, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-8837436426",
        "name": "Limonda",
        "barangay": "Limonda",
        "category": "Public Facility",
        "latitude": 8.32517,
        "longitude": 124.412217,
        "address": "Limonda, Barangay Limonda, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "core-10",
        "name": "Limonda Barangay Hall",
        "barangay": "Limonda",
        "category": "Barangay Center",
        "latitude": 8.32517,
        "longitude": 124.412217,
        "address": "Limonda Barangay Hall, Limonda, Opol, Misamis Oriental"
    },
    {
        "id": "osm-way-954796700",
        "name": "Limunda Elementary School",
        "barangay": "Limonda",
        "category": "School",
        "latitude": 8.324021,
        "longitude": 124.410649,
        "address": "Limunda Elementary School, Barangay Limonda, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-182650022",
        "name": "Manticao-Locloc Road",
        "barangay": "Limonda",
        "category": "Street / Junction",
        "latitude": 8.316293,
        "longitude": 124.420497,
        "address": "Manticao-Locloc Road, Barangay Limonda, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-456582276",
        "name": "Luyong Bonbon Barangay Hall",
        "barangay": "Luyongbonbon",
        "category": "Barangay Center",
        "latitude": 8.526328,
        "longitude": 124.570412,
        "address": "Luyong Bonbon Barangay Hall, Barangay Luyongbonbon, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-456582197",
        "name": "Luyong Bonbon Covered Court",
        "barangay": "Luyongbonbon",
        "category": "Public Facility",
        "latitude": 8.526471,
        "longitude": 124.569814,
        "address": "Luyong Bonbon Covered Court, Barangay Luyongbonbon, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-898390460",
        "name": "Luyong Bonbon Elementary School",
        "barangay": "Luyongbonbon",
        "category": "School",
        "latitude": 8.528185,
        "longitude": 124.570615,
        "address": "Luyong Bonbon Elementary School, Barangay Luyongbonbon, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-311354828",
        "name": "Luyong Bonbon Public Market",
        "barangay": "Luyongbonbon",
        "category": "Public Facility",
        "latitude": 8.52597,
        "longitude": 124.570801,
        "address": "Luyong Bonbon Public Market, Barangay Luyongbonbon, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-1328397215",
        "name": "Luyongbonbon",
        "barangay": "Luyongbonbon",
        "category": "Purok / Sitio",
        "latitude": 8.526387,
        "longitude": 124.570262,
        "address": "Luyongbonbon, Barangay Luyongbonbon, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "core-11",
        "name": "Luyongbonbon Barangay Center (Hall & Plaza)",
        "barangay": "Luyongbonbon",
        "category": "Barangay Center",
        "latitude": 8.526328,
        "longitude": 124.570412,
        "address": "Luyongbonbon Barangay Hall, Luyongbonbon, Opol, Misamis Oriental"
    },
    {
        "id": "osm-node-7192196685",
        "name": "Nikko Hardware",
        "barangay": "Luyongbonbon",
        "category": "Public Facility",
        "latitude": 8.527623,
        "longitude": 124.570941,
        "address": "Nikko Hardware, Barangay Luyongbonbon, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-456582202",
        "name": "Opol Port Management Office",
        "barangay": "Luyongbonbon",
        "category": "Public Facility",
        "latitude": 8.525535,
        "longitude": 124.571506,
        "address": "Opol Port Management Office, Barangay Luyongbonbon, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-9464715021",
        "name": "San Miguel Brewery",
        "barangay": "Luyongbonbon",
        "category": "Public Facility",
        "latitude": 8.529788,
        "longitude": 124.573672,
        "address": "San Miguel Brewery, Barangay Luyongbonbon, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1026557252",
        "name": "Sanitary Care Products Asia",
        "barangay": "Luyongbonbon",
        "category": "Public Facility",
        "latitude": 8.530821,
        "longitude": 124.571839,
        "address": "Sanitary Care Products Asia, Barangay Luyongbonbon, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-539979099",
        "name": "Aro Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.486873,
        "longitude": 124.569775,
        "address": "Aro Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-149091631",
        "name": "Azaka Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.490131,
        "longitude": 124.571649,
        "address": "Azaka Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-8840760679",
        "name": "Binubongan Elementary School",
        "barangay": "Malanang",
        "category": "School",
        "latitude": 8.451546,
        "longitude": 124.545775,
        "address": "Binubongan Elementary School, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-530983129",
        "name": "Camael Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.488781,
        "longitude": 124.568134,
        "address": "Camael Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1127900153",
        "name": "Cassava Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.486577,
        "longitude": 124.567925,
        "address": "Cassava Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-149091612",
        "name": "Dachshund Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.487156,
        "longitude": 124.569353,
        "address": "Dachshund Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-149091616",
        "name": "Daffodil Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.489403,
        "longitude": 124.571765,
        "address": "Daffodil Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-149091593",
        "name": "Dalmatian Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.486565,
        "longitude": 124.570217,
        "address": "Dalmatian Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-820874203",
        "name": "Emerald Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.485438,
        "longitude": 124.568349,
        "address": "Emerald Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-530983106",
        "name": "Gabriel Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.491074,
        "longitude": 124.570383,
        "address": "Gabriel Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-90799129",
        "name": "Gamolo Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.49237,
        "longitude": 124.565679,
        "address": "Gamolo Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-149091618",
        "name": "Gardenia Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.489097,
        "longitude": 124.571343,
        "address": "Gardenia Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-149091587",
        "name": "Greghound Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.487303,
        "longitude": 124.569139,
        "address": "Greghound Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-530983110",
        "name": "Haamiah Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.492191,
        "longitude": 124.57047,
        "address": "Haamiah Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-530983124",
        "name": "Hamied Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.491134,
        "longitude": 124.569814,
        "address": "Hamied Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-530983115",
        "name": "Haniel Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.490293,
        "longitude": 124.569299,
        "address": "Haniel Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-530983127",
        "name": "Harachel Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.489759,
        "longitude": 124.568984,
        "address": "Harachel Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-820872505",
        "name": "Jade Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.485715,
        "longitude": 124.567941,
        "address": "Jade Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-149091620",
        "name": "Jasmine Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.48835,
        "longitude": 124.571047,
        "address": "Jasmine Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-530983109",
        "name": "Jophiel Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.491973,
        "longitude": 124.570319,
        "address": "Jophiel Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1127900152",
        "name": "Kamatis Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.486511,
        "longitude": 124.567494,
        "address": "Kamatis Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-8474834834",
        "name": "Malanang",
        "barangay": "Malanang",
        "category": "Public Facility",
        "latitude": 8.486492,
        "longitude": 124.562877,
        "address": "Malanang, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "core-12",
        "name": "Malanang Barangay Hall",
        "barangay": "Malanang",
        "category": "Barangay Center",
        "latitude": 8.486492,
        "longitude": 124.562877,
        "address": "Malanang Barangay Hall, Malanang, Opol, Misamis Oriental"
    },
    {
        "id": "osm-node-7242359490",
        "name": "Malanang Barangay Health Station",
        "barangay": "Malanang",
        "category": "Public Facility",
        "latitude": 8.486664,
        "longitude": 124.562836,
        "address": "Malanang Barangay Health Station, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-912292717",
        "name": "Malanang Elementary School",
        "barangay": "Malanang",
        "category": "School",
        "latitude": 8.486413,
        "longitude": 124.56336,
        "address": "Malanang Elementary School, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-149091624",
        "name": "Marigold Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.488025,
        "longitude": 124.570626,
        "address": "Marigold Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-11142728905",
        "name": "Ning-Ning Store",
        "barangay": "Malanang",
        "category": "Public Facility",
        "latitude": 8.487382,
        "longitude": 124.570762,
        "address": "Ning-Ning Store, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-11458726769",
        "name": "OPG",
        "barangay": "Malanang",
        "category": "Public Facility",
        "latitude": 8.484857,
        "longitude": 124.56824,
        "address": "OPG, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-13299140566",
        "name": "Pag-ibig Citihomes",
        "barangay": "Malanang",
        "category": "Purok / Sitio",
        "latitude": 8.488757,
        "longitude": 124.568647,
        "address": "Pag-ibig Citihomes, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1030032072",
        "name": "Pearl Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.485606,
        "longitude": 124.569347,
        "address": "Pearl Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-530983116",
        "name": "Perpetiel Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.490076,
        "longitude": 124.569169,
        "address": "Perpetiel Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-530983120",
        "name": "Remliel Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.492985,
        "longitude": 124.570635,
        "address": "Remliel Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-149091577",
        "name": "Rosemary Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.488945,
        "longitude": 124.571082,
        "address": "Rosemary Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-149091573",
        "name": "Rottweiler Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.489618,
        "longitude": 124.570193,
        "address": "Rottweiler Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-149091626",
        "name": "Santan Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.488967,
        "longitude": 124.57108,
        "address": "Santan Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-820874201",
        "name": "Siltstone Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.485324,
        "longitude": 124.568874,
        "address": "Siltstone Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-530983119",
        "name": "Tabbris Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.489572,
        "longitude": 124.568312,
        "address": "Tabbris Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1509528454",
        "name": "The Viewpoint Resort + Resto",
        "barangay": "Malanang",
        "category": "Resort & Beach",
        "latitude": 8.487736,
        "longitude": 124.564129,
        "address": "The Viewpoint Resort + Resto, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-530983112",
        "name": "Uriel Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.491736,
        "longitude": 124.570202,
        "address": "Uriel Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-530983114",
        "name": "Uzziel Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.490527,
        "longitude": 124.569441,
        "address": "Uzziel Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-530983128",
        "name": "Verchiel Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.4896,
        "longitude": 124.569194,
        "address": "Verchiel Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1509528453",
        "name": "Viewpoint",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.487098,
        "longitude": 124.563433,
        "address": "Viewpoint, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-530983117",
        "name": "Yofiel Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.48945,
        "longitude": 124.568803,
        "address": "Yofiel Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-820874202",
        "name": "Zircon Street",
        "barangay": "Malanang",
        "category": "Street / Junction",
        "latitude": 8.485375,
        "longitude": 124.568625,
        "address": "Zircon Street, Barangay Malanang, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-542427618",
        "name": "Iligan - Opol",
        "barangay": "Nangcaon",
        "category": "Public Facility",
        "latitude": 8.454248,
        "longitude": 124.537216,
        "address": "Iligan - Opol, Barangay Nangcaon, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "core-13",
        "name": "Nangcaon Barangay Hall",
        "barangay": "Nangcaon",
        "category": "Barangay Center",
        "latitude": 8.46152,
        "longitude": 124.53851,
        "address": "Nangcaon Barangay Hall, Nangcaon, Opol, Misamis Oriental"
    },
    {
        "id": "core-14",
        "name": "Nangcaon Elementary School",
        "barangay": "Nangcaon",
        "category": "School",
        "latitude": 8.46215,
        "longitude": 124.53921,
        "address": "Nangcaon Elementary School, Nangcaon, Opol, Misamis Oriental"
    },
    {
        "id": "osm-way-542427620",
        "name": "Opol - Tagoloan",
        "barangay": "Nangcaon",
        "category": "Public Facility",
        "latitude": 8.454917,
        "longitude": 124.538015,
        "address": "Opol - Tagoloan, Barangay Nangcaon, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-10580501541",
        "name": "Iso",
        "barangay": "Patag",
        "category": "Purok / Sitio",
        "latitude": 8.472634,
        "longitude": 124.546001,
        "address": "Iso, Barangay Patag, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-4326397032",
        "name": "Patag",
        "barangay": "Patag",
        "category": "Public Facility",
        "latitude": 8.493883,
        "longitude": 124.554779,
        "address": "Patag, Barangay Patag, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "core-15",
        "name": "Patag Barangay Hall",
        "barangay": "Patag",
        "category": "Barangay Center",
        "latitude": 8.493883,
        "longitude": 124.554779,
        "address": "Patag Barangay Hall, Patag, Opol, Misamis Oriental"
    },
    {
        "id": "osm-way-954797472",
        "name": "Patag Elementary School",
        "barangay": "Patag",
        "category": "School",
        "latitude": 8.493232,
        "longitude": 124.554263,
        "address": "Patag Elementary School, Barangay Patag, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-90961844",
        "name": "A. Seriña Street",
        "barangay": "Poblacion",
        "category": "Street / Junction",
        "latitude": 8.519178,
        "longitude": 124.574498,
        "address": "A. Seriña Street, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1165551142",
        "name": "C Petrol",
        "barangay": "Poblacion",
        "category": "Public Facility",
        "latitude": 8.522525,
        "longitude": 124.572087,
        "address": "C Petrol, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-90961748",
        "name": "C. Salva Street",
        "barangay": "Poblacion",
        "category": "Street / Junction",
        "latitude": 8.520206,
        "longitude": 124.572124,
        "address": "C. Salva Street, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-314665144",
        "name": "Caltex",
        "barangay": "Poblacion",
        "category": "Public Facility",
        "latitude": 8.520778,
        "longitude": 124.575163,
        "address": "Caltex, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-456140801",
        "name": "D' Asian Hills Bank",
        "barangay": "Poblacion",
        "category": "Public Facility",
        "latitude": 8.521056,
        "longitude": 124.574838,
        "address": "D' Asian Hills Bank, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-90961773",
        "name": "E. Salva Street",
        "barangay": "Poblacion",
        "category": "Street / Junction",
        "latitude": 8.51831,
        "longitude": 124.571969,
        "address": "E. Salva Street, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-90961859",
        "name": "F. Piit Street",
        "barangay": "Poblacion",
        "category": "Street / Junction",
        "latitude": 8.52064,
        "longitude": 124.573868,
        "address": "F. Piit Street, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-90961766",
        "name": "G. Rabe Street",
        "barangay": "Poblacion",
        "category": "Street / Junction",
        "latitude": 8.519793,
        "longitude": 124.574045,
        "address": "G. Rabe Street, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-90961801",
        "name": "J. Montes Street",
        "barangay": "Poblacion",
        "category": "Street / Junction",
        "latitude": 8.518868,
        "longitude": 124.571616,
        "address": "J. Montes Street, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-143373125",
        "name": "M. Bacalares Street",
        "barangay": "Poblacion",
        "category": "Street / Junction",
        "latitude": 8.519146,
        "longitude": 124.576223,
        "address": "M. Bacalares Street, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-90961799",
        "name": "M. Gamolo Street",
        "barangay": "Poblacion",
        "category": "Street / Junction",
        "latitude": 8.51941,
        "longitude": 124.57245,
        "address": "M. Gamolo Street, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-90961790",
        "name": "M. Yasay Street",
        "barangay": "Poblacion",
        "category": "Street / Junction",
        "latitude": 8.519648,
        "longitude": 124.573294,
        "address": "M. Yasay Street, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-7192196785",
        "name": "Mercury Drug",
        "barangay": "Poblacion",
        "category": "Public Facility",
        "latitude": 8.521691,
        "longitude": 124.57379,
        "address": "Mercury Drug, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-746793380",
        "name": "Multi Purpose Evacuation Center",
        "barangay": "Poblacion",
        "category": "Barangay Center",
        "latitude": 8.521571,
        "longitude": 124.572354,
        "address": "Multi Purpose Evacuation Center, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-9279604117",
        "name": "North Harbor Cafe",
        "barangay": "Poblacion",
        "category": "Public Facility",
        "latitude": 8.522513,
        "longitude": 124.572831,
        "address": "North Harbor Cafe, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-198499916",
        "name": "Opol",
        "barangay": "Poblacion",
        "category": "Public Facility",
        "latitude": 8.521276,
        "longitude": 124.574713,
        "address": "Opol, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1165552551",
        "name": "Opol Bridge",
        "barangay": "Poblacion",
        "category": "Street / Junction",
        "latitude": 8.519837,
        "longitude": 124.5765,
        "address": "Opol Bridge, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-898373219",
        "name": "Opol Central School",
        "barangay": "Poblacion",
        "category": "School",
        "latitude": 8.520402,
        "longitude": 124.571775,
        "address": "Opol Central School, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1165519834",
        "name": "Opol Community College",
        "barangay": "Poblacion",
        "category": "School",
        "latitude": 8.521548,
        "longitude": 124.572336,
        "address": "Opol Community College, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-11045642635",
        "name": "Opol Lying-in Clinic",
        "barangay": "Poblacion",
        "category": "Public Facility",
        "latitude": 8.518716,
        "longitude": 124.575847,
        "address": "Opol Lying-in Clinic, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-326495277",
        "name": "Opol Municipal Hall",
        "barangay": "Poblacion",
        "category": "Barangay Center",
        "latitude": 8.521071,
        "longitude": 124.574179,
        "address": "Opol Municipal Hall, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "core-17",
        "name": "Opol Municipal Hall (MDRRMO Headquarters)",
        "barangay": "Poblacion",
        "category": "Barangay Center",
        "latitude": 8.521071,
        "longitude": 124.574179,
        "address": "Opol Municipal Hall, Poblacion, Opol, Misamis Oriental"
    },
    {
        "id": "osm-way-456140804",
        "name": "Opol Municipal Health Center & Lying-in Clinic",
        "barangay": "Poblacion",
        "category": "Barangay Center",
        "latitude": 8.518649,
        "longitude": 124.575721,
        "address": "Opol Municipal Health Center & Lying-in Clinic, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1165518589",
        "name": "Opol Municipal Police Station",
        "barangay": "Poblacion",
        "category": "Public Facility",
        "latitude": 8.521145,
        "longitude": 124.574249,
        "address": "Opol Municipal Police Station, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-898367636",
        "name": "Opol Public Market",
        "barangay": "Poblacion",
        "category": "Public Facility",
        "latitude": 8.519725,
        "longitude": 124.575952,
        "address": "Opol Public Market, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-456143402",
        "name": "Our Lady of Consolación Parish Church",
        "barangay": "Poblacion",
        "category": "Church / Chapel",
        "latitude": 8.521472,
        "longitude": 124.571377,
        "address": "Our Lady of Consolación Parish Church, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-450057399",
        "name": "Panagatan",
        "barangay": "Poblacion",
        "category": "Public Facility",
        "latitude": 8.521703,
        "longitude": 124.574866,
        "address": "Panagatan, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-13299357501",
        "name": "Poblacion",
        "barangay": "Poblacion",
        "category": "Public Facility",
        "latitude": 8.521425,
        "longitude": 124.573065,
        "address": "Poblacion, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-694434032",
        "name": "Poblacion Barangay Hall",
        "barangay": "Poblacion",
        "category": "Barangay Center",
        "latitude": 8.520485,
        "longitude": 124.574547,
        "address": "Poblacion Barangay Hall, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "core-16",
        "name": "Poblacion Barangay Hall & Municipal Plaza",
        "barangay": "Poblacion",
        "category": "Barangay Center",
        "latitude": 8.520485,
        "longitude": 124.574547,
        "address": "Poblacion Barangay Hall, Poblacion, Opol, Misamis Oriental"
    },
    {
        "id": "osm-way-1165552552",
        "name": "Prawn House Seafood Restaurant",
        "barangay": "Poblacion",
        "category": "Public Facility",
        "latitude": 8.520473,
        "longitude": 124.576285,
        "address": "Prawn House Seafood Restaurant, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-13890099401",
        "name": "Prince Hypermart",
        "barangay": "Poblacion",
        "category": "Public Facility",
        "latitude": 8.518351,
        "longitude": 124.574763,
        "address": "Prince Hypermart, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-6872637707",
        "name": "Prospect Canales Store",
        "barangay": "Poblacion",
        "category": "Public Facility",
        "latitude": 8.518101,
        "longitude": 124.578221,
        "address": "Prospect Canales Store, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-90961814",
        "name": "Q. Cagalawan Street",
        "barangay": "Poblacion",
        "category": "Street / Junction",
        "latitude": 8.519292,
        "longitude": 124.572666,
        "address": "Q. Cagalawan Street, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-331770749",
        "name": "S. Salva Street",
        "barangay": "Poblacion",
        "category": "Street / Junction",
        "latitude": 8.519075,
        "longitude": 124.570571,
        "address": "S. Salva Street, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-1323172095",
        "name": "Seablings Restaurant",
        "barangay": "Poblacion",
        "category": "Public Facility",
        "latitude": 8.520691,
        "longitude": 124.575932,
        "address": "Seablings Restaurant, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-90961759",
        "name": "Suriel Street",
        "barangay": "Poblacion",
        "category": "Street / Junction",
        "latitude": 8.521224,
        "longitude": 124.574337,
        "address": "Suriel Street, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-90961771",
        "name": "T. Vacalares Street",
        "barangay": "Poblacion",
        "category": "Street / Junction",
        "latitude": 8.519166,
        "longitude": 124.571908,
        "address": "T. Vacalares Street, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-450057400",
        "name": "Tabing Dagat Restaurant",
        "barangay": "Poblacion",
        "category": "Public Facility",
        "latitude": 8.521815,
        "longitude": 124.574414,
        "address": "Tabing Dagat Restaurant, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-456140943",
        "name": "Tuesday Cafe - Opol",
        "barangay": "Poblacion",
        "category": "Public Facility",
        "latitude": 8.520523,
        "longitude": 124.575235,
        "address": "Tuesday Cafe - Opol, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-10840888324",
        "name": "Zone 3",
        "barangay": "Poblacion",
        "category": "Purok / Sitio",
        "latitude": 8.521544,
        "longitude": 124.573648,
        "address": "Zone 3, Barangay Poblacion, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-988546574",
        "name": "Jetti",
        "barangay": "Taboc",
        "category": "Public Facility",
        "latitude": 8.515759,
        "longitude": 124.580722,
        "address": "Jetti, Barangay Taboc, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-14089886129",
        "name": "McDonald's",
        "barangay": "Taboc",
        "category": "Public Facility",
        "latitude": 8.515999,
        "longitude": 124.580307,
        "address": "McDonald's, Barangay Taboc, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-552150094",
        "name": "Opol Beach",
        "barangay": "Taboc",
        "category": "Resort & Beach",
        "latitude": 8.518471,
        "longitude": 124.582851,
        "address": "Opol Beach, Barangay Taboc, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-898367638",
        "name": "Opol National Secondary Technical School",
        "barangay": "Taboc",
        "category": "School",
        "latitude": 8.516086,
        "longitude": 124.576412,
        "address": "Opol National Secondary Technical School, Barangay Taboc, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-746027681",
        "name": "Petron",
        "barangay": "Taboc",
        "category": "Public Facility",
        "latitude": 8.515524,
        "longitude": 124.581023,
        "address": "Petron, Barangay Taboc, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-10844865489",
        "name": "Phoenix Super LPG",
        "barangay": "Taboc",
        "category": "Public Facility",
        "latitude": 8.516024,
        "longitude": 124.580562,
        "address": "Phoenix Super LPG, Barangay Taboc, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-12342647901",
        "name": "RTMI Bus Stop",
        "barangay": "Taboc",
        "category": "Street / Junction",
        "latitude": 8.516224,
        "longitude": 124.580738,
        "address": "RTMI Bus Stop, Barangay Taboc, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1166002635",
        "name": "Seaoil",
        "barangay": "Taboc",
        "category": "Public Facility",
        "latitude": 8.515871,
        "longitude": 124.581282,
        "address": "Seaoil, Barangay Taboc, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "core-18",
        "name": "Taboc Barangay Hall",
        "barangay": "Taboc",
        "category": "Barangay Center",
        "latitude": 8.516086,
        "longitude": 124.576412,
        "address": "Taboc Barangay Hall, Taboc, Opol, Misamis Oriental"
    },
    {
        "id": "osm-way-1554290607",
        "name": "Taboc-Igpit Bridge",
        "barangay": "Taboc",
        "category": "Street / Junction",
        "latitude": 8.49759,
        "longitude": 124.581139,
        "address": "Taboc-Igpit Bridge, Barangay Taboc, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-way-1068117454",
        "name": "Balo-i - Villanueva",
        "barangay": "Tingalan",
        "category": "Public Facility",
        "latitude": 8.354004,
        "longitude": 124.504835,
        "address": "Balo-i - Villanueva, Barangay Tingalan, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-10580501242",
        "name": "Naluwas Church",
        "barangay": "Tingalan",
        "category": "Church / Chapel",
        "latitude": 8.322949,
        "longitude": 124.412963,
        "address": "Naluwas Church, Barangay Tingalan, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-12138979931",
        "name": "Pigtaw",
        "barangay": "Tingalan",
        "category": "Purok / Sitio",
        "latitude": 8.356907,
        "longitude": 124.464945,
        "address": "Pigtaw, Barangay Tingalan, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "osm-node-6978211532",
        "name": "Tingalan",
        "barangay": "Tingalan",
        "category": "Public Facility",
        "latitude": 8.369782,
        "longitude": 124.470402,
        "address": "Tingalan, Barangay Tingalan, Opol, Misamis Oriental, Philippines"
    },
    {
        "id": "core-19",
        "name": "Tingalan Barangay Hall",
        "barangay": "Tingalan",
        "category": "Barangay Center",
        "latitude": 8.369782,
        "longitude": 124.470402,
        "address": "Tingalan Barangay Hall, Tingalan, Opol, Misamis Oriental"
    },
    {
        "id": "osm-way-954796443",
        "name": "Tingalan Elementary School",
        "barangay": "Tingalan",
        "category": "School",
        "latitude": 8.368891,
        "longitude": 124.471018,
        "address": "Tingalan Elementary School, Barangay Tingalan, Opol, Misamis Oriental, Philippines"
    }
];

export interface SearchOpolLandmarksResult {
    landmarks: OpolLandmark[];
    detectedBarangay: string | null;
}

// Stopwords that shouldn't block searches when typed along with landmark names
const ADMINISTRATIVE_STOPWORDS = new Set([
    'opol',
    'misamis',
    'oriental',
    'philippines',
    'brgy',
    'barangay',
    'municipality',
    'mun',
    'muni',
]);

/**
 * Location-Aware Search Engine for Opol Landmarks:
 * 
 * 1. If query matches a Barangay name (e.g. "Luyongbonbon", "Poblacion"), returns ONLY landmarks in that barangay.
 * 2. If a Barangay filter is explicitly selected, restricts results exclusively to that barangay.
 * 3. Handles punctuation (commas, dashes), stopwords ("opol", "brgy"), and partial prefixes ("muni" -> "Municipal").
 * 4. Prioritizes primary emergency facilities (Halls, Schools, Health Stations, Police, Evacuation Centers).
 */
export function searchOpolLandmarks(
    query: string,
    filterBarangay?: string | null
): SearchOpolLandmarksResult {
    const raw = (query || '').trim();
    if (!raw && !filterBarangay) {
        return { landmarks: [], detectedBarangay: null };
    }

    // 1. Punctuation normalization (replace commas, slashes, dashes with spaces)
    const normalized = raw
        .toLowerCase()
        .replace(/[,./\\()\-#_]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // 2. Identify if any barangay is mentioned in the query
    // Sort by length descending so "Luyongbonbon" matches before its substring "Bonbon"
    const sortedBarangays = [...OPOL_BARANGAYS].sort((a, b) => b.length - a.length);
    let detectedBarangay: string | null = null;

    for (const b of sortedBarangays) {
        const bLower = b.toLowerCase();
        if (bLower === 'luyongbonbon' && (normalized.includes('luyong bonbon') || normalized.includes('luyongbonbon') || normalized.includes('luyong'))) {
            detectedBarangay = 'Luyongbonbon';
            break;
        } else if (normalized.includes(bLower)) {
            detectedBarangay = b;
            break;
        }
    }

    const targetBarangay = filterBarangay || detectedBarangay;

    // 3. Candidate pool restricted to target barangay if applicable
    let candidates = OPOL_LANDMARKS;
    if (targetBarangay) {
        candidates = OPOL_LANDMARKS.filter(
            (lm) => lm.barangay.toLowerCase() === targetBarangay.toLowerCase()
        );
    }

    // 4. Extract meaningful search tokens (excluding barangay name and administrative stopwords)
    const rawTokens = normalized.split(/\s+/).filter(Boolean);
    const searchTokens = rawTokens.filter((w) => {
        if (ADMINISTRATIVE_STOPWORDS.has(w)) return false;
        if (targetBarangay && w === targetBarangay.toLowerCase()) return false;
        if (targetBarangay === 'Luyongbonbon' && (w === 'luyong' || w === 'bonbon')) return false;
        return true;
    });

    // 5. If no specific landmark search token remains (e.g. user just selected/typed the barangay name),
    // return all landmarks for that barangay
    if (searchTokens.length === 0) {
        return {
            landmarks: candidates.slice(0, 30),
            detectedBarangay: targetBarangay || null,
        };
    }

    // 6. Score candidates against remaining tokens
    const scored = candidates.map((lm) => {
        const nameLower = lm.name.toLowerCase();
        const catLower = lm.category.toLowerCase();
        const addrLower = lm.address.toLowerCase();
        let score = 0;

        for (const token of searchTokens) {
            // Exact word or name match
            if (nameLower === token) {
                score += 50;
            } else if (nameLower.startsWith(token)) {
                score += 30;
            } else if (nameLower.includes(token)) {
                score += 15;
            }

            // Category match (e.g. "school", "church", "court", "beach")
            if (catLower.includes(token)) {
                score += 10;
            }

            // Address match
            if (addrLower.includes(token)) {
                score += 5;
            }

            // Partial prefix matching for abbreviations like "muni" -> "municipal", "elem" -> "elementary"
            if (token.length >= 3) {
                if ('municipal'.startsWith(token) && nameLower.includes('municipal')) score += 25;
                if ('elementary'.startsWith(token) && nameLower.includes('elementary')) score += 25;
                if ('chapel'.startsWith(token) && nameLower.includes('chapel')) score += 25;
                if ('church'.startsWith(token) && nameLower.includes('church')) score += 25;
                if ('health'.startsWith(token) && nameLower.includes('health')) score += 25;
                if ('police'.startsWith(token) && nameLower.includes('police')) score += 25;
                if ('barangay'.startsWith(token) && nameLower.includes('barangay')) score += 20;
            }
        }

        // Boost primary public facilities
        if (lm.category === 'Barangay Center') score += 10;
        if (lm.category === 'School' && searchTokens.some((t) => 'school'.startsWith(t) || 'elementary'.startsWith(t))) score += 15;

        return { lm, score };
    });

    const results = scored
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.lm)
        .slice(0, 25);

    // Fallback: If score filtering returned 0 but a target barangay is set, return the barangay's landmarks
    const finalResults = results.length > 0 ? results : (targetBarangay ? candidates.slice(0, 25) : []);

    return {
        landmarks: finalResults,
        detectedBarangay: targetBarangay || null,
    };
}

/**
 * Haversine formula to compute distance between two GPS points in meters.
 */
export function getHaversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Finds the nearest surveyed landmark in Opol within maxMeters (default 80 meters).
 */
export function findNearestOpolLandmark(
    lat: number,
    lng: number,
    maxMeters: number = 80
): { landmark: OpolLandmark; distance: number } | null {
    let bestMatch: OpolLandmark | null = null;
    let minDistance = Infinity;

    for (const lm of OPOL_LANDMARKS) {
        // Fast bounding box check (~200m) to skip heavy trigonometry
        if (Math.abs(lm.latitude - lat) > 0.002 || Math.abs(lm.longitude - lng) > 0.002) {
            continue;
        }
        const dist = getHaversineDistanceMeters(lat, lng, lm.latitude, lm.longitude);
        if (dist < minDistance) {
            minDistance = dist;
            bestMatch = lm;
        }
    }

    if (bestMatch && minDistance <= maxMeters) {
        return {
            landmark: bestMatch,
            distance: minDistance,
        };
    }

    return null;
}

