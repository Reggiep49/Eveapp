// Catalog, worlds and reference data. Sample content only: no live retailer data.

export const stores = [
  {id: 'target', name: 'Target', mark: 'target', detail: 'Little adventures, big imaginations'},
  {id: 'lego', name: 'LEGO Store', mark: 'brick', detail: 'A world they can build'},
  {id: 'books', name: 'Barnes & Noble', mark: 'book', detail: 'Wonder, stories, and discovery'},
];

// Toy boxes are percentages of the whole illustration: centre x/y, width, height.
export const realms = [
  {id: 'workshop', title: 'The Midnight Toymakers', short: 'Workshop', line: 'Follow the lanterns. Every little invention has a story.', color: '#ffc46b', toys: [
    {id: 'tiles', x: 13.7, y: 23.8, w: 19.3, h: 33.8}, {id: 'train', x: 35.3, y: 45.1, w: 24.8, h: 18.7}, {id: 'truck', x: 24.6, y: 75.5, w: 33.7, h: 32.9},
    {id: 'robot', x: 65.1, y: 28.9, w: 13.2, h: 28.2}, {id: 'dinosaur', x: 88, y: 38.1, w: 23.1, h: 26}, {id: 'fireengine', x: 76, y: 71.4, w: 30.3, h: 32.9}]},
  {id: 'cozy', title: 'The House of Little Wonders', short: 'Fireside', line: 'A fireside full of things to make, play, and love.', color: '#ff9f8a', toys: [
    {id: 'bunny', x: 14.1, y: 27.4, w: 16.6, h: 30.5}, {id: 'art', x: 36.8, y: 37.7, w: 16.7, h: 22.4}, {id: 'dollhouse', x: 22.5, y: 66.5, w: 27.8, h: 42.9},
    {id: 'bear', x: 66.1, y: 29.5, w: 14.4, h: 26.1}, {id: 'ukulele', x: 86.2, y: 36.3, w: 12.3, h: 39.9}, {id: 'craft', x: 74.1, y: 69.1, w: 24.4, h: 35.5}]},
  {id: 'observatory', title: 'Beyond the Northern Lights', short: 'Observatory', line: 'For the part of you that wants to discover everything.', color: '#7ee8e0', toys: [
    {id: 'telescope', x: 15.9, y: 30.2, w: 18.5, h: 36.1}, {id: 'rocket', x: 36.2, y: 39.7, w: 9.7, h: 32.7}, {id: 'globe', x: 22, y: 68.5, w: 14.8, h: 38.2},
    {id: 'solar', x: 67.9, y: 30.8, w: 22.5, h: 30.5}, {id: 'microscope', x: 88.3, y: 42.2, w: 11.4, h: 32.4}, {id: 'astronaut', x: 73.1, y: 67.6, w: 15.1, h: 31.8}]},
];

export const ART = {width: 1672, height: 941};

