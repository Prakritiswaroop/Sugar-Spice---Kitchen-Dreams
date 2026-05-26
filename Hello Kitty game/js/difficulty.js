// DifficultyManager: Calculates procedurally generated scaling variables
export class DifficultyManager {
    constructor() {
        this.reset();
    }

    reset() {
        this.level = 1;
        this.score = 0;
    }

    // Advance level based on score (e.g. 1000 Sugar Points per level)
    update(score) {
        this.score = score;
        const newLevel = Math.max(1, 1 + Math.floor(score / 1000));
        const leveledUp = newLevel > this.level;
        this.level = newLevel;
        return leveledUp;
    }

    // 1. Order spawn delay: decreases from 8.5s down to 2.8s
    getOrderSpawnInterval() {
        const tMax = 8.5;
        const tMin = 2.8;
        const alpha = 0.15;
        // Formula: tMin + (tMax - tMin) * e^(-alpha * (Level - 1))
        return tMin + (tMax - tMin) * Math.exp(-alpha * (this.level - 1));
    }

    // 2. Customer patience time limit: decreases from 28s down to 10s
    getCustomerPatience() {
        const pMax = 28.0;
        const pMin = 10.0;
        const beta = 0.08;
        // Formula: pMin + (pMax - pMin) * e^(-beta * (Level - 1))
        return pMin + (pMax - pMin) * Math.exp(-beta * (this.level - 1));
    }

    // 3. Baking burn threshold time window: decreases from 12s down to 4s
    getBurnThreshold() {
        const bMax = 12.0;
        const bMin = 4.0;
        const gamma = 0.10;
        // Formula: bMin + (bMax - bMin) * e^(-gamma * (Level - 1))
        return bMin + (bMax - bMin) * Math.exp(-gamma * (this.level - 1));
    }

    // 4. Maximum simultaneous active orders on screen (min 1, max 3 matching the UI slot count)
    getMaxSimultaneousOrders() {
        // Starts at 1, goes to 2 at level 3, and 3 at level 5
        return Math.min(3, 1 + Math.floor((this.level - 1) / 2));
    }

    // 5. Recipe pool size based on level
    getAvailableRecipes(allRecipes) {
        if (!allRecipes || allRecipes.length === 0) return [];
        // Level 1: Only 1-step recipes (e.g., Whisking or Baking only)
        // Level 2: Adds 2-step recipes (e.g., Whisking -> Baking)
        // Level 4: Adds 3-step recipes (Whisking -> Baking -> Icing)
        // Level 6+: Dynamic extra complex versions
        const filtered = allRecipes.filter(recipe => {
            if (this.level === 1) {
                return recipe.steps.length === 1;
            } else if (this.level === 2 || this.level === 3) {
                return recipe.steps.length <= 2;
            } else {
                return true; // All recipes available
            }
        });
        
        // Fallback: If filtered list is empty, return the entire recipe database to guarantee spawning!
        return filtered.length > 0 ? filtered : allRecipes;
    }

    // Returns a summary of current stats for debug/info panel
    getDifficultySummary() {
        return {
            level: this.level,
            spawnInterval: this.getOrderSpawnInterval().toFixed(1) + "s",
            patience: this.getCustomerPatience().toFixed(1) + "s",
            burnTime: this.getBurnThreshold().toFixed(1) + "s",
            maxOrders: this.getMaxSimultaneousOrders()
        };
    }
}
