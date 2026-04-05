// ============================================================
// Isla Drop — Full Product Catalogue
// Markup rules:
//   Alcohol (wine, beer, spirits, champagne): +30% on Spain avg
//   Tobacco: +40% on Spain avg
//   Snacks, water, wellness: +20% on Ibiza supermarket avg
// ============================================================

export const PRODUCTS = [

  // ── SOFT DRINKS / CARBONATED ─────────────────────────────
  // Base Ibiza supermarket avg, +20%
  { id: 'sd-001', name: 'Coke 330ml 4 Pack',             category: 'soft_drinks', sub: 'carbonated', emoji: '🥤', price: 5.40,  age_restricted: false, popular: true  },
  { id: 'sd-002', name: 'Coke 330ml 12 Pack',            category: 'soft_drinks', sub: 'carbonated', emoji: '🥤', price: 13.80, age_restricted: false, popular: false },
  { id: 'sd-003', name: 'Coke 330ml 24 Pack',            category: 'soft_drinks', sub: 'carbonated', emoji: '🥤', price: 24.00, age_restricted: false, popular: false },
  { id: 'sd-004', name: 'Coke 1.75 Litre',               category: 'soft_drinks', sub: 'carbonated', emoji: '🥤', price: 3.60,  age_restricted: false, popular: false },
  { id: 'sd-005', name: 'Coke Zero 330ml 4 Pack',        category: 'soft_drinks', sub: 'carbonated', emoji: '🥤', price: 5.40,  age_restricted: false, popular: false },
  { id: 'sd-006', name: 'Coke Zero 330ml 12 Pack',       category: 'soft_drinks', sub: 'carbonated', emoji: '🥤', price: 13.80, age_restricted: false, popular: false },
  { id: 'sd-007', name: 'Coke Zero 330ml 24 Pack',       category: 'soft_drinks', sub: 'carbonated', emoji: '🥤', price: 24.00, age_restricted: false, popular: false },
  { id: 'sd-008', name: 'Coke Zero 1.75 Litre',          category: 'soft_drinks', sub: 'carbonated', emoji: '🥤', price: 3.60,  age_restricted: false, popular: false },
  { id: 'sd-009', name: 'Diet Coke 330ml 4 Pack',        category: 'soft_drinks', sub: 'carbonated', emoji: '🥤', price: 5.40,  age_restricted: false, popular: false },
  { id: 'sd-010', name: 'Diet Coke 330ml 12 Pack',       category: 'soft_drinks', sub: 'carbonated', emoji: '🥤', price: 13.80, age_restricted: false, popular: false },
  { id: 'sd-011', name: 'Diet Coke 330ml 24 Pack',       category: 'soft_drinks', sub: 'carbonated', emoji: '🥤', price: 24.00, age_restricted: false, popular: false },
  { id: 'sd-012', name: 'Diet Coke 1.75 Litre',          category: 'soft_drinks', sub: 'carbonated', emoji: '🥤', price: 3.60,  age_restricted: false, popular: false },
  { id: 'sd-013', name: 'Fanta Lemon 330ml 4 Pack',      category: 'soft_drinks', sub: 'carbonated', emoji: '🍋', price: 5.40,  age_restricted: false, popular: false },
  { id: 'sd-014', name: 'Fanta Lemon 330ml 8 Pack',      category: 'soft_drinks', sub: 'carbonated', emoji: '🍋', price: 9.60,  age_restricted: false, popular: false },
  { id: 'sd-015', name: 'Fanta Orange 330ml 4 Pack',     category: 'soft_drinks', sub: 'carbonated', emoji: '🍊', price: 5.40,  age_restricted: false, popular: true  },
  { id: 'sd-016', name: 'Fanta Orange 330ml 8 Pack',     category: 'soft_drinks', sub: 'carbonated', emoji: '🍊', price: 9.60,  age_restricted: false, popular: false },
  { id: 'sd-017', name: 'Sprite 330ml 4 Pack',           category: 'soft_drinks', sub: 'carbonated', emoji: '🥤', price: 5.40,  age_restricted: false, popular: false },
  { id: 'sd-018', name: 'Sprite 330ml 8 Pack',           category: 'soft_drinks', sub: 'carbonated', emoji: '🥤', price: 9.60,  age_restricted: false, popular: false },
  { id: 'sd-019', name: 'San Pellegrino Lemon 330ml 6pk',category: 'soft_drinks', sub: 'carbonated', emoji: '🍋', price: 8.40,  age_restricted: false, popular: true  },
  { id: 'sd-020', name: 'Lipton Lemon Ice Tea',          category: 'soft_drinks', sub: 'carbonated', emoji: '🍵', price: 2.76,  age_restricted: false, popular: false },
  { id: 'sd-021', name: 'Red Bull 250ml 4 Pack',         category: 'soft_drinks', sub: 'energy',     emoji: '⚡', price: 9.60,  age_restricted: false, popular: true  },
  { id: 'sd-022', name: 'Red Bull Light 250ml 4 Pack',   category: 'soft_drinks', sub: 'energy',     emoji: '⚡', price: 9.60,  age_restricted: false, popular: false },
  { id: 'sd-023', name: 'Monster Energy 500ml 4 Pack',   category: 'soft_drinks', sub: 'energy',     emoji: '⚡', price: 12.00, age_restricted: false, popular: false },
  { id: 'sd-024', name: 'Schweppes Soda Water 1L',       category: 'soft_drinks', sub: 'mixers',     emoji: '💧', price: 2.76,  age_restricted: false, popular: false },
  { id: 'sd-025', name: 'Schweppes Tonic Water 1L',      category: 'soft_drinks', sub: 'mixers',     emoji: '💧', price: 2.76,  age_restricted: false, popular: true  },
  { id: 'sd-026', name: 'Schweppes Ginger Ale 1L',       category: 'soft_drinks', sub: 'mixers',     emoji: '💧', price: 2.76,  age_restricted: false, popular: false },
  { id: 'sd-027', name: 'Schweppes Lemonade 2L',         category: 'soft_drinks', sub: 'mixers',     emoji: '🍋', price: 3.96,  age_restricted: false, popular: false },
  { id: 'sd-028', name: 'Fever-Tree Indian Tonic 8 Pack',category: 'soft_drinks', sub: 'mixers',     emoji: '💧', price: 10.80, age_restricted: false, popular: true  },
  { id: 'sd-029', name: 'Fever-Tree Mediterranean 8 Pack',category:'soft_drinks', sub: 'mixers',     emoji: '💧', price: 10.80, age_restricted: false, popular: false },

  // ── WATER (+20%) ─────────────────────────────────────────
  { id: 'wt-001', name: 'Evian Still 330ml 6 Pack',          category: 'water', sub: 'still',    emoji: '💧', price: 6.00,  age_restricted: false, popular: false },
  { id: 'wt-002', name: 'Fiji Artesian 330ml 6 Pack',        category: 'water', sub: 'still',    emoji: '💧', price: 10.80, age_restricted: false, popular: true  },
  { id: 'wt-003', name: 'San Pellegrino Sparkling 6 Pack',   category: 'water', sub: 'sparkling',emoji: '🫧', price: 7.20,  age_restricted: false, popular: false },

  // ── ICE ──────────────────────────────────────────────────
  { id: 'ic-001', name: 'Ice Bag 2.5kg',  category: 'ice', sub: 'ice', emoji: '🧊', price: 4.20,  age_restricted: false, popular: true  },
  { id: 'ic-002', name: 'Ice Bag 5kg',    category: 'ice', sub: 'ice', emoji: '🧊', price: 7.80,  age_restricted: false, popular: true  },
  { id: 'ic-003', name: 'Ice Bag 10kg',   category: 'ice', sub: 'ice', emoji: '🧊', price: 13.20, age_restricted: false, popular: false },

  // ── SNACKS — SWEET (+20%) ────────────────────────────────
  { id: 'sn-001', name: 'Kinder Chocolate 4 Pack',  category: 'snacks', sub: 'sweet',  emoji: '🍫', price: 3.60, age_restricted: false, popular: true  },
  { id: 'sn-002', name: 'Milka Chocolate Bar',       category: 'snacks', sub: 'sweet',  emoji: '🍫', price: 2.76, age_restricted: false, popular: false },
  { id: 'sn-003', name: 'Lindt Excellence Bar',      category: 'snacks', sub: 'sweet',  emoji: '🍫', price: 4.20, age_restricted: false, popular: false },

  // ── SNACKS — CRISPS (+20%) ───────────────────────────────
  { id: 'sn-004', name: 'Doritos Sharing Bag',   category: 'snacks', sub: 'crisps', emoji: '🌽', price: 3.96, age_restricted: false, popular: true  },
  { id: 'sn-005', name: 'Salted Peanuts 200g',   category: 'snacks', sub: 'crisps', emoji: '🥜', price: 2.76, age_restricted: false, popular: false },
  { id: 'sn-006', name: 'Takis Fuego',           category: 'snacks', sub: 'crisps', emoji: '🌶️', price: 3.60, age_restricted: false, popular: true  },
  { id: 'sn-007', name: 'Kettle Chips',          category: 'snacks', sub: 'crisps', emoji: '🥔', price: 3.60, age_restricted: false, popular: false },
  { id: 'sn-008', name: "Lay's Classic",         category: 'snacks', sub: 'crisps', emoji: '🥔', price: 2.88, age_restricted: false, popular: false },
  { id: 'sn-009', name: 'Pringles Original',     category: 'snacks', sub: 'crisps', emoji: '🥔', price: 3.60, age_restricted: false, popular: true  },

  // ── TOBACCO — CIGARETTES (+40%) ──────────────────────────
  { id: 'tb-001', name: 'Marlboro Gold 20 Pack',          category: 'tobacco', sub: 'cigarettes', emoji: '🚬', price: 6.44,  age_restricted: true, popular: true  },
  { id: 'tb-002', name: 'Marlboro Touch 20 Pack',         category: 'tobacco', sub: 'cigarettes', emoji: '🚬', price: 6.44,  age_restricted: true, popular: false },
  { id: 'tb-003', name: 'Marlboro Red 20 Pack',           category: 'tobacco', sub: 'cigarettes', emoji: '🚬', price: 6.44,  age_restricted: true, popular: true  },
  { id: 'tb-004', name: 'Vogue Essence Bleue Slim 20 Pack',category:'tobacco', sub: 'cigarettes', emoji: '🚬', price: 6.72,  age_restricted: true, popular: false },
  { id: 'tb-005', name: 'Vogue Compact 20 Pack',          category: 'tobacco', sub: 'cigarettes', emoji: '🚬', price: 6.72,  age_restricted: true, popular: false },
  { id: 'tb-006', name: 'Camel Blue 20 Pack',             category: 'tobacco', sub: 'cigarettes', emoji: '🚬', price: 6.30,  age_restricted: true, popular: false },
  { id: 'tb-007', name: 'B&H Sky Blue 20 Pack',           category: 'tobacco', sub: 'cigarettes', emoji: '🚬', price: 6.30,  age_restricted: true, popular: false },
  { id: 'tb-008', name: 'B&H Blue 20 Pack',               category: 'tobacco', sub: 'cigarettes', emoji: '🚬', price: 6.30,  age_restricted: true, popular: false },
  { id: 'tb-009', name: 'B&H Gold 20 Pack',               category: 'tobacco', sub: 'cigarettes', emoji: '🚬', price: 6.30,  age_restricted: true, popular: false },
  { id: 'tb-010', name: 'B&H Silver 20 Pack',             category: 'tobacco', sub: 'cigarettes', emoji: '🚬', price: 6.30,  age_restricted: true, popular: false },

  // ── TOBACCO — ROLLING (+40%) ─────────────────────────────
  { id: 'tb-011', name: 'Amber Leaf Rolling 30g',    category: 'tobacco', sub: 'rolling', emoji: '🍂', price: 14.84, age_restricted: true, popular: true  },
  { id: 'tb-012', name: 'American Spirit 30g',       category: 'tobacco', sub: 'rolling', emoji: '🍂', price: 17.08, age_restricted: true, popular: false },
  { id: 'tb-013', name: 'Golden Virginia 30g',       category: 'tobacco', sub: 'rolling', emoji: '🍂', price: 14.84, age_restricted: true, popular: false },
  { id: 'tb-014', name: "Cutters Choice 30g",        category: 'tobacco', sub: 'rolling', emoji: '🍂', price: 13.44, age_restricted: true, popular: false },

  // ── TOBACCO — NICOTINE POUCHES (+40%) ────────────────────
  { id: 'tb-015', name: 'ZYN Nicotine Pouches',      category: 'tobacco', sub: 'pouches', emoji: '🟡', price: 11.76, age_restricted: true, popular: true  },
  { id: 'tb-016', name: 'VELO Nicotine Pouches',     category: 'tobacco', sub: 'pouches', emoji: '🔵', price: 11.76, age_restricted: true, popular: false },
  { id: 'tb-017', name: 'Nordic Spirit Pouches',     category: 'tobacco', sub: 'pouches', emoji: '⚪', price: 11.76, age_restricted: true, popular: false },

  // ── WINE — RED (+30%) ────────────────────────────────────
  { id: 'wn-001', name: 'Antinori Tignanello 75cl',                    category: 'wine', sub: 'red',   emoji: '🍷', price: 156.00, age_restricted: true, popular: false },
  { id: 'wn-002', name: 'Fattoria dei Barbi Brunello di Montalcino 75cl',category:'wine',sub: 'red',   emoji: '🍷', price: 84.50,  age_restricted: true, popular: false },
  { id: 'wn-003', name: 'Vina Izadi Rioja Reserva 75cl',               category: 'wine', sub: 'red',   emoji: '🍷', price: 24.70,  age_restricted: true, popular: true  },
  { id: 'wn-004', name: 'Cune Organic Rioja 75cl',                     category: 'wine', sub: 'red',   emoji: '🍷', price: 19.50,  age_restricted: true, popular: true  },
  { id: 'wn-005', name: 'Gaja Barbaresco 2020 75cl',                   category: 'wine', sub: 'red',   emoji: '🍷', price: 253.50, age_restricted: true, popular: false },
  { id: 'wn-006', name: 'Prunotto Nizza Bandella 75cl',                category: 'wine', sub: 'red',   emoji: '🍷', price: 44.20,  age_restricted: true, popular: false },
  { id: 'wn-007', name: 'Prunotto Langhe Nebbiolo 75cl',               category: 'wine', sub: 'red',   emoji: '🍷', price: 29.90,  age_restricted: true, popular: false },
  { id: 'wn-008', name: 'Chateau Cheval Blanc 2017 75cl',              category: 'wine', sub: 'red',   emoji: '🍷', price: 715.00, age_restricted: true, popular: false },
  { id: 'wn-009', name: 'Cotes du Rhone Villages 75cl',                category: 'wine', sub: 'red',   emoji: '🍷', price: 16.90,  age_restricted: true, popular: false },

  // ── WINE — WHITE (+30%) ──────────────────────────────────
  { id: 'wn-010', name: 'Sauvignon Blanc Yealands 75cl',   category: 'wine', sub: 'white', emoji: '🥂', price: 19.50, age_restricted: true, popular: true  },
  { id: 'wn-011', name: 'Joseph Drouhin Meursault 75cl',   category: 'wine', sub: 'white', emoji: '🥂', price: 72.80, age_restricted: true, popular: false },
  { id: 'wn-012', name: 'Louis Jadot Macon Villages 75cl', category: 'wine', sub: 'white', emoji: '🥂', price: 24.70, age_restricted: true, popular: false },
  { id: 'wn-013', name: 'Jean-Marc Brocard Chablis 75cl',  category: 'wine', sub: 'white', emoji: '🥂', price: 29.90, age_restricted: true, popular: false },
  { id: 'wn-014', name: 'Gaja Rossj Bass Chardonnay 75cl', category: 'wine', sub: 'white', emoji: '🥂', price: 84.50, age_restricted: true, popular: false },

  // ── WINE — ROSÉ (+30%) ───────────────────────────────────
  { id: 'wn-015', name: 'Laurent Perrier Cuvée Rosé 75cl',         category: 'wine', sub: 'rose', emoji: '🌹', price: 48.10,  age_restricted: true, popular: true  },
  { id: 'wn-016', name: 'Taittinger Comtes Rosé 2011 75cl',        category: 'wine', sub: 'rose', emoji: '🌹', price: 169.00, age_restricted: true, popular: false },
  { id: 'wn-017', name: 'Louis Roederer Rosé Vintage 2017 75cl',   category: 'wine', sub: 'rose', emoji: '🌹', price: 97.50,  age_restricted: true, popular: false },
  { id: 'wn-018', name: 'Laurent Perrier Rosé Magnum 150cl',       category: 'wine', sub: 'rose', emoji: '🌹', price: 110.50, age_restricted: true, popular: false },
  { id: 'wn-019', name: 'Whispering Angel Double Magnum 3L',       category: 'wine', sub: 'rose', emoji: '🌹', price: 221.00, age_restricted: true, popular: false },
  { id: 'wn-020', name: 'Whispering Angel Rosé Magnum 150cl',      category: 'wine', sub: 'rose', emoji: '🌹', price: 84.50,  age_restricted: true, popular: true  },
  { id: 'wn-021', name: 'Whispering Angel Rosé 75cl',              category: 'wine', sub: 'rose', emoji: '🌹', price: 44.20,  age_restricted: true, popular: true  },
  { id: 'wn-022', name: "Chateau d'Esclans Garrus Rosé 75cl",      category: 'wine', sub: 'rose', emoji: '🌹', price: 136.50, age_restricted: true, popular: false },

  // ── CHAMPAGNE (+30%) ─────────────────────────────────────
  { id: 'ch-001', name: 'Dom Pérignon Vintage 75cl',               category: 'champagne', sub: 'champagne', emoji: '🍾', price: 221.00, age_restricted: true, popular: true  },
  { id: 'ch-002', name: 'Armand de Brignac Brut Gold 75cl',        category: 'champagne', sub: 'champagne', emoji: '🍾', price: 338.00, age_restricted: true, popular: false },
  { id: 'ch-003', name: 'Louis Roederer Blanc de Blancs 2016 75cl',category: 'champagne', sub: 'champagne', emoji: '🍾', price: 97.50,  age_restricted: true, popular: false },
  { id: 'ch-004', name: 'Pol Roger Blanc de Blancs 2016 75cl',     category: 'champagne', sub: 'champagne', emoji: '🍾', price: 72.80,  age_restricted: true, popular: false },
  { id: 'ch-005', name: 'Pol Roger Brut Rosé 2018 75cl',           category: 'champagne', sub: 'champagne', emoji: '🍾', price: 84.50,  age_restricted: true, popular: false },
  { id: 'ch-006', name: 'Pol Roger Sir Winston Churchill 75cl',    category: 'champagne', sub: 'champagne', emoji: '🍾', price: 195.00, age_restricted: true, popular: false },
  { id: 'ch-007', name: 'Rock Angels by Whispering Angel 75cl',    category: 'champagne', sub: 'champagne', emoji: '🍾', price: 36.40,  age_restricted: true, popular: true  },
  { id: 'ch-008', name: 'Veuve Clicquot Brut Rosé 75cl',           category: 'champagne', sub: 'champagne', emoji: '🍾', price: 72.80,  age_restricted: true, popular: true  },
  { id: 'ch-009', name: 'Moët & Chandon Grand Vintage 75cl',       category: 'champagne', sub: 'champagne', emoji: '🍾', price: 62.40,  age_restricted: true, popular: false },
  { id: 'ch-010', name: 'Moët & Chandon Impérial 75cl',            category: 'champagne', sub: 'champagne', emoji: '🍾', price: 48.10,  age_restricted: true, popular: true  },
  { id: 'ch-011', name: 'Veuve Clicquot Yellow Label 75cl',        category: 'champagne', sub: 'champagne', emoji: '🍾', price: 62.40,  age_restricted: true, popular: true  },

  // ── BEER (+30%) ──────────────────────────────────────────
  { id: 'br-001', name: 'Corona 330ml 4 Pack',              category: 'beer', sub: 'lager',    emoji: '🍺', price: 9.10,  age_restricted: true, popular: true  },
  { id: 'br-002', name: 'Corona 330ml 12 Pack',             category: 'beer', sub: 'lager',    emoji: '🍺', price: 24.70, age_restricted: true, popular: true  },
  { id: 'br-003', name: 'Corona 330ml 18 Pack',             category: 'beer', sub: 'lager',    emoji: '🍺', price: 34.45, age_restricted: true, popular: false },
  { id: 'br-004', name: 'Peroni Nastro Azzurro 330ml 4 Pack',category:'beer', sub: 'lager',    emoji: '🍺', price: 10.40, age_restricted: true, popular: true  },
  { id: 'br-005', name: 'Peroni Nastro Azzurro 330ml 12 Pack',category:'beer',sub: 'lager',    emoji: '🍺', price: 29.90, age_restricted: true, popular: false },
  { id: 'br-006', name: 'Peroni Nastro Azzurro 330ml 18 Pack',category:'beer',sub: 'lager',    emoji: '🍺', price: 39.00, age_restricted: true, popular: false },
  { id: 'br-007', name: 'Heineken 330ml 4 Pack',            category: 'beer', sub: 'lager',    emoji: '🍺', price: 9.10,  age_restricted: true, popular: true  },
  { id: 'br-008', name: 'Heineken 330ml 12 Pack',           category: 'beer', sub: 'lager',    emoji: '🍺', price: 24.70, age_restricted: true, popular: false },
  { id: 'br-009', name: 'Budweiser 300ml 12 Pack',          category: 'beer', sub: 'lager',    emoji: '🍺', price: 22.10, age_restricted: true, popular: false },
  { id: 'br-010', name: 'Desperados Tequila Beer 330ml 3pk',category: 'beer', sub: 'specialty',emoji: '🍺', price: 11.70, age_restricted: true, popular: true  },
  { id: 'br-011', name: 'Estrella Damm 330ml 12 Pack',      category: 'beer', sub: 'lager',    emoji: '🍺', price: 19.50, age_restricted: true, popular: true  },
  { id: 'br-012', name: 'San Miguel 330ml 12 Pack',         category: 'beer', sub: 'lager',    emoji: '🍺', price: 19.50, age_restricted: true, popular: false },
  { id: 'br-013', name: 'Kopparberg Mixed Fruit Cider',     category: 'beer', sub: 'cider',    emoji: '🍎', price: 9.10,  age_restricted: true, popular: true  },
  { id: 'br-014', name: "Bulmers Original Cider",           category: 'beer', sub: 'cider',    emoji: '🍎', price: 8.45,  age_restricted: true, popular: false },

  // ── SPIRITS — TEQUILA (+30%) ─────────────────────────────
  { id: 'sp-001', name: 'Don Julio 1942 Añejo 70cl',       category: 'spirits', sub: 'tequila',  emoji: '🥃', price: 156.00, age_restricted: true, popular: true  },
  { id: 'sp-002', name: 'Don Julio Reposado 70cl',         category: 'spirits', sub: 'tequila',  emoji: '🥃', price: 72.80,  age_restricted: true, popular: false },
  { id: 'sp-003', name: 'Don Julio Blanco 70cl',           category: 'spirits', sub: 'tequila',  emoji: '🥃', price: 62.40,  age_restricted: true, popular: false },
  { id: 'sp-004', name: 'Patrón XO Café 70cl',             category: 'spirits', sub: 'tequila',  emoji: '🥃', price: 48.10,  age_restricted: true, popular: false },
  { id: 'sp-005', name: 'Clase Azul Mezcal Durango 70cl',  category: 'spirits', sub: 'tequila',  emoji: '🥃', price: 169.00, age_restricted: true, popular: false },
  { id: 'sp-006', name: 'Clase Azul Reposado 70cl',        category: 'spirits', sub: 'tequila',  emoji: '🥃', price: 143.00, age_restricted: true, popular: false },
  { id: 'sp-007', name: 'Patrón Silver 70cl',              category: 'spirits', sub: 'tequila',  emoji: '🥃', price: 62.40,  age_restricted: true, popular: true  },
  { id: 'sp-008', name: 'Patrón Reposado 70cl',            category: 'spirits', sub: 'tequila',  emoji: '🥃', price: 72.80,  age_restricted: true, popular: false },
  { id: 'sp-009', name: 'Patrón Añejo 70cl',               category: 'spirits', sub: 'tequila',  emoji: '🥃', price: 84.50,  age_restricted: true, popular: false },
  { id: 'sp-010', name: 'Tequila Rose 70cl',               category: 'spirits', sub: 'tequila',  emoji: '🌹', price: 36.40,  age_restricted: true, popular: true  },
  { id: 'sp-011', name: 'Casamigos Mezcal 70cl',           category: 'spirits', sub: 'tequila',  emoji: '🥃', price: 84.50,  age_restricted: true, popular: true  },

  // ── SPIRITS — GIN (+30%) ─────────────────────────────────
  { id: 'sp-012', name: "Hendrick's Gin 70cl",             category: 'spirits', sub: 'gin',      emoji: '🌿', price: 44.20, age_restricted: true, popular: true  },
  { id: 'sp-013', name: 'Bombay Sapphire 70cl',            category: 'spirits', sub: 'gin',      emoji: '🌿', price: 33.80, age_restricted: true, popular: true  },
  { id: 'sp-014', name: 'Roku Japanese Craft Gin 70cl',    category: 'spirits', sub: 'gin',      emoji: '🌿', price: 44.20, age_restricted: true, popular: false },

  // ── SPIRITS — WHISKEY (+30%) ─────────────────────────────
  { id: 'sp-015', name: 'Johnnie Walker Blue Label 70cl',  category: 'spirits', sub: 'whiskey',  emoji: '🥃', price: 221.00, age_restricted: true, popular: true  },
  { id: 'sp-016', name: 'Johnnie Walker Black Label 70cl', category: 'spirits', sub: 'whiskey',  emoji: '🥃', price: 48.10,  age_restricted: true, popular: true  },
  { id: 'sp-017', name: 'Macallan Sherry Oak 12yr 70cl',   category: 'spirits', sub: 'whiskey',  emoji: '🥃', price: 84.50,  age_restricted: true, popular: true  },
  { id: 'sp-018', name: "Jack Daniel's Old No.7 70cl",     category: 'spirits', sub: 'whiskey',  emoji: '🥃', price: 44.20,  age_restricted: true, popular: true  },
  { id: 'sp-019', name: 'Glenfiddich 12yr 70cl',           category: 'spirits', sub: 'whiskey',  emoji: '🥃', price: 62.40,  age_restricted: true, popular: false },
  { id: 'sp-020', name: 'Monkey Shoulder Blended Malt 70cl',category:'spirits', sub: 'whiskey',  emoji: '🥃', price: 44.20,  age_restricted: true, popular: false },
  { id: 'sp-021', name: 'Yamazaki Single Malt 70cl',       category: 'spirits', sub: 'whiskey',  emoji: '🥃', price: 143.00, age_restricted: true, popular: false },

  // ── SPIRITS — RUM (+30%) ─────────────────────────────────
  { id: 'sp-022', name: 'Captain Morgan Spiced Gold 70cl', category: 'spirits', sub: 'rum',      emoji: '🍹', price: 33.80, age_restricted: true, popular: true  },
  { id: 'sp-023', name: 'Captain Morgan Dark Rum 70cl',    category: 'spirits', sub: 'rum',      emoji: '🍹', price: 33.80, age_restricted: true, popular: false },
  { id: 'sp-024', name: 'Bacardi White Rum 70cl',          category: 'spirits', sub: 'rum',      emoji: '🍹', price: 29.90, age_restricted: true, popular: true  },
  { id: 'sp-025', name: 'The Kraken Black Spiced Rum 70cl',category: 'spirits', sub: 'rum',      emoji: '🍹', price: 36.40, age_restricted: true, popular: true  },
  { id: 'sp-026', name: 'Diplomatico Reserva Exclusiva 70cl',category:'spirits',sub: 'rum',      emoji: '🍹', price: 62.40, age_restricted: true, popular: false },

  // ── SPIRITS — COGNAC (+30%) ──────────────────────────────
  { id: 'sp-027', name: 'Hennessy XO 70cl',        category: 'spirits', sub: 'cognac',   emoji: '🥃', price: 221.00, age_restricted: true, popular: true  },
  { id: 'sp-028', name: 'Hennessy VS 70cl',         category: 'spirits', sub: 'cognac',   emoji: '🥃', price: 48.10,  age_restricted: true, popular: true  },
  { id: 'sp-029', name: 'Courvoisier XO 70cl',      category: 'spirits', sub: 'cognac',   emoji: '🥃', price: 143.00, age_restricted: true, popular: false },
  { id: 'sp-030', name: 'Courvoisier VS 70cl',      category: 'spirits', sub: 'cognac',   emoji: '🥃', price: 44.20,  age_restricted: true, popular: false },
  { id: 'sp-031', name: 'Rémy Martin VSOP 70cl',    category: 'spirits', sub: 'cognac',   emoji: '🥃', price: 72.80,  age_restricted: true, popular: false },

  // ── SPIRITS — VODKA (+30%) ───────────────────────────────
  { id: 'sp-032', name: 'Belvedere 10 Luminous 70cl',        category: 'spirits', sub: 'vodka', emoji: '🍸', price: 97.50,  age_restricted: true, popular: false },
  { id: 'sp-033', name: 'Belvedere Organic Vodka 70cl',      category: 'spirits', sub: 'vodka', emoji: '🍸', price: 48.10,  age_restricted: true, popular: true  },
  { id: 'sp-034', name: 'Belvedere Magnum Plus 175cl',       category: 'spirits', sub: 'vodka', emoji: '🍸', price: 143.00, age_restricted: true, popular: false },
  { id: 'sp-035', name: 'Grey Goose Vodka 70cl',             category: 'spirits', sub: 'vodka', emoji: '🍸', price: 48.10,  age_restricted: true, popular: true  },
  { id: 'sp-036', name: 'Grey Goose Magnum 150cl',           category: 'spirits', sub: 'vodka', emoji: '🍸', price: 110.50, age_restricted: true, popular: false },
  { id: 'sp-037', name: 'Beluga Gold Line Vodka 70cl',       category: 'spirits', sub: 'vodka', emoji: '🍸', price: 110.50, age_restricted: true, popular: false },
  { id: 'sp-038', name: 'Beluga Noble Vodka 70cl',           category: 'spirits', sub: 'vodka', emoji: '🍸', price: 48.10,  age_restricted: true, popular: false },
  { id: 'sp-039', name: 'Absolut Original Vodka 70cl',       category: 'spirits', sub: 'vodka', emoji: '🍸', price: 29.90,  age_restricted: true, popular: true  },

  // ── SPIRITS — LIQUEURS (+30%) ────────────────────────────
  { id: 'sp-040', name: 'Baileys Irish Cream 70cl',  category: 'spirits', sub: 'liqueurs', emoji: '🍶', price: 29.90, age_restricted: true, popular: true  },
  { id: 'sp-041', name: 'Jägermeister 70cl',         category: 'spirits', sub: 'liqueurs', emoji: '🍶', price: 29.90, age_restricted: true, popular: true  },
  { id: 'sp-042', name: 'Disaronno Amaretto 70cl',   category: 'spirits', sub: 'liqueurs', emoji: '🍶', price: 33.80, age_restricted: true, popular: false },
  { id: 'sp-043', name: 'Yeni Raki 70cl',            category: 'spirits', sub: 'liqueurs', emoji: '🍶', price: 29.90, age_restricted: true, popular: false },
  { id: 'sp-044', name: 'Cointreau Liqueur 70cl',    category: 'spirits', sub: 'liqueurs', emoji: '🍊', price: 33.80, age_restricted: true, popular: false },


  // ── TOBACCO — CIGARS (+40%) ──────────────────────────────
  { id: 'tb-018', name: 'Cohiba Siglo I Cuba 25 Pack',     category: 'tobacco', sub: 'cigars',  emoji: '🚬', price: 238.00, age_restricted: true, popular: true  },
  { id: 'tb-019', name: 'Montecristo No.4 Cigar',          category: 'tobacco', sub: 'cigars',  emoji: '🚬', price: 18.20,  age_restricted: true, popular: true  },
  { id: 'tb-020', name: 'Romeo y Julieta Mille Fleurs',    category: 'tobacco', sub: 'cigars',  emoji: '🚬', price: 15.40,  age_restricted: true, popular: false },
  { id: 'tb-021', name: 'Partagas Series D No.4',          category: 'tobacco', sub: 'cigars',  emoji: '🚬', price: 19.60,  age_restricted: true, popular: false },
  { id: 'tb-022', name: 'H. Upmann Half Corona',           category: 'tobacco', sub: 'cigars',  emoji: '🚬', price: 12.60,  age_restricted: true, popular: false },
  { id: 'tb-023', name: 'Villiger Export Natural Cigar 5pk',category:'tobacco', sub: 'cigars',  emoji: '🚬', price: 14.00,  age_restricted: true, popular: true  },
  { id: 'tb-024', name: 'Café Crème Blue 10 Pack',         category: 'tobacco', sub: 'cigars',  emoji: '🚬', price: 11.20,  age_restricted: true, popular: true  },
  { id: 'tb-025', name: 'Henri Wintermans Half Corona 5pk',category: 'tobacco', sub: 'cigars',  emoji: '🚬', price: 13.30,  age_restricted: true, popular: false },
  { id: 'tb-026', name: 'Davidoff Mini Cigarillos 20pk',   category: 'tobacco', sub: 'cigars',  emoji: '🚬', price: 22.40,  age_restricted: true, popular: false },
  { id: 'tb-027', name: 'Agio Mehari Java 10 Pack',        category: 'tobacco', sub: 'cigars',  emoji: '🚬', price: 10.50,  age_restricted: true, popular: false },

  // ── TOBACCO — VAPES (+40%) ───────────────────────────────
  { id: 'tb-028', name: 'Lost Mary BM600 Disposable',      category: 'tobacco', sub: 'vapes',   emoji: '💨', price: 11.20,  age_restricted: true, popular: true  },
  { id: 'tb-029', name: 'Elf Bar 600 Disposable',          category: 'tobacco', sub: 'vapes',   emoji: '💨', price: 9.80,   age_restricted: true, popular: true  },
  { id: 'tb-030', name: 'SKE Crystal Bar 600',             category: 'tobacco', sub: 'vapes',   emoji: '💨', price: 9.80,   age_restricted: true, popular: false },
  { id: 'tb-031', name: 'Randm Tornado 7000 Puff',         category: 'tobacco', sub: 'vapes',   emoji: '💨', price: 16.80,  age_restricted: true, popular: true  },
  { id: 'tb-032', name: 'Vozol Star 12000 Puff',           category: 'tobacco', sub: 'vapes',   emoji: '💨', price: 19.60,  age_restricted: true, popular: false },
  { id: 'tb-033', name: 'Vuse GO 800 Disposable',          category: 'tobacco', sub: 'vapes',   emoji: '💨', price: 11.20,  age_restricted: true, popular: false },
  { id: 'tb-034', name: 'IVG 2400 Puff Disposable',        category: 'tobacco', sub: 'vapes',   emoji: '💨', price: 14.00,  age_restricted: true, popular: false },
  { id: 'tb-035', name: 'Geek Bar Pulse 15000 Puff',       category: 'tobacco', sub: 'vapes',   emoji: '💨', price: 22.40,  age_restricted: true, popular: true  },
  { id: 'tb-036', name: 'Smok Novo 2 Pod Kit',             category: 'tobacco', sub: 'vapes',   emoji: '💨', price: 28.00,  age_restricted: true, popular: false },
  { id: 'tb-037', name: 'Juul2 Starter Kit',               category: 'tobacco', sub: 'vapes',   emoji: '💨', price: 33.60,  age_restricted: true, popular: false },

  // ── TOBACCO — HEATED TOBACCO (+40%) ──────────────────────
  { id: 'tb-038', name: 'IQOS ILUMA One Starter Kit',      category: 'tobacco', sub: 'heated',  emoji: '🔥', price: 42.00,  age_restricted: true, popular: true  },
  { id: 'tb-039', name: 'IQOS ILUMA Prime Kit',            category: 'tobacco', sub: 'heated',  emoji: '🔥', price: 98.00,  age_restricted: true, popular: false },
  { id: 'tb-040', name: 'HEETS Amber Label 20 Sticks',     category: 'tobacco', sub: 'heated',  emoji: '🔥', price: 7.00,   age_restricted: true, popular: true  },
  { id: 'tb-041', name: 'HEETS Turquoise Label 20 Sticks', category: 'tobacco', sub: 'heated',  emoji: '🔥', price: 7.00,   age_restricted: true, popular: false },
  { id: 'tb-042', name: 'HEETS Yellow Label 20 Sticks',    category: 'tobacco', sub: 'heated',  emoji: '🔥', price: 7.00,   age_restricted: true, popular: false },
  { id: 'tb-043', name: 'Glo Hyper X2 Device',             category: 'tobacco', sub: 'heated',  emoji: '🔥', price: 35.00,  age_restricted: true, popular: false },
  { id: 'tb-044', name: 'Neo Sticks Tobacco 20pk',         category: 'tobacco', sub: 'heated',  emoji: '🔥', price: 6.30,   age_restricted: true, popular: false },
  { id: 'tb-045', name: 'Ploom X Advanced Device',         category: 'tobacco', sub: 'heated',  emoji: '🔥', price: 42.00,  age_restricted: true, popular: false },
  { id: 'tb-046', name: 'EVO Tobacco Sticks 20pk',         category: 'tobacco', sub: 'heated',  emoji: '🔥', price: 6.30,   age_restricted: true, popular: false },
  { id: 'tb-047', name: 'Lil Solid 2.0 Device',            category: 'tobacco', sub: 'heated',  emoji: '🔥', price: 28.00,  age_restricted: true, popular: false },

  // ── SNACKS — NEW POPULAR LOCAL MARKET ADDITIONS (+20%) ──────
  { id: 'sn-020', name: "Lay's Mediterránea Olives 150g",   category:'snacks', sub:'crisps',  emoji:'🫒', price: 3.64,  age_restricted:false, popular:true  },
  { id: 'sn-021', name: 'Ruffles Queso Crisps 170g',         category:'snacks', sub:'crisps',  emoji:'🧀', price: 3.64,  age_restricted:false, popular:false },
  { id: 'sn-022', name: 'Funyuns Onion Rings 163g',          category:'snacks', sub:'crisps',  emoji:'🧅', price: 4.16,  age_restricted:false, popular:false },
  { id: 'sn-023', name: 'Cheetos Crunchy 226g',              category:'snacks', sub:'crisps',  emoji:'🧡', price: 4.16,  age_restricted:false, popular:true  },
  { id: 'sn-024', name: 'Doritos Nacho Cheese 200g',         category:'snacks', sub:'crisps',  emoji:'🌽', price: 3.64,  age_restricted:false, popular:true  },
  { id: 'sn-025', name: 'Patatas Gus Salted 130g',           category:'snacks', sub:'crisps',  emoji:'🥔', price: 2.34,  age_restricted:false, popular:false },
  { id: 'sn-026', name: 'Bocaditos de Jamón Ibérico 100g',   category:'snacks', sub:'crisps',  emoji:'🥩', price: 5.98,  age_restricted:false, popular:true  },
  { id: 'sn-027', name: 'Torres Black Truffle Crisps 150g',  category:'snacks', sub:'crisps',  emoji:'🍄', price: 7.15,  age_restricted:false, popular:true  },
  { id: 'sn-028', name: "Lay's BBQ Pulled Pork 150g",       category:'snacks', sub:'crisps',  emoji:'🥔', price: 3.64,  age_restricted:false, popular:false },
  { id: 'sn-029', name: 'Nachos & Guacamole Dip Set',        category:'snacks', sub:'crisps',  emoji:'🥑', price: 8.45,  age_restricted:false, popular:true  },
  { id: 'sn-030', name: 'Mixed Nuts Deluxe 200g',            category:'snacks', sub:'crisps',  emoji:'🥜', price: 5.98,  age_restricted:false, popular:true  },
  { id: 'sn-031', name: 'Pistachios Roasted Salted 150g',    category:'snacks', sub:'crisps',  emoji:'🟢', price: 5.98,  age_restricted:false, popular:false },
  { id: 'sn-032', name: 'Edamame Salted Snack Pack 200g',    category:'snacks', sub:'crisps',  emoji:'🫛', price: 4.81,  age_restricted:false, popular:false },
  { id: 'sn-033', name: 'Olives Mixed Marinated Jar 350g',   category:'snacks', sub:'crisps',  emoji:'🫒', price: 5.46,  age_restricted:false, popular:true  },
  { id: 'sn-034', name: 'Iberian Chorizo Sliced 100g',       category:'snacks', sub:'crisps',  emoji:'🌶️', price: 5.98,  age_restricted:false, popular:true  },
  { id: 'sn-035', name: 'Manchego Cheese Snack Pack 120g',   category:'snacks', sub:'crisps',  emoji:'🧀', price: 7.15,  age_restricted:false, popular:true  },
  { id: 'sn-036', name: 'Baguette & Hummus Pack',            category:'snacks', sub:'crisps',  emoji:'🥖', price: 5.98,  age_restricted:false, popular:false },
  { id: 'sn-037', name: 'Oreo Original 154g',                category:'snacks', sub:'sweet',   emoji:'⚫', price: 2.99,  age_restricted:false, popular:true  },
  { id: 'sn-038', name: 'Haribo Goldbears 250g',             category:'snacks', sub:'sweet',   emoji:'🐻', price: 3.64,  age_restricted:false, popular:true  },
  { id: 'sn-039', name: 'Trolli Sour Worms 200g',            category:'snacks', sub:'sweet',   emoji:'🐛', price: 3.64,  age_restricted:false, popular:false },
  { id: 'sn-040', name: 'Toblerone Milk 400g',               category:'snacks', sub:'sweet',   emoji:'🍫', price: 8.45,  age_restricted:false, popular:true  },
  { id: 'sn-041', name: 'Ferrero Rocher 16 Pack',            category:'snacks', sub:'sweet',   emoji:'🍫', price: 10.79, age_restricted:false, popular:true  },
  { id: 'sn-042', name: 'Nutella 400g Jar',                  category:'snacks', sub:'sweet',   emoji:'🍫', price: 5.98,  age_restricted:false, popular:false },
  { id: 'sn-043', name: 'Bounty Multipack 6 Bars',           category:'snacks', sub:'sweet',   emoji:'🍬', price: 7.15,  age_restricted:false, popular:false },
  { id: 'sn-044', name: 'Chupa Chups Lollipops 20pk',        category:'snacks', sub:'sweet',   emoji:'🍭', price: 5.98,  age_restricted:false, popular:false },
  { id: 'sn-045', name: 'Maná Chocolate Almonds 200g',       category:'snacks', sub:'sweet',   emoji:'🍫', price: 7.15,  age_restricted:false, popular:false },
  { id: 'sn-046', name: 'Takis Fuego Hot Corn Rolls 100g',   category:'snacks', sub:'crisps',  emoji:'🌶️', price: 4.16,  age_restricted:false, popular:true  },
  { id: 'sn-047', name: 'Peanut Butter Crackers Pack',       category:'snacks', sub:'sweet',   emoji:'🥜', price: 4.81,  age_restricted:false, popular:false },
  { id: 'sn-048', name: 'Protein Bar Variety Pack x6',       category:'snacks', sub:'sweet',   emoji:'💪', price: 14.30, age_restricted:false, popular:false },
  { id: 'sn-049', name: 'Popcorn Sweet & Salted Duo Pack',   category:'snacks', sub:'sweet',   emoji:'🍿', price: 4.81,  age_restricted:false, popular:true  },
  { id: 'sn-050', name: 'Bugles Corn Snacks Original 125g',  category:'snacks', sub:'crisps',  emoji:'🌽', price: 3.64,  age_restricted:false, popular:false },
  { id: 'sn-051', name: 'Krave Chocolate Cereal Bar 45g',    category:'snacks', sub:'sweet',   emoji:'🍫', price: 2.41,  age_restricted:false, popular:false },
  { id: 'sn-052', name: 'Mini Pretzels Salted 200g',         category:'snacks', sub:'crisps',  emoji:'🥨', price: 3.64,  age_restricted:false, popular:false },
  { id: 'sn-053', name: 'Cadbury Roses Selection Box',       category:'snacks', sub:'sweet',   emoji:'🌹', price: 11.96, age_restricted:false, popular:false },
  { id: 'sn-054', name: 'Spanish Almond Turron Soft 300g',   category:'snacks', sub:'sweet',   emoji:'🍬', price: 8.45,  age_restricted:false, popular:true  },

  // ── ESSENTIALS / NAPKINS / PARTY (+20%) ──────────────────────
  { id: 'es-001', name: 'Napkins White 100pk',               category:'essentials', sub:'party', emoji:'🧻', price: 3.64,  age_restricted:false, popular:true  },
  { id: 'es-002', name: 'Napkins Cocktail 200pk',            category:'essentials', sub:'party', emoji:'🧻', price: 4.81,  age_restricted:false, popular:false },
  { id: 'es-003', name: 'Paper Plates 10 inch 20pk',         category:'essentials', sub:'party', emoji:'🍽️', price: 4.81,  age_restricted:false, popular:true  },
  { id: 'es-004', name: 'Plastic Cups 50pk',                 category:'essentials', sub:'party', emoji:'🥤', price: 4.81,  age_restricted:false, popular:true  },
  { id: 'es-005', name: 'Champagne Flutes Plastic 12pk',     category:'essentials', sub:'party', emoji:'🥂', price: 7.15,  age_restricted:false, popular:true  },
  { id: 'es-006', name: 'Cocktail Straws Reusable 20pk',     category:'essentials', sub:'party', emoji:'🥤', price: 3.64,  age_restricted:false, popular:false },
  { id: 'es-007', name: 'Cocktail Stirrers & Picks 50pk',    category:'essentials', sub:'party', emoji:'🍸', price: 3.64,  age_restricted:false, popular:false },
  { id: 'es-008', name: 'Wine Opener Corkscrew',             category:'essentials', sub:'party', emoji:'🍾', price: 5.98,  age_restricted:false, popular:true  },
  { id: 'es-009', name: 'Bottle Stoppers 4pk',               category:'essentials', sub:'party', emoji:'🍾', price: 4.81,  age_restricted:false, popular:false },
  { id: 'es-010', name: 'Reusable Drink Cooler Bag',         category:'essentials', sub:'party', emoji:'🧊', price: 11.96, age_restricted:false, popular:false },
  { id: 'es-011', name: 'Wet Wipes Travel Pack 20pk',        category:'essentials', sub:'basics', emoji:'🧼', price: 2.41, age_restricted:false, popular:true  },
  { id: 'es-012', name: 'Hand Sanitiser 250ml',              category:'essentials', sub:'basics', emoji:'🧼', price: 3.64, age_restricted:false, popular:false },
  { id: 'es-013', name: 'Sunscreen SPF50 200ml',             category:'essentials', sub:'basics', emoji:'☀️', price: 11.96,age_restricted:false, popular:true  },
  { id: 'es-014', name: 'After Sun Aloe Vera Gel 200ml',     category:'essentials', sub:'basics', emoji:'🌿', price: 9.62, age_restricted:false, popular:false },
  { id: 'es-015', name: 'Insect Repellent Spray 100ml',      category:'essentials', sub:'basics', emoji:'🦟', price: 7.15, age_restricted:false, popular:true  },
  { id: 'es-016', name: 'Lighter x3 Pack',                   category:'essentials', sub:'basics', emoji:'🔥', price: 3.64, age_restricted:false, popular:true  },
  { id: 'es-017', name: 'Bin Bags 40L 20pk',                 category:'essentials', sub:'basics', emoji:'🗑️', price: 3.64, age_restricted:false, popular:false },
  { id: 'es-018', name: 'Kitchen Roll 3 Pack',               category:'essentials', sub:'basics', emoji:'🧻', price: 4.81, age_restricted:false, popular:false },

  // ── BEACH (+20%) ─────────────────────────────────────────────
  { id: 'bh-001', name: 'Beach Towel Stripe Large',          category:'beach', sub:'towels',   emoji:'🏖️', price: 24.05, age_restricted:false, popular:true  },
  { id: 'bh-002', name: 'Beach Towel Oversized Premium',     category:'beach', sub:'towels',   emoji:'🏖️', price: 36.01, age_restricted:false, popular:false },
  { id: 'bh-003', name: 'Microfibre Quick-Dry Towel',        category:'beach', sub:'towels',   emoji:'🏖️', price: 17.94, age_restricted:false, popular:true  },
  { id: 'bh-004', name: 'Beach Mat / Blanket Waterproof',    category:'beach', sub:'towels',   emoji:'🏖️', price: 30.03, age_restricted:false, popular:true  },
  { id: 'bh-005', name: "Men's Swim Shorts S-XXL",          category:'beach', sub:'swimwear', emoji:'🩲', price: 24.05, age_restricted:false, popular:true  },
  { id: 'bh-006', name: "Women's Bikini Set S-XL",          category:'beach', sub:'swimwear', emoji:'👙', price: 36.01, age_restricted:false, popular:true  },
  { id: 'bh-007', name: "Women's One-Piece Swimsuit S-XL",  category:'beach', sub:'swimwear', emoji:'🩱', price: 41.99, age_restricted:false, popular:false },
  { id: 'bh-008', name: 'Beach Sarong / Pareo',              category:'beach', sub:'swimwear', emoji:'👘', price: 17.94, age_restricted:false, popular:false },
  { id: 'bh-009', name: 'Flip Flops Unisex S-XL',            category:'beach', sub:'accessories',emoji:'🩴',price: 14.43, age_restricted:false, popular:true  },
  { id: 'bh-010', name: 'Beach Bag Canvas Tote',             category:'beach', sub:'accessories',emoji:'👜',price: 17.94, age_restricted:false, popular:false },
  { id: 'bh-011', name: 'Sunglasses UV400',                  category:'beach', sub:'accessories',emoji:'🕶️',price: 17.94, age_restricted:false, popular:true  },
  { id: 'bh-012', name: 'Snorkelling Set Mask & Fins',       category:'beach', sub:'accessories',emoji:'🤿',price: 36.01, age_restricted:false, popular:false },
  { id: 'bh-013', name: 'Inflatable Pool Float Lilo',        category:'beach', sub:'accessories',emoji:'🛟',price: 24.05, age_restricted:false, popular:true  },
  { id: 'bh-014', name: 'Beach Volleyball',                  category:'beach', sub:'accessories',emoji:'🏐',price: 17.94, age_restricted:false, popular:false },
  { id: 'bh-015', name: 'Waterproof Phone Pouch',            category:'beach', sub:'accessories',emoji:'📱',price: 9.62, age_restricted:false, popular:true  },
  { id: 'bh-016', name: 'Sand-Free Beach Towel Peg Set',     category:'beach', sub:'accessories',emoji:'📎',price: 7.15, age_restricted:false, popular:false },
  { id: 'bh-017', name: 'Dry Bag Waterproof 10L',            category:'beach', sub:'accessories',emoji:'🎒',price: 17.94, age_restricted:false, popular:false },

  // ── WELLNESS — MORE HEALTH ADDITIONS (+20%) ──────────────────
  { id: 'wl-010', name: 'Vitamin C Effervescent Tablets 20pk',category:'wellness',sub:'health', emoji:'💊', price: 7.15,  age_restricted:false, popular:true  },
  { id: 'wl-011', name: 'Ibuprofen 400mg 16 Tablets',         category:'wellness',sub:'health', emoji:'💊', price: 5.98,  age_restricted:false, popular:true  },
  { id: 'wl-012', name: 'Paracetamol 500mg 16 Tablets',       category:'wellness',sub:'health', emoji:'💊', price: 4.81,  age_restricted:false, popular:true  },
  { id: 'wl-013', name: 'Alka-Seltzer Hangover Relief 10pk',  category:'wellness',sub:'health', emoji:'💊', price: 8.45,  age_restricted:false, popular:true  },
  { id: 'wl-014', name: 'Dioralyte Rehydration Sachets 6pk',  category:'wellness',sub:'health', emoji:'💊', price: 8.45,  age_restricted:false, popular:true  },
  { id: 'wl-015', name: 'Berocca Energy Orange 15 Tablets',   category:'wellness',sub:'health', emoji:'💊', price: 9.62,  age_restricted:false, popular:false },
  { id: 'wl-016', name: 'Rennie Antacid Tablets 24pk',        category:'wellness',sub:'health', emoji:'💊', price: 5.98,  age_restricted:false, popular:false },
  { id: 'wl-017', name: 'Melatonin Sleep Aid 30 Tabs',        category:'wellness',sub:'health', emoji:'🌙', price: 11.96, age_restricted:false, popular:false },
  { id: 'wl-018', name: 'Milk Thistle Liver Support 60 Caps', category:'wellness',sub:'health', emoji:'🌿', price: 14.43, age_restricted:false, popular:false },
  { id: 'wl-019', name: 'Magnesium Glycinate 120 Caps',       category:'wellness',sub:'health', emoji:'💊', price: 17.94, age_restricted:false, popular:false },
  { id: 'wl-020', name: 'Coconut Water 1L',                   category:'wellness',sub:'health', emoji:'🥥', price: 4.81,  age_restricted:false, popular:true  },
  { id: 'wl-021', name: 'Isotonic Sports Drink Powder 500g',  category:'wellness',sub:'health', emoji:'💪', price: 17.94, age_restricted:false, popular:false },
  { id: 'wl-022', name: 'Eye Drops Dry Eye Relief',           category:'wellness',sub:'health', emoji:'👁️', price: 7.15,  age_restricted:false, popular:false },
  { id: 'wl-023', name: 'Lip Balm SPF15 3 Pack',              category:'wellness',sub:'health', emoji:'👄', price: 7.15,  age_restricted:false, popular:false },
  { id: 'wl-024', name: 'Blister Plasters Compeed 5pk',       category:'wellness',sub:'health', emoji:'🩹', price: 8.45,  age_restricted:false, popular:false },

  // ── TOBACCO — MORE PREMIUM CIGARS (+40%) ─────────────────────
  { id: 'tb-048', name: 'Cohiba Behike 52 Single',            category:'tobacco', sub:'cigars', emoji:'🚬', price: 62.01, age_restricted:true,  popular:true  },
  { id: 'tb-049', name: 'Cohiba Esplendido Single',           category:'tobacco', sub:'cigars', emoji:'🚬', price: 44.98, age_restricted:true,  popular:false },
  { id: 'tb-050', name: 'Montecristo No.2 Torpedo Single',    category:'tobacco', sub:'cigars', emoji:'🚬', price: 31.98, age_restricted:true,  popular:true  },
  { id: 'tb-051', name: 'Arturo Fuente Opus X Single',        category:'tobacco', sub:'cigars', emoji:'🚬', price: 54.99, age_restricted:true,  popular:false },
  { id: 'tb-052', name: 'Padron 1964 Anniversary Maduro',     category:'tobacco', sub:'cigars', emoji:'🚬', price: 37.96, age_restricted:true,  popular:false },
  { id: 'tb-053', name: 'Davidoff Winston Churchill Single',  category:'tobacco', sub:'cigars', emoji:'🚬', price: 41.99, age_restricted:true,  popular:true  },
  { id: 'tb-054', name: 'Bolivar Royal Corona Single',        category:'tobacco', sub:'cigars', emoji:'🚬', price: 21.97, age_restricted:true,  popular:false },
  { id: 'tb-055', name: 'Trinidad Fundadores Single',         category:'tobacco', sub:'cigars', emoji:'🚬', price: 47.97, age_restricted:true,  popular:false },
  { id: 'tb-056', name: 'Macanudo Café Hampton Court 5pk',    category:'tobacco', sub:'cigars', emoji:'🚬', price: 57.98, age_restricted:true,  popular:false },
  { id: 'tb-057', name: 'Oliva Serie V Melanio 5pk',          category:'tobacco', sub:'cigars', emoji:'🚬', price: 72.02, age_restricted:true,  popular:false },

  // ── SEXUAL WELLNESS (+20%) ───────────────────────────────
  { id: 'sw-001', name: 'Durex Condoms 12 Pack',      category: 'wellness', sub: 'wellness', emoji: '❤️', price: 13.20, age_restricted: false, popular: false },
  { id: 'sw-002', name: 'Durex Condoms 24 Pack',      category: 'wellness', sub: 'wellness', emoji: '❤️', price: 22.80, age_restricted: false, popular: false },
  { id: 'sw-003', name: 'Durex Pleasure Pack 10',     category: 'wellness', sub: 'wellness', emoji: '❤️', price: 15.60, age_restricted: false, popular: false },


  // ── FRESH CITRUS & GARNISHES (+30%) ──────────────────────────
  { id: 'fr-001', name: 'Lemons Bag 6pk',                     category:'fresh', sub:'citrus', emoji:'🍋', price:3.25, age_restricted:false, popular:true  },
  { id: 'fr-002', name: 'Limes Bag 6pk',                      category:'fresh', sub:'citrus', emoji:'🍋', price:3.25, age_restricted:false, popular:true  },
  { id: 'fr-003', name: 'Lemons & Limes Mixed 12pk',          category:'fresh', sub:'citrus', emoji:'🍋', price:5.85, age_restricted:false, popular:true  },
  { id: 'fr-004', name: 'Oranges Bag 4pk',                    category:'fresh', sub:'citrus', emoji:'🍊', price:3.90, age_restricted:false, popular:false },
  { id: 'fr-005', name: 'Fresh Mint Bunch',                   category:'fresh', sub:'garnish', emoji:'🌿', price:2.60, age_restricted:false, popular:true  },
  { id: 'fr-006', name: 'Cocktail Garnish Kit (Lemon, Lime, Mint, Cucumber)', category:'fresh', sub:'garnish', emoji:'🍹', price:9.10, age_restricted:false, popular:true  },

// ── PARTY SUPPLIES (+30%) ─────────────────────────────────────
  { id: 'ps-001', name: 'Balloons Mixed Colours 50pk',        category:'party', sub:'decorations', emoji:'🎈', price:5.85,  age_restricted:false, popular:true  },
  { id: 'ps-002', name: 'Balloon Pump Hand Pump',             category:'party', sub:'decorations', emoji:'🎈', price:3.90,  age_restricted:false, popular:false },
  { id: 'ps-003', name: 'Happy Birthday Banner Foil',         category:'party', sub:'decorations', emoji:'🎂', price:5.20,  age_restricted:false, popular:true  },
  { id: 'ps-004', name: 'Confetti Cannon x2',                 category:'party', sub:'decorations', emoji:'🎊', price:9.10,  age_restricted:false, popular:true  },
  { id: 'ps-005', name: 'Party Poppers 20pk',                 category:'party', sub:'decorations', emoji:'🎉', price:6.50,  age_restricted:false, popular:false },
  { id: 'ps-008', name: 'Birthday Candles Pack 24',           category:'party', sub:'decorations', emoji:'🕯️', price:2.60,  age_restricted:false, popular:false },
  { id: 'ps-010', name: 'Shot Glasses Plastic 20pk',          category:'party', sub:'disposables', emoji:'🥃', price:5.20,  age_restricted:false, popular:true  },
  { id: 'ps-023', name: 'Birthday Shot Sash + Crown Set',     category:'party', sub:'accessories', emoji:'👑', price:6.50,  age_restricted:false, popular:true  },

  // ── POOL PARTY SPECIFIC (+30%) ────────────────────────────────

  // ── SPECIAL OCCASION / CELEBRATION (+30%) ─────────────────────
  { id: 'oc-001', name: 'Moet & Chandon Brut NV 75cl',        category:'champagne', sub:'champagne', emoji:'🍾', price:52.00, age_restricted:true,  popular:true  },
  { id: 'oc-002', name: 'Veuve Clicquot Yellow Label 75cl',   category:'champagne', sub:'champagne', emoji:'🍾', price:65.00, age_restricted:true,  popular:true  },
  { id: 'oc-003', name: 'Ruinart Blanc de Blancs 75cl',       category:'champagne', sub:'champagne', emoji:'🍾', price:91.00, age_restricted:true,  popular:false },
  { id: 'oc-005', name: 'Sparkler Candles 10pk',              category:'party', sub:'decorations',  emoji:'✨', price:7.80,  age_restricted:false, popular:true  },
  { id: 'oc-006', name: 'Number Balloon Set 0-9 Gold',        category:'party', sub:'decorations',  emoji:'🔢', price:9.75,  age_restricted:false, popular:false },

  // ── DAYTIME PARTY FOOD (+30%) ─────────────────────────────────
  { id: 'df-001', name: 'Pringles Original 185g',             category:'snacks', sub:'crisps',  emoji:'🥔', price:4.55,  age_restricted:false, popular:true  },
  { id: 'df-002', name: 'Pringles Sour Cream 185g',           category:'snacks', sub:'crisps',  emoji:'🥔', price:4.55,  age_restricted:false, popular:false },
  { id: 'df-003', name: 'Antipasto Selection Board 400g',     category:'snacks', sub:'crisps',  emoji:'🧀', price:14.30, age_restricted:false, popular:true  },
  { id: 'df-004', name: 'Hummus & Pitta Bread Pack',          category:'snacks', sub:'crisps',  emoji:'🫓', price:7.80,  age_restricted:false, popular:true  },
  { id: 'df-005', name: 'Spanish Tortilla Sliced 400g',       category:'snacks', sub:'crisps',  emoji:'🍳', price:9.10,  age_restricted:false, popular:true  },
  { id: 'df-006', name: 'Cured Meats Selection 200g',         category:'snacks', sub:'crisps',  emoji:'🥩', price:11.70, age_restricted:false, popular:true  },
  { id: 'df-007', name: 'Cheese Board Selection 300g',        category:'snacks', sub:'crisps',  emoji:'🧀', price:14.30, age_restricted:false, popular:false },
  { id: 'df-008', name: 'Watermelon Pre-Cut 500g',            category:'snacks', sub:'sweet',   emoji:'🍉', price:5.20,  age_restricted:false, popular:true  },
  { id: 'df-009', name: 'Fruit Skewers Box 12pk',             category:'snacks', sub:'sweet',   emoji:'🍡', price:9.10,  age_restricted:false, popular:false },
  { id: 'df-010', name: 'Mini Pastries Box 12pk',             category:'snacks', sub:'sweet',   emoji:'🥐', price:9.75,  age_restricted:false, popular:false },


  // ── POOL PARTY (+30%) ────────────────────────────────────────
  { id: 'pp-001', name: 'Inflatable Flamingo XL',             category:'party',  sub:'floats',      emoji:'🦩', price:22.75, age_restricted:false, popular:true  },
  { id: 'pp-002', name: 'Inflatable Unicorn Giant',           category:'party',  sub:'floats',      emoji:'🦄', price:29.25, age_restricted:false, popular:true  },
  { id: 'pp-003', name: 'Inflatable Pizza Slice Float',       category:'party',  sub:'floats',      emoji:'🍕', price:19.50, age_restricted:false, popular:true  },
  { id: 'pp-004', name: 'Inflatable Donut Float',             category:'party',  sub:'floats',      emoji:'🍩', price:16.25, age_restricted:false, popular:false },
  { id: 'pp-005', name: 'Inflatable Swan Ride-On',            category:'party',  sub:'floats',      emoji:'🦢', price:26.00, age_restricted:false, popular:false },
  { id: 'pp-006', name: 'Floating Drinks Holder x4',          category:'party',  sub:'accessories', emoji:'🥂', price:9.75,  age_restricted:false, popular:true  },
  { id: 'pp-008', name: 'Pool Noodles 4pk',                   category:'party',  sub:'accessories', emoji:'🟡', price:13.00, age_restricted:false, popular:false },
  { id: 'pp-009', name: 'Water Guns 2pk Large',               category:'party',  sub:'games',       emoji:'💦', price:13.00, age_restricted:false, popular:true  },
  { id: 'pp-010', name: 'Floating Card Game Waterproof',      category:'party',  sub:'games',       emoji:'🃏', price:9.75,  age_restricted:false, popular:false },
  { id: 'pp-011', name: 'Pool Volleyball Net Set',            category:'party',  sub:'games',       emoji:'🏐', price:26.00, age_restricted:false, popular:false },
  { id: 'pp-012', name: 'Floating Beer Pong Set',             category:'party',  sub:'games',       emoji:'🏓', price:19.50, age_restricted:false, popular:true  },

  // ── PARTY EQUIPMENT & GAMES (+30%) ───────────────────────────
  { id: 'ps-006', name: 'Fairy Lights LED 5m Battery',        category:'party', sub:'decorations', emoji:'✨', price:13.00, age_restricted:false, popular:true  },
  { id: 'ps-007', name: 'Glow Sticks Pack 50',                category:'party', sub:'decorations', emoji:'🌟', price:7.80,  age_restricted:false, popular:true  },
  { id: 'ps-009', name: 'Table Cloth Disposable 4pk',         category:'party', sub:'disposables', emoji:'🍽️', price:5.20,  age_restricted:false, popular:false },
  { id: 'ps-011', name: 'Cocktail Umbrella Picks 50pk',       category:'party', sub:'disposables', emoji:'☂️', price:3.25,  age_restricted:false, popular:false },
  { id: 'ps-012', name: 'Fruit Skewer Picks 50pk',            category:'party', sub:'disposables', emoji:'🍡', price:2.60,  age_restricted:false, popular:false },
  { id: 'ps-013', name: 'Punch Bowl Set with Ladle',          category:'party', sub:'drinkware',   emoji:'🥣', price:16.25, age_restricted:false, popular:false },
  { id: 'ps-014', name: 'Jello Shot Cups 50pk',               category:'party', sub:'drinkware',   emoji:'🍮', price:6.50,  age_restricted:false, popular:true  },
  { id: 'ps-015', name: 'Cooler Box 35L',                     category:'party', sub:'equipment',   emoji:'🧊', price:32.50, age_restricted:false, popular:true  },
  { id: 'ps-017', name: 'Disco Ball LED Rotating',            category:'party', sub:'equipment',   emoji:'🪩', price:22.75, age_restricted:false, popular:true  },
  { id: 'ps-018', name: 'Poker Set 200 Chips',                category:'party', sub:'games',       emoji:'🃏', price:26.00, age_restricted:false, popular:false },
  { id: 'ps-019', name: 'Beer Pong Set 22 Cups + Balls',      category:'party', sub:'games',       emoji:'🏓', price:13.00, age_restricted:false, popular:true  },
  { id: 'ps-021', name: 'Ring Toss Garden Game',              category:'party', sub:'games',       emoji:'⭕', price:16.25, age_restricted:false, popular:false },
  { id: 'ps-022', name: 'Playing Cards 2 Decks',              category:'party', sub:'games',       emoji:'♠️', price:5.85,  age_restricted:false, popular:false },
  { id: 'ps-024', name: 'Photo Booth Props Kit 30pc',         category:'party', sub:'accessories', emoji:'📸', price:9.75,  age_restricted:false, popular:false },
  { id: 'ps-025', name: 'Polaroid Instant Film 20 Shots',     category:'party', sub:'accessories', emoji:'📷', price:19.50, age_restricted:false, popular:false },
  { id: 'oc-004', name: 'Personalised Birthday Ribbon',       category:'party', sub:'accessories', emoji:'🎀', price:3.25,  age_restricted:false, popular:false },
  { id: 'oc-007', name: 'Luxury Gift Bag Large',              category:'party', sub:'accessories', emoji:'🎁', price:5.85,  age_restricted:false, popular:false },
  { id: 'oc-008', name: 'Dried Flower Bouquet',               category:'party', sub:'decorations', emoji:'💐', price:19.50, age_restricted:false, popular:false },
]

