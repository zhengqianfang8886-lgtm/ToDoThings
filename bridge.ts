
// src/utils/bridge.ts

let pyBackend: any = null;

/**
 * Initializes the QWebChannel bridge with Python.
 */
export const initBridge = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const win = window as any;
    if (win.qt !== undefined && win.QWebChannel !== undefined) {
      new win.QWebChannel(win.qt.webChannelTransport, (channel: any) => {
        pyBackend = channel.objects.pyBackend;
        console.log("🚀 Python Backend Connected");
        resolve(true);
      });
    } else {
      console.log("🌐 Browser Environment (Qt not detected)");
      resolve(false);
    }
  });
};

/**
 * Automatically saves data to Python backend or LocalStorage as fallback.
 */
export const autoSave = (dataKey: string, dataObject: any) => {
  const jsonString = JSON.stringify(dataObject, null, 2);

  if (pyBackend && typeof pyBackend.save_data === 'function') {
    try {
      pyBackend.save_data(jsonString);
      console.log("💾 Saved via Python Bridge");
    } catch (e) {
      console.warn("Python Bridge Save Failed, falling back to LocalStorage", e);
    }
  }

  // Always keep a browser fallback
  try {
    localStorage.setItem(dataKey, jsonString);
  } catch (e) {
    console.warn("LocalStorage Save Failed", e);
  }
};

/**
 * Loads data from the Python backend or LocalStorage as fallback.
 */
export const loadData = (dataKey: string): Promise<any> => {
  return new Promise((resolve) => {
    // Strategy A: Try Python Bridge
    if (pyBackend && typeof pyBackend.load_data === 'function') {
      console.log("📂 Requesting data from Python...");
      pyBackend.load_data((response: string) => {
        if (response && response.length > 0) {
          try {
            const data = JSON.parse(response);
            console.log("✅ Loaded from Python");
            resolve(data);
            return;
          } catch (e) {
            console.error("Failed to parse Python data, trying LocalStorage", e);
          }
        }
        resolve(readFromLocalStorage(dataKey));
      });
    } else {
      // Strategy B: Browser Environment
      resolve(readFromLocalStorage(dataKey));
    }
  });
};

const readFromLocalStorage = (key: string) => {
  try {
    const local = localStorage.getItem(key);
    if (local) {
      console.log("🌐 Loaded from LocalStorage");
      return JSON.parse(local);
    }
  } catch (e) {
    console.warn("LocalStorage read failed", e);
  }
  return null;
};
