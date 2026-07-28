const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ========================================
// 1. KONEKSI MONGODB
// ========================================
console.log('🔄 Menghubungkan ke MongoDB...');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => {
  console.log('❌ MongoDB Error:', err.message);
  console.log('⚠️  Pastikan MONGODB_URI di .env sudah benar!');
});

// ========================================
// 2. JENIS LAPORAN (KATEGORI)
// ========================================
const JENIS_LAPORAN = {
  KARHUTLA: 'karhutla',
  BHABINKAMTIBMAS: 'bhabinkamtibmas',
  SABERPUNGLI: 'saberpungli',
  ANTIHOAX: 'antihoax',
  PATROLI: 'patroli',
  PENYULUHAN: 'penyuluhan',
  OPERASI: 'operasi',
  LAINNYA: 'lainnya'
};

// Label untuk ditampilkan di frontend
const LABEL_JENIS = {
  karhutla: '🔥 STOP KARHUTLA',
  bhabinkamtibmas: '👮 Bhabinkamtibmas',
  saberpungli: '⚖️ Saber Pungli',
  antihoax: '📢 Anti Hoax',
  patroli: '🌙 Patroli Malam',
  penyuluhan: '📚 Penyuluhan',
  operasi: '🚨 Operasi',
  lainnya: '📝 Lainnya'
};

