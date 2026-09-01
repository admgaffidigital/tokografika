// =============================================================================
// FRESHMART CONFIGURATION & GLOBAL STATE
// =============================================================================

const GAS_UPLOAD_URL = "https://script.google.com/macros/s/AKfycbw9LRofW_dHGiIOG3IlZ6sEs3YJRGk3z1X_AkAJLA1O7Hhzb_FE6VaL4AzjUrGRzI-w/exec";

// Konfigurasi Firebase
const fbC = {
  apiKey: "AIzaSyCRp4LWBOJus2lcku8_5lHDmfakJfR5C2M",
  authDomain: "grafika24jam.firebaseapp.com",
  databaseURL: "https://grafika24jam-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "grafika24jam",
  storageBucket: "grafika24jam.firebasestorage.app",
  messagingSenderId: "109619354850",
  appId: "1:109619354850:web:171e508ae7d7d617e952bb",
  measurementId: "G-BDZ2NP8M96"
};

// Skema Default Aplikasi Toko
const defApp = {
  store: { 
    name: "TOKO GRAFIKA", slogan: "RITEL & GROSIR", logo: "fa-store", wa: "", address: "", lat: "", lng: "", costPerKm: 0, 
    isDeliveryEnabled: !0, isPickupEnabled: !0, allProductsIcon: "", categoryStyle: "text", footerText: "Terima kasih telah berbelanja di toko kami.",
    social: { fb: "", ig: "", tt: "", yt: "" }
  },
  auth: { username: "", password: "" },
  payment: { qrisUrl: "" },
  banks: [], banners: [], 
  categories: [
    { id: 1, name: "Makanan & Minuman", icon: "fa-utensils" },
    { id: 2, name: "Sembako", icon: "fa-basket-shopping" },
    { id: 3, name: "Kebutuhan Rumah", icon: "fa-house" }
  ], 
  vouchers: [], 
  products: [
    {
      id: 1,
      name: "Beras Premium Pulen 5kg",
      price: 68000,
      originalPrice: 75000,
      category: "Sembako",
      desc: "Beras pulen berkualitas super, bersih, tanpa pemutih dan pengawet.",
      stock: 25,
      img: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=60",
      sku: "BRS-001",
      variants: [],
      wholesale: [{ min: 5, price: 65000 }]
    },
    {
      id: 2,
      name: "Minyak Goreng Pouch 2L",
      price: 34000,
      originalPrice: 38000,
      category: "Sembako",
      desc: "Minyak goreng kelapa sawit berkualitas jernih dan higienis.",
      stock: 40,
      img: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=60",
      sku: "MYK-002",
      variants: []
    },
    {
      id: 3,
      name: "Kopi Arabika Nusantara 250g",
      price: 45000,
      originalPrice: 50000,
      category: "Makanan & Minuman",
      desc: "Biji kopi pilihan dengan aroma harum dan cita rasa nikmat khas nusantara.",
      stock: 15,
      img: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60",
      sku: "KPI-003",
      variants: []
    }
  ], 
  licenseKey: "",
  accounts: [],
  suppliers: [],
  purchases: [],
  stockOpname: []
};

// Global Runtime State Variables
let confirmCb = null;
let appData = JSON.parse(JSON.stringify(defApp));
let cart = [], wishlist = [];
let cust = { name: '', address: '', lat: null, lng: null, deliveryMethod: 'delivery', distance: 0, note: '' };
let vouch = null, aCat = 'Semua Produk', sQ = '', cSort = 'newest', cView = 'grid', cPage = 1, iPP = 12, cTab = 'orders', aSq = '';

let eId = null, isAdm = !1, isPro = !1, cRole = 'admin', cPerms = [];
let cProd = null, cVar = 0, tVars = [], tWhol = [], cQty = 1;
let oMods = [], aOrdLst = null, gOrds = [], cVOrd = null;
let toastT, isSaving = !1;
let _cvBusy = false;
let html5QrCode = null;
let tempPdfData = null;
let _pwaInstallEvent = null;
const _pwaIconCache = {};
let _priceWatcherUnsub = null;
let _priceWatcherLegacyUnsub = null;
let _priceDebounceTimer = null;

// In-Memory Storage Fallback when Browser Tracking Prevention blocks access
const _inMemStore = {};

// LocalStorage Wrappers with Tracking Prevention & Quota Handling
const sL = k => { 
  try { 
    return localStorage.getItem(k); 
  } catch (e) { 
    return _inMemStore[k] || null; 
  } 
};

const ssL = (k, v) => { 
  try { 
    localStorage.setItem(k, v); 
  } catch (e) { 
    _inMemStore[k] = v;
    if (e && (e.name === 'QuotaExceededError' || e.code === 22)) { 
      console.warn('[FreshMart] localStorage penuh, cache dialihkan ke memori:', k); 
    } 
  } 
};

// Global Error Shield (Shield against 3rd-party toolbar/extension DOM Range errors)
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event && event.message && event.message.includes('selectNode')) {
      event.preventDefault();
      return true;
    }
  }, true);
}

try { cart = JSON.parse(sL('freshmart_cart')) || []; } catch (e) { console.warn('[FreshMart] Cart parse error, reset:', e); }
try { wishlist = JSON.parse(sL('freshmart_wishlist')) || []; } catch (e) { console.warn('[FreshMart] Wishlist parse error, reset:', e); }

if (!history.state) history.replaceState({ view: 'view-catalog' }, '', '');
