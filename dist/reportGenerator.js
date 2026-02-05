"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportGenerator = void 0;
class ReportGenerator {
    generateConsoleReport(results) {
        const sortedResults = results.sort((a, b) => b.confidence - a.confidence);
        this.printExecutiveSummary(sortedResults);
        this.printDetailedResults(sortedResults);
        this.printFinalRecommendations(sortedResults);
    }
    printExecutiveSummary(results) {
        const strongBuy = results.filter(r => r.recommendation === 'STRONG_BUY').length;
        const buy = results.filter(r => r.recommendation === 'BUY').length;
        const hold = results.filter(r => r.recommendation === 'HOLD').length;
        const sell = results.filter(r => r.recommendation === 'SELL').length;
        const strongSell = results.filter(r => r.recommendation === 'STRONG_SELL').length;
        if (strongBuy > 0 || buy > 0) {
            results
                .filter(r => r.recommendation === 'STRONG_BUY' || r.recommendation === 'BUY')
                .slice(0, 3)
                .forEach((result, index) => {
            });
        }
    }
    printDetailedResults(results) {
        results.forEach((result, index) => {
            if (result.stats && Object.keys(result.stats).length > 0) {
                const stats = result.stats;
            }
        });
    }
    printFinalRecommendations(results) {
        const strongResults = results.filter(r => r.recommendation === 'STRONG_BUY');
        if (strongResults.length > 0) {
            strongResults.forEach((result, index) => {
            });
        }
        const buyResults = results.filter(r => r.recommendation === 'BUY');
        if (buyResults.length > 0) {
            buyResults.forEach((result, index) => {
            });
        }
    }
    getRecommendationEmoji(recommendation) {
        switch (recommendation) {
            case 'STRONG_BUY': return '🔥';
            case 'BUY': return '⚡';
            case 'HOLD': return '📊';
            case 'SELL': return '⚠️';
            case 'STRONG_SELL': return '❌';
            default: return '❓';
        }
    }
    generateJSONReport(results) {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalStrategies: results.length,
                strongBuy: results.filter(r => r.recommendation === 'STRONG_BUY').length,
                buy: results.filter(r => r.recommendation === 'BUY').length,
                hold: results.filter(r => r.recommendation === 'HOLD').length,
                sell: results.filter(r => r.recommendation === 'SELL').length,
                strongSell: results.filter(r => r.recommendation === 'STRONG_SELL').length
            },
            results: results.map(result => ({
                pair: result.pair,
                recommendation: result.recommendation,
                confidence: result.confidence,
                stats: result.stats
            }))
        };
        return JSON.stringify(report, null, 2);
    }
    generateCSVReport(results) {
        const headers = [
            'Estrategia',
            'Recomendacion',
            'Confianza',
            'FundingFeeLong',
            'FundingFeeShort',
            'DiasValidos',
            'DiasGanadores',
            'DiasPerdedores',
            'WinRate%',
            'LossRate%',
            'GananciaTotal%',
            'GananciaPromedioDiaria%',
            'GananciaMaximaDia%',
            'PerdidaMaximaDia%',
            'MaxConsecutivoGanador',
            'MaxConsecutivoPerdedor',
            'VolatilidadGanancias%',
            'SharpeRatio',
            'MaxDrawdown%',
            'ConsistenciaScore'
        ];
        const rows = results.map(result => [
            result.pair,
            result.recommendation,
            result.confidence.toFixed(2),
            result.stats.fundingFeeLong ?? '',
            result.stats.fundingFeeShort ?? '',
            result.stats.validDays || 0,
            result.stats.winningDays || 0,
            result.stats.losingDays || 0,
            (result.stats.winRate || 0).toFixed(2),
            (result.stats.lossRate || 0).toFixed(2),
            (result.stats.totalProfit || 0).toFixed(2),
            (result.stats.averageDailyProfit || 0).toFixed(2),
            (result.stats.maxSingleDayProfit || 0).toFixed(2),
            (result.stats.maxSingleDayLoss || 0).toFixed(2),
            result.stats.maxConsecutiveWinningDays || 0,
            result.stats.maxConsecutiveLosingDays || 0,
            (result.stats.profitVolatility || 0).toFixed(2),
            (result.stats.sharpeRatio || 0).toFixed(2),
            (result.stats.maxDrawdown || 0).toFixed(2),
            (result.stats.consistencyScore || 0).toFixed(1)
        ]);
        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }
}
exports.ReportGenerator = ReportGenerator;
