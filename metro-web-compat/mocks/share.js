/**
 * Web-compatible Share implementation using Web Share API
 * Compatible with react-native-share and expo-sharing
 */

const Share = {
  async share(options = {}) {
    try {
      const { message, url, title, subject } = options;
      
      // Try Web Share API first (mobile browsers)
      if (navigator.share) {
        const shareData = {};
        
        if (title) shareData.title = title;
        if (message) shareData.text = message;
        if (url) shareData.url = url;
        
        await navigator.share(shareData);
        return { success: true, activityType: 'web-share-api' };
      }
      
      // Fallback to clipboard + alert
      let shareText = '';
      if (title) shareText += `${title}\n`;
      if (message) shareText += `${message}\n`;
      if (url) shareText += url;
      
      if (shareText) {
        await navigator.clipboard.writeText(shareText);
        alert('Content copied to clipboard! You can now paste it anywhere.');
        return { success: true, activityType: 'clipboard' };
      }
      
      throw new Error('No content to share');
      
    } catch (error) {
      console.error('Share failed:', error);
      throw error;
    }
  },

  async shareAsync(options = {}) {
    return this.share(options);
  },

  async isAvailableAsync() {
    return Promise.resolve(
      'share' in navigator || 
      ('clipboard' in navigator && 'writeText' in navigator.clipboard)
    );
  },

  // Social media specific sharing (fallback URLs)
  async shareSingle(options = {}) {
    const { social, message, url, title } = options;
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url || '')}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message || title || '')}&url=${encodeURIComponent(url || '')}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url || '')}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent((message || title || '') + ' ' + (url || ''))}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url || '')}&text=${encodeURIComponent(message || title || '')}`,
      email: `mailto:?subject=${encodeURIComponent(title || '')}&body=${encodeURIComponent((message || '') + '\n' + (url || ''))}`,
      sms: `sms:?body=${encodeURIComponent((message || title || '') + ' ' + (url || ''))}`
    };
    
    const shareUrl = shareUrls[social];
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
      return { success: true, activityType: social };
    }
    
    // Fallback to generic share
    return this.share(options);
  },

  // File sharing (limited on web)
  async shareFile(options = {}) {
    console.warn('File sharing limited on web platform');
    
    if ('share' in navigator && options.files) {
      try {
        await navigator.share({
          files: options.files,
          title: options.title,
          text: options.message
        });
        return { success: true, activityType: 'web-share-api' };
      } catch (error) {
        console.error('File sharing failed:', error);
        throw error;
      }
    }
    
    throw new Error('File sharing not supported');
  },

  // Expo sharing compatibility
  async shareAsync(uri, options = {}) {
    if (typeof uri === 'string') {
      // Assume it's a file URI
      return this.shareFile({ files: [uri], ...options });
    }
    
    // Assume it's options object
    return this.share(uri);
  }
};

export default Share;