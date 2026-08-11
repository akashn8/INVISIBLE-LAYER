// === COMBINED DATA: Satellite + Time Use ===
// Sources:
// - UCS Satellite Database (https://www.ucsusa.org/resources/satellite-database)
// - OECD Time Use Database (https://www.oecd.org/en/data/datasets/time-use-database.html)
// - BLS ATUS 2025 (https://www.bls.gov/tus/)
// - Our World in Data (https://ourworldindata.org/time-use)
// - NASA/CelesTrak

var SAT_DATA = {
  total: 18560,
  categories: [
    { id: 'comms', name: 'Communications', count: 6172, examples: ['Starlink-5291','OneWeb-0421','Iridium 163','SES-17','Intelsat 40e','Viasat-3'] },
    { id: 'nav', name: 'Navigation', count: 137, examples: ['GPS IIF-12','GLONASS-M 761','Galileo 27','BeiDou-3 M23','NavIC-1G'] },
    { id: 'weather', name: 'Weather & Climate', count: 94, examples: ['GOES-18','Meteosat-12','Himawari-9','FY-4B','JPSS-2'] },
    { id: 'earthobs', name: 'Earth Observation', count: 1205, examples: ['Landsat 9','Sentinel-2B','WorldView-4','Planet Dove','RADARSAT-C'] },
    { id: 'science', name: 'Space Science', count: 192, examples: ['Hubble','James Webb','TESS','SWIFT','Chandra'] },
    { id: 'other', name: 'Military & Other', count: 2552, examples: ['ISS (Zarya)','USA-326','Yaogan-39','Cosmos 2562','NROL-85'] }
  ]
};

var TIME_DATA = {
  countries: {
    Japan: { flag: "🇯🇵", sleep: 6.3, work: 5.5, unpaidWork: 1.5, eating: 1.6, leisure: 4.0, personalCare: 1.3, commute: 1.4, other: 2.4 },
    USA: { flag: "🇺🇸", sleep: 8.8, work: 3.8, unpaidWork: 2.0, eating: 1.2, leisure: 5.2, personalCare: 0.8, commute: 0.8, other: 1.4 },
    France: { flag: "🇫🇷", sleep: 8.5, work: 2.7, unpaidWork: 2.3, eating: 2.2, leisure: 4.0, personalCare: 1.0, commute: 0.6, other: 2.7 },
    Germany: { flag: "🇩🇪", sleep: 8.2, work: 3.3, unpaidWork: 2.4, eating: 1.6, leisure: 4.3, personalCare: 1.0, commute: 0.7, other: 2.5 },
    India: { flag: "🇮🇳", sleep: 8.0, work: 4.7, unpaidWork: 2.8, eating: 1.3, leisure: 3.5, personalCare: 1.2, commute: 1.0, other: 1.5 },
    Brazil: { flag: "🇧🇷", sleep: 8.3, work: 4.1, unpaidWork: 1.8, eating: 1.4, leisure: 4.2, personalCare: 1.1, commute: 1.2, other: 1.9 },
    Norway: { flag: "🇳🇴", sleep: 8.0, work: 3.2, unpaidWork: 2.6, eating: 1.2, leisure: 5.0, personalCare: 0.9, commute: 0.5, other: 2.6 },
    SouthKorea: { flag: "🇰🇷", sleep: 7.5, work: 4.8, unpaidWork: 1.4, eating: 1.8, leisure: 4.2, personalCare: 1.2, commute: 1.2, other: 1.9 },
    Mexico: { flag: "🇲🇽", sleep: 8.4, work: 4.6, unpaidWork: 2.7, eating: 1.1, leisure: 3.2, personalCare: 1.0, commute: 1.2, other: 1.8 },
    Italy: { flag: "🇮🇹", sleep: 8.3, work: 2.9, unpaidWork: 2.5, eating: 1.8, leisure: 4.3, personalCare: 1.1, commute: 0.7, other: 2.4 }
  },
  globalAverage: { sleep: 7.5, work: 3.9, unpaidWork: 2.2, eating: 1.5, leisure: 4.2, personalCare: 1.0, commute: 0.9, other: 2.8 },
  screenTime: {
    "South Africa": 10.5, "Brazil": 9.4, "Philippines": 9.1, "USA": 7.1,
    "UK": 6.8, "India": 6.7, "Germany": 5.9, "France": 5.6, "South Korea": 5.1, "Japan": 4.4
  },
  lifetime: {
    labels: ["Sleeping","Working","Screen Time","Eating","Commuting","Housework","Socializing","Exercise","Education","Other"],
    years: [26, 10.5, 11, 3.5, 4.3, 6, 5, 1.3, 4.5, 6.9]
  }
};

