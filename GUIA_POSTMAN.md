# Guía para Probar el Login y 2FA en Postman

## 📋 Preparación

### 1. Crear Usuario de Prueba

Ejecuta el siguiente comando para crear un usuario de prueba:

```bash
npm run seed:user
```

O directamente:

```bash
node scripts/createTestUser.js
```

**Credenciales del usuario de prueba:**
- **Email:** `admin@test.com`
- **Contraseña:** `123456`
- **Rol:** `administrador`

---

## 🔐 Flujo de Autenticación en Postman

### **PASO 1: Login Inicial (Sin 2FA)**

#### Request 1: POST /api/usuarios/login

**Configuración:**
- **Método:** `POST`
- **URL:** `http://localhost:3001/api/usuarios/login`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Body (raw JSON):**
  ```json
  {
    "email": "admin@test.com",
    "password": "123456"
  }
  ```

**Respuesta esperada:**
```json
{
  "message": "Inicio de sesión exitoso.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**⚠️ Importante:** Guarda este token para usar en las siguientes peticiones.

**En Postman:**
1. Crea una nueva petición
2. Selecciona método `POST`
3. Ingresa la URL
4. Ve a la pestaña "Headers" y agrega `Content-Type: application/json`
5. Ve a la pestaña "Body", selecciona "raw" y "JSON"
6. Pega el JSON del body
7. Haz clic en "Send"

---

### **PASO 2: Configurar 2FA (Setup)**

#### Request 2: POST /api/usuarios/2fa/setup

**Configuración:**
- **Método:** `POST`
- **URL:** `http://localhost:3001/api/usuarios/2fa/setup`
- **Headers:**
  ```
  Content-Type: application/json
  Authorization: Bearer {TOKEN_DEL_PASO_1}
  ```
- **Body:** No requiere body

**Respuesta esperada:**
```json
{
  "message": "Escanea este código QR con tu app de autenticación.",
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCodeUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

**📱 Siguiente paso:**
1. Copia el `secret` o usa el `qrCodeUrl` para escanear con tu app de autenticación (Google Authenticator, Authy, etc.)
2. La app generará un código de 6 dígitos que usarás en el siguiente paso

**En Postman:**
1. Crea una nueva petición
2. Selecciona método `POST`
3. Ingresa la URL
4. Ve a "Headers" y agrega:
   - `Content-Type: application/json`
   - `Authorization: Bearer {pega_el_token_del_paso_1}`
5. Haz clic en "Send"

---

### **PASO 3: Habilitar 2FA (Enable)**

#### Request 3: POST /api/usuarios/2fa/enable

**Configuración:**
- **Método:** `POST`
- **URL:** `http://localhost:3001/api/usuarios/2fa/enable`
- **Headers:**
  ```
  Content-Type: application/json
  Authorization: Bearer {TOKEN_DEL_PASO_1}
  ```
- **Body (raw JSON):**
  ```json
  {
    "token2FA": "123456"
  }
  ```
  **⚠️ Reemplaza `123456` con el código de 6 dígitos de tu app de autenticación**

**Respuesta esperada:**
```json
{
  "message": "La autenticación de dos factores ha sido habilitada exitosamente."
}
```

**En Postman:**
1. Crea una nueva petición
2. Selecciona método `POST`
3. Ingresa la URL
4. Ve a "Headers" y agrega:
   - `Content-Type: application/json`
   - `Authorization: Bearer {pega_el_token_del_paso_1}`
5. Ve a "Body", selecciona "raw" y "JSON"
6. Ingresa el JSON con el código de tu app de autenticación
7. Haz clic en "Send"

---

### **PASO 4: Login con 2FA (Dos Pasos)**

Ahora que 2FA está habilitado, el login requiere dos pasos.

#### Request 4a: POST /api/usuarios/login (Primer Paso)

**Configuración:**
- **Método:** `POST`
- **URL:** `http://localhost:3001/api/usuarios/login`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Body (raw JSON):**
  ```json
  {
    "email": "admin@test.com",
    "password": "123456"
  }
  ```

