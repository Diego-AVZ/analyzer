"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportGenerator = void 0;
/**
 * Generador de reportes para el análisis de correlaciones
 */
class ReportGenerator {
    /**
     * Genera un reporte completo en consola
     */
    generateConsoleReport(results) {
        console.log('\n' + '='.repeat(80));
        console.log('📊 REPORTE DE ANÁLISIS DE ESTRATEGIAS LONG/SHORT - BINANCE');
        console.log('='.repeat(80));
        // Ordenar resultados por confianza descendente
        const sortedResults = results.sort((a, b) => b.confidence - a.confidence);
        // Resumen ejecutivo
        this.printExecutiveSummary(sortedResults);
        // Detalles por par
        this.printDetailedResults(sortedResults);
        // Recomendaciones finales
        this.printFinalRecommendations(sortedResults);
        console.log('\n' + '='.repeat(80));
        console.log('🏁 Análisis completado');
        console.log('='.repeat(80));
    }
    /**
     * Imprime el resumen ejecutivo
     */
    printExecutiveSummary(results) {
        console.log('\n📋 RESUMEN EJECUTIVO');
        console.log('-'.repeat(50));
        const strongBuy = results.filter(r => r.recommendation === 'STRONG_BUY').length;
        const buy = results.filter(r => r.recommendation === 'BUY').length;
        const hold = results.filter(r => r.recommendation === 'HOLD').length;
        const sell = results.filter(r => r.recommendation === 'SELL').length;
        const strongSell = results.filter(r => r.recommendation === 'STRONG_SELL').length;
        console.log(`🔍 Total de estrategias analizadas: ${results.length}`);
        console.log(`🔥 Estrategias muy fuertes (STRONG_BUY): ${strongBuy}`);
        console.log(`⚡ Estrategias buenas (BUY): ${buy}`);
        console.log(`📊 Estrategias neutras (HOLD): ${hold}`);
        console.log(`⚠️ Estrategias débiles (SELL): ${sell}`);
        console.log(`❌ Estrategias muy débiles (STRONG_SELL): ${strongSell}`);
        if (strongBuy > 0 || buy > 0) {
            console.log('\n🎯 MEJORES OPORTUNIDADES:');
            results
                .filter(r => r.recommendation === 'STRONG_BUY' || r.recommendation === 'BUY')
                .slice(0, 3)
                .forEach((result, index) => {
                console.log(`${index + 1}. ${result.pair} - Confianza: ${result.confidence.toFixed(1)}%`);
            });
        }
    }
    /**
     * Imprime los resultados detallados
     */
    printDetailedResults(results) {
        console.log('\n📈 RESULTADOS DETALLADOS POR ESTRATEGIA');
        console.log('-'.repeat(50));
        results.forEach((result, index) => {
            console.log(`\n${index + 1}. ${result.pair}`);
            console.log(`   Recomendación: ${this.getRecommendationEmoji(result.recommendation)} ${result.recommendation}`);
            console.log(`   Confianza: ${result.confidence.toFixed(1)}%`);
            if (result.stats && Object.keys(result.stats).length > 0) {
                const stats = result.stats;
                console.log(`   📊 Estadísticas:`);
                console.log(`      • Días válidos: ${stats.validDays}/${stats.totalDays}`);
                console.log(`      • Días ganadores: ${stats.winningDays} (${stats.winRate.toFixed(1)}%)`);
                console.log(`      • Días perdedores: ${stats.losingDays} (${stats.lossRate.toFixed(1)}%)`);
                console.log(`      • Ganancia total: ${stats.totalProfit.toFixed(2)}%`);
                console.log(`      • Ganancia promedio diaria: ${stats.averageDailyProfit.toFixed(2)}%`);
                console.log(`      • Ganancia máxima en un día: ${stats.maxSingleDayProfit.toFixed(2)}%`);
                console.log(`      • Pérdida máxima en un día: ${stats.maxSingleDayLoss.toFixed(2)}%`);
                console.log(`      • Máximo consecutivo ganador: ${stats.maxConsecutiveWinningDays} días`);
                console.log(`      • Máximo consecutivo perdedor: ${stats.maxConsecutiveLosingDays} días`);
                console.log(`      • Volatilidad de ganancias: ${stats.profitVolatility.toFixed(2)}%`);
                console.log(`      • Sharpe ratio: ${stats.sharpeRatio.toFixed(2)}`);
                console.log(`      • Máximo drawdown: ${stats.maxDrawdown.toFixed(2)}%`);
                console.log(`      • Score consistencia: ${stats.consistencyScore.toFixed(1)}/100`);
            }
            console.log(`   💡 Estrategia: ${result.strategyAdvice.split('\n')[0]}`);
        });
    }
    /**
     * Imprime las recomendaciones finales
     */
    printFinalRecommendations(results) {
        console.log('\n🎯 RECOMENDACIONES FINALES');
        console.log('-'.repeat(50));
        const strongResults = results.filter(r => r.recommendation === 'STRONG_BUY');
        if (strongResults.length > 0) {
            console.log('\n🔥 ESTRATEGIAS MUY RECOMENDADAS (Alta confianza):');
            strongResults.forEach((result, index) => {
                console.log(`\n${index + 1}. ${result.pair} (Confianza: ${result.confidence.toFixed(1)}%)`);
                console.log(`   • Win Rate: ${result.stats.winRate.toFixed(1)}%`);
                console.log(`   • Ganancia promedio diaria: ${result.stats.averageDailyProfit.toFixed(2)}%`);
                console.log(`   • Ganancia total esperada: ${result.stats.totalProfit.toFixed(2)}%`);
                console.log(`   • Máximo consecutivo ganador: ${result.stats.maxConsecutiveWinningDays} días`);
            });
        }
        const buyResults = results.filter(r => r.recommendation === 'BUY');
        if (buyResults.length > 0) {
            console.log('\n⚡ ESTRATEGIAS RECOMENDADAS (Confianza media):');
            buyResults.forEach((result, index) => {
                console.log(`\n${index + 1}. ${result.pair} (Confianza: ${result.confidence.toFixed(1)}%)`);
                console.log(`   • Win Rate: ${result.stats.winRate.toFixed(1)}%`);
                console.log(`   • Ganancia promedio diaria: ${result.stats.averageDailyProfit.toFixed(2)}%`);
                console.log(`   • Considerar gestión de riesgo adecuada`);
            });
        }
        console.log('\n⚠️ CONSIDERACIONES IMPORTANTES:');
        console.log('• Este análisis se basa en datos históricos y no garantiza resultados futuros');
        console.log('• Siempre implementar gestión de riesgo adecuada (stop-loss, position sizing)');
        console.log('• Considerar comisiones y spreads en las estrategias');
        console.log('• Monitorear cambios en las correlaciones a lo largo del tiempo');
        console.log('• Diversificar estrategias y no depender de una sola correlación');
        console.log('• Las estrategias Long/Short requieren capital suficiente para mantener posiciones');
    }
    /**
     * Obtiene el emoji correspondiente a la recomendación
     */
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
    /**
     * Genera un reporte en formato JSON para exportar
     */
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
                stats: result.stats,
                strategyAdvice: result.strategyAdvice
            }))
        };
        return JSON.stringify(report, null, 2);
    }
    /**
     * Genera un reporte CSV para análisis en Excel
     */
    generateCSVReport(results) {
        const headers = [
            'Estrategia',
            'Recomendacion',
            'Confianza',
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
//# sourceMappingURL=reportGenerator.js.map