// Bridge data: mapping activities to satellite dependencies — specific and surprising
var BRIDGE_DATA = [
  {
    activity: 'Sleep',
    hours: 7.5,
    icon: '💤',
    satellite: 'Your phone alarm is accurate because it syncs to GPS atomic clocks every few hours. Without satellites, your alarm drifts 1 second per day — enough to make you late in a week.',
    sats: ['GPS III-5', 'GLONASS-M'],
    satCount: 4
  },
  {
    activity: 'Commute',
    hours: 0.9,
    icon: '🚗',
    satellite: 'Your phone pinged GPS 2,400+ times during a 30-minute commute. Every lane change, every turn, every ETA update. <a href="https://www.qualcomm.com/research/projects/gnss" target="_blank" style="color:var(--phosphor);opacity:0.6;font-size:10px;">(Qualcomm GNSS)</a>',
    sats: ['GPS IIF-12', 'GLONASS-M', 'Galileo 27', 'BeiDou-3'],
    satCount: 12
  },
  {
    activity: 'Work',
    hours: 3.9,
    icon: '💼',
    satellite: 'Every video call you take is timed by satellite-synced servers. Chat messages are sequenced using GPS-derived timestamps. Your pay clears because banks use satellite atomic clocks to order transactions. <a href="https://londoneconomics.co.uk/blog/publication/economic-impact-disruption-gnss/" target="_blank" style="color:var(--phosphor);opacity:0.6;font-size:10px;">(London Economics)</a>',
    sats: ['SES-17', 'GPS III-1', 'Intelsat 40e'],
    satCount: 18
  },
  {
    activity: 'Eating',
    hours: 1.5,
    icon: '🍽️',
    satellite: 'The wheat in your bread was planted by a GPS-guided tractor accurate to 2cm. Whoever brought you your last meal — a delivery rider, a market vendor\'s supply truck — checked satellite positioning hundreds of times to get there.',
    sats: ['GPS IIF-9', 'Landsat 9', 'Planet Dove'],
    satCount: 8
  },
  {
    activity: 'Leisure & Screen',
    hours: 4.2,
    icon: '📱',
    satellite: 'Whatever you\'re streaming routes through satellite-timed CDN nodes. Any photo tagged with a location used GPS to do it. Search results anywhere in the world are ranked on servers that sync clocks 16 times per day via satellite.',
    sats: ['Starlink-5291', 'SES-17', 'Eutelsat HB'],
    satCount: 24
  },
  {
    activity: 'Personal Care',
    hours: 1.0,
    icon: '☂️',
    satellite: 'Checked if you need an umbrella? That forecast came from a satellite 35,786 km above you that scans Earth every 10 minutes. Your weather app refreshes 6x/hour — all from orbit.',
    sats: ['GOES-18', 'Meteosat-12', 'JPSS-2'],
    satCount: 3
  }
];

// Trivia: fun, surprising, tighter tolerances
var GAME_QUESTIONS = [
  { question: "How many active satellites are orbiting Earth right now — thousands?", answer: 18.5, tolerance: 4, unit: "K", step: 1, max: 30, fact: "About 18,500! And 70% belong to just one company — SpaceX Starlink." },
  { question: "The Japanese sleep the least in the world. How many hours per night?", answer: 6, tolerance: 1, unit: "hrs", step: 1, max: 10, fact: "Just 6.3 hours. They also have a word for death from overwork: karoshi." },
  { question: "Your phone talks to how many GPS satellites at once to find you?", answer: 4, tolerance: 1, unit: "", step: 1, max: 10, fact: "4 minimum — 3 for position + 1 to fix your phone's terrible clock." },
  { question: "Norwegians enjoy how many hours of leisure per day?", answer: 5, tolerance: 1, unit: "hrs", step: 1, max: 9, fact: "5 hours! Yet they have one of the highest GDPs per capita. Rest = productivity." },
  { question: "How many hours a day do Brazilians spend socializing face-to-face?", answer: 2, tolerance: 1, unit: "hrs", step: 1, max: 6, fact: "Over 2 hours daily — world champions of in-person connection. Sundays are sacred BBQ time." },
  { question: "South Africans have the highest screen time globally. How many hours/day?", answer: 10, tolerance: 1, unit: "hrs", step: 1, max: 14, fact: "10.5 hours per day! That's almost all waking hours staring at a screen." },
  { question: "How many countries have sent people to the International Space Station?", answer: 19, tolerance: 2, unit: "", step: 1, max: 40, fact: "19 countries — the most collaborative engineering project ever built by humanity." },
  { question: "Italy and France barely work. How many hours of paid work per day in France?", answer: 3, tolerance: 1, unit: "hrs", step: 1, max: 8, fact: "Just 2.7 hours! Fewest in the OECD. Still the 7th largest economy. Productivity ≠ hours." },
  { question: "What percentage of the world's large farms use GPS-guided equipment?", answer: 70, tolerance: 10, unit: "%", step: 5, max: 100, fact: "70%! Your food was planted by a GPS-guided tractor. Space feeds you every day." },
  { question: "South Korea works how many hours daily? (Hint: more than Japan)", answer: 5, tolerance: 1, unit: "hrs", step: 1, max: 9, fact: "4.8 hours of paid work — close to Japan. K-drama binge time is earned the hard way." }
];
