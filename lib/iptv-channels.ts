// 📁 lib/iptv-channels.ts

// =============================================
// 🧠 نظام إدارة الذاكرة المدمج
// =============================================

interface CacheEntry<T> {
  data: T;
  lastAccessed: number;
  accessCount: number;
  size: number;
}

class ChannelsMemoryManager {
  private static instance: ChannelsMemoryManager;
  private cache = new Map<string, CacheEntry<any>>();
  private maxTotalSize = 30 * 1024 * 1024; // 30MB
  private maxEntries = 50;
  private cleanupInterval: NodeJS.Timeout;

  private constructor() {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 2 * 60 * 1000);
  }

  static getInstance(): ChannelsMemoryManager {
    if (!ChannelsMemoryManager.instance) {
      ChannelsMemoryManager.instance = new ChannelsMemoryManager();
    }
    return ChannelsMemoryManager.instance;
  }

  set<T>(key: string, data: T, size: number = 1): void {
    while (this.cache.size >= this.maxEntries || this.getTotalSize() + size > this.maxTotalSize) {
      this.removeLeastUsed();
    }
    this.cache.set(key, { data, lastAccessed: Date.now(), accessCount: 1, size });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    entry.lastAccessed = Date.now();
    entry.accessCount++;
    return entry.data as T;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private getTotalSize(): number {
    let total = 0;
    this.cache.forEach(entry => { total += entry.size; });
    return total;
  }

  private removeLeastUsed(): void {
    let leastUsedKey = '';
    let minScore = Infinity;
    this.cache.forEach((entry, key) => {
      const hoursSinceAccess = (Date.now() - entry.lastAccessed) / (1000 * 60 * 60);
      const score = entry.accessCount / (hoursSinceAccess + 1);
      if (score < minScore) {
        minScore = score;
        leastUsedKey = key;
      }
    });
    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const thirtyMinutesAgo = now - (30 * 60 * 1000);
    this.cache.forEach((entry, key) => {
      if (entry.lastAccessed < thirtyMinutesAgo) {
        this.cache.delete(key);
      }
    });
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// =============================================
// 🎯 التهيئة والنظام الأساسي
// =============================================

const memoryManager = ChannelsMemoryManager.getInstance();

export interface IPTVChannel {
  name: string;
  url: string;
  logo?: string;
  category?: string;
  countryName?: string;
  language?: any;
  lang?: any;
  platform?: string;
  source?: string;
  streams?: any[];
  sources?: any[];
  description?: string;
  priority?: number;
  [key: string]: any;
}

// =============================================
// 🔧 الدوال المساعدة
// =============================================

export function normalizeYouTubeUrl(url: string): string {
  if (!url || (!url.includes("youtube") && !url.includes("youtu.be"))) return url;
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace("/", "");
      return `https://www.youtube-nocookie.com/embed/${id}`;
    }
    if (u.searchParams.has("v")) {
      const id = u.searchParams.get("v");
      return `https://www.youtube-nocookie.com/embed/${id}`;
    }
    if (u.pathname.startsWith("/live/")) {
      const id = u.pathname.split("/live/")[1];
      return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
    }
    if (u.pathname.includes("/embed/")) {
      return url.replace("youtube.com", "youtube-nocookie.com");
    }
    return url;
  } catch {
    return url;
  }
}

export async function getAllChannels(): Promise<Record<string, IPTVChannel[]>> {
  const cached = memoryManager.get<Record<string, IPTVChannel[]>>('all-channels');
  if (cached) {
    return cached;
  }
  try {
    const response = await fetch('/data/channels.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch channels: ${response.statusText}`);
    }
    const data: Record<string, IPTVChannel[]> = await response.json();
    if (data["United States"]) {
      data["United States of America"] = data["United States"];
    }
    const estimatedSize = JSON.stringify(data).length;
    memoryManager.set('all-channels', data, estimatedSize);
    return data;
  } catch (error) {
    console.error("Error loading channels.json:", error);
    return {};
  }
}

function sortChannelsSmartly(a: IPTVChannel, b: IPTVChannel): number {
  const prioA = a.priority ?? Infinity;
  const prioB = b.priority ?? Infinity;
  if (prioA !== prioB) {
    return prioA - prioB;
  }
  return a.name.localeCompare(b.name);
}

// =============================================
// 🎪 نظام الفلترة والتصنيف
// =============================================

