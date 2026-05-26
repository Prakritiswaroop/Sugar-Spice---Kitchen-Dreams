import { DifficultyManager } from './difficulty.js?v=6';
import { OrderGenerator } from './order.js?v=6';
import { DishState, KitchenManager } from './kitchen.js?v=6';
import { sfx } from './audio.js?v=6';

export class GameManager {
    constructor() {
        this.difficulty = new DifficultyManager();
        this.orders = new OrderGenerator(this.difficulty);
        this.heldDish = new DishState();
        this.kitchen = new KitchenManager(this.difficulty);

        this.gameState = 'MENU'; // 'MENU' | 'PLAYING' | 'GAMEOVER'
        this.score = 0;
        this.hearts = 5;
        this.maxHearts = 5;
        this.cakesBaked = 0;
        
        // Shift time limit in seconds
        this.shiftDuration = 90; 
        this.shiftTimeLeft = 90;

        // Timing helpers
        this.lastTime = 0;
        this.spawnTimer = 0;

        this.onStateChange = null;
        this.onTick = null;
    }

    // Initialize/Start a new game session
    startNewGame() {
        this.difficulty.reset();
        this.orders.reset();
        this.heldDish.reset();
        this.kitchen.reset();

        this.score = 0;
        this.hearts = this.maxHearts;
        this.cakesBaked = 0;
        this.shiftTimeLeft = this.shiftDuration;
        
        this.gameState = 'PLAYING';
        this.lastTime = performance.now();
        
        // Spawn first order immediately upon game start so they never see an empty screen!
        const spawned = this.orders.spawnOrder();
        if (spawned) {
            this.heldDish.startRecipe(spawned.recipe);
        }
        
        // Reset spawn timer using DifficultyManager's scaling delay
        this.spawnTimer = this.difficulty.getOrderSpawnInterval();

        sfx.playClick();
        if (this.onStateChange) this.onStateChange(this.gameState);

        // Start game loop request
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    // The main game update loop
    gameLoop(currentTime) {
        if (this.gameState !== 'PLAYING') return;

        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap delta to prevent massive jumps
        this.lastTime = currentTime;

        // 1. Tick Shift Timer
        this.shiftTimeLeft -= deltaTime;
        if (this.shiftTimeLeft <= 0) {
            this.shiftTimeLeft = 0;
            this.finishShift(true); // Win/Finished
            return;
        }

        // 2. Tick Customer Orders patience
        const expiredOrders = this.orders.tick(deltaTime);
        if (expiredOrders.length > 0) {
            expiredOrders.forEach(() => {
                this.hearts--;
                sfx.playFailure();
            });

            if (this.hearts <= 0) {
                this.hearts = 0;
                this.finishShift(false); // Game Over (hearts depleted)
                return;
            }
        }

        // 3. Tick Spawn Timers
        this.spawnTimer -= deltaTime;
        if (this.spawnTimer <= 0) {
            const spawned = this.orders.spawnOrder();
            if (spawned) {
                sfx.playDing();
            }
            // Reset spawn timer using DifficultyManager's scaling delay
            this.spawnTimer = this.difficulty.getOrderSpawnInterval();
        }

        // Auto-assign first pending recipe if holding nothing
        if (!this.heldDish.recipe && this.orders.activeOrders.length > 0) {
            this.heldDish.startRecipe(this.orders.activeOrders[0].recipe);
        }

        // 4. Tick Kitchen Auto-Stations
        const stationChanged = this.kitchen.tick(deltaTime, this.heldDish);

        // 5. Trigger Callback for UI updates
        if (this.onTick) {
            this.onTick();
        }

        // Continue Loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    // Finish current shift (either time runs out or lives deplete)
    finishShift(isWin) {
        this.gameState = 'GAMEOVER';
        
        if (isWin) {
            sfx.playLevelUp();
        } else {
            sfx.playFailure();
        }

        if (this.onStateChange) this.onStateChange(this.gameState, isWin);
    }

    // Attempt to prepare a recipe by selecting it
    selectRecipe(recipe) {
        if (this.gameState !== 'PLAYING') return;
        this.heldDish.startRecipe(recipe);
        if (this.onTick) this.onTick();
    }

    // Whisk station tap
    tapWhisk() {
        if (this.gameState !== 'PLAYING') return;
        const complete = this.kitchen.tapWhisk(this.heldDish);
        if (this.onTick) this.onTick();
    }

    // Bake station interaction
    interactBake() {
        if (this.gameState !== 'PLAYING') return;
        
        if (this.kitchen.baking.active) {
            // Oven is running. Check if we can retrieve finished baked item
            if (this.kitchen.baking.isDone) {
                this.kitchen.retrieveBake(this.heldDish);
            }
        } else {
            // Oven is empty. Try to place the held dish inside
            this.kitchen.startBaking(this.heldDish);
        }
        if (this.onTick) this.onTick();
    }

    // Icing station interaction
    interactIcing() {
        if (this.gameState !== 'PLAYING') return;
        
        if (!this.kitchen.icing.active) {
            this.kitchen.startIcing(this.heldDish);
        }
        if (this.onTick) this.onTick();
    }

    // Trash currently held dish
    trashDish() {
        if (this.gameState !== 'PLAYING') return;
        
        if (this.heldDish.recipe) {
            this.heldDish.reset();
            sfx.playFailure();
            
            // Auto-assign next pending recipe
            if (this.orders.activeOrders.length > 0) {
                this.heldDish.startRecipe(this.orders.activeOrders[0].recipe);
            }
            
            if (this.onTick) this.onTick();
        }
    }

    // Serve completed dish to a customer order
    serveDish() {
        if (this.gameState !== 'PLAYING') return;
        if (!this.heldDish.isComplete) return;

        const result = this.orders.serveRecipe(this.heldDish);
        if (result) {
            // Score earned
            this.score += result.score;
            this.cakesBaked++;
            sfx.playSuccess();
            
            // Check for level ups and play alert
            const leveledUp = this.difficulty.update(this.score);
            if (leveledUp) {
                sfx.playLevelUp();
            }

            // Clear hand
            this.heldDish.reset();
            
            // Auto-assign next pending recipe
            if (this.orders.activeOrders.length > 0) {
                this.heldDish.startRecipe(this.orders.activeOrders[0].recipe);
            }
        } else {
            // No matching customer order! Discard with minor audio penalty
            sfx.playFailure();
        }

        if (this.onTick) this.onTick();
    }

    // Return to main menu
    returnToMenu() {
        this.gameState = 'MENU';
        sfx.playClick();
        if (this.onStateChange) this.onStateChange(this.gameState);
    }
}
