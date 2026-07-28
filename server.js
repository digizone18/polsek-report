const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ========================================
// KONEKSI MONGODB
// ========================================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://polsekbusaw:1234567890Aa@cluster0.qimud9r.mongodb.net/polsek_reports';

console.log('🔄 Menghubungkan ke MongoDB...');

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.log('❌ MongoDB Error:', err.message);
  });

// ========================================
// JENIS LAPORAN
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
// SCHEMA
// ========================================
const ReportSchema = new mongoose.Schema({
  jenisLaporan: { type: String, enum: Object.values(JENIS_LAPORAN), required: true },
  judulKegiatan: { type: String, required: true },
  laporanKepada: [String],
  sapaan: String,
  unitPelaksana: String,
  waktu: {
    hari: String,
    tanggal: Date,
    jam: String,
    selesai: String
  },
  personel: [{
    nama: String,
    pangkat: String,
    jabatan: String
  }],
  lokasi: {
    desa: String,
    kecamatan: String,
    kabupaten: String,
    provinsi: { type: String, default: 'Kalimantan Tengah' }
  },
  sasaran: [String],
  kegiatanSpesifik: { type: mongoose.Schema.Types.Mixed, default: {} },
  bentukKegiatan: [String],
  hasil: String,
  hambatan: String,
  langkahLangkah: [String],
  penutup: String,
  penandatangan: {
    jabatan: String,
    nama: String,
    pangkat: String,
    nip: String
  },
  status: {
    type: String,
    enum: ['draft', 'diajukan', 'disetujui', 'ditolak'],
    default: 'draft'
  },
  aiEnhanced: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Report = mongoose.model('Report', ReportSchema);

// ========================================
// TEMPLATES
// ========================================
const TEMPLATES = {
  karhutla: {
    judul: 'STOP KARHUTLA',
    kegiatanSpesifik: { titikRawan: 'Desa Bukit Sawit', luasLahan: '5 Hektar' },
    bentukKegiatanDefault: [
      'Memberikan himbauan & sosialisasi kepada warga dan tokoh masyarakat untuk tidak membuka lahan dengan cara dibakar',
      'Menempelkan himbauan tentang larangan membuka hutan dan lahan dengan cara membakar karena dapat dikenakan Pidana',
      'Menyebarkan nomor handphone Polsek dan Petugas Bhabinkamtibmas untuk laporan Karhutla'
    ],
    langkahDefault: [
      'Melakukan himbauan/sosialisasi & patroli rutin di lokasi rawan Karhutla',
      'Koordinasi dengan Koramil, Kepala Desa, dan Tim Manggala Agni'
    ]
  },
  bhabinkamtibmas: {
    judul: 'KEGIATAN BHABINKAMTIBMAS',
    kegiatanSpesifik: { jumlahKK: '150 KK', jumlahJiwa: '450 Jiwa' },
    bentukKegiatanDefault: [
      'Melakukan silaturahmi dengan warga binaan',
      'Mendengarkan keluhan dan aspirasi masyarakat',
      'Memberikan himbauan kamtibmas'
    ],
    langkahDefault: [
      'Kunjungan door to door ke rumah warga',
      'Pembinaan dan penyuluhan kepada masyarakat'
    ]
  },
  saberpungli: {
    judul: 'SABER PUNGLI',
    kegiatanSpesifik: { lokasiRawan: 'Pasar Tradisional', modus: 'Pungutan liar' },
    bentukKegiatanDefault: [
      'Operasi penertiban pungutan liar di lokasi rawan',
      'Edukasi masyarakat tentang bahaya pungli'
    ],
    langkahDefault: [
      'Koordinasi dengan instansi terkait',
      'Patroli dan monitoring lokasi rawan pungli'
    ]
  },
  antihoax: {
    judul: 'ANTI HOAX',
    kegiatanSpesifik: { platform: 'Facebook, WhatsApp', dampak: 'Meresahkan masyarakat' },
    bentukKegiatanDefault: [
      'Sosialisasi literasi digital kepada masyarakat',
      'Penyebaran informasi yang benar melalui media sosial'
    ],
    langkahDefault: [
      'Monitoring peredaran hoax di media sosial',
      'Koordinasi dengan Dinas Kominfo'
    ]
  },
  patroli: {
    judul: 'PATROLI MALAM',
    kegiatanSpesifik: { rute: 'Jalan Trans Kalimantan', titikRawan: 'Area perkebunan' },
    bentukKegiatanDefault: [
      'Patroli rutin di wilayah hukum Polsek',
      'Pemeriksaan kendaraan dan orang yang mencurigakan'
    ],
    langkahDefault: [
      'Koordinasi dengan pos ronda',
      'Pencatatan hasil patroli secara berkala'
    ]
  },
  penyuluhan: {
    judul: 'PENYULUHAN HUKUM',
    kegiatanSpesifik: { materi: 'UU Lalu Lintas, Bahaya Narkoba', peserta: '50 orang' },
    bentukKegiatanDefault: [
      'Penyampaian materi tentang hukum dan kamtibmas',
      'Sesi tanya jawab dengan masyarakat'
    ],
    langkahDefault: [
      'Persiapan materi dan alat peraga',
      'Pelaksanaan penyuluhan di lokasi'
    ]
  },
  operasi: {
    judul: 'OPERASI',
    kegiatanSpesifik: { sandi: 'Operasi Zebra 2026', target: 'Pelanggaran lalu lintas' },
    bentukKegiatanDefault: [
      'Pelaksanaan operasi sesuai sandi yang ditentukan',
      'Penggeledahan dan pemeriksaan'
    ],
    langkahDefault: [
      'Briefing personel sebelum operasi',
      'Pelaksanaan operasi di lapangan'
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
// ROUTES API
// ========================================

// GET semua laporan
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

// GET jenis laporan
app.get('/api/jenis-laporan', (req, res) => {
  res.json({
    jenis: Object.values(JENIS_LAPORAN),
    labels: LABEL_JENIS
  });
});

// GET template
app.get('/api/templates/:jenis', (req, res) => {
  const template = TEMPLATES[req.params.jenis];
  if (!template) return res.status(404).json({ message: 'Template tidak ditemukan' });
  res.json(template);
});

// ========================================
// ========================================
// 🤖 AI ENHANCE DENGAN GEMINI API
// ========================================
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

    // Ambil API Key dari environment variable
    const apiKey = process.env.GEMINI_API_KEY;
    
    // ========================================
    // JIKA ADA GEMINI API KEY, PAKAI AI
    // ========================================
    if (apiKey && apiKey !== 'AQ.Ab8RN6Ih_mEpbKCnkMb2aT87T5wcTXLbZqEqjmw_JdMOjiGR4w') {
      try {
        const prompt = `
Anda adalah asisten AI untuk membantu memperbaiki kalimat laporan kepolisian di Indonesia.
Perbaiki kalimat berikut menjadi lebih profesional, formal, dan mudah dipahami.

Jenis Laporan: ${jenisLaporan || 'Umum'}

Teks asli:
"${text}"

Aturan:
1. Perbaiki tata bahasa dan ejaan yang salah
2. Buat kalimat lebih formal dan profesional (sesuai standar kepolisian)
3. Gunakan bahasa Indonesia yang baku dan mudah dipahami
4. Pertahankan makna asli dari teks
5. Jika ada singkatan (utk, kpd, dgn, dll), tulis dengan lengkap
6. Perbaiki tanda baca dan kapitalisasi
7. JANGAN tambahkan kalimat baru, hanya perbaiki yang ada

Hasil perbaikan (hanya teks hasil perbaikan, tanpa penjelasan tambahan):
`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 500,
            }
          })
        });

        const data = await response.json();
        
        if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          const enhanced = data.candidates[0].content.parts[0].text.trim();
          return res.json({ 
            enhanced: enhanced,
            message: '✅ Diperbaiki dengan AI Gemini',
            aiUsed: true
          });
        } else {
          console.log('Gemini response error:', data);
          // Fallback ke perbaikan sederhana
          const enhanced = simpleEnhance(text);
          return res.json({ 
            enhanced: enhanced,
            message: '⚠️ AI error, pakai perbaikan sederhana',
            aiUsed: false
          });
        }
      } catch (aiError) {
        console.error('AI Error:', aiError.message);
        // Fallback ke perbaikan sederhana
        const enhanced = simpleEnhance(text);
        return res.json({ 
          enhanced: enhanced,
          message: '⚠️ AI error, pakai perbaikan sederhana',
          aiUsed: false
        });
      }
    }
    
    // ========================================
    // TANPA GEMINI API KEY - PAKAI FALLBACK
    // ========================================
    const enhanced = simpleEnhance(text);
    res.json({ 
      enhanced: enhanced,
      message: 'ℹ️ Perbaikan sederhana (AI tidak aktif)',
      aiUsed: false
    });

  } catch (error) {
    console.error('Enhance Error:', error);
    const enhanced = simpleEnhance(req.body.text);
    res.json({ 
      enhanced: enhanced,
      message: '⚠️ Terjadi error, pakai perbaikan sederhana'
    });
  }
});

