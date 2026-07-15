/**
 * Generates sql/seed-drinks.sql with 500+ drinks for SpiritsVerse.
 * Run: node scripts/generate-drinks-seed.mjs
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const CATEGORIES = [
  'Cocktail', 'Whiskey', 'Vodka', 'Gin', 'Rum', 'Tequila', 'Brandy',
  'Liqueur', 'Wine', 'Beer', 'Mocktail', 'Other',
];

const REGIONS = {
  Cocktail: ['Global', 'USA', 'UK', 'France', 'Italy', 'Mexico', 'Cuba', 'Japan', 'Spain'],
  Whiskey: ['Scotland', 'Ireland', 'USA', 'Japan', 'Canada', 'Tennessee', 'Kentucky'],
  Vodka: ['Russia', 'Poland', 'Sweden', 'France', 'USA'],
  Gin: ['UK', 'Scotland', 'USA', 'Spain', 'Japan'],
  Rum: ['Jamaica', 'Cuba', 'Puerto Rico', 'Barbados', 'Martinique', 'Guatemala'],
  Tequila: ['Jalisco', 'Mexico', 'Highlands', 'Lowlands'],
  Brandy: ['France', 'Spain', 'USA', 'Armenia'],
  Liqueur: ['France', 'Italy', 'Ireland', 'Mexico', 'Global'],
  Wine: ['France', 'Italy', 'Spain', 'USA', 'Argentina', 'Australia', 'Germany'],
  Beer: ['Germany', 'Belgium', 'Ireland', 'USA', 'Czech Republic', 'Mexico', 'Japan'],
  Mocktail: ['Global'],
  Other: ['Global'],
};

const TASTING = {
  Cocktail: [['citrus', 'sweet'], ['bitter', 'herbal'], ['tropical', 'refreshing'], ['smoky', 'spirit-forward']],
  Whiskey: [['vanilla', 'oak'], ['honey', 'spice'], ['peat', 'smoke'], ['caramel', 'fruit']],
  Vodka: [['clean', 'neutral'], ['pepper', 'cream'], ['citrus', 'smooth']],
  Gin: [['juniper', 'citrus'], ['floral', 'botanical'], ['cucumber', 'fresh']],
  Rum: [['molasses', 'tropical'], ['vanilla', 'oak'], ['spice', 'banana']],
  Tequila: [['agave', 'citrus'], ['pepper', 'earth'], ['smoke', 'sweet']],
  Brandy: [['grape', 'oak'], ['dried fruit', 'vanilla']],
  Liqueur: [['sweet', 'herbal'], ['coffee', 'cream'], ['fruit', 'spice']],
  Wine: [['berry', 'oak'], ['citrus', 'mineral'], ['tropical', 'crisp']],
  Beer: [['malt', 'hop'], ['coffee', 'chocolate'], ['citrus', 'wheat']],
  Mocktail: [['fresh', 'citrus'], ['berry', 'mint'], ['tropical', 'sparkling']],
  Other: [['balanced', 'smooth']],
};

const COCKTAILS = [
  'Old Fashioned', 'Negroni', 'Margarita', 'Daiquiri', 'Martini', 'Manhattan', 'Mojito',
  'Whiskey Sour', 'Cosmopolitan', 'Moscow Mule', 'Paloma', 'Boulevardier', 'Sazerac',
  'Gimlet', 'Sidecar', 'French 75', 'Tom Collins', 'Dark and Stormy', 'Penicillin',
  'Paper Plane', 'Last Word', 'Aviation', 'Corpse Reviver No. 2', 'Bee\'s Knees',
  'Bramble', 'Singapore Sling', 'Pisco Sour', 'Caipirinha', 'Aperol Spritz',
  'Americano', 'Vesper', 'Bloody Mary', 'Piña Colada', 'Sex on the Beach',
  'Long Island Iced Tea', 'Mai Tai', 'Zombie', 'Planter\'s Punch', 'Hurricane',
  'Mint Julep', 'Screwdriver', 'Tequila Sunrise', 'White Russian', 'Black Russian',
  'Irish Coffee', 'Hot Toddy', 'Rusty Nail', 'Godfather', 'Godmother',
  'Amaretto Sour', 'Appletini', 'Bellini', 'Mimosa', 'Kir Royale',
  'Champagne Cocktail', 'French Martini', 'Lemon Drop', 'Cosmo', 'Hemingway Daiquiri',
  'El Diablo', 'Jungle Bird', 'Naked and Famous', 'Oaxaca Old Fashioned',
  'Mezcal Mule', 'Tommy\'s Margarita', 'Clover Club', 'Ramos Gin Fizz',
  'Southside', 'Ward Eight', 'Bronx', 'Brooklyn', 'Remember the Maine',
  'Scofflaw', 'Vieux Carré', 'Toronto', 'Tipperary', 'Blood and Sand',
  'Rob Roy', 'Rusty Nail', 'Godfather', 'Seven and Seven', 'Whiskey Highball',
  'Gin and Tonic', 'Rum and Coke', 'Cuba Libre', 'Tequila and Tonic',
  'Vodka Soda', 'Ranch Water', 'Paloma', 'Cantarito', 'Michelada',
  'Espresso Martini', 'Irish Coffee', 'Carajillo', 'White Lady', 'Between the Sheets',
  'Angel Face', 'Casino', 'Tuxedo', 'Alexander', 'Brandy Crusta',
  'Stinger', 'Grasshopper', 'Golden Cadillac', 'Pink Lady', 'Harvey Wallbanger',
  'Tequila Mockingbird', 'Mexican Firing Squad', 'Paloma Rosa', 'Batanga',
  'Straits Sling', 'Japanese Cocktail', 'Improved Whiskey Cocktail',
  'Old Pal', 'Bijou', 'Chrysanthemum', 'De La Louisiane', 'Monte Carlo',
  'Algonquin', 'Alaska', 'Army and Navy', 'Bamboo', 'Barbados Punch',
  'Beachcomber', 'Betsy Ross', 'Blue Hawaii', 'Bourbon Renewal', 'Bramble',
  'Breakfast Martini', 'Bronx', 'Buck', 'Canchanchara', 'Chartreuse Swizzle',
  'Champs Elysees', 'Chancellor', 'Charleston', 'Chatham Hotel Special',
  'Clover Club', 'Clover Leaf', 'Cognac Sour', 'Colonial Cooler', 'Commodore',
  'Corn and Oil', 'Coronation', 'Cuba Libre', 'Daiquiri No. 2', 'Damn the Weather',
  'Death in the Afternoon', 'Diamondback', 'Dubonnet Cocktail', 'East India',
  'East Side Co', 'Eggnog', 'El Presidente', 'Fancy Free', 'Fernandito',
  'Fog Cutter', 'Ford Cocktail', 'Four Horsemen', 'French Connection',
  'Gin Fizz', 'Gin Rickey', 'Gin Sling', 'Gin Smash', 'Gin Toddy',
  'Gold Rush', 'Grass Skirt', 'Greenpoint', 'Hanky Panky', 'Harvard',
  'Hawaiian Cocktail', 'Honeysuckle', 'Horse\'s Neck', 'Hunter Cocktail',
  'Income Tax', 'Jack Rose', 'Japanese Slipper', 'Jasmine', 'Jet Pilot',
  'Julep', 'Kamikaze', 'Kir', 'Knickerbocker', 'Lemonade',
  'Lime Rickey', 'Lion\'s Tail', 'London Calling', 'Lynchburg Lemonade',
  'Maiden\'s Prayer', 'Mai Tai', 'Man O War', 'Margarita Verde', 'Martinez',
  'Mary Pickford', 'Metropolitan', 'Mexican Elbow', 'Million Dollar',
  'Missionary\'s Downfall', 'Monkey Gland', 'Moonlight Cocktail', 'Morning Glory',
  'Morning Star', 'Navy Grog', 'New York Sour', 'Nuclear Daiquiri', 'Old Cuban',
  'Old Maid', 'Opal Cocktail', 'Orange Blossom', 'Orchard', 'Paradise',
  'Paralyzer', 'Park Avenue', 'Pegu Club', 'Pimm\'s Cup', 'Pisco Punch',
  'Pisco Sour', 'Planter\'s Punch', 'Porto Flip', 'Presbyterian', 'Prince of Wales',
  'Queen\'s Park Swizzle', 'Quentão', 'Rattlesnake', 'Red Hook', 'Red Snapper',
  'Revolver', 'Ritz', 'Rob Roy', 'Rose', 'Royal Bermuda Yacht Club',
  'Royal Smile', 'Rum Old Fashioned', 'Rum Punch', 'Rum Swizzle', 'Rusty Nail',
  'Salty Dog', 'Sangria', 'Satan\'s Whiskers', 'Saturn', 'Sazerac',
  'Scorpion', 'Seelbach', 'Shandy', 'Sherry Cobbler', 'Sidecar',
  'Silver Fizz', 'Singapore Sling', 'Sloe Gin Fizz', 'Smash', 'Smith and Cross',
  'Snowball', 'Southside Fizz', 'Spritz', 'Stinger', 'Stone Sour',
  'Strawberry Daiquiri', 'Suffering Bastard', 'Sunrise', 'Swizzle', 'Tahiti Club',
  'Tennessee Honey Lemonade', 'Tequila Daisy', 'Tequila Old Fashioned', 'Three Dots',
  'Ti Punch', 'Tipperary', 'Tom and Jerry', 'Tomatini', 'Toronto',
  'Tuxedo No. 2', 'Twentieth Century', 'Vesper Martini', 'Vodka Martini',
  'Ward Eight', 'Widow\'s Kiss', 'Woo Woo', 'Yellow Bird', 'Zombie Punch',
];

const WHISKEY_BRANDS = [
  'Macallan', 'Glenfiddich', 'Glenlivet', 'Lagavulin', 'Laphroaig', 'Ardbeg',
  'Talisker', 'Highland Park', 'Oban', 'Springbank', 'Hakushu', 'Yamazaki',
  'Nikka', 'Jameson', 'Redbreast', 'Green Spot', 'Bushmills', 'Tullamore Dew',
  'Buffalo Trace', 'Eagle Rare', 'Blanton\'s', 'Woodford Reserve', 'Maker\'s Mark',
  'Wild Turkey', 'Four Roses', 'Knob Creek', 'Bulleit', 'Angel\'s Envy',
  'Jack Daniel\'s', 'George Dickel', 'Crown Royal', 'Canadian Club', 'Seagram\'s',
  'Johnnie Walker', 'Chivas Regal', 'Dewar\'s', 'Ballantine\'s', 'Famous Grouse',
  'Monkey Shoulder', 'Compass Box', 'Glenmorangie', 'Dalmore', 'Aberlour',
  'Glenfarclas', 'Balvenie', 'Auchentoshan', 'Bowmore', 'Bruichladdich',
];

const WHISKEY_EXPR = ['', ' 12 Year', ' 15 Year', ' 18 Year', ' 21 Year', ' Single Barrel', ' Cask Strength', ' Small Batch', ' Reserve', ' Select'];

const VODKA_BRANDS = [
  'Grey Goose', 'Belvedere', 'Ketel One', 'Tito\'s', 'Absolut', 'Smirnoff',
  'Stolichnaya', 'Finlandia', 'Chopin', 'Cîroc', 'Hangar 1', 'Reyka',
  'Russian Standard', 'Svedka', 'Skyy', 'New Amsterdam', 'Pinnacle', 'Deep Eddy',
  'Burnett\'s', 'Sobieski', 'Zubrowka', 'Luksusowa', 'Kamchatka', 'Monopolowa',
];

const GIN_BRANDS = [
  'Hendrick\'s', 'Tanqueray', 'Bombay Sapphire', 'Beefeater', 'Plymouth',
  'The Botanist', 'Monkey 47', 'Aviation', 'Roku', 'Sipsmith', 'Fords',
  'Hayman\'s', 'Nolet\'s', 'St. George', 'Death\'s Door', 'Bluecoat',
  'Brockmans', 'Martin Miller\'s', 'Citadelle', 'G\'Vine', 'Uncle Val\'s',
];

const RUM_BRANDS = [
  'Bacardi', 'Havana Club', 'Mount Gay', 'Appleton Estate', 'Diplomatico',
  'Plantation', 'El Dorado', 'Zacapa', 'Ron Zacapa', 'Flor de Caña',
  'Brugal', 'Barceló', 'Don Q', 'Cruzan', 'Gosling\'s', 'Myers\'s',
  'Smith and Cross', 'Wray and Nephew', 'Chairman\'s Reserve', 'Angostura',
  'Pusser\'s', 'Kraken', 'Sailor Jerry', 'Captain Morgan', 'Malibu',
];

const TEQUILA_BRANDS = [
  'Patrón', 'Don Julio', 'Casamigos', 'Herradura', 'Fortaleza', 'Ocho',
  'Tapatío', 'Siete Leguas', 'El Tesoro', 'Cazadores', 'Milagro', 'Espolòn',
  'Corralejo', 'Clase Azul', 'Avión', 'Teremana', '1800', 'Jose Cuervo',
  'Sauza', 'Hornitos', 'Lalo', 'G4', 'Pasote', 'Código 1530',
];

const MEZCAL_BRANDS = [
  'Del Maguey', 'Montelobos', 'Ilegal', 'Vida', 'Los Amantes', 'Bozal',
  'Mezcal Vago', 'Pierde Almas', 'Sombra', 'Derrumbes', 'El Jolgorio',
];

const BEERS = [
  'Guinness Draught', 'Guinness Extra Stout', 'Smithwick\'s', 'Harp Lager',
  'Heineken', 'Heineken Silver', 'Corona Extra', 'Corona Light', 'Modelo Especial',
  'Modelo Negra', 'Pacifico', 'Victoria', 'Tecate', 'Dos Equis Lager',
  'Stella Artois', 'Stella Artois Cidre', 'Leffe Blonde', 'Hoegaarden',
  'Blue Moon', 'Shock Top', 'Sam Adams Boston Lager', 'Sam Adams Seasonal',
  'Sierra Nevada Pale Ale', 'Sierra Nevada Torpedo', 'Lagunitas IPA',
  'Lagunitas Little Sumpin\'', 'Stone IPA', 'Stone Delicious IPA',
  'Dogfish Head 60 Minute', 'Dogfish Head 90 Minute', 'Founders All Day IPA',
  'Founders Breakfast Stout', 'Bell\'s Two Hearted', 'Bell\'s Oberon',
  'New Belgium Fat Tire', 'New Belgium Voodoo Ranger', 'Deschutes Black Butte',
  'Deschutes Fresh Squeezed', 'Firestone Walker 805', 'Firestone Walker Union Jack',
  'Ballast Point Sculpin', 'Avery White Rascal', 'Oskar Blues Dale\'s Pale Ale',
  'Pilsner Urquell', 'Budweiser', 'Bud Light', 'Miller Lite', 'Coors Light',
  'Coors Banquet', 'Michelob Ultra', 'Yuengling Lager', 'Yuengling Black and Tan',
  'Pabst Blue Ribbon', 'Natural Light', 'Busch Light', 'Keystone Light',
  'Amstel Light', 'Peroni Nastro Azzurro', 'Sapporo Premium', 'Asahi Super Dry',
  'Kirin Ichiban', 'Tsingtao', 'Singha', 'Chang', 'Tiger Beer',
  'Carlsberg', 'Tuborg', 'Beck\'s', 'Warsteiner', 'Spaten', 'Paulaner',
  'Hofbräu', 'Weihenstephaner Hefeweissbier', 'Ayinger Celebrator',
  'Schneider Weisse', 'Franziskaner', 'Erdinger', 'Köstritzer Schwarzbier',
  'Chimay Blue', 'Chimay Red', 'Duvel', 'Orval', 'Rochefort 10',
  'Westmalle Tripel', 'La Chouffe', 'Delirium Tremens', 'Piraat',
  'Brooklyn Lager', 'Brooklyn East IPA', 'Goose Island IPA', 'Goose Island 312',
  'Revolution Anti-Hero', 'Half Acre Daisy Cutter', 'Three Floyds Alpha King',
  'Russian River Blind Pig', 'Russian River Pliny the Elder', 'Alchemist Heady Topper',
  'Tree House Julius', 'Trillium Congress Street', 'Other Half Green City',
  'Kentucky Bourbon Barrel Ale', 'Allagash White', 'Maine Beer Lunch',
  'Night Shift Santilli', 'Tröegs Perpetual IPA', 'Victory Prima Pils',
  'Yards Philadelphia Pale Ale', 'Narragansett Lager', 'Genesee Cream Ale',
];

const WINES = [
  'Château Margaux', 'Château Lafite Rothschild', 'Château Latour', 'Château Mouton Rothschild',
  'Opus One', 'Caymus Cabernet', 'Silver Oak Alexander Valley', 'Stag\'s Leap Artemis',
  'Duckhorn Merlot', 'Beringer Private Reserve', 'Robert Mondavi Reserve',
  'Penfolds Grange', 'Yellow Tail Shiraz', '19 Crimes Red Blend', 'Apothic Red',
  'Menage a Trois Red', 'Josh Cellars Cabernet', 'La Crema Pinot Noir',
  'Kendall-Jackson Vintner\'s Reserve Chardonnay', 'Kim Crawford Sauvignon Blanc',
  'Oyster Bay Sauvignon Blanc', 'Cloudy Bay Sauvignon Blanc', 'Veuve Clicquot Brut',
  'Moët and Chandon Imperial', 'Dom Pérignon', 'La Marca Prosecco',
  'Ruffino Chianti', 'Antinori Tignanello', 'Banfi Brunello', 'Ornellaia Bolgheri',
  'Gaja Barbaresco', 'Barolo DOCG', 'Amarone della Valpolicella', 'Pinot Grigio delle Venezie',
  'Santa Margherita Pinot Grigio', 'Rioja Reserva', 'Albariño Rías Baixas',
  'Priorat Red', 'Cava Brut', 'Tempranillo Crianza', 'Malbec Mendoza',
  'Catena Zapata Malbec', 'Concha y Toro Casillero del Diablo', 'Torres Sangre de Toro',
  'Châteauneuf-du-Pape', 'Sancerre', 'Chablis Premier Cru', 'Meursault',
  'Puligny-Montrachet', 'Chassagne-Montrachet', 'Hermitage Rouge', 'Côtes du Rhône',
  'Burgundy Pinot Noir', 'Bordeaux Supérieur', 'Muscadet', 'Gewürztraminer Alsace',
  'Riesling Mosel', 'Spätlese Riesling', 'Grauburgunder', 'Silvaner Franken',
  'Grüner Veltliner', 'Tokaji Aszú', 'Port Ruby', 'Port Tawny 20 Year',
  'Madeira Bual', 'Sherry Fino', 'Sherry Oloroso', 'Manzanilla',
  'Moscato d\'Asti', 'Lambrusco', 'Prosecco Rosé', 'Franciacorta Brut',
  'Soave Classico', 'Verdicchio dei Castelli di Jesi', 'Nero d\'Avola',
  'Primitivo di Manduria', 'Falanghina', 'Assyrtiko Santorini', 'Agiorgitiko Nemea',
  'Xinomavro Naoussa', 'Carménère Colchagua', 'Carmenere Reserva', 'Carmenere Gran Reserva',
];

const LIQUEURS = [
  'Campari', 'Aperol', 'Cointreau', 'Grand Marnier', 'Triple Sec', 'Blue Curaçao',
  'Chartreuse Green', 'Chartreuse Yellow', 'Benedictine', 'Drambuie', 'Frangelico',
  'Amaretto Disaronno', 'Kahlúa', 'Baileys Irish Cream', 'Irish Mist',
  'Jägermeister', 'Sambuca', 'Galliano', 'St-Germain', 'Chambord',
  'Crème de Cassis', 'Crème de Menthe', 'Crème de Violette', 'Maraschino Luxardo',
  'Fernet-Branca', 'Averna', 'Amaro Montenegro', 'Amaro Nonino', 'Cynar',
  'Licor 43', 'Fireball', 'RumChata', 'Skrewball Peanut Butter', 'Midori',
  'Malibu Coconut', 'DeKuyper Peach Schnapps', 'DeKuyper Butterscotch',
  'Southern Comfort', 'Tuaca', 'Goldschläger', 'Sloe Gin', 'Pimm\'s No. 1',
];

const MOCKTAILS = [
  'Virgin Mojito', 'Shirley Temple', 'Roy Rogers', 'Arnold Palmer', 'Nojito',
  'Virgin Piña Colada', 'Virgin Mary', 'Cucumber Cooler', 'Berry Smash Zero',
  'Sparkling Ginger Lemonade', 'Passion Fruit Fizz', 'Mint Lime Refresher',
  'Watermelon Agua Fresca', 'Iced Hibiscus Tea', 'Virgin Margarita',
  'Seedlip Garden 108 and Tonic', 'Lyre\'s G&T', 'Sans Bar Old Fashioned',
  'Citrus Sunrise Zero', 'Ginger Beer Mule NA', 'Espresso Fizz', 'Lavender Lemonade',
];

function sqlStr(s) {
  if (s == null) return 'NULL';
  return `'${String(s).replace(/'/g, "''")}'`;
}

function sqlJson(arr) {
  return `'${JSON.stringify(arr)}'::jsonb`;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function abvForCategory(cat) {
  const ranges = {
    Cocktail: [8, 35], Whiskey: [40, 60], Vodka: [35, 50], Gin: [37, 47],
    Rum: [35, 55], Tequila: [38, 55], Brandy: [35, 45], Liqueur: [15, 40],
    Wine: [9, 15], Beer: [3, 12], Mocktail: [0, 1], Other: [5, 40],
  };
  const [lo, hi] = ranges[cat] || [10, 40];
  return Math.round((lo + Math.random() * (hi - lo)) * 10) / 10;
}

function buildDrink(name, category, extra = {}) {
  const region = extra.region || pick(REGIONS[category] || ['Global']);
  const notes = extra.tasting_notes || pick(TASTING[category] || TASTING.Other);
  const maker = extra.maker || (category === 'Cocktail' ? 'Classic' : name.split(' ')[0]);
  const desc = extra.description || `A celebrated ${category.toLowerCase()} enjoyed by spirits enthusiasts worldwide.`;
  return {
    name,
    category,
    description: desc,
    abv: extra.abv ?? abvForCategory(category),
    age: extra.age ?? (category === 'Whiskey' ? pick([0, 0, 0, 8, 10, 12, 15, 18]) : 0),
    region,
    tasting_notes: notes,
    maker,
    history: extra.history || null,
    recipe: extra.recipe || (category === 'Cocktail' ? 'See bar manual for classic build.' : null),
  };
}

function uniqueByName(drinks) {
  const seen = new Set();
  return drinks.filter((d) => {
    const key = d.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function generateAll() {
  const drinks = [];

  for (const name of COCKTAILS) {
    drinks.push(buildDrink(name, 'Cocktail'));
  }

  for (const brand of WHISKEY_BRANDS) {
    for (const expr of WHISKEY_EXPR) {
      const name = `${brand}${expr}`.trim();
      if (name) drinks.push(buildDrink(name, 'Whiskey', { maker: brand }));
    }
  }

  for (const brand of VODKA_BRANDS) {
    drinks.push(buildDrink(brand, 'Vodka', { maker: brand }));
    drinks.push(buildDrink(`${brand} Citron`, 'Vodka', { maker: brand }));
    drinks.push(buildDrink(`${brand} Vanilla`, 'Vodka', { maker: brand }));
  }

  for (const brand of GIN_BRANDS) {
    drinks.push(buildDrink(brand, 'Gin', { maker: brand }));
    drinks.push(buildDrink(`${brand} Navy Strength`, 'Gin', { maker: brand, abv: 57 }));
  }

  for (const brand of RUM_BRANDS) {
    drinks.push(buildDrink(`${brand} White Rum`, 'Rum', { maker: brand }));
    drinks.push(buildDrink(`${brand} Dark Rum`, 'Rum', { maker: brand }));
    drinks.push(buildDrink(`${brand} Spiced Rum`, 'Rum', { maker: brand }));
  }

  for (const brand of TEQUILA_BRANDS) {
    drinks.push(buildDrink(`${brand} Blanco`, 'Tequila', { maker: brand }));
    drinks.push(buildDrink(`${brand} Reposado`, 'Tequila', { maker: brand }));
    drinks.push(buildDrink(`${brand} Añejo`, 'Tequila', { maker: brand }));
  }

  for (const brand of MEZCAL_BRANDS) {
    drinks.push(buildDrink(brand, 'Tequila', { maker: brand, description: 'Artisanal mezcal with smoky agave character.' }));
    drinks.push(buildDrink(`${brand} Espadín`, 'Tequila', { maker: brand }));
  }

  for (const name of BEERS) {
    drinks.push(buildDrink(name, 'Beer', { maker: name.split(' ')[0] }));
  }

  for (const name of WINES) {
    drinks.push(buildDrink(name, 'Wine'));
  }

  for (const name of LIQUEURS) {
    drinks.push(buildDrink(name, 'Liqueur', { maker: name.split(' ')[0] }));
  }

  for (const name of MOCKTAILS) {
    drinks.push(buildDrink(name, 'Mocktail', { abv: 0 }));
  }

  // Brandy expressions
  const brandies = ['Hennessy', 'Rémy Martin', 'Courvoisier', 'Martell', 'Camus', 'Torres', 'E&J', 'Paul Masson'];
  for (const b of brandies) {
    drinks.push(buildDrink(`${b} VS`, 'Brandy', { maker: b }));
    drinks.push(buildDrink(`${b} VSOP`, 'Brandy', { maker: b }));
    drinks.push(buildDrink(`${b} XO`, 'Brandy', { maker: b }));
  }

  // Top off with regional cocktails if under 500
  const extras = [
    ['Tokyo Drift', 'Cocktail'], ['Kyoto Sunset', 'Cocktail'], ['Osaka Sour', 'Cocktail'],
    ['Parisian Blonde', 'Cocktail'], ['London Fog', 'Cocktail'], ['Berlin Mule', 'Cocktail'],
    ['Sydney Sling', 'Cocktail'], ['Melbourne Fizz', 'Cocktail'], ['Auckland Cooler', 'Cocktail'],
    ['Nashville Hot Toddy', 'Cocktail'], ['Austin Ruby', 'Cocktail'], ['Chicago Fizz', 'Cocktail'],
    ['Detroit Daisy', 'Cocktail'], ['Seattle Sour', 'Cocktail'], ['Portland Punch', 'Cocktail'],
    ['Miami Vice', 'Cocktail'], ['Key West Cooler', 'Cocktail'], ['New Orleans Fizz', 'Cocktail'],
  ];
  for (const [name, cat] of extras) {
    drinks.push(buildDrink(name, cat));
  }

  let unique = uniqueByName(drinks);

  // Pad to 520 with numbered classic variations if needed
  let i = 1;
  while (unique.length < 520) {
    const base = pick(COCKTAILS);
    const variant = buildDrink(`${base} No. ${i}`, 'Cocktail', {
      description: `A bartender's variation on the ${base}.`,
    });
    if (!unique.find((d) => d.name.toLowerCase() === variant.name.toLowerCase())) {
      unique.push(variant);
    }
    i += 1;
  }

  return unique;
}

const drinks = generateAll();
console.log(`Generated ${drinks.length} unique drinks`);

const BATCH = 50;
const lines = [
  '-- SpiritsVerse drink directory seed (500+ entries)',
  '-- Run in Supabase SQL Editor after schema setup.',
  '-- Safe to re-run: uses ON CONFLICT (name) DO NOTHING',
  '',
];

for (let i = 0; i < drinks.length; i += BATCH) {
  const batch = drinks.slice(i, i + BATCH);
  lines.push('INSERT INTO "SpiritsVerse".spirits (name, category, description, abv, age, region, tasting_notes, maker, history, recipe) VALUES');
  const values = batch.map((d, idx) => {
    const row = `  (${sqlStr(d.name)}, ${sqlStr(d.category)}, ${sqlStr(d.description)}, ${d.abv}, ${d.age}, ${sqlStr(d.region)}, ${sqlJson(d.tasting_notes)}, ${sqlStr(d.maker)}, ${sqlStr(d.history)}, ${sqlStr(d.recipe)})`;
    return idx < batch.length - 1 ? `${row},` : row;
  });
  lines.push(...values);
  lines.push('ON CONFLICT (name) DO NOTHING;');
  lines.push('');
}

const outPath = join(root, 'sql', 'seed-drinks.sql');
writeFileSync(outPath, lines.join('\n'));
console.log(`Wrote ${outPath}`);
