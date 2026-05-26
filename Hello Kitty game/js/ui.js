import { RECIPES } from './order.js?v=6';
import { sfx } from './audio.js?v=6';

export class UIController {
    constructor(gameManager) {
        this.game = gameManager;

        // Cache DOM elements
        this.screenMenu = document.getElementById('screen-menu');
        this.screenPlay = document.getElementById('screen-play');
        this.screenOver = document.getElementById('screen-over');

        // Main Menu elements
        this.btnStartGame = document.getElementById('btn-start-game');
        this.btnLevelSelect = document.getElementById('btn-level-select');
        this.btnSettings = document.getElementById('btn-settings');
        
        // Gameplay elements
        this.pointsDisplay = document.getElementById('points-val');
        this.ordersContainer = document.getElementById('orders-list');
        this.whiskStation = document.getElementById('station-whisk');
        this.bakeStation = document.getElementById('station-bake');
        this.icingStation = document.getElementById('station-icing');
        this.trashStation = document.getElementById('station-trash');
        this.heldDishDisplay = document.getElementById('held-dish-card');
        this.heartsContainer = document.getElementById('hearts-list');
        this.timerDisplay = document.getElementById('timer-val');
        this.levelDisplay = document.getElementById('level-val');
        this.btnCookbook = document.getElementById('btn-cookbook');
        this.modalCookbook = document.getElementById('modal-cookbook');
        this.cookbookList = document.getElementById('cookbook-list');
        this.btnCloseCookbook = document.getElementById('close-cookbook');
        this.hudLightning = document.getElementById('hud-lightning');
        this.navBtnPrep = document.getElementById('nav-btn-prep');
        this.navBtnBake = document.getElementById('nav-btn-bake');
        this.navBtnDecor = document.getElementById('nav-btn-decor');
        this.navBtnServe = document.getElementById('nav-btn-serve');

        // Game Over elements
        this.overTitle = document.getElementById('over-title');
        this.overSubtitle = document.getElementById('over-subtitle');
        this.overStars = document.getElementById('over-stars');
        this.overCakesBaked = document.getElementById('over-cakes-val');
        this.overPointsVal = document.getElementById('over-points-val');
        this.btnBakeAgain = document.getElementById('btn-bake-again');
        this.btnMainMenu = document.getElementById('btn-main-menu');
        this.overQuote = document.getElementById('over-quote-bubble');

        this.initEvents();
    }

