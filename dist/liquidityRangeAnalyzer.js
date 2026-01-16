"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiquidityRangeAnalyzer = void 0;
class LiquidityRangeAnalyzer {
    analyzeLiquidityRange(tokenA, tokenB, klinesA, klinesB, rangeUpPercent, rangeDownPercent) {
        const currentPriceA = klinesA[klinesA.length - 1].close;
        const currentPriceB = klinesB[klinesB.length - 1].close;
        const currentPriceRatio = currentPriceB !== 0 ? currentPriceA / currentPriceB : 0;
        const priceRatioRange = {
            min: currentPriceRatio * (1 - rangeDownPercent / 100),
            max: currentPriceRatio * (1 + rangeUpPercent / 100)
        };
        const historicalAnalysis = this.analyzeHistoricalData(klinesA, klinesB, currentPriceRatio, priceRatioRange);
        const impermanentLossEstimation = this.estimateImpermanentLoss(rangeUpPercent, rangeDownPercent);
        const recommendation = this.generateRecommendation(historicalAnalysis, impermanentLossEstimation);
        return {
            pair: `${tokenA}/${tokenB}`,
            currentPriceA,
            currentPriceB,
            currentPriceRatio,
            priceRatioRange,
            historicalAnalysis,
            impermanentLossEstimation,
            recommendation: recommendation.recommendation,
            confidence: recommendation.confidence,
            advice: recommendation.advice
        };
    }
    analyzeHistoricalData(klinesA, klinesB, currentPriceRatio, priceRatioRange) {
        let daysInRange = 0;
        let daysOutOfRangeUp = 0;
        let daysOutOfRangeDown = 0;
        let maxConsecutiveDaysOut = 0;
        let currentConsecutiveDaysOut = 0;
        const volatilities = [];
        for (let i = 0; i < klinesA.length; i++) {
            const priceA = klinesA[i].close;
            const priceB = klinesB[i].close;
            const historicalPriceRatio = priceB !== 0 ? priceA / priceB : 0;
            let ratioVolatility = 0;
            if (i > 0) {
                const prevPriceA = klinesA[i - 1].close;
                const prevPriceB = klinesB[i - 1].close;
                const prevRatio = prevPriceB !== 0 ? prevPriceA / prevPriceB : 0;
                if (prevRatio > 0) {
                    ratioVolatility = Math.abs((historicalPriceRatio - prevRatio) / prevRatio) * 100;
                }
            }
            volatilities.push(ratioVolatility);
            const ratioInRange = historicalPriceRatio >= priceRatioRange.min && historicalPriceRatio <= priceRatioRange.max;
            if (ratioInRange) {
                daysInRange++;
                currentConsecutiveDaysOut = 0; // Resetear contador
            }
            else {
                currentConsecutiveDaysOut++;
                maxConsecutiveDaysOut = Math.max(maxConsecutiveDaysOut, currentConsecutiveDaysOut);
                if (historicalPriceRatio > priceRatioRange.max) {
                    daysOutOfRangeUp++;
                }
                else if (historicalPriceRatio < priceRatioRange.min) {
                    daysOutOfRangeDown++;
                }
            }
        }
        const totalDays = klinesA.length;
        const timeInRangePercentage = (daysInRange / totalDays) * 100;
        const averageVolatility = volatilities.length > 0
            ? volatilities.reduce((sum, vol) => sum + vol, 0) / volatilities.length
            : 0;
        return {
            totalDays,
            daysInRange,
            daysOutOfRangeUp,
            daysOutOfRangeDown,
            timeInRangePercentage,
            averageVolatility,
            maxConsecutiveDaysOut
        };
    }
    estimateImpermanentLoss(rangeUpPercent, rangeDownPercent) {
        const priceRatioUp = 1 + (rangeUpPercent / 100);
        const ilUp = this.calculateImpermanentLoss(priceRatioUp);
        const finalValueUp = 1000 * (1 + ilUp / 100); // Asumiendo inversión de $1000
        const priceRatioDown = 1 - (rangeDownPercent / 100);
        const ilDown = this.calculateImpermanentLoss(1 / priceRatioDown); // Invertir el ratio
        const finalValueDown = 1000 * (1 + ilDown / 100); // Asumiendo inversión de $1000
        const avgIL = (Math.abs(ilUp) + Math.abs(ilDown)) / 2;
        const feesNeededToCoverIL = avgIL * 1.2; // 20% de margen adicional
        return {
            scenarioUp: {
                priceRatio: priceRatioUp,
                impermanentLoss: ilUp,
                finalValue: finalValueUp
            },
            scenarioDown: {
                priceRatio: priceRatioDown,
                impermanentLoss: ilDown,
                finalValue: finalValueDown
            },
            feesNeededToCoverIL
        };
    }
    calculateImpermanentLoss(priceRatio) {
        if (priceRatio <= 0)
            return 0;
        const sqrtRatio = Math.sqrt(priceRatio);
        const il = (2 * sqrtRatio) / (1 + priceRatio) - 1;
        return il * 100; // Convertir a porcentaje
    }
    generateRecommendation(historicalAnalysis, impermanentLossEstimation) {
        const timeInRange = historicalAnalysis.timeInRangePercentage;
        const avgIL = (Math.abs(impermanentLossEstimation.scenarioUp.impermanentLoss) +
            Math.abs(impermanentLossEstimation.scenarioDown.impermanentLoss)) / 2;
        const feesNeeded = impermanentLossEstimation.feesNeededToCoverIL;
        const volatility = historicalAnalysis.averageVolatility;
        let recommendation;
        let confidence;
        let advice;
        if (timeInRange >= 80 && avgIL <= 2 && volatility <= 5) {
            recommendation = 'EXCELLENT';
            confidence = 90;
            advice = `Excelente rango! El precio ha estado en rango el ${timeInRange.toFixed(1)}% del tiempo. 
                El IL promedio es bajo (${avgIL.toFixed(1)}%) y la volatilidad es moderada. 
                Este rango es ideal para maximizar fees con bajo riesgo.`;
        }
        else if (timeInRange >= 70 && avgIL <= 4 && volatility <= 8) {
            recommendation = 'GOOD';
            confidence = 75;
            advice = `Buen rango. El precio ha estado en rango el ${timeInRange.toFixed(1)}% del tiempo. 
                El IL promedio es moderado (${avgIL.toFixed(1)}%) pero manejable. 
                Considera este rango si puedes generar suficientes fees.`;
        }
        else if (timeInRange >= 60 && avgIL <= 6 && volatility <= 12) {
            recommendation = 'MODERATE';
            confidence = 60;
            advice = `Rango moderado. El precio ha estado en rango el ${timeInRange.toFixed(1)}% del tiempo. 
                El IL promedio es ${avgIL.toFixed(1)}% y necesitarás generar al menos ${feesNeeded.toFixed(1)}% en fees. 
                Considera un rango más amplio si la volatilidad te preocupa.`;
        }
        else {
            recommendation = 'RISKY';
            confidence = 40;
            advice = `Rango arriesgado. El precio solo ha estado en rango el ${timeInRange.toFixed(1)}% del tiempo. 
                El IL promedio es alto (${avgIL.toFixed(1)}%) y la volatilidad es elevada (${volatility.toFixed(1)}%). 
                Recomendamos un rango más amplio o reconsiderar este par.`;
        }
        return { recommendation, confidence, advice };
    }
}
exports.LiquidityRangeAnalyzer = LiquidityRangeAnalyzer;
