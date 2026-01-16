"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeltaNeutralAnalyzer = void 0;
const binanceService_1 = require("./binanceService");
const longShortAnalyzer_1 = require("./longShortAnalyzer");
class DeltaNeutralAnalyzer {
    constructor() {
        this.binanceService = new binanceService_1.BinanceService('https://api.binance.com/api/v3/klines', '1d', 100);
        this.longShortAnalyzer = new longShortAnalyzer_1.LongShortAnalyzer();
    }
    async analyzeDeltaNeutral(strategyA, strategyB, timePeriod = 100) {
        this.binanceService = new binanceService_1.BinanceService('https://api.binance.com/api/v3/klines', '1d', timePeriod);
        const strategyAResult = await this.analyzeSingleStrategy(strategyA.longToken, strategyA.shortToken);
        const strategyBResult = await this.analyzeSingleStrategy(strategyB.longToken, strategyB.shortToken);
        const correlation = this.analyzeStrategyCorrelation(strategyAResult, strategyBResult);
        const portfolioMetrics = this.calculatePortfolioMetrics(strategyAResult, strategyBResult, correlation);
        const recommendation = this.generateRecommendation(strategyAResult, strategyBResult, correlation, portfolioMetrics);
        const result = {
            strategyA: strategyAResult,
            strategyB: strategyBResult,
            correlation,
            portfolioMetrics,
            recommendation
        };
        this.printSummary(result);
        return result;
    }
    async analyzeSingleStrategy(longToken, shortToken) {
        const longTokenData = await this.binanceService.getKlines(longToken.toUpperCase());
        const shortTokenData = await this.binanceService.getKlines(shortToken.toUpperCase());
        if (!longTokenData.success || !shortTokenData.success) {
            throw new Error(`Error fetching data: ${longTokenData.error || shortTokenData.error}`);
        }
        const longKlines = this.binanceService.processKlines(longTokenData.data);
        const shortKlines = this.binanceService.processKlines(shortTokenData.data);
        if (!this.binanceService.validateKlines(longKlines) || !this.binanceService.validateKlines(shortKlines)) {
            throw new Error('Invalid data received from Binance');
        }
        const filteredLongKlines = this.binanceService.filterValidDays(longKlines);
        const filteredShortKlines = this.binanceService.filterValidDays(shortKlines);
        const { synchronizedA, synchronizedB } = this.binanceService.synchronizeTimestamps(filteredLongKlines, filteredShortKlines);
        if (synchronizedA.length < 30) {
            throw new Error(`Insufficient valid data: ${synchronizedA.length} days (minimum: 30)`);
        }
        const stats = this.longShortAnalyzer.analyzeLongShortStrategy(longToken.toUpperCase(), shortToken.toUpperCase(), synchronizedA, synchronizedB);
        const result = this.longShortAnalyzer.generateRecommendation(stats);
        return result;
    }
    analyzeStrategyCorrelation(strategyA, strategyB) {
        const dailyProfitsA = strategyA.stats.dailyProfits;
        const dailyProfitsB = strategyB.stats.dailyProfits;
        let bothWinDays = 0;
        let bothLoseDays = 0;
        let strategyAWinsStrategyBLoses = 0;
        let strategyBWinsStrategyALoses = 0;
        for (let i = 0; i < dailyProfitsA.length; i++) {
            const profitA = dailyProfitsA[i];
            const profitB = dailyProfitsB[i];
            if (profitA > 0 && profitB > 0) {
                bothWinDays++;
            }
            else if (profitA < 0 && profitB < 0) {
                bothLoseDays++;
            }
            else if (profitA > 0 && profitB < 0) {
                strategyAWinsStrategyBLoses++;
            }
            else if (profitA < 0 && profitB > 0) {
                strategyBWinsStrategyALoses++;
            }
        }
        const correlationCoefficient = this.calculateCorrelationCoefficient(dailyProfitsA, dailyProfitsB);
        const totalDays = dailyProfitsA.length;
        const hedgeDays = strategyAWinsStrategyBLoses + strategyBWinsStrategyALoses;
        const hedgeEffectiveness = (hedgeDays / totalDays) * 100;
        const combinedVolatility = this.calculateCombinedVolatility(dailyProfitsA, dailyProfitsB);
        const portfolioSharpeRatio = this.calculatePortfolioSharpeRatio(dailyProfitsA, dailyProfitsB);
        return {
            bothWinDays,
            bothLoseDays,
            strategyAWinsStrategyBLoses,
            strategyBWinsStrategyALoses,
            correlationCoefficient,
            hedgeEffectiveness,
            combinedVolatility,
            portfolioSharpeRatio
        };
    }
    calculateCorrelationCoefficient(arrayA, arrayB) {
        const n = arrayA.length;
        const sumA = arrayA.reduce((sum, val) => sum + val, 0);
        const sumB = arrayB.reduce((sum, val) => sum + val, 0);
        const sumAB = arrayA.reduce((sum, val, i) => sum + val * arrayB[i], 0);
        const sumA2 = arrayA.reduce((sum, val) => sum + val * val, 0);
        const sumB2 = arrayB.reduce((sum, val) => sum + val * val, 0);
        const numerator = n * sumAB - sumA * sumB;
        const denominator = Math.sqrt((n * sumA2 - sumA * sumA) * (n * sumB2 - sumB * sumB));
        return denominator === 0 ? 0 : numerator / denominator;
    }
    calculateCombinedVolatility(dailyProfitsA, dailyProfitsB) {
        const combinedProfits = dailyProfitsA.map((profit, i) => (profit + dailyProfitsB[i]) / 2);
        const mean = combinedProfits.reduce((sum, val) => sum + val, 0) / combinedProfits.length;
        const variance = combinedProfits.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / combinedProfits.length;
        return Math.sqrt(variance);
    }
    calculatePortfolioSharpeRatio(dailyProfitsA, dailyProfitsB) {
        const combinedProfits = dailyProfitsA.map((profit, i) => (profit + dailyProfitsB[i]) / 2);
        const mean = combinedProfits.reduce((sum, val) => sum + val, 0) / combinedProfits.length;
        const volatility = this.calculateCombinedVolatility(dailyProfitsA, dailyProfitsB);
        return volatility === 0 ? 0 : mean / volatility;
    }
    calculatePortfolioMetrics(strategyA, strategyB, correlation) {
        const combinedWinRate = (correlation.bothWinDays / strategyA.stats.totalDays) * 100;
        const combinedTotalProfit = (strategyA.stats.totalProfit + strategyB.stats.totalProfit) / 2;
        const combinedAverageDailyProfit = (strategyA.stats.averageDailyProfit + strategyB.stats.averageDailyProfit) / 2;
        const maxDrawdownA = strategyA.stats.maxDrawdown;
        const maxDrawdownB = strategyB.stats.maxDrawdown;
        const maxCombinedDrawdown = Math.max(maxDrawdownA, maxDrawdownB);
        const individualVolatility = (strategyA.stats.profitVolatility + strategyB.stats.profitVolatility) / 2;
        const riskReduction = ((individualVolatility - correlation.combinedVolatility) / individualVolatility) * 100;
        const diversificationBenefit = correlation.hedgeEffectiveness;
        return {
            combinedWinRate,
            combinedTotalProfit,
            combinedAverageDailyProfit,
            maxCombinedDrawdown,
            portfolioVolatility: correlation.combinedVolatility,
            portfolioSharpeRatio: correlation.portfolioSharpeRatio,
            riskReduction,
            diversificationBenefit
        };
    }
    generateRecommendation(strategyA, strategyB, correlation, portfolioMetrics) {
        let overallRecommendation = 'POOR';
        let confidence = 0;
        let riskLevel = 'HIGH';
        const criteria = {
            bothStrategiesGood: strategyA.recommendation !== 'SELL' && strategyB.recommendation !== 'SELL',
            lowCorrelation: Math.abs(correlation.correlationCoefficient) < 0.3,
            goodHedgeEffectiveness: correlation.hedgeEffectiveness > 30,
            riskReduction: portfolioMetrics.riskReduction > 10,
            goodCombinedWinRate: portfolioMetrics.combinedWinRate > 50
        };
        const score = Object.values(criteria).filter(Boolean).length;
        if (score >= 4) {
            overallRecommendation = 'EXCELLENT';
            confidence = 85;
            riskLevel = 'LOW';
        }
        else if (score >= 3) {
            overallRecommendation = 'GOOD';
            confidence = 70;
            riskLevel = 'MEDIUM';
        }
        else if (score >= 2) {
            overallRecommendation = 'MODERATE';
            confidence = 55;
            riskLevel = 'MEDIUM';
        }
        else {
            overallRecommendation = 'POOR';
            confidence = 30;
            riskLevel = 'HIGH';
        }
        let advice = '';
        if (overallRecommendation === 'EXCELLENT') {
            advice = '🔥 EXCELENTE combinación delta neutral. Ambas estrategias se complementan perfectamente con alta efectividad de cobertura.';
        }
        else if (overallRecommendation === 'GOOD') {
            advice = '⚡ BUENA combinación. Las estrategias ofrecen diversificación adecuada con cobertura moderada.';
        }
        else if (overallRecommendation === 'MODERATE') {
            advice = '📊 COMBINACIÓN MODERADA. Considerar gestión de riesgo adicional debido a correlación limitada.';
        }
        else {
            advice = '⚠️ COMBINACIÓN POCO EFECTIVA. Las estrategias están muy correlacionadas o tienen rendimientos pobres.';
        }
        return {
            overallRecommendation,
            confidence,
            advice,
            riskLevel
        };
    }
    printSummary(result) {
    }
}
exports.DeltaNeutralAnalyzer = DeltaNeutralAnalyzer;