const categoryKeywords: Record<string, string[]> = {
  // الفئات الأساسية
  music: [
    'music', 'mtv', 'radio', 'fm', 'hits', 'rap', 'pop', 'rock', 'schlager',
    'vevo', 'musica', 'música', 'musique', 'aghani', 'tarab', 'songtv', 'melody',
    'rotana', 'stereo', 'anghami', 'mazzika'
  ],
  news: [
    'news', 'nachrichten', 'noticias', 'info', 'akhbar', 'إخبارية', 'خبر',
    'jazeera', 'cnn', 'bbc', 'fox', 'dw', 'rt', 'sky news', 'cbs', 'abc',
    'nbc', 'notizie', 'nouvelles', '24/7', '24h', 'alarabiya', 'al hadath',
    'alghad', 'al mayadeen', 'france 24', 'العربية', 'الحدث', 'أخبار'
  ],
  movies: [
    'movie', 'film', 'cinema', 'cine', 'kino', 'aflam', 'أفلام', 'hollywood',
    'action', 'drama', 'fox movies'
  ],
  sports: [
    'sport', 'sports', 'nfl', 'nba', 'mlb', 'football', 'futbol', 'tennis',
    'golf', 'racing', 'carreras', 'f1', 'رياضة', 'bein', 'espn', 'tnt sports',
    'ad sports', 'ssc', 'alkass', 'الكاس'
  ],
  kids: [
    'kids', 'animation', 'cartoon', 'niños', 'enfants', 'kinder', 'أطفال',
    'junior', 'disney', 'nick', 'cn', 'cartoonito', 'spaceto.o.n', 'peppa',
    'gumball', 'smurfs', 'سنافر', 'كرتون', 'اطفال'
  ],
  documentary: [
    'documentary', 'doc', 'discovery', 'geo', 'history', 'animal',
    'planet', 'nat geo', 'national geographic', 'وثائقي', 'wathaiqi'
  ],
  shop: [
    'shop', 'qvc', 'hse', 'tjc', 'ideal world', 'citruss'
  ],
  religious: [
    'religious', 'quran', 'قرآن', 'sunnah', 'bible', 'ewtn', 'mta', 'islam',
    'makkah', 'mecca', 'saudi quran', 'al majid', 'iqraa'
  ],
  cooking: [
    'cooking', 'kitchen', 'food', 'chef', 'مطبخ', 'طبخ', 'food network'
  ],
  auto: [
    'auto', 'car', 'motor', 'racing', 'f1', 'vehicle', 'automotive', 'سيارات'
  ],
  animation: [
    'animation', 'anime', 'أنمي'
  ],
  business: [
    'business', 'finance', 'money', 'invest', 'stock', 'market', 'bloomberg', 'cnbc', 'مال', 'أعمال'
  ],
  classic: [
    'classic', 'retro', 'vintage', 'oldies', 'golden age', 'كلاسيك'
  ],
  comedy: [
    'comedy', 'funny', 'laugh', 'standup', 'humor', 'كوميديا', 'ضحك'
  ],
  culture: [
    'culture', 'arts', 'cultural', 'heritage', 'thakafia', 'ثقافة'
  ],
  education: [
    'education', 'school', 'learn', 'teach', 'university', 'تعليم'
  ],
  entertainment: [
    'entertainment', 'celeb', 'gossip', 'hollywood', 'e!', 'فن', 'ترفيه'
  ],
  family: [
    'family', 'familia', 'famille', 'عائلة'
  ],
  general: [
    'general', 'generalista', 'général', 'عام', 'منوعات'
  ],
  legislative: [
    'legislative', 'government', 'parliament', 'c-span', 'senate', 'parlamento', 'مجلس'
  ],
  lifestyle: [
    'lifestyle', 'life', 'style', 'home', 'garden', 'fashion', 'health', 'wellbeing'
  ],
  series: [
    'series', 'tv show', 'drama', 'sitcom', 'مسلسلات'
  ],
  outdoor: [
    'outdoor', 'nature', 'adventure', 'hunting', 'fishing', 'طبيعة'
  ],
  relax: [
    'relax', 'chill', 'ambience', 'fireplace', 'calm', 'ambiant', 'استرخاء'
  ],
  science: [
    'science', 'tech', 'technology', 'sci', 'space', 'nasa', 'علوم'
  ],
  travel: [
    'travel', 'tourism', 'voyage', 'safar', 'trip', 'vacation', 'سفر'
  ],
  weather: [
    'weather', 'meteo', 'forecast', 'طقس', 'wetter', 'tiempo'
  ]
};

