/**
 * Web-compatible Clipboard implementation using Clipboard API
 * Compatible with @react-native-clipboard/clipboard and expo-clipboard
 */

const Clipboard = {
  async getString() {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        return await navigator.clipboard.readText();
      } else {
        console.warn('Clipboard read not supported in this browser');
        return '';
      }
    } catch (error) {
      console.error('Failed to read clipboard:', error);
      return '';
    }
  },

  async setString(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback method
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          return successful;
        } catch (err) {
          document.body.removeChild(textArea);
          console.error('Fallback clipboard copy failed:', err);
          return false;
        }
      }
    } catch (error) {
      console.error('Failed to write to clipboard:', error);
      return false;
    }
  },

  async hasString() {
    try {
      const text = await this.getString();
      return text.length > 0;
    } catch (error) {
      return false;
    }
  },

  // Expo clipboard compatibility
  async getStringAsync() {
    return this.getString();
  },

  async setStringAsync(text) {
    const success = await this.setString(text);
    if (!success) {
      throw new Error('Failed to set clipboard content');
    }
  },

  async hasStringAsync() {
    return this.hasString();
  },

  // Image clipboard support (limited)
  async getImageAsync() {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const clipboardItems = await navigator.clipboard.read();
        
        for (const clipboardItem of clipboardItems) {
          for (const type of clipboardItem.types) {
            if (type.startsWith('image/')) {
              const blob = await clipboardItem.getType(type);
              return {
                uri: URL.createObjectURL(blob),
                type: type,
                size: blob.size
              };
            }
          }
        }
      }
      
      console.warn('No image found in clipboard or clipboard.read not supported');
      return null;
    } catch (error) {
      console.error('Failed to read image from clipboard:', error);
      return null;
    }
  },

  async setImageAsync(imageUri) {
    try {
      if (navigator.clipboard && navigator.clipboard.write) {
        // Convert data URI to blob
        const response = await fetch(imageUri);
        const blob = await response.blob();
        
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ]);
        
        return true;
      } else {
        console.warn('Clipboard image write not supported in this browser');
        return false;
      }
    } catch (error) {
      console.error('Failed to write image to clipboard:', error);
      return false;
    }
  }
};

export default Clipboard;