export const gifts = [
  ['tiles', 'lego', 'Winter Castle Building Set', 'Build & Play', '5+', 39.99, 'A castle with a thousand possible stories.', 'Stack colorful magnetic pieces into towers, secret rooms, and bridges. Every day, a different kingdom.', '48 magnetic pieces and a build guide', 'Can you build a bridge wide enough for a reindeer?', 'The castle windows light up.'],
  ['train', 'target', 'Little Timber Train', 'Build & Play', '3+', 29.99, 'Next stop: absolutely anywhere.', 'Connect the carriages, lay a winding track, and take the little red engine somewhere only you can imagine.', 'An engine, 2 carriages, and 12 wooden tracks', 'Make a station out of blocks and give your train a snowy place to stop.', 'All aboard! The train pulls out of the station.'],
  ['truck', 'target', 'Trailblazer RC Truck', 'Discover', '6+', 44.99, 'Turn the living room into the wild.', 'Rumble over rugs and climb cushion mountains. Big rubber tires and a four-way controller put your next adventure in your hands.', 'RC truck, controller, and rechargeable truck battery', 'Build a trail with a tunnel and a hill. Where will it lead?', 'The truck revs and climbs a snowbank.'],
  ['robot', 'target', 'Pip’s Wind-Up Robot', 'Build & Play', '5+', 34.99, 'A little friend with big ideas.', 'Turn the key, set Pip down, and send him on a mission through your make-believe workshop.', 'Wind-up robot and a story card', 'What important mission will you give Pip first?', 'Pip wakes up and does a little dance.'],
  ['dinosaur', 'target', 'Roaming Rex Dinosaur', 'Build & Play', '4+', 27.99, 'A roar from a world before ours.', 'Meet a friendly poseable dinosaur. Move his arms, tail, and jaw, then turn the room into your very own prehistoric jungle.', 'Poseable dinosaur and a discovery booklet', 'Can you make a jungle out of the things in your room?', 'Rex stomps and lets out a roar.'],
  ['fireengine', 'target', 'Firehouse Rescue Truck', 'Build & Play', '4+', 36.99, 'Big adventures. A very brave crew.', 'Raise the ladder, roll out the hoses, and make up a rescue story with this bright red fire engine.', 'Toy fire engine with movable ladder', 'Who needs a helping hand in your imaginary town?', 'The fire truck flashes its lights and rolls out.'],
  ['bunny', 'target', 'Marshmallow Bunny', 'Cozy & Creative', '3+', 19.99, 'Some adventures start with a cuddle.', 'Velvety ears, a tiny scarf, and a very important job: keeping you company through every story and dream.', 'One 12-inch plush bunny with a stitched scarf', 'What will you name your new story-time friend?'],
  ['art', 'books', 'Little Studio Watercolor Kit', 'Cozy & Creative', '5+', 24.99, 'Paint the world the way you see it.', 'Open the little tin, dip your brush, and turn a blank page into a winter forest, a dragon, or a whole new world.', '12 colors, 2 brushes, and 10 watercolor sheets', 'Can you paint snow using blue and purple?'],
  ['dollhouse', 'lego', 'Little Lantern Dollhouse', 'Cozy & Creative', '5+', 69.99, 'A tiny home for enormous stories.', 'Arrange the little rooms, move the furniture, and invent a family of characters who live in your very own wooden house.', 'Wooden house and 12 miniature furnishings', 'Which room will become the secret headquarters?'],
  ['bear', 'target', 'Hearthside Teddy Bear', 'Cozy & Creative', '3+', 22.99, 'The best listener in the whole house.', 'A soft brown bear with a gentle smile. Just the friend for a bedtime story, a pretend picnic, or a very important cuddle.', 'One 14-inch plush teddy bear', 'Tell your bear about your favorite part of today.'],
  ['ukulele', 'books', 'My First Little Ukulele', 'Cozy & Creative', '6+', 32.99, 'Your first song is waiting for you.', 'A small wooden ukulele with four gentle strings. Strum, explore different sounds, and start making music with a grown-up.', 'Child-size ukulele, pick, and beginner song cards', 'Can you invent a tune for a reindeer parade?'],
  ['craft', 'books', 'Make a Little Magic Craft Box', 'Cozy & Creative', '6+', 26.99, 'A box of almost-anything.', 'Turn colorful felt, yarn, and ribbons into little creatures and holiday keepsakes. Ask a grown-up to help with the tools.', 'Felt, yarn, safety scissors, and idea cards', 'Make a tiny creature no one has ever seen before.'],
  ['telescope', 'books', 'Starlight Telescope', 'Discover', '7+', 54.99, 'The universe is waiting up for you.', 'Set your telescope on a steady table, point it at the Moon, and discover craters that look like another world. Explore with a grown-up; never look at the Sun.', 'A telescope, tabletop tripod, and Moon guide', 'Draw the Moon tonight. Will it look the same next week?'],
  ['rocket', 'lego', 'Moonbound Rocket Explorer', 'Discover', '6+', 42.99, 'Next stop: your imagination.', 'Build your own red-and-white rocket, imagine the countdown, and take a crew of toy astronauts on a brand-new mission.', 'Rocket model, stand, and mission cards', 'What would you pack for a trip to the Moon?'],
  ['globe', 'books', 'Little World Explorer Globe', 'Discover', '6+', 34.99, 'A whole world of somewhere-new.', 'Spin a blue-and-gold globe and discover oceans, continents, and faraway places. Follow a pretend journey around the world.', 'Desk globe and exploration cards', 'Find a place you’d love to visit with your family.'],
  ['solar', 'books', 'My Little Solar System', 'Discover', '7+', 39.99, 'A universe on your tabletop.', 'Explore the planets on a beautiful little model of our solar system. Spin the arms and imagine their great journeys around the Sun.', 'Solar system model and planet guide', 'Which planet would have the most surprising weather?'],
  ['microscope', 'books', 'Tiny Worlds Microscope', 'Discover', '7+', 49.99, 'The smallest things have big secrets.', 'Look closely at leaves and other prepared samples with a grown-up. A tiny world of shapes and patterns is waiting.', 'Starter microscope, slides, and discovery guide', 'What does a leaf look like up very, very close?'],
  ['astronaut', 'target', 'Cosmo the Astronaut', 'Discover', '3+', 24.99, 'A soft friend for faraway adventures.', 'Meet Cosmo, a cuddly astronaut ready for moonwalks across the living room and sleepy trips to the stars.', 'One 12-inch astronaut plush', 'What will you and Cosmo name your spaceship?'],
].map(([id, store, name, category, age, price, short, detail, inside, play, alive]) => {
  const realm = realms.find(r => r.toys.some(t => t.id === id));
  return {id, store, name, category, age, price, short, detail, inside, play, realm: realm.id,
    alive: alive || 'A little North Pole magic wakes it up.'};
});

export const activities = ['Build a railroad together', 'Build a blanket fort', 'Put on a puppet show', 'Make Christmas pancakes'];

export const shipmentStates = [
  {name: 'Order placed', tone: 'neutral', description: 'The store is getting your order ready.'},
  {name: 'Shipped', tone: 'info', description: 'The carrier picked up the package.'},
  {name: 'Delayed', tone: 'warn', description: 'Weather delayed the package by two days.'},
  {name: 'Arrives tomorrow', tone: 'info', description: 'The package is one day away.'},
  {name: 'Out for delivery', tone: 'good', description: 'The package is on its way to your door today.'},
  {name: 'Delivered', tone: 'good', description: 'The carrier marked the package delivered.'},
];

export const routeByStore = {
  target: {carrier: 'UPS', days: 3},
  lego: {carrier: 'FedEx', days: 4},
  books: {carrier: 'USPS', days: 5},
};

export const findGift = id => gifts.find(g => g.id === id);
export const getStore = id => stores.find(s => s.id === id);
export const findRealm = id => realms.find(r => r.id === id);