// ── Category config ─────────────────────────────────────────
  // ── COCKTAIL KITS & MIXERS (+30%) ─────────────────────────────
  { id: 'ck-001', name: 'Classic Cocktail Kit (shaker, strainer, jigger, muddler, bar spoon)', category:'cocktail', sub:'kit', emoji:'🍹', price:22.75, age_restricted:false, popular:true  },
  { id: 'ck-002', name: 'Aperol Spritz Kit (Aperol 70cl + Prosecco + Soda)', category:'cocktail', sub:'kit', emoji:'🥂', price:28.60, age_restricted:true,  popular:true  },
  { id: 'ck-003', name: 'Mojito Kit (Rum + Mint + Lime + Sugar + Soda)', category:'cocktail', sub:'kit', emoji:'🌿', price:24.70, age_restricted:true,  popular:true  },
  { id: 'ck-004', name: 'Gin & Tonic Kit (Premium Gin + Fever-Tree Tonic 4pk + Limes)', category:'cocktail', sub:'kit', emoji:'🫙', price:32.50, age_restricted:true,  popular:true  },
  { id: 'ck-005', name: 'Espresso Martini Kit (Vodka + Kahlua + Espresso pods)', category:'cocktail', sub:'kit', emoji:'☕', price:35.75, age_restricted:true,  popular:true  },
  { id: 'ck-006', name: 'Margarita Kit (Tequila + Triple Sec + Lime juice + Salt)', category:'cocktail', sub:'kit', emoji:'🍋', price:29.90, age_restricted:true,  popular:true  },
  { id: 'ck-007', name: 'Negroni Kit (Gin + Campari + Sweet Vermouth)', category:'cocktail', sub:'kit', emoji:'🍊', price:34.45, age_restricted:true,  popular:false },
  { id: 'ck-008', name: 'Sangria Kit (Red Wine + Brandy + Orange juice + Fruit)', category:'cocktail', sub:'kit', emoji:'🍷', price:23.40, age_restricted:true,  popular:true  },
  { id: 'ck-009', name: 'Pina Colada Kit (White Rum + Coconut Cream + Pineapple juice)', category:'cocktail', sub:'kit', emoji:'🥥', price:26.65, age_restricted:true,  popular:true  },
  { id: 'ck-010', name: 'Bellini Kit (Prosecco + Peach puree)', category:'cocktail', sub:'kit', emoji:'🍑', price:21.45, age_restricted:true,  popular:false },
  { id: 'ck-011', name: 'Whisky Sour Kit (Bourbon + Lemon juice + Sugar syrup)', category:'cocktail', sub:'kit', emoji:'🥃', price:27.95, age_restricted:true,  popular:false },
  { id: 'ck-012', name: 'Cosmopolitan Kit (Vodka + Triple Sec + Cranberry + Lime)', category:'cocktail', sub:'kit', emoji:'🌸', price:28.60, age_restricted:true,  popular:true  },
  { id: 'ck-013', name: 'Cocktail Garnish Kit (Lemons, Limes, Mint, Cucumber, Olives, Cherries)', category:'cocktail', sub:'garnish', emoji:'🍋', price:12.35, age_restricted:false, popular:true  },
  { id: 'ck-014', name: 'Simple Syrup & Grenadine Set', category:'cocktail', sub:'mixer', emoji:'🍯', price:9.75, age_restricted:false, popular:false },
  { id: 'ck-015', name: 'Cocktail Napkins & Picks Set 50pk', category:'cocktail', sub:'accessories', emoji:'🍡', price:5.20, age_restricted:false, popular:false },


