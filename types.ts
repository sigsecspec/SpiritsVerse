
export enum AppView {
  DRINK_DIRECTORY = 'DRINK_DIRECTORY',
  SIP_STREAM = 'SIP_STREAM',
  LOCAL_PUB = 'LOCAL_PUB',
  POUR_UP = 'POUR_UP',
  BAR_SESH = 'BAR_SESH',
  PROFILE = 'PROFILE'
}

export type UserRole = 'User' | 'Bartender' | 'Sommelier' | 'Brewer' | 'Mixologist' | 'Moderator' | 'Administrator';

export interface Drink {
  id: string;
  name: string;
  category: 'Whiskey' | 'Vodka' | 'Tequila' | 'Rum' | 'Gin' | 'Brandy' | 'Liqueur' | 'Wine' | 'Beer' | 'Cocktail' | 'Mocktail' | 'Other';
  description: string;
  abv?: number; // Alcohol by volume
  age?: number; // Years aged (optional)
  region?: string;
  tasting_notes: string[];
  pairs_with: string[];
  maker: string;
  history?: string;
  recipe?: string;
  strength_level?: 'Zero Proof' | 'Light' | 'Medium' | 'Strong' | 'Nuclear';
  // Aggregated data for display
  photo_count?: number;
  review_count?: number;
  avg_rating?: number;
  cover_image_url?: string;
  // User-specific data
  user_has_tasted?: boolean;
  user_has_collected?: boolean;
}

export interface DrinkPhoto {
  id: string;
  spirit_id: string; // Keeping DB field name for now
  user_id: string;
  user_name: string;
  user_avatar: string;
  image_url: string;
  created_at: string;
  serving_style: string; // Generic context: HOME, BAR, etc.
  cocktail_name?: string;
  context?: 'HOME' | 'BAR';
}

export interface DrinkReview {
  id: string;
  spirit_id: string; // Keeping DB field name
  user_id: string;
  user_name: string;
  user_avatar: string;
  rating: number;
  text: string;
  created_at: string;
  serving_style: string; 
  context?: 'HOME' | 'BAR';
}

export interface DrinkChatMessage {
    id: string;
    spirit_id: string;
    user_id: string;
    user_name: string;
    message: string;
    created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji or icon name
}

export interface User {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  widgets: Widget[];
  latitude?: number;
  longitude?: number;
  distanceRadius?: number; // km
  city?: string;
  state?: string;
  favDrinks?: string[];
  drinkingStyle?: 'Neat' | 'On the Rocks' | 'Cocktails' | 'Shots' | 'Wine Only' | 'Craft Beer' | 'Mocktails';
  badges?: Badge[];
  custom_css?: string;
  custom_js?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  status?: 'active' | 'shadow_banned' | 'banned';
  role?: UserRole;
}

export interface Widget {
  id: string;
  type: 'YOUTUBE' | 'IMAGE' | 'TEXT' | 'STATS';
  content: string; 
  title?: string;
}

export type PostVisibility = 
  | 'GLOBAL_BAR'      // Global Public
  | 'LOCAL_PUB'       // Local Radius
  | 'FRIENDS' 
  | 'FAMILY' 
  | 'FRIENDS_AND_FAMILY' 
  | 'FRIEND_GROUP' 
  | 'FAMILY_GROUP' 
  | 'TOAST_MATCH'      // Dating/Linkup profile feed
  | 'ONLY_ME';

export type ReactionType = 
  | 'CHEERS' 
  | 'DRINK' 
  | 'SPILL'
  | 'THUMBS_UP'
  | 'BUZZED'
  | 'WEAK'
  | 'SALUTE'
  | 'HANGOVER'
  | 'MELTING'
  | 'DROOLING'
  | 'ZANY'
  | 'LAUGHING'
  | 'MIND_BLOWN'
  | 'RELIEF';

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  image?: string;
  timestamp: number;
  reactions: Record<string, number>;
  userReaction?: ReactionType | null;
  comments: number;
  visibility: PostVisibility;
  latitude?: number;
  longitude?: number;
  distance?: number; 
  groupId?: string;
  isToastIt?: boolean;
  authorCity?: string;
  authorState?: string;
  mood?: string;
  
  // PourUp (formerly ToastIt) Metadata
  toastLookingFor?: string;
  toastExpiresAt?: string; // ISO string

  // SipStream (formerly TheBar) Metadata
  spirit?: string;
  buzzLevel?: number; // 0-10 (How tipsy?)
  venue?: string; // Bar name
  badges?: string[]; 
}

export interface PostComment {
    id: string;
    post_id: string;
    user_id: string;
    user_name: string;
    user_avatar: string;
    content: string;
    created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  type: 'FRIEND' | 'FAMILY' | 'PUBLIC' | 'TOAST';
  members: string[]; 
  messages: ChatMessage[];
  cover_image_url?: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

export interface SafetyReport {
  id: string;
  latitude: number;
  longitude: number;
  status: 'SAFE' | 'ROWDY';
  timestamp: number;
}

export interface CellarItem {
  id: string;
  user_id: string;
  name: string;
  spirit_type: string;
  status: 'SEALED' | 'OPEN' | 'EMPTY';
  rating: number; // 0-100
  acquired_date: string; // ISO string timestamp
}

export interface Story {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  image_url: string;
  spirit_name?: string;
  buzz_level?: number;
}

export interface Relationship {
  user_1_id: string;
  user_2_id: string;
  type: 'FRIEND' | 'FAMILY';
  status: 'PENDING' | 'ACCEPTED';
}

export interface DrinkSuggestion {
    drinkName: string;
    description: string;
    category: 'Whiskey' | 'Vodka' | 'Tequila' | 'Rum' | 'Gin' | 'Brandy' | 'Liqueur' | 'Wine' | 'Beer' | 'Cocktail' | 'Mocktail';
}

export interface GameScore {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  game_id: string;
  score: number;
}

export type ReportCategory = 
  | 'Suspicious activity'
  | 'Underage'
  | 'Spam'
  | 'Harassment'
  | 'Illegal Sales'
  | 'Fake / catfishing';

export type PourUpInteractionType = 'RAISE_GLASS' | 'CLINK';
export type PourUpInteractionStatus = 'PENDING' | 'TOASTED' | 'DECLINED';

export interface PourUpInteraction {
    id: string;
    post_id: string;
    sender_id: string;
    sender_name: string;
    sender_avatar: string;
    receiver_id: string;
    message: string | null;
    type: PourUpInteractionType;
    status: PourUpInteractionStatus;
    created_at: string;
    group_id?: string | null;
}
