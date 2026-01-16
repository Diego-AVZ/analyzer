const WebSocket = require('ws');

class PumpFunBot {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 5000;
        this.isConnected = false;
        this.filterTerm = 'dobby';
        this.filterEnabled = true;
        this.alarmEnabled = true;
    }

    connect() {
        this.ws = new WebSocket('wss://pumpportal.fun/api/data');

        this.ws.on('open', () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.subscribeToNewTokens();
        });

        this.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                this.handleNewToken(message);
            } catch (error) {
            }
        });

        this.ws.on('close', () => {
            this.isConnected = false;
            this.handleReconnect();
        });

        this.ws.on('error', () => {
            this.isConnected = false;
        });
    }

    subscribeToNewTokens() {
        if (!this.isConnected) {
            return;
        }

        const payload = {
            method: "subscribeNewToken"
        };

        this.ws.send(JSON.stringify(payload));
    }

    handleNewToken(data) {
        if (data.message && data.message.includes('Successfully subscribed')) {
            return;
        }
        
        if (data.txType === 'create' && data.mint && data.name && data.symbol) {
            if (this.shouldShowToken(data)) {
                if (this.alarmEnabled) {
                    this.playAlarm();
                }
            }
        }
    }

    shouldShowToken(data) {
        if (!this.filterEnabled) {
            return true;
        }
        
        const name = (data.name || '').toLowerCase();
        const symbol = (data.symbol || '').toLowerCase();
        const searchTerm = this.filterTerm.toLowerCase();
        
        return name.includes(searchTerm) || symbol.includes(searchTerm);
    }

    setFilterTerm(term) {
        this.filterTerm = term;
    }

    toggleFilter(enabled) {
        this.filterEnabled = enabled;
    }

    playAlarm() {
        try {
        } catch (error) {
        }
    }

    toggleAlarm(enabled) {
        this.alarmEnabled = enabled;
    }

    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
                this.connect();
            }, this.reconnectDelay);
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }

    subscribeToTokenTrades(tokenAddresses) {
        if (!this.isConnected) {
            return;
        }

        const payload = {
            method: "subscribeTokenTrade",
            keys: tokenAddresses
        };

        this.ws.send(JSON.stringify(payload));
    }

    subscribeToAccountTrades(accountAddresses) {
        if (!this.isConnected) {
            return;
        }

        const payload = {
            method: "subscribeAccountTrade",
            keys: accountAddresses
        };

        this.ws.send(JSON.stringify(payload));
    }
}

const bot = new PumpFunBot();

process.on('SIGINT', () => {
    bot.disconnect();
    process.exit(0);
});

process.on('SIGTERM', () => {
    bot.disconnect();
    process.exit(0);
});

bot.connect();

 setTimeout(() => {
  bot.setFilterTerm('fractal');
}, 10000);