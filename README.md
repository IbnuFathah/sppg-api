# API Latihan SPPG (tiruan API LKS Jabar 2026)

Akun login: username `supplier` / password `supplier123`

Endpoint (semua kecuali login butuh header `Authorization: Bearer {token}`):
- POST /api/auth/login        body: {"username":"..","password":".."}
- GET  /api/dashboards
- GET  /api/orders
- GET  /api/orders/{id}
- PUT  /api/orders/{id}/status  body: {"status":"Diproses"} atau {"status":"Dikirim"}