export const CATEGORIES = [
  { key: 'spirits',    label: 'Spirits',      emoji: '🥃', subs: [
    { key: 'tequila',  label: 'Tequila'  },
    { key: 'vodka',    label: 'Vodka'    },
    { key: 'gin',      label: 'Gin'      },
    { key: 'whiskey',  label: 'Whiskey'  },
    { key: 'rum',      label: 'Rum'      },
    { key: 'cognac',   label: 'Cognac'   },
    { key: 'liqueurs', label: 'Liqueurs' },
  ]},
  { key: 'champagne',  label: 'Champagne',    emoji: '🍾', subs: [{ key: 'champagne', label: 'All Champagne' }] },
  { key: 'wine',       label: 'Wine',         emoji: '🍷', subs: [
    { key: 'red',   label: 'Red Wine' },
    { key: 'white', label: 'White Wine' },
    { key: 'rose',  label: 'Rosé' },
  ]},
  { key: 'beer',       label: 'Beer & Cider', emoji: '🍺', subs: [
    { key: 'lager',    label: 'Lager'    },
    { key: 'specialty',label: 'Specialty'},
    { key: 'cider',    label: 'Cider'    },
  ]},
  { key: 'soft_drinks',label: 'Soft Drinks',  emoji: '🥤', subs: [
    { key: 'carbonated', label: 'Carbonated' },
    { key: 'energy',     label: 'Energy'     },
    { key: 'mixers',     label: 'Mixers'     },
  ]},
  { key: 'water',      label: 'Water',        emoji: '💧', subs: [
    { key: 'still',    label: 'Still'    },
    { key: 'sparkling',label: 'Sparkling'},
  ]},
  { key: 'ice',        label: 'Ice',          emoji: '🧊', subs: [{ key: 'ice', label: 'All Ice' }] },
  { key: 'snacks',     label: 'Snacks',       emoji: '🍿', subs: [
    { key: 'sweet',  label: 'Sweet Treats'    },
    { key: 'crisps', label: 'Crisps & Snacks' },
  ]},
  { key: 'tobacco',    label: 'Tobacco',      emoji: '🚬', subs: [
    { key: 'cigarettes', label: 'Cigarettes'      },
    { key: 'rolling',    label: 'Rolling Tobacco' },
    { key: 'pouches',    label: 'Nicotine Pouches'},
    { key: 'cigars',     label: 'Cigars'          },
    { key: 'vapes',      label: 'Vapes'           },
    { key: 'heated',     label: 'Heated Tobacco'  },
  ]},
  { key: 'wellness',   label: 'Wellness',     emoji: '❤️', subs: [
    { key: 'wellness', label: 'Sexual Wellness' },
    { key: 'health',   label: 'Health & Remedies' },
  ]},
  { key: 'essentials', label: 'Essentials',   emoji: '🧻', subs: [
    { key: 'party',  label: 'Party Essentials' },
    { key: 'basics', label: 'Daily Basics' },
  ]},
  { key: 'beach',      label: 'Beach',         emoji: '🏖️', subs: [
    { key: 'towels',      label: 'Towels & Mats' },
    { key: 'swimwear',    label: 'Swimwear' },
    { key: 'accessories', label: 'Accessories' },
  ]},
  { key: 'cocktail',   label: 'Cocktail Kits',   emoji: '🍹', subs: [
    { key: 'kit',        label: 'Cocktail Kits'  },
    { key: 'garnish',    label: 'Garnishes'      },
    { key: 'mixer',      label: 'Syrups & Mixes' },
    { key: 'accessories',label: 'Accessories'    },
  ]},
  { key: 'fresh',      label: 'Fresh & Citrus',  emoji: '🍋', subs: [
    { key: 'citrus',  label: 'Citrus' },
    { key: 'garnish', label: 'Garnishes' },
  ]},
  { key: 'party',      label: 'Party Supplies', emoji: '🎉', subs: [
    { key: 'decorations', label: 'Decorations'    },
    { key: 'disposables', label: 'Cups & Plates'  },
    { key: 'floats',      label: 'Pool Inflatables'},
    { key: 'games',       label: 'Party Games'    },
    { key: 'equipment',   label: 'Equipment'      },
    { key: 'accessories', label: 'Accessories'    },
  ]},


]

export const BEST_SELLERS = PRODUCTS.filter(p => p.popular).slice(0, 12)
export const NEW_IN       = PRODUCTS.slice(-16)

// ── NAPKINS & DISPOSABLES (+20%) ──────────────────────────────
// Added to snacks category as sub: 'essentials'
