# Fleet Ledger — Vehicle Management Frontend (React + Vite)

## Sida loo shaqeeyo (Setup)

1. Furfur ZIP-ka, kadibna terminal-ka ku gal folder-ka:
   ```
   cd VehicleFrontend
   ```

2. Rakib packages-ka:
   ```
   npm install
   ```

3. Bilaabo app-ka:
   ```
   npm run dev
   ```
   Wuxuu ku furmi doonaa `http://localhost:5173`

## MUHIIM: Certificate-ka HTTPS

Backend-kaagu wuxuu ku socdaa `https://localhost:7204` isagoo isticmaalaya **self-signed certificate** (development cert). Browser-ka aad marka hore isku dayi doontaa inuu diido connection-ka (`ERR_CERT_AUTHORITY_INVALID` ama fetch failed).

**Xalka:**
1. Fur tab kale oo browser ah, tag: `https://localhost:7204/swagger`
2. Browser-ku wuxuu ku tusi doonaa digniin ("Your connection is not private") — dooro **Advanced → Proceed to localhost (unsafe)**
3. Marka aad mar ku aqbasho certificate-ka, dib u tag app-ka frontend-ka (`localhost:5173`) — hadda fetch requests-ku way shaqeyn doonaan.

## Xogta ku jirta

- `src/api.js` — dhammaan API calls-ka (Register, Login, VehicleData CRUD, TechnicalIncome CRUD, MonthlyReport)
- `src/App.jsx` — dhammaan qaybaha UI (Login/Register, Xogta Baabuurta, Dakhliga Farsamada, Warbixin Bille)
- `src/index.css` — design tokens iyo styling

## Haddii aad rabto inaad beddesho backend URL-ka

Fur `src/api.js`, beddel sadarka:
```js
const BASE_URL = "https://localhost:7204/api";
```
