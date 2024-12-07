import React, { useState, useRef } from 'react';
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
    en: {
      title: "X Wrapped 2024",
      enterUsername: "Enter your X username",
      generate: "View My 2024 Wrapped",
      share: "Share on X",
      tweets: "Tweets",
      likes: "Likes",
      retweets: "Retweets",
      replies: "Replies",
      topWords: "Most Used Words",
      topEmojis: "Top Emojis",
      bestTweet: "Most Popular Tweet",
      interactions: "Interactions",
      errorFetching: "Error fetching your tweets. Please try again.",
      yearStats: "Your 2024 Stats",
      score: "Your X Power",
      level: "Your X Title",
      influencer: "Influencer",
      creator: "Creator",
      engager: "Engager",
      rookie: "Rookie",
      memeKing: "Meme Lord 👑",
      tweetStorm: "Tweet Storm ⚡",
      socialButterfly: "Social Butterfly 🦋",
      keyboardWarrior: "Keyboard Warrior ⚔️",
      threadMaster: "Thread Master 🧵",
      ratioKing: "Ratio King 📊",
      emojiBoss: "Emoji Boss 😎",
      lurker: "Professional Lurker 👀"
    },
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
      topEmojis: "En Çok Kullanılan Emojiler",
      bestTweet: "En Popüler Tweet",
      interactions: "Etkileşim",
      errorFetching: "Tweet'leriniz alınırken hata oluştu. Lütfen tekrar deneyin.",
      yearStats: "2024 İstatistikleriniz",
      score: "X Gücünüz",
      level: "X Ünvanınız",
      influencer: "Etkileyici",
      creator: "İçerik Üretici",
      engager: "Etkileşimci",
      rookie: "Acemi",
      memeKing: "Caps Lordu 👑",
      tweetStorm: "Tweet Fırtınası ⚡",
      socialButterfly: "Sosyal Kelebek 🦋",
      keyboardWarrior: "Klavye Delikanlısı ⚔️",
      threadMaster: "Flood Ustası 🧵",
      ratioKing: "Ratio Kralı 📊",
      emojiBoss: "Emoji Patronu 😎",
      lurker: "Profesyonel Stalkercı 👀"
    }
  };

  const t = translations[language];

  const calculateScore = (data) => {
    // Tweet puanı (her tweet 2 puan)
    const tweetScore = data.totalTweets * 2;
    
    // Etkileşim puanı
    const engagementScore = (data.totalLikes * 0.5) + (data.totalRetweets * 3) + (data.totalReplies * 1);
    
    // En iyi tweet puanı
    const bestTweetScore = (data.bestTweet.likes * 0.5) + (data.bestTweet.retweets * 3) + (data.bestTweet.replies * 1);
    
    // Toplam puan
    const totalScore = Math.floor(tweetScore + engagementScore + bestTweetScore);
    
    // Eğlenceli seviye belirleme
    let level;
    const tweetRatio = data.totalLikes / data.totalTweets; // beğeni/tweet oranı
    const replyRatio = data.totalReplies / data.totalTweets; // yanıt/tweet oranı
    
    if (tweetRatio > 100) {
      level = t.memeKing; // Viral içerik üretici
    } else if (data.totalTweets > 1000) {
      level = t.tweetStorm; // Çok tweet atan
    } else if (data.totalReplies > data.totalTweets) {
      level = t.socialButterfly; // Sosyal etkile��imci
    } else if (replyRatio > 0.8) {
      level = t.keyboardWarrior; // Tartışmacı
    } else if (data.topWords.length > 100) {
      level = t.threadMaster; // Uzun yazı yazan
    } else if (tweetRatio > 50) {
      level = t.ratioKing; // Etkileşimi yüksek
    } else if (data.topEmojis.length > 20) {
      level = t.emojiBoss; // Emoji seven
    } else {
      level = t.lurker; // Az tweet atan
    }
    
    return { 
      score: totalScore, 
      level,
      tweetRatio: Math.floor(tweetRatio),
      replyRatio: Math.floor(replyRatio * 100)
    };
  };

  const fetchUserTweets = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/twitter/user?username=${username}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.errorFetching);
      }

      const scoreData = calculateScore(data);
      setUserData({ ...data, ...scoreData });
    } catch (error) {
      console.error('Error:', error);
      setError(t.errorFetching);
    } finally {
      setIsLoading(false);
    }
  };

  const shareToTwitter = () => {
    const { score, level, tweetRatio, replyRatio } = calculateScore(userData);
    const tweetText = `2024 X istatistiklerim! 🎉\n\n🏆 ${t.score}: ${score.toLocaleString()}\n👑 ${t.level}: ${level}\n📊 Tweet başına beğeni: ${tweetRatio}\n💬 Yanıt oranı: %${replyRatio}\n\n#XWrapped2024`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[conic-gradient(at_top,_var(--tw-gradient-stops))] from-blue-900 via-black to-purple-900 px-4 py-8 md:py-12 transition-all duration-500 relative">
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
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setLanguage(language === 'en' ? 'tr' : 'en')}
            className="p-3 rounded-full hover:bg-white/10 text-white backdrop-blur-sm border border-white/20"
          >
            <Globe2 className="w-6 h-6" />
          </motion.button>
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
              <Card className="bg-black/30 border-white/10 backdrop-blur-xl overflow-hidden">
                <CardContent className="p-6 md:p-8">
                  <motion.div 
                    className="space-y-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
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
                      onClick={fetchUserTweets}
                      disabled={!username || isLoading}
                      className="w-full p-4 text-lg font-medium bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 relative overflow-hidden"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center space-x-3 relative z-10">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                          <span>Yükleniyor...</span>
                        </div>
                      ) : (
                        <span className="relative z-10">{t.generate}</span>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700 opacity-0 hover:opacity-100 transition-opacity duration-300" />
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
              className="relative"
            >
              <Card className="bg-black/30 border-white/10 backdrop-blur-xl overflow-hidden">
                <CardContent className="p-8">
                  <motion.div 
                    className="space-y-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex justify-between items-center">
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

                    <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                            {userData.score.toLocaleString()}
                          </h3>
                          <p className="text-white/60">{t.score}</p>
                          <div className="mt-2 text-sm text-white/40">
                            Tweet başına {userData.tweetRatio} beğeni
                          </div>
                        </div>
                        <div className="text-right">
                          <h3 className="text-2xl font-bold text-white bg-gradient-to-r from-yellow-400 to-pink-500 bg-clip-text">
                            {userData.level}
                          </h3>
                          <p className="text-white/60">{t.level}</p>
                          <div className="mt-2 text-sm text-white/40">
                            %{userData.replyRatio} yanıt oranı
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { value: userData.totalTweets.toLocaleString(), label: t.tweets, icon: '📝' },
                        { value: userData.totalLikes.toLocaleString(), label: t.likes, icon: '❤️' },
                        { value: userData.totalRetweets.toLocaleString(), label: t.retweets, icon: '🔄' },
                        { value: userData.totalReplies.toLocaleString(), label: t.replies, icon: '💬' },
                      ].map((stat, index) => (
                        <motion.div
                          key={stat.label}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
                        >
                          <div className="text-3xl mb-2">{stat.icon}</div>
                          <div className="text-2xl font-bold text-white">{stat.value}</div>
                          <div className="text-white/60">{stat.label}</div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="space-y-6">
                      <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
                        <h3 className="text-xl font-semibold text-white mb-4">{t.topWords}</h3>
                        <div className="flex flex-wrap gap-2">
                          {userData.topWords.map((word, index) => (
                            <motion.span
                              key={word}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 }}
                              className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white rounded-xl border border-white/10 hover:border-white/30 transition-all duration-300"
                            >
                              {word}
                            </motion.span>
                          ))}
                        </div>
                      </div>

                      {userData.bestTweet && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10"
                        >
                          <h3 className="text-xl font-semibold text-white mb-4">{t.bestTweet}</h3>
                          <p className="text-white text-lg mb-4 leading-relaxed">{userData.bestTweet.content}</p>
                          <div className="flex justify-start space-x-6 text-white/60">
                            <div className="flex items-center space-x-2">
                              <span>❤️</span>
                              <span>{userData.bestTweet.likes.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span>🔄</span>
                              <span>{userData.bestTweet.retweets.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span>💬</span>
                              <span>{userData.bestTweet.replies.toLocaleString()}</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 p-4 text-center text-white/60">
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