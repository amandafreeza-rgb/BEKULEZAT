/* ==========================================================
   BekuLezat – script.js
   Fitur: menu hamburger, keranjang, slider testimoni, checkout WhatsApp
   ========================================================== */

// Nomor WhatsApp toko (format internasional, tanpa 0 di depan dan tanpa +)
const WA_NUMBER = "6289673787320";

// Data keranjang: [{ name, variant, price, qty }]
let cart = [];

// Format angka ke Rupiah, contoh: 12000 -> "Rp12.000"
const rupiah = (n) => "Rp" + n.toLocaleString("id-ID");

// Shortcut ambil elemen
const $ = (id) => document.getElementById(id);

/* ---------- 1. NAVBAR HAMBURGER ---------- */
const hamburger = $("hamburger");
const navLinks = $("navLinks");

hamburger.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  hamburger.classList.toggle("open", open);
  hamburger.setAttribute("aria-expanded", open);
});
// Tutup menu setelah link diklik (mobile)
navLinks.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    navLinks.classList.remove("open");
    hamburger.classList.remove("open");
    hamburger.setAttribute("aria-expanded", false);
  })
);

/* ---------- 2. DRAWER KERANJANG (buka/tutup) ---------- */
const drawer = $("cartDrawer");
const overlay = $("overlay");

function toggleCart(show) {
  drawer.classList.toggle("open", show);
  overlay.classList.toggle("show", show);
}
$("cartToggle").addEventListener("click", () => toggleCart(!drawer.classList.contains("open")));
$("cartClose").addEventListener("click", () => toggleCart(false));
overlay.addEventListener("click", () => toggleCart(false));
$("goOrder").addEventListener("click", () => toggleCart(false));

/* ---------- 3. TAMBAH ITEM KE KERANJANG ---------- */
document.querySelectorAll(".add-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const card = btn.closest(".card");
    const select = card.querySelector(".variant");
    const name = card.dataset.name;
    const price = Number(select.value);
    // Ambil label varian saja (sebelum tanda " – ")
    const variant = select.options[select.selectedIndex].text.split(" – ")[0];

    // Jika menu + varian yang sama sudah ada, tambah jumlahnya
    const found = cart.find((i) => i.name === name && i.variant === variant);
    if (found) found.qty++;
    else cart.push({ name, variant, price, qty: 1 });

    renderCart();

    // Umpan balik singkat pada tombol
    const oldText = btn.textContent;
    btn.textContent = "Ditambahkan";
    setTimeout(() => (btn.textContent = oldText), 900);
  });
});

/* ---------- 4. TAMPILKAN KERANJANG & HITUNG TOTAL ---------- */
function renderCart() {
  const html = cart.length
    ? cart
        .map(
          (item, i) => `
      <li class="cart-item">
        <span class="name">${item.name}</span>
        <p class="sub">${rupiah(item.price * item.qty)}</p>
        <span class="var">${item.variant} · ${rupiah(item.price)}</span>
        <div class="qty">
          <button data-act="minus" data-i="${i}" aria-label="Kurangi">−</button>
          <span>${item.qty}</span>
          <button data-act="plus" data-i="${i}" aria-label="Tambah">+</button>
          <button class="remove" data-act="remove" data-i="${i}">Hapus</button>
        </div>
      </li>`
        )
        .join("")
    : '<li class="empty">Keranjang masih kosong. Pilih menu dulu, ya.</li>';

  // Isi drawer dan ringkasan di bagian pemesanan
  $("cartList").innerHTML = html;
  $("summaryList").innerHTML = html;

  // Total harga dan jumlah item (real-time)
  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const count = cart.reduce((sum, i) => sum + i.qty, 0);
  $("cartTotal").textContent = rupiah(total);
  $("summaryTotal").textContent = rupiah(total);
  $("cartCount").textContent = count;
}

// Tombol + / − / Hapus (event delegation untuk kedua daftar)
function handleCartClick(e) {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  const i = Number(btn.dataset.i);
  const act = btn.dataset.act;

  if (act === "plus") cart[i].qty++;
  if (act === "minus") cart[i].qty--;
  if (act === "remove" || cart[i].qty <= 0) cart.splice(i, 1);
  renderCart();
}
$("cartList").addEventListener("click", handleCartClick);
$("summaryList").addEventListener("click", handleCartClick);

/* ---------- 5. SLIDER TESTIMONI ---------- */
const track = $("sliderTrack");
const slides = track.children;
const dotsBox = $("sliderDots");
let current = 0;

// Buat titik indikator
for (let i = 0; i < slides.length; i++) {
  const dot = document.createElement("button");
  dot.setAttribute("aria-label", "Testimoni " + (i + 1));
  dot.addEventListener("click", () => goTo(i));
  dotsBox.appendChild(dot);
}

