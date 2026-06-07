// Static map of common competitive move names → Pokemon type
// Covers the most frequently seen moves in Smogon usage stats
export const MOVE_TYPES: Record<string, string> = {
  // Normal
  'Boomburst': 'normal', 'Body Slam': 'normal', 'Double-Edge': 'normal', 'Extreme Speed': 'normal',
  'Facade': 'normal', 'Hyper Voice': 'normal', 'Last Resort': 'normal', 'Quick Attack': 'normal',
  'Return': 'normal', 'Slash': 'normal', 'Tackle': 'normal', 'Tri Attack': 'normal',
  'Recover': 'normal', 'Soft-Boiled': 'normal', 'Wish': 'normal', 'Protect': 'normal',
  'Substitute': 'normal', 'Swords Dance': 'normal', 'Nasty Plot': 'normal', 'Calm Mind': 'normal',
  'Amnesia': 'normal', 'Haze': 'normal', 'Baton Pass': 'normal', 'Encore': 'normal',
  'Taunt': 'normal', 'Toxic': 'poison', 'Whirlwind': 'normal', 'Roar': 'normal',
  'Entrainment': 'normal', 'Minimize': 'normal',

  // Fire
  'Flamethrower': 'fire', 'Fire Blast': 'fire', 'Overheat': 'fire', 'Heat Wave': 'fire',
  'Lava Plume': 'fire', 'Sacred Fire': 'fire', 'Flare Blitz': 'fire', 'Fire Fang': 'fire',
  'Will-O-Wisp': 'fire', 'Fire Spin': 'fire', 'Ember': 'fire', 'V-create': 'fire',
  'Mystical Fire': 'fire', 'Torch Song': 'fire', 'Inferno': 'fire',

  // Water
  'Surf': 'water', 'Scald': 'water', 'Hydro Pump': 'water', 'Waterfall': 'water',
  'Aqua Jet': 'water', 'Aqua Tail': 'water', 'Liquidation': 'water', 'Rain Dance': 'water',
  'Water Spout': 'water', 'Origin Pulse': 'water', 'Flip Turn': 'water', 'Jet Punch': 'water',
  'Chilling Water': 'water', 'Wave Crash': 'water', 'Crabhammer': 'water', 'Muddy Water': 'water',
  'Ice Spinner': 'ice',

  // Electric
  'Thunderbolt': 'electric', 'Thunder': 'electric', 'Volt Switch': 'electric', 'Thunder Wave': 'electric',
  'Wild Charge': 'electric', 'Discharge': 'electric', 'Zap Cannon': 'electric',
  'Volt Tackle': 'electric', 'Parabolic Charge': 'electric', 'Electroweb': 'electric',
  'Thunder Punch': 'electric', 'Charge Beam': 'electric', 'Nuzzle': 'electric',
  'Rising Voltage': 'electric', 'Aura Sphere': 'fighting',

  // Grass
  'Energy Ball': 'grass', 'Giga Drain': 'grass', 'Leaf Storm': 'grass', 'Power Whip': 'grass',
  'Seed Flare': 'grass', 'Spore': 'grass', 'Sleep Powder': 'grass', 'Leech Seed': 'grass',
  'Synthesis': 'grass', 'Wood Hammer': 'grass', 'Leaf Blade': 'grass', 'Bullet Seed': 'grass',
  'Solar Beam': 'grass', 'Solar Blade': 'grass', 'Grassy Glide': 'grass', 'Pollen Puff': 'grass',
  'Petal Dance': 'grass', 'Petal Blizzard': 'grass',

  // Ice
  'Blizzard': 'ice', 'Ice Beam': 'ice', 'Freeze-Dry': 'ice', 'Icicle Crash': 'ice',
  'Ice Punch': 'ice', 'Ice Fang': 'ice', 'Aurora Veil': 'ice', 'Hail': 'ice',
  'Triple Axel': 'ice', 'Glacial Lance': 'ice', 'Snowscape': 'ice',

  // Fighting
  'Close Combat': 'fighting', 'Focus Blast': 'fighting', 'Superpower': 'fighting',
  'Drain Punch': 'fighting', 'Mach Punch': 'fighting', 'High Jump Kick': 'fighting',
  'Jump Kick': 'fighting', 'Circle Throw': 'fighting', 'Seismic Toss': 'fighting',
  'Low Kick': 'fighting', 'Low Sweep': 'fighting', 'Cross Chop': 'fighting',
  'Sacred Sword': 'fighting', 'Secret Sword': 'fighting', 'Vacuum Wave': 'fighting',
  'Bulk Up': 'fighting', 'Coaching': 'fighting',

  // Poison
  'Sludge Bomb': 'poison', 'Sludge Wave': 'poison', 'Poison Jab': 'poison', 'Gunk Shot': 'poison',
  'Venoshock': 'poison', 'Cross Poison': 'poison',

  // Ground
  'Earthquake': 'ground', 'Earth Power': 'ground', 'Precipice Blades': 'ground',
  'High Horsepower': 'ground', 'Bulldoze': 'ground', 'Sand Attack': 'ground',
  'Shore Up': 'ground', 'Spikes': 'ground',

  // Flying
  'Brave Bird': 'flying', 'Hurricane': 'flying', 'Acrobatics': 'flying', 'Roost': 'flying',
  'Air Slash': 'flying', 'Dual Wingbeat': 'flying', 'Fly': 'flying', 'Bounce': 'flying',
  'Tailwind': 'flying', 'Defog': 'flying', 'Aerial Ace': 'flying',

  // Psychic
  'Psychic': 'psychic', 'Psyshock': 'psychic', 'Psystrike': 'psychic', 'Zen Headbutt': 'psychic',
  'Future Sight': 'psychic', 'Trick Room': 'psychic', 'Trick': 'psychic', 'Healing Wish': 'psychic',
  'Lunar Dance': 'psychic', 'Teleport': 'psychic', 'Reflect': 'psychic', 'Light Screen': 'psychic',
  'Expanding Force': 'psychic', 'Armor Cannon': 'fire',

  // Bug
  'Bug Buzz': 'bug', 'U-turn': 'bug', 'Leech Life': 'bug', 'Pin Missile': 'bug',
  'Signal Beam': 'bug', 'Megahorn': 'bug', 'X-Scissor': 'bug',

  // Rock
  'Stone Edge': 'rock', 'Rock Slide': 'rock', 'Stealth Rock': 'rock', 'Head Smash': 'rock',
  'Rock Blast': 'rock', 'Smack Down': 'rock', 'Power Gem': 'rock',

  // Ghost
  'Shadow Ball': 'ghost', 'Shadow Claw': 'ghost', 'Hex': 'ghost', 'Poltergeist': 'ghost',
  'Phantom Force': 'ghost', 'Shadow Sneak': 'ghost',
  'Destiny Bond': 'ghost', 'Pain Split': 'normal',

  // Dragon
  'Dragon Dance': 'dragon', 'Dragon Claw': 'dragon', 'Outrage': 'dragon', 'Draco Meteor': 'dragon',
  'Dragon Pulse': 'dragon', 'Dragon Tail': 'dragon', 'Dual Chop': 'dragon', 'Scale Shot': 'dragon',
  'Roar of Time': 'dragon', 'Eternabeam': 'dragon',

  // Dark
  'Dark Pulse': 'dark', 'Crunch': 'dark', 'Knock Off': 'dark', 'Sucker Punch': 'dark',
  'Night Slash': 'dark', 'Wicked Blow': 'dark', 'Foul Play': 'dark', 'Snarl': 'dark',
  'Pursuit': 'dark', 'Thief': 'dark', 'Payback': 'dark', 'Parting Shot': 'dark',

  // Steel
  'Iron Head': 'steel', 'Flash Cannon': 'steel', 'Meteor Mash': 'steel', 'Bullet Punch': 'steel',
  'Iron Defense': 'steel', 'Steel Beam': 'steel', 'Heavy Slam': 'steel', 'Smart Strike': 'steel',
  'Shift Gear': 'steel', 'Doom Desire': 'steel', 'Sunsteel Strike': 'steel', 'Tachyon Cutter': 'steel',

  // Fairy
  'Moonblast': 'fairy', 'Dazzling Gleam': 'fairy', 'Play Rough': 'fairy', 'Charm': 'fairy',
  'Moonlight': 'fairy', 'Misty Terrain': 'fairy', 'Sparkling Aria': 'water',
  'Spirit Break': 'fairy', 'Strange Steam': 'fairy', 'Draining Kiss': 'fairy',
  'Baby-Doll Eyes': 'fairy', 'Fleur Cannon': 'fairy',
}

export function getMoveType(moveName: string): string | null {
  return MOVE_TYPES[moveName] ?? null
}
