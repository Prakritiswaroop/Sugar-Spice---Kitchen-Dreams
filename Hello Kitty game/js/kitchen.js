import { sfx } from './audio.js?v=6';

// Represents the state of the dish currently held by the player
export class DishState {
    constructor(recipe = null) {
        this.recipe = recipe; // The target recipe object
        this.completedSteps = []; // List of steps completed so far, e.g. ["whisk", "bake"]
        this.isBurnt = false;
    }

    reset() {
        this.recipe = null;
        this.completedSteps = [];
        this.isBurnt = false;
    }

    startRecipe(recipe) {
        this.recipe = recipe;
        this.completedSteps = [];
        this.isBurnt = false;
        sfx.playClick();
    }

    // Returns whether the dish matches its target recipe fully
    get isComplete() {
        if (!this.recipe) return false;
        if (this.isBurnt) return false;
        
        // Check if all steps in the recipe have been completed in order
        if (this.completedSteps.length !== this.recipe.steps.length) return false;
        
        for (let i = 0; i < this.recipe.steps.length; i++) {
            if (this.completedSteps[i] !== this.recipe.steps[i]) return false;
        }
        return true;
    }

    // Get the next step required for this dish
    getNextRequiredStep() {
        if (!this.recipe || this.isBurnt) return null;
        const currentStepIdx = this.completedSteps.length;
        if (currentStepIdx < this.recipe.steps.length) {
            return this.recipe.steps[currentStepIdx];
        }
        return null; // Already completed all steps!
    }

    // Mark a step as completed
    completeStep(step) {
        if (!this.recipe || this.isBurnt) return;
        
        const nextStep = this.getNextRequiredStep();
        if (nextStep === step) {
            this.completedSteps.push(step);
            return true;
        }
        return false;
    }

    burn() {
        this.isBurnt = true;
        sfx.playFailure();
    }
}

// KitchenManager: Manages progress of all active stations
export class KitchenManager {
    constructor(difficultyManager) {
        this.difficulty = difficultyManager;
        
        // Individual station state models
        this.whisking = {
            active: false,
            progress: 0,
            tapIncrement: 12 // Requires ~8 taps to finish
        };
        
        this.baking = {
            active: false,
            progress: 0,
            bakingSpeed: 20, // 20% progress per second -> 5s total
            burnProgress: 0,
            isDone: false,
            isBurnt: false
        };
        
        this.icing = {
            active: false,
            progress: 0,
            decoratingSpeed: 25 // 25% progress per second -> 4s total
        };
    }

    reset() {
        this.whisking.active = false;
        this.whisking.progress = 0;

        this.baking.active = false;
        this.baking.progress = 0;
        this.baking.burnProgress = 0;
        this.baking.isDone = false;
        this.baking.isBurnt = false;

        this.icing.active = false;
        this.icing.progress = 0;
    }

    // Ticks automatic stations (Baking and Icing) over time
    tick(deltaTime, heldDish) {
        let stateChanged = false;

        // 1. Tick Baking
        if (this.baking.active) {
            if (!this.baking.isDone) {
                this.baking.progress += this.baking.bakingSpeed * deltaTime;
                if (this.baking.progress >= 100) {
                    this.baking.progress = 100;
                    this.baking.isDone = true;
                    sfx.playDing();
                    stateChanged = true;
                }
            } else if (!this.baking.isBurnt) {
                // If baking is finished, start the burn timer!
                const burnThreshold = this.difficulty.getBurnThreshold(); // Scales with level
                const burnSpeed = 100 / burnThreshold; // Fill burn bar in burnThreshold seconds
                
                this.baking.burnProgress += burnSpeed * deltaTime;
                
                // Sound warning when almost burnt
                if (this.baking.burnProgress > 75 && Math.random() < 0.05) {
                    sfx.playBurnAlert();
                }

                if (this.baking.burnProgress >= 100) {
                    this.baking.burnProgress = 100;
                    this.baking.isBurnt = true;
                    if (heldDish && heldDish.recipe && heldDish.getNextRequiredStep() === "bake") {
                        heldDish.burn();
                    }
                    stateChanged = true;
                }
            }
        }

        // 2. Tick Icing/Decorating
        if (this.icing.active) {
            this.icing.progress += this.icing.decoratingSpeed * deltaTime;
            if (this.icing.progress >= 100) {
                this.icing.progress = 100;
                this.icing.active = false;
                if (heldDish && heldDish.completeStep("decorate")) {
                    sfx.playSuccess();
                }
                stateChanged = true;
            }
        }

        return stateChanged;
    }

    // Whisking action (Tap to Mix)
    tapWhisk(heldDish) {
        if (!heldDish.recipe || heldDish.isBurnt) return false;
        if (heldDish.getNextRequiredStep() !== "whisk") return false;

        if (!this.whisking.active) {
            this.whisking.active = true;
            this.whisking.progress = 0;
        }

        this.whisking.progress += this.whisking.tapIncrement;
        sfx.playWhisk();

        if (this.whisking.progress >= 100) {
            this.whisking.progress = 100;
            this.whisking.active = false;
            heldDish.completeStep("whisk");
            sfx.playSuccess();
            return true; // Whisk complete
        }
        return false;
    }

    // Place in oven to bake
    startBaking(heldDish) {
        if (!heldDish.recipe || heldDish.isBurnt) return false;
        if (heldDish.getNextRequiredStep() !== "bake") return false;
        if (this.baking.active) return false; // Oven already in use

        this.baking.active = true;
        this.baking.progress = 0;
        this.baking.burnProgress = 0;
        this.baking.isDone = false;
        this.baking.isBurnt = false;
        sfx.playClick();
        return true;
    }

    // Remove from oven to inventory
    retrieveBake(heldDish) {
        if (!this.baking.active || !this.baking.isDone) return false;

        if (this.baking.isBurnt) {
            heldDish.burn();
        } else {
            heldDish.completeStep("bake");
            sfx.playSuccess();
        }

        // Reset oven
        this.baking.active = false;
        this.baking.progress = 0;
        this.baking.burnProgress = 0;
        this.baking.isDone = false;
        this.baking.isBurnt = false;
        return true;
    }

    // Start decorating
    startIcing(heldDish) {
        if (!heldDish.recipe || heldDish.isBurnt) return false;
        if (heldDish.getNextRequiredStep() !== "decorate") return false;
        if (this.icing.active) return false; // Icing counter in use

        this.icing.active = true;
        this.icing.progress = 0;
        sfx.playClick();
        return true;
    }
}