**Respuesta esperada:**
```json
{
  "message": "Verificación en dos pasos requerida.",
  "requires2FA": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**⚠️ Importante:** Este token es temporal (válido por 10 minutos) y solo puede usarse para el segundo paso del login.

---

#### Request 4b: POST /api/usuarios/login/verify-2fa (Segundo Paso)

**Configuración:**
- **Método:** `POST`
- **URL:** `http://localhost:3001/api/usuarios/login/verify-2fa`
- **Headers:**
  ```
  Content-Type: application/json
  Authorization: Bearer {TOKEN_TEMPORAL_DEL_PASO_4A}
  ```
- **Body (raw JSON):**
  ```json
  {
    "token2FA": "654321"
  }
  ```
  **⚠️ Reemplaza `654321` con el código actual de 6 dígitos de tu app de autenticación**

**Respuesta esperada:**
```json
{
  "message": "Inicio de sesión exitoso.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**✅ Este es el token final que usarás para acceder a las rutas protegidas.**

---

## 🔒 Probar Rutas Protegidas

### Request 5: GET /api/usuarios/profile

**Configuración:**
- **Método:** `GET`
- **URL:** `http://localhost:3001/api/usuarios/profile`
- **Headers:**
  ```
  Authorization: Bearer {TOKEN_FINAL_DEL_PASO_4B}
  ```

**Respuesta esperada:**
```json
{
  "id": "uuid-del-usuario",
  "nombres": "Juan",
  "apellidoPaterno": "Pérez",
  "apellidoMaterno": "García",
  "email": "admin@test.com",
  "telefono": "5551234567",
  "rol": "administrador",
  "estado": "activo",
  "sede": "Sede Central",
  "isTwoFactorEnabled": true,
  "fechaRegistro": "2024-01-01T00:00:00.000Z"
}
```

---

## 📝 Resumen del Flujo Completo

1. ✅ **Crear usuario** → `npm run seed:user`
2. ✅ **Login inicial** → Obtener token
3. ✅ **Setup 2FA** → Obtener QR/secret
4. ✅ **Escanear QR** → Con app de autenticación
5. ✅ **Enable 2FA** → Verificar código de la app
6. ✅ **Login con 2FA (Paso 1)** → Email + Password → Token temporal
7. ✅ **Login con 2FA (Paso 2)** → Token temporal + Código 2FA → Token final
8. ✅ **Usar token final** → Para acceder a rutas protegidas

---

## 🛠️ Tips para Postman

### Guardar Variables en Postman

1. Crea un **Environment** en Postman
2. Agrega variables:
   - `base_url`: `http://localhost:3001`
   - `token`: (se actualizará después del login)
   - `temp_token`: (para el token temporal del 2FA)

3. Usa las variables en las URLs:
   - `{{base_url}}/api/usuarios/login`
   - `{{base_url}}/api/usuarios/profile`

### Scripts de Postman (Opcional)

Puedes agregar scripts en Postman para guardar automáticamente los tokens:

**En el "Tests" tab del Request de Login:**
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    if (jsonData.token) {
        pm.environment.set("token", jsonData.token);
    }
}
```

---

## ⚠️ Notas Importantes

- Los tokens tienen expiración (por defecto 24 horas, excepto el token temporal de 2FA que expira en 10 minutos)
- El código 2FA cambia cada 30 segundos en tu app de autenticación
- Si el token temporal expira, debes volver a hacer login (Paso 4a)
- Para deshabilitar 2FA, usa: `POST /api/usuarios/2fa/disable` con el token de sesión

---

## 🐛 Solución de Problemas

### Error: "No autorizado, no hay token"
- Verifica que estés enviando el header `Authorization: Bearer {token}`
- Asegúrate de que el token no haya expirado

### Error: "Token 2FA inválido"
- Verifica que estés usando el código actual de tu app (cambia cada 30 segundos)
- Asegúrate de haber escaneado el QR correcto

### Error: "Se requiere verificación 2FA para continuar"
- Estás usando un token temporal de 2FA en una ruta que no es `/login/verify-2fa`
- Usa el token final del Paso 4b para acceder a otras rutas

---

¡Listo! Ahora puedes probar todo el flujo de autenticación con 2FA en Postman. 🚀

