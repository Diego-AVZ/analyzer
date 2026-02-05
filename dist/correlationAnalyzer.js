"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorrelationAnalyzer = void 0;
class CorrelationAnalyzer {
    analyzeCorrelation(tokenA, tokenB, klinesA, klinesB) {
        const totalDays = klinesA.length;
        let validDays = 0;
        let inverseCorrelationDays = 0;
        let oppositeDirectionDays = 0;
        let aOutperformsB = 0;
        let bOutperformsA = 0;
        let totalDifference = 0;
        let totalDifferenceWhenAUp = 0;
        let totalDifferenceWhenBUp = 0;
        let daysWhenAUp = 0;
        let daysWhenBUp = 0;
        let maxSingleDayDifference = 0;
        let minSingleDayDifference = 0;
        let consecutiveInverseDays = 0;
        let maxConsecutiveInverseDays = 0;
        let currentConsecutiveInverseDays = 0;
        const dailyChangesA = [];
        const dailyChangesB = [];
        const differences = [];
        for (let i = 0; i < totalDays; i++) {
            const klineA = klinesA[i];
            const klineB = klinesB[i];
            if (klineA.timestamp !== klineB.timestamp) {
                continue;
            }
            validDays++;
            const changeA = klineA.dailyChange;
            const changeB = klineB.dailyChange;
            const difference = changeA - changeB;
            dailyChangesA.push(changeA);
            dailyChangesB.push(changeB);
            differences.push(difference);
            totalDifference += difference;
            if (i === 0) {
                maxSingleDayDifference = difference;
                minSingleDayDifference = difference;
            }
            else {
                maxSingleDayDifference = Math.max(maxSingleDayDifference, difference);
                minSingleDayDifference = Math.min(minSingleDayDifference, difference);
            }
            const aUp = changeA > 0;
            const bUp = changeB > 0;
            const aDown = changeA < 0;
            const bDown = changeB < 0;
            if ((aUp && bDown) || (aDown && bUp)) {
                oppositeDirectionDays++;
            }
            if (changeA > changeB) {
                aOutperformsB++;
                totalDifferenceWhenAUp += difference;
                daysWhenAUp++;
            }
            if (changeB > changeA) {
                bOutperformsA++;
                totalDifferenceWhenBUp += difference;
                daysWhenBUp++;
            }
            const inverseCondition = (aUp && bDown && changeA > Math.abs(changeB)) ||
                (bUp && aDown && changeB > Math.abs(changeA));
            if (inverseCondition) {
                inverseCorrelationDays++;
                consecutiveInverseDays++;
                currentConsecutiveInverseDays = consecutiveInverseDays;
                maxConsecutiveInverseDays = Math.max(maxConsecutiveInverseDays, consecutiveInverseDays);
            }
            else {
                consecutiveInverseDays = 0;
            }
        }
        const averageDifference = validDays > 0 ? totalDifference / validDays : 0;
        const averageDifferenceWhenAUp = daysWhenAUp > 0 ? totalDifferenceWhenAUp / daysWhenAUp : 0;
        const averageDifferenceWhenBUp = daysWhenBUp > 0 ? totalDifferenceWhenBUp / daysWhenBUp : 0;
        const correlationCoefficient = this.calculateCorrelationCoefficient(dailyChangesA, dailyChangesB);
        const aVolatility = this.calculateVolatility(dailyChangesA);
        const bVolatility = this.calculateVolatility(dailyChangesB);
        const volatilityRatio = bVolatility > 0 ? aVolatility / bVolatility : 0;
        const consistencyScore = this.calculateConsistencyScore(differences, averageDifference);
        const stats = {
            tokenA,
            tokenB,
            totalDays,
            validDays,
            inverseCorrelationDays,
            inverseCorrelationPercentage: validDays > 0 ? (inverseCorrelationDays / validDays) * 100 : 0,
            oppositeDirectionDays,
            oppositeDirectionPercentage: validDays > 0 ? (oppositeDirectionDays / validDays) * 100 : 0,
            aOutperformsB,
            aOutperformsBPercentage: validDays > 0 ? (aOutperformsB / validDays) * 100 : 0,
            bOutperformsA,
            bOutperformsAPercentage: validDays > 0 ? (bOutperformsA / validDays) * 100 : 0,
            averageDifference,
            averageDifferenceWhenAUp,
            averageDifferenceWhenBUp,
            correlationCoefficient,
            maxSingleDayDifference,
            minSingleDayDifference,
            consistencyScore,
            aVolatility,
            bVolatility,
            volatilityRatio,
            maxConsecutiveInverseDays,
            currentConsecutiveInverseDays
        };
        return stats;
    }
    calculateCorrelationCoefficient(x, y) {
        if (x.length !== y.length || x.length === 0) {
            return 0;
        }
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        return denominator === 0 ? 0 : numerator / denominator;
    }
    calculateVolatility(changes) {
        if (changes.length === 0)
            return 0;
        const mean = changes.reduce((a, b) => a + b, 0) / changes.length;
        const variance = changes.reduce((sum, change) => sum + Math.pow(change - mean, 2), 0) / changes.length;
        return Math.sqrt(variance);
    }
    calculateConsistencyScore(differences, averageDifference) {
        if (differences.length === 0)
            return 0;
        const variance = differences.reduce((sum, diff) => sum + Math.pow(diff - averageDifference, 2), 0) / differences.length;
        const standardDeviation = Math.sqrt(variance);
        return Math.max(0, 100 - (standardDeviation * 10));
    }
    generateRecommendation(stats) {
        let recommendation;
        let confidence = 0;
        let strategyAdvice = '';
        if (stats.inverseCorrelationPercentage >= 40 && stats.correlationCoefficient <= -0.3) {
            recommendation = 'STRONG_INVERSE';
            confidence = Math.min(100, stats.inverseCorrelationPercentage + Math.abs(stats.correlationCoefficient) * 100);
            strategyAdvice = `STRONG INVERSE CORRELATION: ${stats.inverseCorrelationPercentage.toFixed(1)}% of days with inverse correlation. 
      Recommended strategy: Long ${stats.tokenA} when ${stats.tokenB} drops, Short ${stats.tokenB} when ${stats.tokenA} rises.
      Average difference: ${stats.averageDifference.toFixed(2)}%.`;
        }
        else if (stats.inverseCorrelationPercentage >= 25 && stats.correlationCoefficient <= -0.2) {
            recommendation = 'MODERATE_INVERSE';
            confidence = Math.min(100, stats.inverseCorrelationPercentage + Math.abs(stats.correlationCoefficient) * 100);
            strategyAdvice = `MODERATE INVERSE CORRELATION: ${stats.inverseCorrelationPercentage.toFixed(1)}% of days with inverse correlation.
      Recommended strategy: Consider opposite positions on high volatility days.
      Average difference: ${stats.averageDifference.toFixed(2)}%.`;
        }
        else if (stats.inverseCorrelationPercentage >= 15) {
            recommendation = 'WEAK_INVERSE';
            confidence = stats.inverseCorrelationPercentage;
            strategyAdvice = `WEAK INVERSE CORRELATION: ${stats.inverseCorrelationPercentage.toFixed(1)}% of days with inverse correlation.
      Recommended strategy: Additional analysis required before implementing opposite strategy.`;
        }
        else {
            recommendation = 'NO_CORRELATION';
            confidence = 100 - stats.inverseCorrelationPercentage;
            strategyAdvice = `NO SIGNIFICANT INVERSE CORRELATION: Only ${stats.inverseCorrelationPercentage.toFixed(1)}% of days with inverse correlation.
      Recommended strategy: Look for other token pairs or different strategies.`;
        }
        strategyAdvice += `\n\nADDITIONAL METRICS:
    • Opposite days: ${stats.oppositeDirectionPercentage.toFixed(1)}%
    • ${stats.tokenA} outperforms ${stats.tokenB}: ${stats.aOutperformsBPercentage.toFixed(1)}%
    • ${stats.tokenB} outperforms ${stats.tokenA}: ${stats.bOutperformsAPercentage.toFixed(1)}%
    • ${stats.tokenA} volatility: ${stats.aVolatility.toFixed(2)}%
    • ${stats.tokenB} volatility: ${stats.bVolatility.toFixed(2)}%
    • Volatility ratio: ${stats.volatilityRatio.toFixed(2)}
    • Maximum consecutive inverse: ${stats.maxConsecutiveInverseDays} days
    • Consistency: ${stats.consistencyScore.toFixed(1)}/100`;
        return {
            pair: `${stats.tokenA}/${stats.tokenB}`,
            stats,
            recommendation,
            confidence,
            strategyAdvice
        };
    }
    analyzeMultiplePairs(tokenPairs) {
        const results = [];
        tokenPairs.forEach((pair, index) => {
            try {
                const stats = this.analyzeCorrelation(pair.tokenA, pair.tokenB, pair.klinesA, pair.klinesB);
                const result = this.generateRecommendation(stats);
                results.push(result);
            }
            catch (error) {
                results.push({
                    pair: `${pair.tokenA}/${pair.tokenB}`,
                    stats: {},
                    recommendation: 'NO_CORRELATION',
                    confidence: 0,
                    strategyAdvice: `Analysis error: ${error}`
                });
            }
        });
        return results;
    }
}
exports.CorrelationAnalyzer = CorrelationAnalyzer;
