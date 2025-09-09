# PumpFun Bot 🤖

Bot de Node.js que obtiene nuevos tokens creados en Pump.fun en tiempo real usando el WebSocket de PumpPortal.

## 🚀 Características

- **Detección en tiempo real**: Recibe notificaciones instantáneas de nuevos tokens creados en Pump.fun
- **Filtro inteligente**: Solo muestra tokens que contengan "dobby" en el nombre o símbolo
- **Filtro configurable**: Puedes cambiar el término de búsqueda o deshabilitar el filtro
- **Reconexión automática**: Se reconecta automáticamente si se pierde la conexión
- **Manejo robusto de errores**: Gestiona errores de conexión y parsing de datos
- **Logs detallados**: Muestra información completa de cada evento
- **Múltiples suscripciones**: Soporte para suscribirse a tokens y cuentas específicas

## 📋 Requisitos

- Node.js (versión 14 o superior)
- npm

## 🛠️ Instalación

1. Clona el repositorio:
```bash
git clone <tu-repositorio>
cd something
```

2. Instala las dependencias:
```bash
npm install
```

## 🎯 Uso

### Ejecutar el bot básico
```bash
npm start
```

### Ejecutar en modo desarrollo
```bash
npm run dev
```

## 📡 Funcionalidades del WebSocket

El bot se conecta al WebSocket de PumpPortal (`wss://pumpportal.fun/api/data`) y puede suscribirse a:

### 1. Nuevos Tokens (Principal)
```javascript
// Se suscribe automáticamente a nuevos tokens
method: "subscribeNewToken"
```

### 2. Trades de Tokens Específicos
```javascript
// Ejemplo de uso en el código
bot.subscribeToTokenTrades(['91WNez8D22NwBssQbkzjy4s2ipFrzpmn5hfvWVe2aY5p']);
```

### 3. Trades de Cuentas Específicas
```javascript
// Ejemplo de uso en el código
bot.subscribeToAccountTrades(['AArPXm8JatJiuyEffuC1un2Sc835SULa4uQqDcaGpAjV']);
```

## 🔧 Configuración

### Variables de Entorno (Opcional)
Puedes crear un archivo `.env` para configurar:

```env
# Configuración del WebSocket
WS_URL=wss://pumpportal.fun/api/data
MAX_RECONNECT_ATTEMPTS=5
RECONNECT_DELAY=5000
```

### Control del Filtro

El bot incluye un sistema de filtrado configurable:

```javascript
// Cambiar el término de filtro
bot.setFilterTerm('chippy');

// Deshabilitar el filtro (ver todos los tokens)
bot.toggleFilter(false);

// Habilitar el filtro nuevamente
bot.toggleFilter(true);
```

### Personalización
Puedes modificar el archivo `index.js` para:

- Cambiar el término de filtro por defecto
- Modificar el formato de los logs
- Agregar filtros adicionales
- Integrar con bases de datos
- Enviar notificaciones a Telegram/Discord
- Implementar análisis de datos

## 📊 Estructura de Datos

Cuando se detecta un nuevo token, recibirás un objeto JSON con información como:

```json
{
  "type": "newToken",
  "data": {
    "tokenAddress": "...",
    "creator": "...",
    "timestamp": "...",
    "metadata": {
      "name": "...",
      "symbol": "...",
      "description": "..."
    }
  }
}
```

## ⚠️ Limitaciones Importantes

- **Una sola conexión**: Solo usa UNA conexión WebSocket a la vez
- **No spam**: No abras múltiples conexiones simultáneas o podrías ser bloqueado
- **Rate limiting**: Respeta los límites de la API

## 🛑 Detener el Bot

Para detener el bot de forma segura:
- Presiona `Ctrl + C` en la terminal
- El bot se desconectará automáticamente del WebSocket

## 🔗 Enlaces Útiles

- [Documentación de PumpPortal](https://pumpportal.fun/data-api/real-time)
- [Pump.fun](https://pump.fun)

## 📝 Logs

El bot muestra logs detallados incluyendo:
- Estado de conexión
- Nuevos tokens detectados
- Errores y reconexiones
- Timestamps de eventos

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia ISC.