// ========================================
// 3. SCHEMA DATABASE
// ========================================
const ReportSchema = new mongoose.Schema({
  // Jenis Laporan
  jenisLaporan: {
    type: String,
    enum: Object.values(JENIS_LAPORAN),
    required: true
  },
  judulKegiatan: {
    type: String,
    required: true
  },
  
  // Data Umum
  laporanKepada: [String],
  sapaan: String,
  unitPelaksana: String,
  
  // Waktu
  waktu: {
    hari: String,
    tanggal: Date,
    jam: String,
    selesai: String
  },
  
  // Personel
  personel: [{
    nama: String,
    pangkat: String,
    jabatan: String
  }],
  
  // Lokasi
  lokasi: {
    desa: String,
    kecamatan: String,
    kabupaten: String,
    provinsi: { type: String, default: 'Kalimantan Tengah' }
  },
  
  // Sasaran
  sasaran: [String],
  
  // Kegiatan Spesifik (berbeda tiap jenis)
  kegiatanSpesifik: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Bentuk Kegiatan
  bentukKegiatan: [String],
  
  // Hasil/Hambatan
  hasil: String,
  hambatan: String,
  
  // Langkah-langkah
  langkahLangkah: [String],
  
  // Penutup
  penutup: String,
  
  // Penandatangan
  penandatangan: {
    jabatan: String,
    nama: String,
    pangkat: String,
    nip: String
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'diajukan', 'disetujui', 'ditolak'],
    default: 'draft'
  },
  
  // AI Enhanced
  aiEnhanced: {
    type: Boolean,
    default: false
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Report = mongoose.model('Report', ReportSchema);

// ========================================
// 4. TEMPLATE PER JENIS LAPORAN
// ========================================
const TEMPLATES = {
  karhutla: {
    judul: 'STOP KARHUTLA',
    kegiatanSpesifik: {
      titikRawan: 'Desa Bukit Sawit',
      luasLahan: '5 Hektar',
      koordinat: '-0.1234, 115.5678',
    },
    bentukKegiatanDefault: [
      'Memberikan himbauan & sosialisasi kepada warga dan tokoh masyarakat untuk tidak membuka lahan dengan cara dibakar',
      'Menempelkan himbauan tentang larangan membuka hutan dan lahan dengan cara membakar karena dapat dikenakan Pidana',
      'Menyebarkan nomor handphone Polsek dan Petugas Bhabinkamtibmas untuk laporan Karhutla'
    ],
    langkahDefault: [
      'Melakukan himbauan/sosialisasi & patroli rutin di lokasi rawan Karhutla',
      'Koordinasi dengan Koramil, Kepala Desa, dan Tim Manggala Agni Kabupaten Barito Utara'
    ]
  },
  
  bhabinkamtibmas: {
    judul: 'KEGIATAN BHABINKAMTIBMAS',
    kegiatanSpesifik: {
      jumlahKK: '150 KK',
      jumlahJiwa: '450 Jiwa',
      rtRw: 'RT 01-05, RW 02',
      keluhan: 'Keluhan masyarakat tentang keamanan lingkungan'
    },
    bentukKegiatanDefault: [
      'Melakukan silaturahmi dengan warga binaan di Desa Bukit Sawit',
      'Mendengarkan keluhan dan aspirasi masyarakat terkait kamtibmas',
      'Memberikan himbauan kamtibmas dan waspada terhadap tindak kriminal'
    ],
    langkahDefault: [
      'Kunjungan door to door ke rumah warga binaan',
      'Pembinaan dan penyuluhan kepada masyarakat tentang keamanan lingkungan',
      'Pencatatan data warga dan permasalahan yang dihadapi'
    ]
  },
  
  saberpungli: {
    judul: 'SABER PUNGLI (Sapu Bersih Pungutan Liar)',
    kegiatanSpesifik: {
      lokasiRawan: 'Pasar Tradisional dan Terminal',
      modus: 'Pungutan liar oleh oknum tidak bertanggung jawab',
      pelaku: 'Orang tidak dikenal',
      barangBukti: 'Uang tunai Rp 500.000'
    },
    bentukKegiatanDefault: [
      'Operasi penertiban pungutan liar di lokasi rawan (Pasar dan Terminal)',
      'Edukasi masyarakat tentang bahaya pungli dan cara melapor',
      'Pemasangan spanduk himbauan anti pungli di lokasi strategis'
    ],
    langkahDefault: [
      'Koordinasi dengan Satpol PP dan instansi terkait',
      'Patroli dan monitoring lokasi rawan pungli secara rutin',
      'Penindakan tegas terhadap pelaku pungli sesuai hukum yang berlaku'
    ]
  },
  
  antihoax: {
    judul: 'ANTI HOAX & BERITA PALSU',
    kegiatanSpesifik: {
      platform: 'Facebook, WhatsApp, Instagram',
      penyebar: 'Akun anonim',
      konten: 'Berita hoax tentang konflik sosial',
      dampak: 'Meresahkan masyarakat'
    },
    bentukKegiatanDefault: [
      'Sosialisasi literasi digital kepada masyarakat tentang cara cek fakta',
      'Penyebaran informasi yang benar melalui media sosial resmi Polsek',
      'Pembentukan agen anti hoax di setiap desa'
    ],
    langkahDefault: [
      'Monitoring peredaran hoax di media sosial secara berkala',
      'Koordinasi dengan Dinas Kominfo untuk penanganan hoax',
      'Edukasi masyarakat tentang cara melaporkan konten hoax'
    ]
  },
  
  patroli: {
    judul: 'PATROLI MALAM',
    kegiatanSpesifik: {
      rute: 'Jalan Trans Kalimantan - Desa Bukit Sawit',
      kendaraan: 'Mobil Patroli Polsek',
      titikRawan: 'Area perkebunan dan pemukiman'
    },
    bentukKegiatanDefault: [
      'Patroli rutin di wilayah hukum Polsek pada malam hari',
      'Pemeriksaan kendaraan dan orang yang mencurigakan',
      'Pengamanan objek vital dan area rawan kriminal'
    ],
    langkahDefault: [
      'Koordinasi dengan pos ronda dan keamanan lingkungan',
      'Pencatatan hasil patroli secara berkala',
      'Pelaporan temuan menonjol kepada pimpinan'
    ]
  },
  
  penyuluhan: {
    judul: 'PENYULUHAN HUKUM & KAMTIBMAS',
    kegiatanSpesifik: {
      materi: 'Undang-Undang Lalu Lintas, Bahaya Narkoba, Keamanan Lingkungan',
      peserta: 'Masyarakat Desa Bukit Sawit (50 orang)',
      durasi: '2 Jam'
    },
    bentukKegiatanDefault: [
      'Penyampaian materi tentang hukum dan kamtibmas kepada masyarakat',
      'Sesi tanya jawab interaktif dengan masyarakat',
      'Pembagian brosur edukasi dan nomor darurat Polsek'
    ],
    langkahDefault: [
      'Persiapan materi dan alat peraga penyuluhan',
      'Pelaksanaan penyuluhan di balai desa',
      'Evaluasi pemahaman peserta melalui sesi diskusi'
    ]
  },
  
  operasi: {
    judul: 'OPERASI',
    kegiatanSpesifik: {
      sandi: 'Operasi Zebra 2026',
      target: 'Pelanggaran lalu lintas dan kriminalitas',
      hasil: '10 pelanggaran tertib lalu lintas'
    },
    bentukKegiatanDefault: [
      'Pelaksanaan operasi sesuai sandi yang ditentukan',
      'Penggeledahan dan pemeriksaan kendaraan bermotor',
      'Pengamanan barang bukti dan penindakan pelanggar'
    ],
    langkahDefault: [
      'Briefing personel sebelum operasi',
      'Pelaksanaan operasi di lapangan dengan tegas dan humanis',
      'Pembuatan laporan hasil operasi'
    ]
  },
  
  lainnya: {
    judul: '',
    kegiatanSpesifik: {},
    bentukKegiatanDefault: [''],
    langkahDefault: ['']
  }
};

// ========================================
// 5. ROUTES API
// ========================================

// GET semua laporan (bisa filter jenis)
app.get('/api/reports', async (req, res) => {
  try {
    const { jenis } = req.query;
    const filter = jenis ? { jenisLaporan: jenis } : {};
    const reports = await Report.find(filter).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET satu laporan
app.get('/api/reports/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Tidak ditemukan' });
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST laporan baru
app.post('/api/reports', async (req, res) => {
  try {
    const report = new Report(req.body);
    await report.save();
    res.status(201).json(report);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update laporan
app.put('/api/reports/:id', async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!report) return res.status(404).json({ message: 'Tidak ditemukan' });
    res.json(report);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE laporan
app.delete('/api/reports/:id', async (req, res) => {
  try {
    await Report.findByIdAndDelete(req.params.id);
    res.json({ message: 'Laporan dihapus' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========================================
// 6. GET JENIS LAPORAN (untuk dropdown)
// ========================================
app.get('/api/jenis-laporan', (req, res) => {
  res.json({
    jenis: Object.values(JENIS_LAPORAN),
    labels: LABEL_JENIS
  });
});

// ========================================
// 7. GET TEMPLATE per jenis
// ========================================
app.get('/api/templates/:jenis', (req, res) => {
  const template = TEMPLATES[req.params.jenis];
  if (!template) {
    return res.status(404).json({ message: 'Template tidak ditemukan' });
  }
  res.json(template);
});

// ========================================
// 8. AI ASSISTANT (Gemini API)
// ========================================
app.post('/api/ai/enhance', async (req, res) => {
  try {
    const { text, jenisLaporan } = req.body;
    
    if (!text || text.trim().length < 5) {
      return res.json({ 
        enhanced: text,
        message: 'Teks terlalu pendek untuk dianalisis'
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      // Fallback tanpa AI
      const enhanced = simpleEnhance(text);
      return res.json({ 
        enhanced,
        message: 'Perbaikan sederhana (AI tidak aktif)'
      });
    }

    // Panggil Gemini API
    const prompt = `
Anda adalah asisten untuk membantu memperbaiki kalimat laporan kepolisian.
Perbaiki kalimat berikut menjadi lebih profesional, formal, dan mudah dipahami.

Jenis Laporan: ${jenisLaporan || 'Umum'}

Teks asli:
"${text}"

Aturan:
1. Perbaiki tata bahasa dan ejaan
2. Buat lebih formal dan profesional
3. Gunakan bahasa Indonesia yang baku
4. Pertahankan makna asli
5. Jika ada singkatan, tulis dengan benar

Hasil perbaikan (hanya teks hasil perbaikan, tanpa penjelasan):
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    const data = await response.json();
    const enhanced = data?.candidates?.[0]?.content?.parts?.[0]?.text || text;

    res.json({ 
      enhanced: enhanced.trim(),
      message: '✅ Diperbaiki dengan AI'
    });

  } catch (error) {
    console.error('AI Error:', error);
    const enhanced = simpleEnhance(req.body.text);
    res.json({ 
      enhanced,
      message: 'Perbaikan sederhana (AI error)'
    });
  }
});

// ========================================
// 9. SIMPLE ENHANCE (Fallback tanpa AI)
// ========================================
function simpleEnhance(text) {
  let result = text;
  
  const fixes = {
    'utk': 'untuk',
    'kpd': 'kepada',
    'yg': 'yang',
    'dgn': 'dengan',
    'tdk': 'tidak',
    'sdh': 'sudah',
    'wib': 'WIB',
    's/d': 'sampai dengan',
    '&': 'dan',
    'dpt': 'dapat',
    'bs': 'bisa',
    'jgn': 'jangan',
    'msh': 'masih',
    'krn': 'karena',
    'klo': 'kalau',
    'jg': 'juga',
    'dri': 'dari',
    'utk': 'untuk'
  };

  for (const [key, value] of Object.entries(fixes)) {
    result = result.replace(new RegExp(`\\b${key}\\b`, 'gi'), value);
  }

  result = result.replace(/(^|\.\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
  result = result.replace(/\s+\./g, '.');
  result = result.replace(/\.+/g, '.');

  return result;
}

// ========================================
// 10. ROOT
// ========================================
app.get('/', (req, res) => {
  res.json({
    name: 'Polsek Report API',
    version: '2.0',
    status: 'running',
    endpoints: {
      reports: '/api/reports',
      jenis: '/api/jenis-laporan',
      templates: '/api/templates/:jenis',
      ai: '/api/ai/enhance'
    }
  });
});

// ========================================
// 11. START SERVER
// ========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📋 API URL: http://localhost:${PORT}/api/reports`);
  console.log('========================================');
});