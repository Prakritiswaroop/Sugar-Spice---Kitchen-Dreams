// Recipes Database (At least 10 recipes)
export const RECIPES = [
    {
        id: "berry_cake",
        name: "Berry Cake",
        icon: "🍰",
        steps: ["whisk", "bake", "decorate"],
        description: "Garnished with fresh berries!",
        color: "pink"
    },
    {
        id: "choco_chip",
        name: "Choco Chip",
        icon: "🍪",
        steps: ["whisk", "bake"],
        description: "Full of chocolate chips!",
        color: "green"
    },
    {
        id: "space_donut",
        name: "Space Donut",
        icon: "🍩",
        steps: ["whisk", "decorate"],
        description: "Glazed cosmic donut!",
        color: "purple"
    },
    {
        id: "sweet_cupcake",
        name: "Sweet Cupcake",
        icon: "🧁",
        steps: ["bake", "decorate"],
        description: "Fluffy vanilla frosting!",
        color: "pink"
    },
    {
        id: "sugar_cookie",
        name: "Sugar Cookie",
        icon: "🥞",
        steps: ["whisk"],
        description: "Simple sweet cookie!",
        color: "green"
    },
    {
        id: "rainbow_roll",
        name: "Rainbow Roll",
        icon: "🍥",
        steps: ["whisk", "bake", "decorate"],
        description: "Colorful sponge roll!",
        color: "purple"
    },
    {
        id: "apple_tart",
        name: "Apple Tart",
        icon: "🥧",
        steps: ["bake", "decorate"],
        description: "Caramelized apples!",
        color: "pink"
    },
    {
        id: "choco_brownie",
        name: "Choco Brownie",
        icon: "🍫",
        steps: ["whisk", "bake"],
        description: "Fudgy and double choco!",
        color: "green"
    },
    {
        id: "honey_macaron",
        name: "Honey Macaron",
        icon: "🍬",
        steps: ["whisk", "decorate"],
        description: "Sandwiched sweet honey!",
        color: "purple"
    },
    {
        id: "strawberry_crepe",
        name: "Strawberry Crepe",
        icon: "🍓",
        steps: ["whisk", "decorate"],
        description: "Topped with strawberries!",
        color: "pink"
    },
    {
        id: "vanilla_scone",
        name: "Vanilla Scone",
        icon: "🍞",
        steps: ["bake"],
        description: "Baked to golden brown!",
        color: "green"
    }
];

// OrderGenerator class: handles customer order queue, spawning, and patience ticking
export class OrderGenerator {
    constructor(difficultyManager) {
        this.difficulty = difficultyManager;
        this.activeOrders = []; // Maximum 3 orders matching screen space
        this.orderIdCounter = 0;
    }

    reset() {
        this.activeOrders = [];
        this.orderIdCounter = 0;
    }

    // Attempt to spawn a new customer order
    spawnOrder() {
        const maxSimultaneous = this.difficulty.getMaxSimultaneousOrders();
        if (this.activeOrders.length >= maxSimultaneous) {
            return null; // Queue is full for current level
        }

        // Get available recipes for current difficulty level
        const available = this.difficulty.getAvailableRecipes(RECIPES);
        if (available.length === 0) return null;

        // Choose a random recipe
        const recipe = available[Math.floor(Math.random() * available.length)];
        
        // Determine customer patience based on level
        const maxPatience = this.difficulty.getCustomerPatience();
        
        const newOrder = {
            id: ++this.orderIdCounter,
            recipe: recipe,
            patienceMax: maxPatience,
            patienceLeft: maxPatience,
            createdAt: Date.now()
        };

        this.activeOrders.push(newOrder);
        return newOrder;
    }

    // Tick patience timers. Returns array of expired orders.
    tick(deltaTime) {
        const expired = [];
        this.activeOrders = this.activeOrders.filter(order => {
            order.patienceLeft -= deltaTime;
            if (order.patienceLeft <= 0) {
                expired.push(order);
                return false; // Remove from list
            }
            return true;
        });
        return expired;
    }

    // Attempt to serve a recipe. Returns matched score/bonus or null.
    serveRecipe(dishState) {
        // Find an active order matching this recipe structure and completeness
        const matchIndex = this.activeOrders.findIndex(order => {
            return order.recipe.id === dishState.recipe.id && dishState.isComplete;
        });

        if (matchIndex === -1) {
            return null; // No matching customer order
        }

        const matchedOrder = this.activeOrders[matchIndex];
        
        // Calculate scores: baseline is 100 points, with a bonus up to +100 based on remaining patience
        const patienceRatio = matchedOrder.patienceLeft / matchedOrder.patienceMax;
        const speedBonus = Math.round(patienceRatio * 100);
        const scoreEarned = 100 + speedBonus;

        // Remove order from active list
        this.activeOrders.splice(matchIndex, 1);

        return {
            score: scoreEarned,
            speedBonus: speedBonus,
            recipeName: matchedOrder.recipe.name
        };
    }
}
