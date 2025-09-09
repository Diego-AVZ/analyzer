const WebSocket = require('ws');

class PumpFunBot {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 5000; // 5 segundos
        this.isConnected = false;
        this.filterTerm = 'dobby'; // Término de filtro por defecto
        this.filterEnabled = true; // Filtro habilitado por defecto
    }

    connect() {
        console.log('🚀 Conectando al WebSocket de PumpPortal...');
        
        this.ws = new WebSocket('wss://pumpportal.fun/api/data');

        this.ws.on('open', () => {
            console.log('✅ Conectado exitosamente al WebSocket de PumpPortal');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.subscribeToNewTokens();
        });

        this.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                this.handleNewToken(message);
            } catch (error) {
                console.error('❌ Error al parsear mensaje:', error);
            }
        });

        this.ws.on('close', (code, reason) => {
            console.log(`🔌 Conexión cerrada. Código: ${code}, Razón: ${reason}`);
            this.isConnected = false;
            this.handleReconnect();
        });

        this.ws.on('error', (error) => {
            console.error('❌ Error en WebSocket:', error);
            this.isConnected = false;
        });
    }

    subscribeToNewTokens() {
        if (!this.isConnected) {
            console.log('⚠️ No hay conexión activa para suscribirse');
            return;
        }

        const payload = {
            method: "subscribeNewToken"
        };

        console.log('📡 Suscribiéndose a nuevos tokens...');
        this.ws.send(JSON.stringify(payload));
    }

    handleNewToken(data) {
        // Verificar si es un mensaje de confirmación de suscripción
        if (data.message && data.message.includes('Successfully subscribed')) {
            console.log('✅ ' + data.message);
            return;
        }
        
        // Verificar si es un token creado (tiene txType: "create") y tiene name y symbol
        if (data.txType === 'create' && data.mint && data.name && data.symbol) {
            // Aplicar filtro para tokens que contengan el término en name o symbol
            if (this.shouldShowToken(data)) {
                console.log('\n🆕 ¡NUEVO TOKEN DETECTADO!');
                console.log(`📛 Nombre: ${data.name}`);
                console.log(`🔤 Símbolo: ${data.symbol}`);
                console.log(`💰 Market Cap: ${data.marketCapSol} SOL`);
                console.log(`🔗 Mint: ${data.mint}`);
                console.log(`📊 Datos completos:`, JSON.stringify(data, null, 2));
                console.log(`🌐 URL PUMPFUN: https://pump.fun/coin/${data.mint}`);
                console.log('⏰ Timestamp:', new Date().toISOString());
                console.log('─'.repeat(50));
            } else {
                // Mostrar mensaje discreto para tokens filtrados
                console.log(`🔍 Token filtrado: ${data.name || 'Sin nombre'} (${data.symbol || 'Sin símbolo'})`);
            }
        } else if (data.txType === 'create' && data.mint && (!data.name || !data.symbol)) {
            // Token incompleto (sin name o symbol)
            console.log(`⚠️ Token incompleto filtrado: ${data.name || 'Sin nombre'} (${data.symbol || 'Sin símbolo'}) - Mint: ${data.mint}`);
        } else {
            // Mostrar otros tipos de mensajes para debugging
            console.log('📨 Mensaje recibido:', JSON.stringify(data, null, 2));
        }
    }

    shouldShowToken(data) {
        // Si el filtro está deshabilitado, mostrar todos los tokens
        if (!this.filterEnabled) {
            return true;
        }
        
        // Filtrar tokens que contengan el término de búsqueda en el nombre o símbolo (case insensitive)
        const name = (data.name || '').toLowerCase();
        const symbol = (data.symbol || '').toLowerCase();
        const searchTerm = this.filterTerm.toLowerCase();
        
        return name.includes(searchTerm) || symbol.includes(searchTerm);
    }

    // Método para cambiar el término de filtro
    setFilterTerm(term) {
        this.filterTerm = term;
        console.log(`🔍 Filtro actualizado a: "${term}"`);
    }

    // Método para habilitar/deshabilitar el filtro
    toggleFilter(enabled) {
        this.filterEnabled = enabled;
        console.log(`🔍 Filtro ${enabled ? 'habilitado' : 'deshabilitado'}`);
    }

    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Intentando reconectar... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            setTimeout(() => {
                this.connect();
            }, this.reconnectDelay);
        } else {
            console.log('❌ Máximo número de intentos de reconexión alcanzado');
            console.log('💡 Por favor, reinicia el bot manualmente');
        }
    }

    disconnect() {
        if (this.ws) {
            console.log('🔌 Desconectando...');
            this.ws.close();
        }
    }

    // Método para suscribirse a tokens específicos (opcional)
    subscribeToTokenTrades(tokenAddresses) {
        if (!this.isConnected) {
            console.log('⚠️ No hay conexión activa para suscribirse');
            return;
        }

        const payload = {
            method: "subscribeTokenTrade",
            keys: tokenAddresses
        };

        console.log('📡 Suscribiéndose a trades de tokens específicos:', tokenAddresses);
        this.ws.send(JSON.stringify(payload));
    }

    // Método para suscribirse a trades de cuentas específicas (opcional)
    subscribeToAccountTrades(accountAddresses) {
        if (!this.isConnected) {
            console.log('⚠️ No hay conexión activa para suscribirse');
            return;
        }

        const payload = {
            method: "subscribeAccountTrade",
            keys: accountAddresses
        };

        console.log('📡 Suscribiéndose a trades de cuentas específicas:', accountAddresses);
        this.ws.send(JSON.stringify(payload));
    }
}

// Crear instancia del bot
const bot = new PumpFunBot();

// Manejar señales de terminación
process.on('SIGINT', () => {
    console.log('\n🛑 Deteniendo el bot...');
    bot.disconnect();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Deteniendo el bot...');
    bot.disconnect();
    process.exit(0);
});

// Iniciar el bot
console.log('🤖 Iniciando PumpFun Bot...');
console.log('📋 Funcionalidades:');
console.log('   • Detección de nuevos tokens en tiempo real');
console.log('   • Filtro activo: Solo tokens con "dobby" en nombre/símbolo');
console.log('   • Reconexión automática en caso de desconexión');
console.log('   • Manejo de errores robusto');
console.log('   • Logs detallados de eventos');
console.log('─'.repeat(50));

bot.connect();

// Ejemplos de uso del filtro (descomenta según necesites)
 setTimeout(() => {
   // Cambiar el término de filtro
  bot.setFilterTerm('fractal');
}, 10000);

// setTimeout(() => {
//     // Deshabilitar el filtro para ver todos los tokens
//     bot.toggleFilter(false);
// }, 20000);

// setTimeout(() => {
//     // Volver a habilitar el filtro
//     bot.toggleFilter(true);
// }, 30000);

// Ejemplo de uso adicional (descomenta si necesitas suscribirte a tokens específicos)
// setTimeout(() => {
//     bot.subscribeToTokenTrades(['91WNez8D22NwBssQbkzjy4s2ipFrzpmn5hfvWVe2aY5p']);
// }, 10000);