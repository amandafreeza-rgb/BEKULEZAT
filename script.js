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

/* -------- 3. TAMBAH ITEM KE KERANJANG (Ala ShopeeFood & Checkout Mini) -------- */
document.addEventListener("DOMContentLoaded", function () {
  if (typeof cart === "undefined") {
    window.cart = [];
  }

  function updateCardButton(card, name, variant, qty) {
    const btnContainer = card.querySelector(".btn-container") || card.querySelector(".add-btn").parentElement;
    
    let controller = btnContainer.querySelector(".qty-controller");
    let checkoutBtn = btnContainer.querySelector(".card-checkout-btn");
    let addBtn = btnContainer.querySelector(".add-btn");

    if (qty > 0) {
      if (addBtn) addBtn.style.display = "none";

      // 1. Buat atau perbarui Stepper (- qty +)
      if (!controller) {
        controller = document.createElement("div");
        controller.className = "qty-controller";
        controller.innerHTML = `
          <button class="qty-btn qty-minus" type="button">-</button>
          <span class="qty-value">${qty}</span>
          <button class="qty-btn qty-plus" type="button">+</button>
        `;
        btnContainer.appendChild(controller);

        controller.querySelector(".qty-minus").addEventListener("click", () => {
          changeQty(card, name, variant, -1);
        });

        controller.querySelector(".qty-plus").addEventListener("click", () => {
          changeQty(card, name, variant, 1);
        });
      } else {
        controller.querySelector(".qty-value").innerText = qty;
        controller.style.display = "flex";
      }

      // 2. Buat atau tampilkan Tombol Checkout Mini di bawah stepper
      if (!checkoutBtn) {
        checkoutBtn = document.createElement("button");
        checkoutBtn.type = "button";
        checkoutBtn.className = "card-checkout-btn";
        checkoutBtn.innerHTML = `Checkout Sekarang ➔`;
        btnContainer.appendChild(checkoutBtn);

        // Aksi klik -> Scroll mulus ke form pembelian (#pesan)
        checkoutBtn.addEventListener("click", () => {
          const formPesan = document.getElementById("pesan");
          if (formPesan) {
            formPesan.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
      } else {
        checkoutBtn.style.display = "flex";
      }

    } else {
      if (controller) controller.style.display = "none";
      if (checkoutBtn) checkoutBtn.style.display = "none";
      if (addBtn) addBtn.style.display = "block";
    }
  }

  function changeQty(card, name, variant, delta) {
    const existingIndex = cart.findIndex((i) => i.name === name && i.variant === variant);
    if (existingIndex > -1) {
      cart[existingIndex].qty += delta;
      if (cart[existingIndex].qty <= 0) {
        cart.splice(existingIndex, 1);
        updateCardButton(card, name, variant, 0);
      } else {
        updateCardButton(card, name, variant, cart[existingIndex].qty);
      }
    }
    if (typeof renderCart === "function") {
      renderCart();
    }
  }

  document.querySelectorAll(".add-btn").forEach((btn) => {
    const card = btn.closest(".card");
    if (!card) return;

    btn.addEventListener("click", function (e) {
      e.preventDefault();

      const select = card.querySelector(".variant");
      const name = card.dataset.name || card.querySelector("h3")?.innerText || "Produk";
      
      let price = 0;
      let variant = "Standard";

      if (select) {
        price = Number(select.value) || 0;
        const selectedOption = select.options[select.selectedIndex];
        if (selectedOption) {
          const text = selectedOption.text;
          variant = text.includes("–") ? text.split("–")[0].trim() : (text.includes("-") ? text.split("-")[0].trim() : text);
        }
      } else {
        const priceEl = card.querySelector(".card-price");
        if (priceEl) {
          price = Number(priceEl.innerText.replace(/[^0-9]/g, "")) || 0;
        }
      }

      const existingIndex = cart.findIndex((i) => i.name === name && i.variant === variant);
      let currentQty = 1;

      if (existingIndex > -1) {
        cart[existingIndex].qty += 1;
        currentQty = cart[existingIndex].qty;
      } else {
        cart.push({ name, variant, price, qty: 1 });
      }

      updateCardButton(card, name, variant, currentQty);

      if (typeof renderCart === "function") {
        renderCart();
      }
    });
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

/* -------- CHECKOUT: LANGSUNG KE WHATSAPP + CATAT ADMIN -------- */
/* GANTI seluruh blok checkout lama dengan blok ini */
document.addEventListener("DOMContentLoaded", function () {
  const checkoutBtn = document.getElementById("checkoutBtn");
  if (!checkoutBtn) return;

  checkoutBtn.addEventListener("click", function () {
    // 1. Ambil nilai form
    const nama = document.getElementById("nama")?.value.trim() || "";
    const hp = document.getElementById("hp")?.value.trim() || "";
    const alamat = document.getElementById("alamat")?.value.trim() || "";
    const sambal = document.getElementById("sambal")?.value || "Standard";
    const catatan = document.getElementById("catatan")?.value.trim() || "";
    const errorEl = document.getElementById("formError");

    // 2. Validasi
    if (cart.length === 0) {
      if (errorEl) errorEl.textContent = "Keranjang masih kosong! Silakan pilih menu dulu.";
      alert("Keranjang kamu masih kosong, yuk pilih menu dulu!");
      return;
    }
    if (nama.length < 3) {
      if (errorEl) errorEl.textContent = "Isi nama lengkap minimal 3 karakter.";
      alert("Mohon isi nama lengkap minimal 3 karakter.");
      document.getElementById("nama")?.focus();
      return;
    }
    if (!/^(\+62|62|0)8[0-9]{8,12}$/.test(hp.replace(/[\s-]/g, ""))) {
      if (errorEl) errorEl.textContent = "Nomor WhatsApp tidak valid. Contoh: 089673787320";
      alert("Nomor WhatsApp tidak valid.");
      document.getElementById("hp")?.focus();
      return;
    }
    if (alamat.length < 8) {
      if (errorEl) errorEl.textContent = "Isi alamat pengantaran dengan lengkap.";
      alert("Mohon isi alamat pengantaran dengan lengkap.");
      document.getElementById("alamat")?.focus();
      return;
    }
    if (errorEl) errorEl.textContent = "";

    // 3. Hitung total
    const totalHarga = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

    // 4. Susun daftar menu
    const daftarMenu = cart
      .map(
        (i, index) =>
          `${index + 1}. ${i.name} (${i.variant}) x${i.qty} = Rp ${(i.price * i.qty).toLocaleString("id-ID")}`
      )
      .join("\n");

    // 5. Susun teks pesan WhatsApp
    const pesanWA =
      `*PESANAN BEKULEZAT*\n\n` +
      `*Nama Pemesan:* ${nama}\n` +
      `*No. WhatsApp:* ${hp}\n` +
      `*Alamat Pengiriman:* ${alamat}\n` +
      `*Level Sambal:* ${sambal}\n` +
      (catatan ? `*Catatan:* ${catatan}\n` : "") +
      `\n*Daftar Menu:*\n${daftarMenu}\n\n` +
      `*Total Pembayaran:* Rp ${totalHarga.toLocaleString("id-ID")}\n\n` +
      `Bukti pembayaran saya lampirkan di chat ini ya kak.\n` +
      `Mohon segera diproses, terima kasih!`;

    // 6. URL WhatsApp (pesan WAJIB di-encode dan ditempel sebagai ?text=)
    const urlWhatsApp = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(pesanWA)}`;

    // 7. Simpan ke LocalStorage untuk panel admin (dibungkus try/catch agar tidak menghalangi redirect)
    try {
      const newOrder = {
        id: "BK-" + Date.now().toString().slice(-6),
        tanggal: new Date().toLocaleString("id-ID"),
        nama,
        hp,
        alamat,
        items: [...cart],
        total: totalHarga,
        catatan: `Level Sambal: ${sambal} | Catatan: ${catatan}`,
        status: "Direct WhatsApp",
      };
      const existingOrders = JSON.parse(localStorage.getItem("bekulezat_orders")) || [];
      existingOrders.unshift(newOrder);
      localStorage.setItem("bekulezat_orders", JSON.stringify(existingOrders));
    } catch (err) {
      console.warn("Gagal menyimpan pesanan ke localStorage:", err);
    }

    // 8. Buka WhatsApp (langsung dari klik user agar tidak diblokir popup blocker)
    const win = window.open(urlWhatsApp, "_blank");
    if (!win) window.location.href = urlWhatsApp; // fallback jika popup diblokir

    // 9. Kosongkan keranjang (pakai cart = [], BUKAN window.cart = [])
    cart = [];
    renderCart();

    // 10. Reset tombol produk
    document.querySelectorAll(".qty-controller").forEach((el) => (el.style.display = "none"));
    document.querySelectorAll(".card-checkout-btn").forEach((el) => (el.style.display = "none"));
    document.querySelectorAll(".add-btn").forEach((el) => (el.style.display = "block"));
  });
});

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