// ========================================
// SIMPLE ENHANCE (FALLBACK TANPA AI)
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
    'utk': 'untuk',
    'pda': 'pada',
    'klo': 'kalau',
    'sm': 'sama',
    'aja': 'saja',
    'bgmn': 'bagaimana',
    'knp': 'kenapa',
    'spt': 'seperti',
    'tp': 'tetapi',
    'dng': 'dengan',
    'mrh': 'marah',
    'bsk': 'besok',
    'kmrn': 'kemarin',
    'skrg': 'sekarang',
    'trs': 'terus',
    'udh': 'udah',
    'ud': 'sudah',
    'd': 'di',
    'y': 'yang'
  };

  for (const [key, value] of Object.entries(fixes)) {
    result = result.replace(new RegExp(`\\b${key}\\b`, 'gi'), value);
  }

  // Kapitalisasi awal kalimat
  result = result.replace(/(^|\.\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
  
  // Perbaiki spasi
  result = result.replace(/\s+\./g, '.');
  result = result.replace(/\.+/g, '.');
  result = result.replace(/\s{2,}/g, ' ');

  return result;
}

// ========================================
// ROOT
// ========================================
app.get('/', (req, res) => {
  res.json({
    name: 'Polsek Report API',
    version: '2.0',
    status: 'running',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Disconnected ❌',
    ai: process.env.GEMINI_API_KEY ? 'Gemini AI Active ✅' : 'Simple Enhancer Only ⚠️'
  });
});

// ========================================
// START SERVER
// ========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🤖 AI Status: ${process.env.GEMINI_API_KEY ? 'Gemini AI Active ✅' : 'Simple Enhancer Only ⚠️'}`);
  console.log('========================================');
});
