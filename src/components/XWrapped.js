'use client';

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Twitter, Share2, Globe2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const XWrapped = () => {
  const [username, setUsername] = useState('');
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('tr');

  const translations = {
    tr: {
      title: "X Wrapped 2024",
      enterUsername: "X kullanıcı adınızı girin",
      generate: "2024 Wrapped'ımı Göster",
      share: "X'te Paylaş",
      tweets: "Tweet",
      likes: "Beğeni",
      retweets: "Retweet",
      replies: "Yanıt",
      topWords: "En Çok Kullanılan Kelimeler",
      bestTweet: "En Popüler Tweet",
      interactions: "Etkileşim",
      errorFetching: "Tweet'leriniz alınırken hata oluştu. Lütfen tekrar deneyin.",
      yearStats: "2024 İstatistikleriniz",
      score: "X Gücünüz",
      level: "X Ünvanınız",
      followers: "Takipçi",
      following: "Takip"
    }
  };

  const t = translations[language];

  const fetchTwitterData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/twitter/user?username=${encodeURIComponent(username)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.errorFetching);
      }

      setUserData(data);
    } catch (error) {
      console.error('Error:', error);
      setError(t.errorFetching);
    } finally {
      setIsLoading(false);
    }
  };

  const shareToTwitter = () => {
    const tweetText = `2024 X istatistiklerim! 🎉\n\n📊 Tweet: ${userData.metrics.totalTweets}\n❤️ Beğeni: ${userData.metrics.totalLikes}\n🔄 Retweet: ${userData.metrics.totalRetweets}\n💬 Yanıt: ${userData.metrics.totalReplies}\n\n#XWrapped2024`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, '_blank');
  };

  return (
    <div className="min-h-screen px-4 py-8 md:py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto mt-12"
      >
        <div className="flex justify-between items-center mb-12">
          <Link href="/">
            <motion.h1 
              className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 cursor-pointer"
              whileHover={{ scale: 1.05 }}
            >
              {t.title}
            </motion.h1>
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {!userData ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8"
            >
              <Card>
                <CardContent className="p-6 md:p-8">
                  <motion.div className="space-y-6">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={t.enterUsername}
                        value={username}
                        onChange={(e) => setUsername(e.target.value.replace('@', ''))}
                        className="w-full h-14 px-4 pl-12 text-lg rounded-2xl bg-white/5 text-white border-2 border-white/10 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 placeholder-white/50"
                      />
                      <Twitter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                    </div>
                    
                    {error && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center space-x-2 text-red-400 bg-red-500/10 p-4 rounded-xl"
                      >
                        <AlertCircle className="w-5 h-5" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={fetchTwitterData}
                      disabled={!username || isLoading}
                      className="w-full p-4 text-lg font-medium bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center space-x-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                          <span>Yükleniyor...</span>
                        </div>
                      ) : (
                        <span>{t.generate}</span>
                      )}
                    </motion.button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8 space-y-6"
            >
              <Card>
                <CardContent className="p-6 md:p-8">
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
                        <Twitter className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">@{userData.username}</h2>
                        <p className="text-white/60">{t.yearStats}</p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={shareToTwitter}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center space-x-2"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>{t.share}</span>
                    </motion.button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                      { value: userData.metrics.totalTweets, label: t.tweets, icon: '📝' },
                      { value: userData.metrics.totalLikes, label: t.likes, icon: '❤️' },
                      { value: userData.metrics.followers, label: t.followers, icon: '👥' },
                      { value: userData.metrics.following, label: t.following, icon: '👤' },
                    ].map((stat, index) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10"
                      >
                        <div className="text-2xl mb-2">{stat.icon}</div>
                        <div className="text-xl font-bold text-white">
                          {stat.value ? stat.value.toLocaleString() : '0'}
                        </div>
                        <div className="text-sm text-white/60">{stat.label}</div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="bg-white/5 p-6 rounded-xl backdrop-blur-sm border border-white/10 mb-8">
                    <h3 className="text-xl font-semibold text-white mb-4">Kullanıcı İstatistikleri</h3>
                    <div className="flex flex-col space-y-2">
                      <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                        Günlük {userData.metrics.tweetsPerDay} tweet
                      </div>
                      <div className="text-white/60">
                        Etkileşim Oranı: {userData.metrics.engagementRate}
                      </div>
                      <div className="text-sm text-white/40">
                        {Math.floor(userData.accountAge / 365)} yıl {userData.accountAge % 365} gündür X kullanıcısı
                      </div>
                    </div>
                  </div>

                  {userData.description && (
                    <div className="bg-white/5 p-6 rounded-xl backdrop-blur-sm border border-white/10">
                      <h3 className="text-xl font-semibold text-white mb-4">Hakkında</h3>
                      <p className="text-white/80">{userData.description}</p>
                      {userData.location && (
                        <div className="mt-2 text-white/60 flex items-center">
                          <span className="mr-2">📍</span>
                          {userData.location}
                        </div>
                      )}
                      {userData.url && (
                        <a
                          href={userData.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 text-blue-400 hover:text-blue-300 flex items-center"
                        >
                          <Globe2 className="w-4 h-4 mr-2" />
                          {userData.url}
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <footer className="mt-12 text-center text-white/60">
        <div className="max-w-2xl mx-auto flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
          <div className="text-sm">
            © 2024 X Wrapped. All rights reserved.
          </div>
          <div className="text-sm flex items-center space-x-2">
            <span>Developed by</span>
            <a 
              href="https://x.com/yigitech" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1"
            >
              <Twitter className="w-4 h-4" />
              <span>@yigitech</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default XWrapped;