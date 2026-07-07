// app/services/api.ts

// ==========================================
// 1. DEFINISI TIPE DATA (INTERFACE)
// ==========================================
export interface KelolaanMitra {
  namaMitra: string;
  brandMitra: string;
  kodeOwner: string;
  namaOwner: string;
  brandNasabah: string;
  kategoriMitra: string;
  paket: string;
  status: string;
}

export interface ListMitra {
  kategori: string;
  owner: string;
  brand: string;
  telp: string;
  rekening: string;
  wilayah: string;
  alamat: string;
  totalReferral: number;
}

// ==========================================
// 2. DATABASE STATIS INTERNAL (MOCK DB)
// ==========================================
const mockKelolaanMitra: KelolaanMitra[] = [
  // --- REFERRAL DARI LENY (GET LAUNDRY RMJ) ---
  { namaMitra: "leny", brandMitra: "Get Laundry RMJ", kodeOwner: "8068", namaOwner: "Get Laundry Villa Pamulang", brandNasabah: "Get Laundry", kategoriMitra: "Referral", paket: "Bisnis 12 Bulan", status: "Berlangganan" },
  { namaMitra: "leny", brandMitra: "Get Laundry RMJ", kodeOwner: "15559", namaOwner: "obby / mama laundry", brandNasabah: "laundry / mama laundry", kategoriMitra: "Referral", paket: "Bisnis 12 Bulan", status: "Berlangganan" },

  // --- REFERRAL DARI AYU WIDYASARI (HAWP LAUNDRY) ---
  { namaMitra: "Ayu Widyasari", brandMitra: "HAWP LAUNDRY", kodeOwner: "13966", namaOwner: "Laundry in Sini", brandNasabah: "Laundry In Sini", kategoriMitra: "Corporate", paket: "Bisnis 12 Bulan", status: "Berlangganan" },

  // --- REFERRAL DARI SUGIANA & CITRA HALIM ---
  { namaMitra: "Sugiana", brandMitra: "Indah Express", kodeOwner: "8162", namaOwner: "Viva Yuniarti", brandNasabah: "Dilvio Laundry", kategoriMitra: "Referral", paket: "Bisnis 12 Bulan", status: "Berlangganan" },
  { namaMitra: "Citra Halim", brandMitra: "Citra Laundry", kodeOwner: "7885", namaOwner: "Frenki Hardjono", brandNasabah: "rejeki laundry", kategoriMitra: "Referral", paket: "Bisnis 6 Bulan", status: "Berlangganan" },

  // --- REFERRAL DARI BUDI SANTO (SAHABAT LAUNDRY) ---
  { namaMitra: "Budi Santo", brandMitra: "sahabat laundry", kodeOwner: "9322", namaOwner: "Laundry Geulis", brandNasabah: "geulis laundry", kategoriMitra: "Referral", paket: "Basic 12 Bulan", status: "Berlangganan" },
  { namaMitra: "Budi Santo", brandMitra: "sahabat laundry", kodeOwner: "7479", namaOwner: "farhan alfatan", brandNasabah: "juragan laundry", kategoriMitra: "Referral", paket: "Bisnis 1 Bulan", status: "Berlangganan" },
  { namaMitra: "Budi Santo", brandMitra: "sahabat laundry", kodeOwner: "8763", namaOwner: "Yadi Mulyawarman", brandNasabah: "Ceuk Mamah", kategoriMitra: "Referral", paket: "Basic 1 Bulan", status: "Berlangganan" },
  { namaMitra: "Budi Santo", brandMitra: "sahabat laundry", kodeOwner: "9805", namaOwner: "Asep Sugianto", brandNasabah: "Akang Laundry", kategoriMitra: "Referral", paket: "Basic 1 Bulan", status: "Berlangganan" },

  // --- REFERRAL DARI DIGNITY SINAGA (DIGNITY LAUNDRY) ---
  { namaMitra: "DIGNITY SINAGA", brandMitra: "DIGNITY LAUNDRY", kodeOwner: "9665", namaOwner: "Rama Purba", brandNasabah: "RAMA LAUNDRY", kategoriMitra: "Referral", paket: "Basic 12 Bulan", status: "Berlangganan" },
  { namaMitra: "DIGNITY SINAGA", brandMitra: "DIGNITY LAUNDRY", kodeOwner: "10250", namaOwner: "Mieke Simamora", brandNasabah: "Gwen Laundry", kategoriMitra: "Referral", paket: "Basic 12 Bulan", status: "Berlangganan" },
  { namaMitra: "DIGNITY SINAGA", brandMitra: "DIGNITY LAUNDRY", kodeOwner: "10237", namaOwner: "Dolok Manullang", brandNasabah: "Dr Laundry", kategoriMitra: "Referral", paket: "Basic 12 Bulan", status: "Berlangganan" },

  // --- REFERRAL DARI MASTER TAUFIK (mesincucilaundry.com) ---
  { namaMitra: "Taufik", brandMitra: "mesincucilaundry.com", kodeOwner: "8159", namaOwner: "novi yanti", brandNasabah: "hloundry168", kategoriMitra: "Referral", paket: "Basic 1 Bulan", status: "Berlangganan" },
  { namaMitra: "Taufik", brandMitra: "mesincucilaundry.com", kodeOwner: "8555", namaOwner: "Selly Andini", brandNasabah: "Sultan Laundry. co", kategoriMitra: "Referral", paket: "Bisnis 12 Bulan", status: "Berlangganan" },
  { namaMitra: "Taufik", brandMitra: "mesincucilaundry.com", kodeOwner: "8793", namaOwner: "Jessica", brandNasabah: "Super Power Wash", kategoriMitra: "Referral", paket: "Bisnis 12 Bulan", status: "Berlangganan" },
  { namaMitra: "Taufik", brandMitra: "mesincucilaundry.com", kodeOwner: "11165", namaOwner: "Ayu Widyasari", brandNasabah: "HAWP LAUNDRY", kategoriMitra: "Referral", paket: "Bisnis 12 Bulan", status: "Berlangganan" },
  { namaMitra: "Taufik", brandMitra: "mesincucilaundry.com", kodeOwner: "11375", namaOwner: "Wiwin Bunda Yuki", brandNasabah: "Yuki Laundry", kategoriMitra: "Referral", paket: "Basic 1 Bulan", status: "Berlangganan" },
  { namaMitra: "Taufik", brandMitra: "mesincucilaundry.com", kodeOwner: "11972", namaOwner: "Eko Budi Hartanto", brandNasabah: "SATSET Laundry", kategoriMitra: "Referral", paket: "Bisnis 1 Bulan", status: "Berlangganan" },
  { namaMitra: "Taufik", brandMitra: "mesincucilaundry.com", kodeOwner: "12934", namaOwner: "Jessica Marthasari", brandNasabah: "Gwebi Laundry", kategoriMitra: "Referral", paket: "No Package", status: "Follow Up" },
  { namaMitra: "Taufik", brandMitra: "mesincucilaundry.com", kodeOwner: "14098", namaOwner: "Rizky Cahya Amellin", brandNasabah: "Klik Laundry", kategoriMitra: "Referral", paket: "Bisnis 12 Bulan", status: "Berlangganan" },
  { namaMitra: "Taufik", brandMitra: "mesincucilaundry.com", kodeOwner: "15630", namaOwner: "Laundry_1945", brandNasabah: "laundry 1945", kategoriMitra: "Referral", paket: "Bisnis 12 Bulan", status: "Berlangganan" },
  { namaMitra: "Taufik", brandMitra: "mesincucilaundry.com", kodeOwner: "17823", namaOwner: "Noto Adiputro", brandNasabah: "Laundry Clean star", kategoriMitra: "Referral", paket: "Pro 12 Bulan", status: "Berlangganan" },

  // --- REFERRAL DARI VENDOR KG TEKNIK BATAM ---
  { namaMitra: "KG TEKNIK BATAM", brandMitra: "KG TEKNIK BATAM", kodeOwner: "15129", namaOwner: "Robin", brandNasabah: "boss laundry", kategoriMitra: "Referral", paket: "Bisnis 12 Bulan", status: "Berlangganan" },
  { namaMitra: "KG TEKNIK BATAM", brandMitra: "KG TEKNIK BATAM", kodeOwner: "15401", namaOwner: "Susi Yanti", brandNasabah: "D' Laundry coin", kategoriMitra: "Referral", paket: "Bisnis 6 Bulan", status: "Berlangganan" },
  { namaMitra: "KG TEKNIK BATAM", brandMitra: "KG TEKNIK BATAM", kodeOwner: "17470", namaOwner: "Ika Khairani", brandNasabah: "Ika Laundry Coin", kategoriMitra: "Referral", paket: "Pro 12 Bulan", status: "Berlangganan" },
  { namaMitra: "KG TEKNIK BATAM", brandMitra: "KG TEKNIK BATAM", kodeOwner: "17869", namaOwner: "Supreme Wash Laundry", brandNasabah: "SW Laundry", kategoriMitra: "Referral", paket: "Pro 12 Bulan", status: "Berlangganan" },

  // --- REFERRAL DARI MITRA LAINNYA ---
  { namaMitra: "Ahmad Kamal Dahlan", brandMitra: "Zona Laundry Mamuju", kodeOwner: "15520", namaOwner: "Nuzul Rahmat", brandNasabah: "Wonder Wash", kategoriMitra: "Referral", paket: "Bisnis 12 Bulan", status: "Berlangganan" },
  { namaMitra: "Atik Nurbayati", brandMitra: "Delisha Laundry", kodeOwner: "15514", namaOwner: "Siti Umayah", brandNasabah: "Super Laundry", kategoriMitra: "Referral", paket: "Basic 12 Bulan", status: "Berlangganan" },
  { namaMitra: "Tengku ariani", brandMitra: "Mame Laundry", kodeOwner: "16306", namaOwner: "Vicky loundry", brandNasabah: "loundry", kategoriMitra: "Referral", paket: "Basic 6 Bulan", status: "Berlangganan" }
];