    initEvents() {
        // Menu Button clicks
        this.btnStartGame.addEventListener('click', () => this.game.startNewGame());
        this.btnLevelSelect.addEventListener('click', () => {
            sfx.playClick();
            alert("Level Select: Standard Campaign Mode or Procedural Endless Mode! Let's play Endless!");
        });
        this.btnSettings.addEventListener('click', () => {
            sfx.playClick();
            alert("Settings: Audio Enabled! Web Audio API Synthesizer is active.");
        });

        // Gameplay station clicks - Auto-open Cookbook if holding nothing
        this.whiskStation.addEventListener('click', () => {
            if (!this.game.heldDish.recipe) {
                this.toggleCookbook(true);
            } else {
                this.game.tapWhisk();
            }
        });
        
        this.bakeStation.addEventListener('click', () => {
            if (!this.game.heldDish.recipe) {
                this.toggleCookbook(true);
            } else {
                this.game.interactBake();
            }
        });
        
        this.icingStation.addEventListener('click', () => {
            if (!this.game.heldDish.recipe) {
                this.toggleCookbook(true);
            } else {
                this.game.interactIcing();
            }
        });
        
        this.trashStation.addEventListener('click', () => this.game.trashDish());
        
        // App Standalone Mode Cache-Buster force reload binders
        document.querySelectorAll('.btn-reload-app').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                sfx.playClick();
                // Forces hard reload bypassing browser service worker & app wrapper caches
                window.location.href = window.location.origin + window.location.pathname + '?r=' + Math.random();
            });
        });
        
        // Inventory clicks
        this.heldDishDisplay.addEventListener('click', () => {
            if (this.game.heldDish.isComplete) {
                this.game.serveDish();
            }
        });

        // Bottom navigation quick task buttons
        if (this.navBtnPrep) {
            this.navBtnPrep.addEventListener('click', () => {
                if (!this.game.heldDish.recipe) {
                    this.toggleCookbook(true);
                } else {
                    this.game.tapWhisk();
                }
            });
        }
        if (this.navBtnBake) {
            this.navBtnBake.addEventListener('click', () => {
                if (!this.game.heldDish.recipe) {
                    this.toggleCookbook(true);
                } else {
                    this.game.interactBake();
                }
            });
        }
        if (this.navBtnDecor) {
            this.navBtnDecor.addEventListener('click', () => {
                if (!this.game.heldDish.recipe) {
                    this.toggleCookbook(true);
                } else {
                    this.game.interactIcing();
                }
            });
        }
        if (this.navBtnServe) {
            this.navBtnServe.addEventListener('click', () => {
                if (this.game.heldDish.isComplete) {
                    this.game.serveDish();
                } else {
                    sfx.playFailure();
                    alert("Your hand is empty or your treat is not complete yet! Keep cooking!");
                }
            });
        }

        // Cookbook / central menu toggling
        this.btnCookbook.addEventListener('click', () => this.toggleCookbook(true));
        this.btnCloseCookbook.addEventListener('click', () => this.toggleCookbook(false));
        this.hudLightning.addEventListener('click', () => {
            sfx.playLevelUp();
            // Brief visual boost effect
            this.hudLightning.classList.add('pulse-active');
            setTimeout(() => this.hudLightning.classList.remove('pulse-active'), 500);
            
            // Instantly clear and whisk/bake current step as a booster!
            if (this.game.heldDish.recipe) {
                const nextStep = this.game.heldDish.getNextRequiredStep();
                if (nextStep === "whisk") {
                    this.game.kitchen.whisking.progress = 100;
                    this.game.heldDish.completeStep("whisk");
                    sfx.playSuccess();
                } else if (nextStep === "bake" && this.game.kitchen.baking.active && !this.game.kitchen.baking.isDone) {
                    this.game.kitchen.baking.progress = 100;
                    this.game.kitchen.baking.isDone = true;
                    sfx.playDing();
                } else if (nextStep === "decorate" && this.game.kitchen.icing.active && this.game.kitchen.icing.progress < 100) {
                    this.game.kitchen.icing.progress = 100;
                }
                this.updateHUD();
            }
        });

        // Game Over Button clicks
        this.btnBakeAgain.addEventListener('click', () => this.game.startNewGame());
        this.btnMainMenu.addEventListener('click', () => this.game.returnToMenu());

        // Connect state change from Game Manager
        this.game.onStateChange = (state, isWin) => this.handleStateChange(state, isWin);
        this.game.onTick = () => this.updateHUD();

        // Build the Cookbook modal items
        this.renderCookbook();
    }

    handleStateChange(state, isWin) {
        // Hide all screens
        this.screenMenu.style.display = 'none';
        this.screenPlay.style.display = 'none';
        this.screenOver.style.display = 'none';

        if (state === 'MENU') {
            this.screenMenu.style.display = 'flex';
        } else if (state === 'PLAYING') {
            this.screenPlay.style.display = 'flex';
            this.toggleCookbook(false);
            this.updateHUD();
        } else if (state === 'GAMEOVER') {
            this.screenOver.style.display = 'flex';
            this.renderGameOverScreen(isWin);
        }
    }

    toggleCookbook(show) {
        sfx.playClick();
        if (show) {
            this.modalCookbook.classList.add('active');
        } else {
            this.modalCookbook.classList.remove('active');
        }
    }

    renderCookbook() {
        this.cookbookList.innerHTML = '';
        RECIPES.forEach(recipe => {
            const card = document.createElement('div');
            card.className = `cookbook-card border-${recipe.color}`;
            
            // Format steps with bullet lines
            const stepsHtml = recipe.steps.map(step => {
                let badgeColor = 'pink';
                if (step === 'bake') badgeColor = 'teal';
                if (step === 'decorate') badgeColor = 'purple';
                return `<span class="step-badge-mini badge-${badgeColor}">${step.toUpperCase()}</span>`;
            }).join(' ➔ ');

            card.innerHTML = `
                <div class="recipe-icon-circle">${recipe.icon}</div>
                <div class="recipe-details">
                    <h4>${recipe.name}</h4>
                    <p class="recipe-desc">${recipe.description}</p>
                    <div class="recipe-steps-row">${stepsHtml}</div>
                </div>
                <button class="btn-select-recipe">PREP</button>
            `;

            // Prep button click
            card.querySelector('.btn-select-recipe').addEventListener('click', () => {
                this.game.selectRecipe(recipe);
                this.toggleCookbook(false);
            });

            this.cookbookList.appendChild(card);
        });
    }

    updateHUD() {
        // 1. Update points & timers
        this.pointsDisplay.textContent = this.game.score.toLocaleString();
        
        const minutes = Math.floor(this.game.shiftTimeLeft / 60);
        const seconds = Math.floor(this.game.shiftTimeLeft % 60);
        this.timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        
        this.levelDisplay.textContent = `LEVEL ${this.game.difficulty.level}`;

        // 2. Render lives (hearts outline / filled)
        this.heartsContainer.innerHTML = '';
        for (let i = 1; i <= this.game.maxHearts; i++) {
            const heart = document.createElement('span');
            heart.className = i <= this.game.hearts ? 'heart filled' : 'heart empty';
            heart.innerHTML = i <= this.game.hearts ? '♥' : '♡';
            this.heartsContainer.appendChild(heart);
        }

        // 3. Render Active Orders (Top Left)
        this.ordersContainer.innerHTML = '';
        this.game.orders.activeOrders.forEach(order => {
            const card = document.createElement('div');
            card.className = `order-card border-${order.recipe.color}`;
            
            const patienceRatio = order.patienceLeft / order.patienceMax;
            const patiencePct = Math.max(0, patienceRatio * 100);
            
            // Format steps labels with icons or shorthand
            const stepsHtml = order.recipe.steps.map(step => {
                let badgeClass = 'badge-pink';
                if (step === 'bake') badgeClass = 'badge-teal';
                if (step === 'decorate') badgeClass = 'badge-purple';
                return `<span class="step-badge-mini ${badgeClass}" style="padding: 2px 5px; font-size: 7px; border-radius: 6px;">${step.toUpperCase()}</span>`;
            }).join(' <span style="font-size:7px;color:#BDC3C7;margin:0 1px;">➔</span> ');

            card.innerHTML = `
                <div class="order-avatar-circle">
                    <span class="order-avatar-emoji">${order.recipe.icon}</span>
                </div>
                <div class="order-info">
                    <span class="order-name">${order.recipe.name}</span>
                    <div class="patience-track" style="margin-bottom: 5px;">
                        <div class="patience-fill bg-${order.recipe.color}" style="width: ${patiencePct}%"></div>
                    </div>
                    <div class="order-steps-dots" style="display: flex; align-items: center; gap: 1px; flex-wrap: wrap;">
                        ${stepsHtml}
                    </div>
                </div>
                <div class="order-heart-badge border-${order.recipe.color}">
                    <span>♥</span>
                </div>
            `;

            // Click active order card to instantly start prepped recipe or serve it if complete!
            card.addEventListener('click', () => {
                if (this.game.heldDish.recipe && this.game.heldDish.recipe.id === order.recipe.id) {
                    if (this.game.heldDish.isComplete) {
                        this.game.serveDish();
                    } else {
                        sfx.playClick();
                    }
                } else {
                    this.game.selectRecipe(order.recipe);
                }
            });

            this.ordersContainer.appendChild(card);
        });

        // 4. Update Kitchen Stations progress bars & status
        this.updateStationUI();

        // 5. Update Held Dish Inventory visual display
        this.updateHeldDishUI();
    }

    updateStationUI() {
        const kt = this.game.kitchen;

        // Whisking Station
        const whiskBar = this.whiskStation.querySelector('.station-progress-fill');
        const whiskText = this.whiskStation.querySelector('.station-status-text');
        
        if (kt.whisking.active) {
            whiskBar.style.width = `${kt.whisking.progress}%`;
            whiskText.textContent = `Mixing: ${Math.round(kt.whisking.progress)}%`;
            this.whiskStation.classList.add('station-active');
        } else {
            const nextStep = this.game.heldDish.getNextRequiredStep();
            if (nextStep === "whisk") {
                whiskBar.style.width = '0%';
                whiskText.textContent = "Tap to Mix!";
                this.whiskStation.classList.add('station-highlight');
                this.whiskStation.classList.remove('station-active');
            } else {
                whiskBar.style.width = '0%';
                whiskText.textContent = "Inactive";
                this.whiskStation.classList.remove('station-highlight', 'station-active');
            }
        }

        // Baking Station
        const bakeBar = this.bakeStation.querySelector('.station-progress-fill');
        const bakeText = this.bakeStation.querySelector('.station-status-text');
        
        if (kt.baking.active) {
            this.bakeStation.classList.add('station-active');
            if (!kt.baking.isDone) {
                bakeBar.style.width = `${kt.baking.progress}%`;
                bakeBar.className = "station-progress-fill bg-green";
                bakeText.textContent = `Baking: ${Math.round(kt.baking.progress)}%`;
            } else if (!kt.baking.isBurnt) {
                bakeBar.style.width = '100%';
                bakeBar.className = "station-progress-fill bg-green ready-pulse";
                bakeText.textContent = "READY! Tap to retrieve!";
            } else {
                bakeBar.style.width = '100%';
                bakeBar.className = "station-progress-fill bg-red burnt-shake";
                bakeText.textContent = "BURNT! Throw in Trash!";
            }
        } else {
            const nextStep = this.game.heldDish.getNextRequiredStep();
            if (nextStep === "bake") {
                bakeBar.style.width = '0%';
                bakeBar.className = "station-progress-fill bg-green";
                bakeText.textContent = "Ready to Bake!";
                this.bakeStation.classList.add('station-highlight');
                this.bakeStation.classList.remove('station-active');
            } else {
                bakeBar.style.width = '0%';
                bakeBar.className = "station-progress-fill bg-green";
                bakeText.textContent = "Smells Sweet!";
                this.bakeStation.classList.remove('station-highlight', 'station-active');
            }
        }

        // Icing Station
        const iceBar = this.icingStation.querySelector('.station-progress-fill');
        const iceText = this.icingStation.querySelector('.station-status-text');
        
        if (kt.icing.active) {
            this.icingStation.classList.add('station-active');
            iceBar.style.width = `${kt.icing.progress}%`;
            iceText.textContent = `Decorating: ${Math.round(kt.icing.progress)}%`;
        } else {
            const nextStep = this.game.heldDish.getNextRequiredStep();
            if (nextStep === "decorate") {
                iceBar.style.width = '0%';
                iceText.textContent = "Ready to Ice!";
                this.icingStation.classList.add('station-highlight');
                this.icingStation.classList.remove('station-active');
            } else {
                iceBar.style.width = '0%';
                iceText.textContent = "Be Creative!";
                this.icingStation.classList.remove('station-highlight', 'station-active');
            }
        }
    }

    updateHeldDishUI() {
        const dish = this.game.heldDish;
        
        if (!dish.recipe) {
            this.heldDishDisplay.className = "held-dish-capsule empty";
            this.heldDishDisplay.innerHTML = `
                <span class="held-icon">🍳</span>
                <div class="held-details">
                    <h5>EMPTY HANDS</h5>
                    <p>Select an active order or Cookbook to start</p>
                </div>
            `;
            return;
        }

        // Format step progress dots
        const stepsDots = dish.recipe.steps.map((step, idx) => {
            let dotClass = 'dot-todo';
            if (dish.completedSteps[idx] === step) {
                dotClass = `dot-done bg-${dish.recipe.color}`;
            }
            return `<span class="step-dot ${dotClass}" title="${step}"></span>`;
        }).join('');

        if (dish.isBurnt) {
            this.heldDishDisplay.className = "held-dish-capsule burnt-shake error-state";
            this.heldDishDisplay.innerHTML = `
                <span class="held-icon">🔥</span>
                <div class="held-details">
                    <h5>BURNT ${dish.recipe.name.toUpperCase()}</h5>
                    <p class="txt-red">Must be discarded in Trash!</p>
                </div>
            `;
        } else if (dish.isComplete) {
            this.heldDishDisplay.className = `held-dish-capsule success-pulse ready-border border-${dish.recipe.color}`;
            this.heldDishDisplay.innerHTML = `
                <span class="held-icon">${dish.recipe.icon}</span>
                <div class="held-details">
                    <h5>READY ${dish.recipe.name.toUpperCase()}!</h5>
                    <p class="txt-green">Tap here or on Order to Serve!</p>
                </div>
            `;
        } else {
            const nextStep = dish.getNextRequiredStep();
            this.heldDishDisplay.className = `held-dish-capsule active-border border-${dish.recipe.color}`;
            this.heldDishDisplay.innerHTML = `
                <span class="held-icon">${dish.recipe.icon}</span>
                <div class="held-details">
                    <h5>COOKING: ${dish.recipe.name.toUpperCase()}</h5>
                    <p>Next: <b class="capitalize text-accent">${nextStep}</b></p>
                    <div class="steps-progress-dots">${stepsDots}</div>
                </div>
            `;
        }
    }

    renderGameOverScreen(isWin) {
        // Final values
        this.overCakesBaked.textContent = this.game.cakesBaked;
        this.overPointsVal.textContent = this.game.score.toLocaleString();

        // Clear stars
        this.overStars.innerHTML = '';

        let earnedStars = 0;
        if (isWin) {
            this.overTitle.textContent = "Sweet Success!";
            this.overSubtitle.textContent = "• SHIFT FINISHED! •";
            this.overQuote.textContent = "“That was delicious! The kitchen is smelling so sweet!”";

            if (this.game.score >= 2500) {
                earnedStars = 3;
            } else if (this.game.score >= 1200) {
                earnedStars = 2;
            } else {
                earnedStars = 1;
            }
        } else {
            this.overTitle.textContent = "Shift Failed!";
            this.overSubtitle.textContent = "• KITCHEN CLOSED •";
            this.overQuote.textContent = "“Oh no, the kitchen is in a mess! Let's clean up and try again!”";
            earnedStars = 0;
        }

        // Render stars with precise layout matching Screen 3 (2 filled, 1 empty)
        for (let i = 1; i <= 3; i++) {
            const star = document.createElement('span');
            star.className = i <= earnedStars ? 'over-star filled-star' : 'over-star empty-star';
            star.innerHTML = i <= earnedStars ? '★' : '☆';
            this.overStars.appendChild(star);
        }
    }
}