function goTo(index) {
  current = (index + slides.length) % slides.length; // berputar
  track.style.transform = `translateX(-${current * 100}%)`;
  [...dotsBox.children].forEach((d, i) => d.classList.toggle("active", i === current));
}
$("nextBtn").addEventListener("click", () => goTo(current + 1));
$("prevBtn").addEventListener("click", () => goTo(current - 1));
goTo(0);

/* ---------- 6. CHECKOUT: VALIDASI + KIRIM KE WHATSAPP ---------- */
$("checkoutBtn").addEventListener("click", () => {
  const nama = $("nama").value.trim();
  const hp = $("hp").value.trim();
  const alamat = $("alamat").value.trim();
  const sambal = $("sambal").value;
  const catatan = $("catatan").value.trim();
  const error = $("formError");

  // Validasi sederhana
  if (cart.length === 0) return (error.textContent = "Keranjang masih kosong. Tambahkan menu dulu.");
  if (nama.length < 3) return (error.textContent = "Isi nama lengkap minimal 3 huruf.");
  if (!/^(\+62|62|0)8[0-9]{8,12}$/.test(hp.replace(/[\s-]/g, "")))
    return (error.textContent = "Nomor WhatsApp tidak valid. Contoh: 081234567890.");
  if (alamat.length < 8) return (error.textContent = "Isi alamat pengantaran dengan lengkap.");
  error.textContent = "";

  // Susun pesan rapi
  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const daftar = cart
    .map((i, n) => `${n + 1}. ${i.name} (${i.variant}) x${i.qty} = ${rupiah(i.price * i.qty)}`)
    .join("\n");

  const pesan =
    `*PESANAN BEKULEZAT*\n\n` +
    `*Nama:* ${nama}\n` +
    `*No. WA:* ${hp}\n` +
    `*Alamat:* ${alamat}\n` +
    `*Sambal:* ${sambal}\n` +
    (catatan ? `*Catatan:* ${catatan}\n` : "") +
    `\n*Daftar Pesanan:*\n${daftar}\n\n` +
    `*TOTAL: ${rupiah(total)}*\n` +
    `Pembayaran: QRIS (bukti bayar saya kirim di chat ini)\n\n` +
    `Terima kasih!`;

  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(pesan)}`, "_blank");
});

// Tampilkan keranjang kosong saat halaman pertama dibuka
renderCart();

// ========== LOGIKA DARK / LIGHT MODE ==========
document.addEventListener('DOMContentLoaded', () => {
  const themeToggleBtn = document.getElementById('themeToggle');
  const themeIcon = themeToggleBtn ? themeToggleBtn.querySelector('.theme-icon') : null;

  // Cek simpanan tema dari sesi sebelumnya
  const currentTheme = localStorage.getItem('theme');
  if (currentTheme === 'dark') {
    document.body.classList.add('dark-mode');
    if (themeIcon) themeIcon.textContent = '☀️';
  }

  // Event listener saat tombol diklik
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      
      const isDarkMode = document.body.classList.contains('dark-mode');
      
      // Ubah ikon tombol (Bulan 🌙 / Matahari ☀️)
      if (themeIcon) {
        themeIcon.textContent = isDarkMode ? '☀️' : '🌙';
      }
      
      // Simpan pilihan ke localStorage
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    });
  }
});

// ========== LOGIKA SLIDER GAMBAR & SINKRONISASI VARIAN KARTU MENU ==========
document.querySelectorAll('.card').forEach(card => {
  const track = card.querySelector('.card-image-track');
  if (!track) return;
  
  const imgs = track.querySelectorAll('img');
  const prevBtn = card.querySelector('.card-img-prev');
  const nextBtn = card.querySelector('.card-img-next');
  const variantSelect = card.querySelector('.variant');
  
  let currentIndex = 0;

  function updateSlide(index) {
    if (index < 0) {
      currentIndex = imgs.length - 1;
    } else if (index >= imgs.length) {
      currentIndex = 0;
    } else {
      currentIndex = index;
    }
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    
    // Sinkronisasi otomatis dropdown varian jika gambar digeser
    if (variantSelect) {
      variantSelect.selectedIndex = currentIndex;
    }
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => updateSlide(currentIndex + 1));
  }
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => updateSlide(currentIndex - 1));
  }

  // Jika dropdown varian diubah, gambar ikut bergeser otomatis
  if (variantSelect) {
    variantSelect.addEventListener('change', (e) => {
      const selectedIndex = e.target.selectedIndex;
      updateSlide(selectedIndex);
    });
  }
});