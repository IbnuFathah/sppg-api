const express = require("express");
const crypto = require("crypto");

const app = express();
app.use(express.json());

const SECRET = "rahasia-latihan-lks";
const USERS = [{ id: 1, username: "supplier", password: "supplier123", name: "PT. Pemasok Sejahtera" }];

// ---------- data palsu (reset kalau server restart, wajar di Vercel) ----------
const orders = [
  {
    id: 1, order_number: "ORD-001", order_date: "2026-07-01", status: "Pending",
    items: [
      { id: 1, material_name: "Beras Premium", quantity: 50, unit: "Kg" },
      { id: 2, material_name: "Minyak Goreng", quantity: 20, unit: "Liter" },
    ],
  },
  {
    id: 2, order_number: "ORD-002", order_date: "2026-07-02", status: "Pending",
    items: [
      { id: 3, material_name: "Daging Ayam Filet", quantity: 25, unit: "Kg" },
      { id: 4, material_name: "Telur Ayam", quantity: 15, unit: "Kg" },
      { id: 5, material_name: "Bawang Putih", quantity: 5, unit: "Kg" },
    ],
  },
  {
    id: 3, order_number: "ORD-003", order_date: "2026-07-03", status: "Diproses",
    items: [{ id: 6, material_name: "Sayur Bayam", quantity: 30, unit: "Ikat" }],
  },
  {
    id: 4, order_number: "ORD-004", order_date: "2026-07-04", status: "Dikirim",
    items: [{ id: 7, material_name: "Tahu Putih", quantity: 100, unit: "Pcs" }],
  },
];

// ---------- token sederhana (ditandatangani, tanpa library) ----------
function makeToken(user) {
  const payload = Buffer.from(JSON.stringify({ uid: user.id })).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}
function verifyToken(token) {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  if (sig !== expected) return null;
  try {
    const { uid } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return USERS.find((u) => u.id === uid) || null;
  } catch {
    return null;
  }
}
function auth(req, res, next) {
  const h = req.headers["authorization"] || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  const user = verifyToken(token);
  if (!user) return res.status(401).json({ message: "Unauthorized" });
  req.user = user;
  next();
}

const router = express.Router();

// 1. Login
router.post("/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  const user = USERS.find((u) => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ message: "Username atau password salah" });
  res.json({ message: "Login berhasil", token: makeToken(user), user: { id: user.id, name: user.name, username: user.username } });
});

// 2. Dashboard
router.get("/dashboards", auth, (req, res) => {
  const count = (s) => orders.filter((o) => o.status === s).length;
  res.json({ data: { total_orders: orders.length, pending: count("Pending"), diproses: count("Diproses"), dikirim: count("Dikirim") } });
});

// 3. Daftar pesanan
router.get("/orders", auth, (req, res) => {
  res.json({
    data: orders.map((o) => ({ id: o.id, order_number: o.order_number, order_date: o.order_date, status: o.status, total_items: o.items.length })),
  });
});

// 4. Detail pesanan
router.get("/orders/:id", auth, (req, res) => {
  const o = orders.find((x) => x.id === Number(req.params.id));
  if (!o) return res.status(404).json({ message: "Pesanan tidak ditemukan" });
  res.json({ data: o });
});

// 5. Update status
router.put("/orders/:id/status", auth, (req, res) => {
  const o = orders.find((x) => x.id === Number(req.params.id));
  if (!o) return res.status(404).json({ message: "Pesanan tidak ditemukan" });
  const { status } = req.body || {};
  if (!["Diproses", "Dikirim"].includes(status)) {
    return res.status(422).json({ message: "Status harus 'Diproses' atau 'Dikirim'" });
  }
  o.status = status;
  res.json({ message: "Status berhasil diperbarui", data: { id: o.id, status: o.status } });
});

app.use("/api", router);
app.use("/", router);
app.use((req, res) => res.status(404).json({ message: "Endpoint tidak ditemukan" }));

module.exports = app;