const mockListMitra: ListMitra[] = [
  {
    kategori: "AFILIASI (Eks. Mesin, Rak, Dll)",
    owner: "KG TEKNIK BATAM",
    brand: "KG TEKNIK BATAM",
    telp: "081364050429",
    rekening: "Mandiri - 1090019010180",
    wilayah: "Kota Batam / Kepulauan Riau",
    alamat: "Ruko Puri Legenda Blok C2 No 02-03 Batam Centre",
    totalReferral: 4 // Disesuaikan dari total item KG Teknik di kelolaan
  },
  {
    kategori: "AFILIASI (Eks. Mesin, Rak, Dll)",
    owner: "Asep Taufik Hidayat",
    brand: "mesincucilaundry.com",
    telp: "081213970585",
    rekening: "BCA - 6880445471",
    wilayah: "Jawa Barat",
    alamat: "Perumahan Cibarusah Indah Blok e23 No.4 Cibarusah Kota Kab. Bekasi",
    totalReferral: 10 // Disesuaikan dari total item Taufik di kelolaan
  }
];

// ==========================================
// 3. FUNGSI API CLIENT (INSTAN / REKURSAL)
// ==========================================

// Mengambil data kelolaan nasabah secara instan
export async function fetchKelolaanMitra(): Promise<KelolaanMitra[]> {
  return [...mockKelolaanMitra];
}

// Mengambil data induk list mitra secara instan
export async function fetchListMitra(): Promise<ListMitra[]> {
  return [...mockListMitra];
}