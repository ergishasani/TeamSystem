import { ImageSourcePropType } from 'react-native';

const IMAGES = {
  // Wellness
  spa:                    require('@/assets/img/spa.jpeg'),
  spa_access_pass:        require('@/assets/img/spa_access_pass.jpeg'),
  hot_stone_massage:      require('@/assets/img/hot_stone_massage.jpeg'),
  group_yoga_class:       require('@/assets/img/Group_yoga_class.jpeg'),
  hair_glow_treatment:    require('@/assets/img/hair_grow_treatment.jpeg'),
  facial_skin_care:       require('@/assets/img/Skin_care.jpeg'),
  // Fitness
  pilates:                require('@/assets/img/pilates.jpeg'),
  pilates_class:          require('@/assets/img/Pilates_class.jpeg'),
  personal_training:      require('@/assets/img/personal_training.jpeg'),
  rock_climbing:          require('@/assets/img/Rock_climbing_session.jpeg'),
  // Travel
  bovilla:                require('@/assets/img/bovilla.jpeg'),
  dajti:                  require('@/assets/img/dajti.jpeg'),
  ohrid_weekend:          require('@/assets/img/ohrid_weekend.jpeg'),
  skadar_kayaking:        require('@/assets/img/skadar_kayaking.jpeg'),
  // Food
  healthy_dinner_voucher: require('@/assets/img/healthy_dinner_voucher.jpeg'),
  smoothie_bowl_set:      require('@/assets/img/smoothie_bowl_set.jpeg'),
  chefs_tasting_menu:     require('@/assets/img/chef_tating_menu.jpeg'),
  business_lunch:         require('@/assets/img/business_lunch.jpeg'),
  monthly_coffee_pass:    require('@/assets/img/monthly_coffee_pass.jpeg'),
  // Learning
  ai_tools:               require('@/assets/img/ai_tools.jpeg'),
  ai_tools_workshop:      require('@/assets/img/AI_tools_workshop.jpg'),
  python:                 require('@/assets/img/python.jpg'),
  italian:                require('@/assets/img/italian.jpg'),
  english_business:       require('@/assets/img/english_business.jpg'),
  // Health
  dental_checkup:         require('@/assets/img/dental_checkup.jpeg'),
  eye_examination:        require('@/assets/img/Eye_examination.jpeg'),
  therapy_session:        require('@/assets/img/therapy_session.jpeg'),
  mindfulness:            require('@/assets/img/mindefulness.jpeg'),
  nutrition_consultation: require('@/assets/img/nutrition_consultation.jpeg'),
} as const;

type ImageKey = keyof typeof IMAGES;

const TITLE_MAP: Record<string, ImageKey> = {
  // Wellness — each offer gets its own photo
  'Spa Access Pass':         'spa_access_pass',
  'Hot Stone Massage':       'hot_stone_massage',
  'Group Yoga Class':        'group_yoga_class',
  'Hair & Glow Treatment':   'hair_glow_treatment',
  'Facial & Skin Care':      'facial_skin_care',
  'Mindfulness Workshop':    'mindfulness',
  // Health — each offer gets its own photo
  'Dental Checkup':          'dental_checkup',
  'Eye Examination':         'eye_examination',
  'Therapy Session':         'therapy_session',
  'Nutrition Consultation':  'nutrition_consultation',
  // Fitness — each offer gets its own photo
  'Pilates Class':           'pilates_class',
  'Personal Training':       'personal_training',
  'Rock Climbing Session':   'rock_climbing',
  // Food — each offer gets its own photo
  'Healthy Dinner Voucher':  'healthy_dinner_voucher',
  'Smoothie Bowl Set':       'smoothie_bowl_set',
  "Chef's Tasting Menu":     'chefs_tasting_menu',
  'Business Lunch':          'business_lunch',
  'Monthly Coffee Pass':     'monthly_coffee_pass',
  // Travel — each offer gets its own photo
  'Bovilla Day Trip':        'bovilla',
  'Ohrid Weekend':           'ohrid_weekend',
  'Dajti Mountain Hike':     'dajti',
  'Skadar Kayaking':         'skadar_kayaking',
  // Learning — each offer gets its own photo
  'AI Tools Workshop':       'ai_tools_workshop',
  'Python for Data Science': 'python',
  'Italian Starter Course':  'italian',
  'English Business Skills': 'english_business',
};

const CATEGORY_MAP: Record<string, ImageKey> = {
  wellness: 'spa_access_pass',
  fitness:  'pilates_class',
  travel:   'bovilla',
  learning: 'ai_tools_workshop',
  health:   'therapy_session',
  food:     'healthy_dinner_voucher',
  // food and fitness category fallbacks for any future offers
};

export function getOfferImage(title: string, category: string): ImageSourcePropType | null {
  const key = TITLE_MAP[title] ?? CATEGORY_MAP[category] ?? null;
  return key ? IMAGES[key] : null;
}
