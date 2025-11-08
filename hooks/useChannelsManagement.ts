// 📁 hooks/useChannelsManagement.ts
import { useState, useEffect, useCallback, useRef } from 'react';
// 👈🔴 (1) استيراد الدالة الجديدة
import { IPTVChannel, getChannelsPaginated, getCategoryChannelsPaginated } from '@/lib/iptv-channels'; 

interface UseChannelsManagementProps {
  country: string | null;
  category: string | null;
  pageSize?: number;
  enableAutoLoad?: boolean; // (هذا لم يعد مستخدماً هنا، الـ Sidebar سيتولى الأمر)
}

export function useChannelsManagement({ 
  country, 
  category, 
  pageSize = 50,
}: UseChannelsManagementProps) {
  const [channels, setChannels] = useState<IPTVChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalChannels, setTotalChannels] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // 👈🔴 (2) الدالة المحدثة
  const loadInitialChannels = useCallback(async () => {
    // تحديد نوع الجلب
    const isCountrySearch = !!country;
    const isCategorySearch = !country && !!category && category !== 'all-channels' && category !== 'history' && category !== 'favorites';

    // إذا لم يكن هناك دولة أو فئة، لا تفعل شيئاً
    if (!isCountrySearch && !isCategorySearch) {
      setChannels([]);
      setLoading(false);
      setHasMore(false);
      return;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);
    setChannels([]); // تنظيف القنوات القديمة
    setCurrentPage(0); // إعادة تعيين الصفحة

    try {
      let result;
      if (isCountrySearch) {
        // --- الحالة 1: جلب حسب الدولة ---
        result = await getChannelsPaginated(
          country, 
          category, 
          0, 
          pageSize
        );
      } else {
        // --- الحالة 2: جلب حسب الفئة ---
        result = await getCategoryChannelsPaginated(
          category, 
          0, 
          pageSize
        );
      }
      
      if (abortControllerRef.current?.signal.aborted) return;
      
      setChannels(result.channels);
      setHasMore(result.hasMore);
      setTotalChannels(result.total);
      setCurrentPage(1); // نحن الآن في الصفحة التالية (رقم 1)
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to load channels');
        console.error('Error loading channels:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [country, category, pageSize]);

  // 👈🔴 (3) الدالة المحدثة
  const loadMoreChannels = useCallback(async () => {
    const isCountrySearch = !!country;
    const isCategorySearch = !country && !!category && category !== 'all-channels' && category !== 'history' && category !== 'favorites';

    if (!hasMore || loadingMore || (!isCountrySearch && !isCategorySearch)) {
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoadingMore(true);

    try {
      let result;
      if (isCountrySearch) {
        // --- الحالة 1: جلب المزيد حسب الدولة ---
        result = await getChannelsPaginated(
          country, 
          category, 
          currentPage, 
          pageSize
        );
      } else {
        // --- الحالة 2: جلب المزيد حسب الفئة ---
        result = await getCategoryChannelsPaginated(
          category, 
          currentPage, 
          pageSize
        );
      }
      
      if (abortControllerRef.current?.signal.aborted) return;
      
      setChannels(prev => [...prev, ...result.channels]);
      setHasMore(result.hasMore);
      setCurrentPage(prev => prev + 1);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to load more channels');
        console.error('Error loading more channels:', err);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [country, category, currentPage, hasMore, loadingMore, pageSize]);

  // إعادة التعيين عند تغيير المعايير
  useEffect(() => {
    loadInitialChannels();
  }, [loadInitialChannels]); // (هذا صحيح، سيعمل عند تغيير 'country' أو 'category')

  // 👈🔴 (4) تم حذف useEffect الخاص بـ handleScroll
  // (لأن country-sidebar.tsx سيتولى التحميل عند التمرير)

  // تنظيف عند إلغاء التثبيت
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    channels,
    loading,
    loadingMore,
    hasMore,
    totalChannels,
    error,
    loadMoreChannels,
    refresh: loadInitialChannels,
    currentPage
  };
}