function filterChannel(channel: IPTVChannel, category: string | null): boolean {
  if (
    !category ||
    category === "all-channels" ||
    category === "about" ||
    category.startsWith("faq") ||
    category.startsWith("privacy") ||
    category.startsWith("feedback") ||
    category === "history" ||
    category === "favorites"
  ) {
    return true;
  }
  if (category === "random-channel") {
    return true;
  }

  const requestedCategory = category.toLowerCase().replace("-", " ");
  const chName = channel.name.toLowerCase();
  const chCategory = channel.category?.toLowerCase(); 

  if (chCategory === requestedCategory) {
    return true;
  }

  if (chCategory === 'news' && (requestedCategory === 'top news' || requestedCategory === 'news')) {
    return true;
  }
  
  let keywords: string[] | undefined = categoryKeywords[requestedCategory as keyof typeof categoryKeywords];
  
  if (requestedCategory === 'top news') {
    keywords = categoryKeywords['news'];
  }

  if (keywords) {
    if (keywords.some(keyword => chName.includes(keyword))) {
      return true;
    }
  } else {
    if (chName.includes(requestedCategory)) {
      return true;
    }
  }

  return false;
}

// =============================================
// 🚀 الدوال الرئيسية المحسنة
// =============================================

export async function getChannelsByCountry(
  country: string,
  category: string | null
): Promise<IPTVChannel[]> {
  const cacheKey = `country-${country}-${category}`;
  
  const cached = memoryManager.get<IPTVChannel[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const allChannelsData = await getAllChannels();
  const allChannels = allChannelsData[country] || [];

  const normalizedChannels = allChannels.map((ch) => ({
    ...ch,
    url: normalizeYouTubeUrl(ch.url),
  }));

  const filtered = normalizedChannels.filter(ch => filterChannel(ch, category));

  if (category !== "random-channel") {
    filtered.sort(sortChannelsSmartly);
  }

  let result: IPTVChannel[];
  if (category === "random-channel") {
    result = filtered.sort(() => 0.5 - Math.random()).slice(0, 20);
  } else {
    result = filtered;
  }

  memoryManager.set(cacheKey, result, result.length * 200);
  return result;
}

export async function getChannelsByCategory(
  category: string | null
): Promise<IPTVChannel[]> {

  if (
    !category ||
    category === "all-channels" ||
    category === "about" ||
    category.startsWith("faq") ||
    category.startsWith("privacy") ||
    category.startsWith("feedback") ||
    category === "history" ||
    category === "favorites"
  ) {
    return [];
  }

  const cacheKey = `category-${category}`;
  
  const cached = memoryManager.get<IPTVChannel[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const allChannelsData = await getAllChannels();

  let allChannels: IPTVChannel[] = [];
  for (const country in allChannelsData) {
    if (country === "United States of America") continue; 

    allChannelsData[country].forEach(channel => {
      allChannels.push({
        ...channel,
        countryName: country,
      });
    });
  }

  const normalizedChannels = allChannels.map((ch) => ({
    ...ch,
    url: normalizeYouTubeUrl(ch.url),
  }));

  const filtered = normalizedChannels.filter(ch => filterChannel(ch, category));

  let result: IPTVChannel[];
  if (category === "random-channel") {
    result = filtered.sort(() => 0.5 - Math.random()).slice(0, 40);
  } else {
    result = filtered;
    result.sort(sortChannelsSmartly);
  }

  memoryManager.set(cacheKey, result, result.length * 150);
  return result;
}

// =============================================
// 📖 نظام التحميل التدريجي
// =============================================

export async function getChannelsPaginated(
  country: string,
  category: string | null,
  page: number = 0,
  pageSize: number = 50
): Promise<{ 
  channels: IPTVChannel[]; 
  hasMore: boolean; 
  total: number;
  nextPage?: number;
}> {
  
  const cacheKey = `paginated-${country}-${category}-${page}-${pageSize}`;
  
  const cached = memoryManager.get<typeof result>(cacheKey);
  if (cached) {
    return cached;
  }

  const allChannels = await getChannelsByCountry(country, category);
  
  const start = page * pageSize;
  const end = start + pageSize;
  
  const result = {
    channels: allChannels.slice(start, end),
    hasMore: end < allChannels.length,
    total: allChannels.length,
    nextPage: end < allChannels.length ? page + 1 : undefined
  };

  memoryManager.set(cacheKey, result, result.channels.length * 100);
  
  return result;
}

export async function getCategoryChannelsPaginated(
  category: string | null,
  page: number = 0,
  pageSize: number = 50
): Promise<{ 
  channels: IPTVChannel[]; 
  hasMore: boolean; 
  total: number;
  nextPage?: number;
}> {
  
  const cacheKey = `paginated-category-${category}-${page}-${pageSize}`;
  
  const cached = memoryManager.get<typeof result>(cacheKey);
  if (cached) {
    return cached;
  }

  const allChannels = await getChannelsByCategory(category); 
  
  const start = page * pageSize;
  const end = start + pageSize;
  
  const result = {
    channels: allChannels.slice(start, end),
    hasMore: end < allChannels.length,
    total: allChannels.length,
    nextPage: end < allChannels.length ? page + 1 : undefined
  };

  memoryManager.set(cacheKey, result, result.channels.length * 100);
  
  return result;
}

export async function preloadPriorityCountries(): Promise<void> {
  const priorityCountries = [
    'United States', 'United Kingdom', 'Saudi Arabia', 
    'United Arab Emirates', 'Egypt', 'Germany', 'France',
    'Canada', 'Australia', 'India', 'Italy', 'Spain',
    'Brazil', 'Japan', 'South Korea', 'Turkey', 'Morocco' // (إضافة المغرب)
  ];

  const preloadPromises = priorityCountries.map(async (country) => {
    // 👈🔴 (1) تم تغيير المفتاح ليتطابق مع getChannelsByCountry
    const cacheKey = `country-${country}-all-channels`; 
    if (!memoryManager.has(cacheKey)) {
      try {
        // 👈🔴 (2) تم إصلاح الخطأ هنا
        await getChannelsByCountry(country, null); 
        console.log(`✅ Preloaded: ${country}`);
      } catch (error) {
        console.warn(`⚠️ Failed to preload: ${country}`, error);
      }
    }
  });

  Promise.allSettled(preloadPromises).then((results) => {
    const successful = results.filter(r => r.status === 'fulfilled').length;
    console.log(`🎯 Preloading completed: ${successful}/${priorityCountries.length} countries`);
  });
}

export function clearChannelsCache(): void {
  memoryManager.clear();
  console.log('🧹 Channels cache cleared');
}

// =============================================
// 💾 دوال التخزين المحلي (تبقى كما هي)
// =============================================

export async function getHistoryChannels(): Promise<IPTVChannel[]> {
  if (typeof window === 'undefined') {
    return [];
  }
  
  await new Promise((resolve) => setTimeout(resolve, 100)); 
  try {
    const historyJson = localStorage.getItem('sora_tv_history');
    if (!historyJson) {
      return [];
    }
    const channels: IPTVChannel[] = JSON.parse(historyJson);
    return channels;
  } catch (error) {
    console.error("Failed to parse history:", error);
    localStorage.removeItem('sora_tv_history');
    return [];
  }
}

export async function getFavoriteChannels(): Promise<IPTVChannel[]> {
  if (typeof window === 'undefined') {
    return [];
  }

  const allChannelsData = await getAllChannels();
  
  try {
    const favoritesJson = localStorage.getItem('favorites');
    if (!favoritesJson) {
      return [];
    }
    
    const favoriteKeys: string[] = JSON.parse(favoritesJson);
    if (favoriteKeys.length === 0) {
      return [];
    }
    
    const allFavoriteChannels: IPTVChannel[] = [];
    
    for (const country in allChannelsData) {
      if (country === "United States of America") continue;

      allChannelsData[country].forEach(channel => {
        const key = `${country}:${channel.name}`; 
        
        if (favoriteKeys.includes(key)) {
           allFavoriteChannels.push({
             ...channel,
             url: normalizeYouTubeUrl(channel.url),
             countryName: country,
           });
        }
      });
    }
    
    return allFavoriteChannels.sort((a, b) => a.name.localeCompare(b.name));

  } catch (error) {
    console.error("Failed to parse favorites:", error);
    return [];
  }
}
