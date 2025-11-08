"use client"

import {
  Globe,
  Shuffle,
  Music,
  Film,
  Newspaper,
  Trophy,
  Baby,
  BookOpen,
  ShoppingBag,
  HeartHandshake,
  ChefHat,
  Info,
  Star,
  MessageSquare,
  History,
  // 🔴 الإضافات الجديدة
  Car,
  Sparkles,
  Briefcase,
  Scroll,
  Laugh,
  Palette,
  GraduationCap,
  Ticket,
  Users,
  Scale,
  Heart,
  Mountain,
  Wind,
  Tv,
  FlaskConical,
  Plane,
  CloudSun,
} from "lucide-react"

interface CategorySidebarProps {
  activeCategory: string | null
  onCategorySelect: (category: string) => void
  onClose: () => void
}

// 👈🔴 (هذا هو التعديل الكامل)
// (تم الاحتفاظ بالمفضلة والسجل في الأعلى)
const categories = [
  { id: "history", name: "History", icon: History, className: "text-cyan-400" },
  { id: "favorites", name: "Favorites", icon: Star, className: "text-yellow-400" },
  { id: "all-channels", name: "All Channels", icon: Globe, className: "text-blue-400" },
  { id: "top-news", name: "Top News", icon: Newspaper, className: "text-orange-400" },
  { id: "news", name: "News", icon: Newspaper, className: "text-orange-300" },
  { id: "music", name: "Music", icon: Music, className: "text-pink-400" },
  { id: "sports", name: "Sports", icon: Trophy, className: "text-green-400" },
  { id: "auto", name: "Auto", icon: Car, className: "text-red-300" },
  { id: "animation", name: "Animation", icon: Sparkles, className: "text-yellow-300" },
  { id: "business", name: "Business", icon: Briefcase, className: "text-blue-300" },
  { id: "classic", name: "Classic", icon: Scroll, className: "text-amber-300" },
  { id: "comedy", name: "Comedy", icon: Laugh, className: "text-yellow-400" },
  { id: "cooking", name: "Cooking", icon: ChefHat, className: "text-orange-300" },
  { id: "culture", name: "Culture", icon: Palette, className: "text-purple-300" },
  { id: "documentary", name: "Documentary", icon: BookOpen, className: "text-yellow-200" },
  { id: "education", name: "Education", icon: GraduationCap, className: "text-blue-300" },
  { id: "entertainment", name: "Entertainment", icon: Ticket, className: "text-red-400" },
  { id: "family", name: "Family", icon: Users, className: "text-green-300" },
  { id: "general", name: "General", icon: Globe, className: "text-gray-300" },
  { id: "kids", name: "Kids", icon: Baby, className: "text-teal-300" },
  { id: "legislative", name: "Legislative", icon: Scale, className: "text-amber-400" },
  { id: "lifestyle", name: "Lifestyle", icon: Heart, className: "text-pink-300" },
  { id: "movies", name: "Movies", icon: Film, className: "text-red-400" },
  { id: "series", name: "Series", icon: Tv, className: "text-red-500" },
  { id: "outdoor", name: "Outdoor", icon: Mountain, className: "text-green-400" },
  { id: "relax", name: "Relax", icon: Wind, className: "text-blue-200" },
  { id: "religious", name: "Religious", icon: HeartHandshake, className: "text-green-300" },
  { id: "science", name: "Science", icon: FlaskConical, className: "text-blue-300" },
  { id: "shop", name: "Shop", icon: ShoppingBag, className: "text-indigo-300" },
  { id: "travel", name: "Travel", icon: Plane, className: "text-blue-400" },
  { id: "weather", name: "Weather", icon: CloudSun, className: "text-sky-300" },
  { id: "random-channel", name: "Random Channels", icon: Shuffle, className: "text-purple-400" },
]

const staticPages = [
  { id: "about", name: "About", icon: Info },
  { id: "feedback", name: "Send Feedback", icon: MessageSquare },
]

export default function CategorySidebar({
  activeCategory,
  onCategorySelect,
  onClose,
}: CategorySidebarProps) {
  return (
    <div className="w-full h-full flex flex-col text-white bg-[#0B0D11] pt-4">
      <nav className="flex-1 overflow-y-auto custom-scroll px-3">
        {/* --- القنوات الديناميكية --- */}
        <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Categories
        </h3>
        <ul className="space-y-1.5">
          {categories.map((category) => (
            <li key={category.id}>
              <button
                onClick={() => onCategorySelect(category.id)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-colors duration-200 ${
                  activeCategory === category.id
                    ? "bg-gray-700/80 text-white shadow-inner"
                    : "text-gray-300 hover:bg-gray-800/70"
                }`}
              >
                <category.icon
                  className={`w-5 h-5 flex-shrink-0 ${category.className || 'text-gray-400'}`}
                  strokeWidth={2}
                />
                <span className="text-[15px] font-medium">{category.name}</span>
              </button>
            </li>
          ))}
        </ul>

        {/* --- الصفحات الثابتة --- */}
        <h3 className="px-3 pt-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Info
        </h3>
        <ul className="space-y-1.5">
          {staticPages.map((page) => (
            <li key={page.id}>
              <button
                onClick={() => onCategorySelect(page.id)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-colors duration-200 ${
                  activeCategory === page.id
                    ? "bg-gray-700/80 text-white shadow-inner"
                    : "text-gray-300 hover:bg-gray-800/70"
                }`}
              >
                <page.icon
                  className="w-5 h-5 flex-shrink-0 text-gray-400"
                  strokeWidth={2}
                />
                <span className="text-[15px] font-medium">{page.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}