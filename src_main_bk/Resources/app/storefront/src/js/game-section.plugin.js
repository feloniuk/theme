import Plugin from 'src/plugin-system/plugin.class';

export default class GameSectionPlugin extends Plugin {

    init() {
        // Error handler for debugging
        window.onerror = function(message, source, lineno, colno, error) {
            return false;
        };

        // Check containers - search within this.el (the plugin element)
        const featuredContainer = this.el.querySelector('#featured-games-container');
        const smallContainer = this.el.querySelector('#small-games-container');

        // DOM elements - search within this.el
        const filterTabs = this.el.querySelectorAll('.filter-tab');
        const searchInput = this.el.querySelector('.search-input');
        const showMoreButton = this.el.querySelector('.show-more-button');

        // Create "Show Less" button
        const showLessButton = document.createElement('button');
        showLessButton.className = 'show-less-button';
        showLessButton.textContent = 'Show Less';
        showLessButton.style.display = 'none';
        // Copy styles from showMoreButton
        showLessButton.style.cssText = getComputedStyle(showMoreButton).cssText;

        // Find container with showMoreButton and add showLessButton after it
        const buttonContainer = showMoreButton.parentElement;
        buttonContainer.insertBefore(showLessButton, showMoreButton.nextSibling);

        // Initialize button state
        showMoreButton.style.display = 'none';

        // Display counts
        let initialFeaturedCount = 10; // Initial featured games count
        let initialSmallCount = 15; // Initial small games count
        let displayedFeaturedCount = initialFeaturedCount; // Current featured games count
        let displayedSmallCount = initialSmallCount; // Current small games count
        let currentCategory = 'all';
        let currentSearchTerm = '';

        const gameData = JSON.parse(this.el.dataset.gameSectionOptions);

        // Set all games as visible initially
        gameData.forEach(game => {
            game.visible = true;
        });

        // Category filter handler
        filterTabs.forEach((tab, index) => {
            tab.addEventListener('click', function() {
                filterTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');

                switch (index) {
                    case 0:
                        currentCategory = 'all';
                        break;
                    case 1:
                        currentCategory = 'bestsellers';
                        break;
                    case 2:
                        currentCategory = 'sale';
                        break;
                }

                // Reset displayed game count when changing category
                displayedFeaturedCount = initialFeaturedCount;
                displayedSmallCount = initialSmallCount;

                // Hide "Show Less" when changing category
                showLessButton.style.display = 'none';
                applyFilters();
            });
        });

        // Search handler
        searchInput.addEventListener('input', function() {
            currentSearchTerm = this.value.toLowerCase().trim();
            applyFilters();
        });

        // Add CSS for animations
        addAnimationStyles();

        // "Show more" button handler
        showMoreButton.addEventListener('click', function() {
            // Get filtered games by current category
            const filteredGames = getFilteredGames();

            // Store current counts
            const currentFeaturedCount = displayedFeaturedCount;
            const currentSmallCount = displayedSmallCount;

            // Set values to show all games
            const totalFilteredFeatured = filteredGames.filter(game => game.featured).length;
            const totalFilteredSmall = filteredGames.filter(game => !game.featured).length;

            // Set values to show all games
            displayedFeaturedCount = totalFilteredFeatured;
            displayedSmallCount = totalFilteredSmall;

            // Apply filters and update display with animation
            // true means adding games (we only want to render the new ones)
            applyFilters(true);

            // Hide "Show More" and show "Show Less"
            this.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            this.style.opacity = '0';
            this.style.transform = 'translateY(10px)';

            setTimeout(() => {
                this.style.display = 'none';
                showLessButton.style.display = 'flex';
                showLessButton.style.opacity = '0';
                showLessButton.style.transform = 'translateY(10px)';

                setTimeout(() => {
                    showLessButton.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    showLessButton.style.opacity = '1';
                    showLessButton.style.transform = 'translateY(0)';
                }, 50);
            }, 300);
        });

        // "Show less" button handler
        showLessButton.addEventListener('click', function() {
            const targetSection = document.querySelector('.data-game-section');
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }

            // Remember current count for animation
            const currentFeaturedCount = displayedFeaturedCount;
            const currentSmallCount = displayedSmallCount;

            // Get lists of all visible games for subsequent animation
            const visibleGames = gameData.filter(game => game.visible);
            const visibleFeaturedGames = visibleGames.filter(game => game.featured);
            const visibleSmallGames = visibleGames.filter(game => !game.featured);

            // Animate hiding "extra" games
            animateHideExcessGames(visibleFeaturedGames, visibleSmallGames);

            // Reset displayed game counts to initial values
            displayedFeaturedCount = initialFeaturedCount;
            displayedSmallCount = initialSmallCount;

            // Hide "Show Less" with animation
            this.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            this.style.opacity = '0';
            this.style.transform = 'translateY(10px)';

            // Delayed filter application after animation
            setTimeout(() => {
                // Apply filters and update display
                applyFilters(false); // false means hiding games

                this.style.display = 'none';
                showMoreButton.style.display = 'flex';
                showMoreButton.style.opacity = '0';
                showMoreButton.style.transform = 'translateY(10px)';

                setTimeout(() => {
                    showMoreButton.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    showMoreButton.style.opacity = '1';
                    showMoreButton.style.transform = 'translateY(0)';
                }, 50);
            }, 700); // Increased delay for smoother transition
        });

        // Function to animate hiding excess games
        function animateHideExcessGames(featuredGames, smallGames) {
            // Animate disappearance for featured games to be hidden
            if (featuredGames.length > initialFeaturedCount) {
                const featuredToHide = featuredContainer.querySelectorAll('.game-card.featured');
                // Hide games starting from initialFeaturedCount to end with cascade delay
                for (let i = initialFeaturedCount; i < featuredToHide.length; i++) {
                    if (featuredToHide[i]) {
                        // Add small delay for each card for cascade effect
                        const delay = (i - initialFeaturedCount) * 50;
                        setTimeout(() => {
                            featuredToHide[i].classList.add('game-card-hiding');
                        }, delay);
                    }
                }
            }

            // Animate disappearance for small games to be hidden
            if (smallGames.length > initialSmallCount) {
                const smallToHide = smallContainer.querySelectorAll('.game-card.small');
                // Hide games starting from initialSmallCount to end with cascade delay
                for (let i = initialSmallCount; i < smallToHide.length; i++) {
                    if (smallToHide[i]) {
                        // Add small delay for each card for cascade effect
                        const delay = (i - initialSmallCount) * 30;
                        setTimeout(() => {
                            smallToHide[i].classList.add('game-card-hiding');
                        }, delay);
                    }
                }
            }
        }

        // Function to get filtered games
        function getFilteredGames() {
            return gameData.filter(game => {
                if (currentCategory !== 'all') {
                    if (currentCategory === 'bestsellers' && !game.isBestseller) {
                        return false;
                    } else if (currentCategory === 'sale' && !game.isOnSale) {
                        return false;
                    }
                }
                if (currentSearchTerm && !game.name.toLowerCase().includes(currentSearchTerm)) {
                    return false;
                }
                return true;
            });
        }

        // Function to limit visible games
        function limitVisibleGames() {
            let featuredCount = 0;
            let smallCount = 0;

            // First apply category filters
            gameData.forEach(game => {
                // Check if game matches current category filters
                if (currentCategory !== 'all') {
                    if (currentCategory === 'bestsellers' && !game.isBestseller) {
                        game.visible = false;
                        return;
                    } else if (currentCategory === 'sale' && !game.isOnSale) {
                        game.visible = false;
                        return;
                    }
                }

                // If game matches category, limit by type and count
                if (game.featured) {
                    // For featured games
                    if (featuredCount < displayedFeaturedCount) {
                        game.visible = true;
                        featuredCount++;
                    } else {
                        game.visible = false;
                    }
                } else {
                    // For small games
                    if (smallCount < displayedSmallCount) {
                        game.visible = true;
                        smallCount++;
                    } else {
                        game.visible = false;
                    }
                }
            });
        }

        // Reset visibility of all games
        function resetVisibility() {
            gameData.forEach(game => {
                game.visible = true;
            });
        }

        // Function to apply filters
        function applyFilters(isAddingGames = false) {
            // Store previously visible games for comparison
            const prevVisibleGames = gameData.filter(game => game.visible);
            const prevFeaturedCount = prevVisibleGames.filter(game => game.featured).length;
            const prevSmallCount = prevVisibleGames.filter(game => !game.featured).length;

            resetVisibility();

            // Apply category filters
            if (currentCategory !== 'all') {
                gameData.forEach(game => {
                    if (currentCategory === 'bestsellers' && !game.isBestseller) {
                        game.visible = false;
                    } else if (currentCategory === 'sale' && !game.isOnSale) {
                        game.visible = false;
                    }
                });
            }

            // Apply search
            if (currentSearchTerm) {
                gameData.forEach(game => {
                    if (!game.name.toLowerCase().includes(currentSearchTerm)) {
                        game.visible = false;
                    }
                });
            }

            // Limit visible games if no search
            if (!currentSearchTerm) {
                limitVisibleGames();
            }

            // Get current visible games after applying filters
            const visibleGames = gameData.filter(game => game.visible);

            if (isAddingGames) {
                // When adding games, only render the newly visible games
                renderNewGames(visibleGames, prevVisibleGames);
            } else {
                // When not adding games (initial load or category change), clear and render all
                featuredContainer.innerHTML = '';
                smallContainer.innerHTML = '';
                renderGames(false);
            }
        }

        // Function to render games
        function renderGames(isAddingGames = false) {
            // Get visible games
            const visibleGames = gameData.filter(game => game.visible);
            const featuredGames = visibleGames.filter(game => game.featured);
            const smallGames = visibleGames.filter(game => !game.featured);

            // Create row for featured games
            const featuredRow = document.createElement('div');
            featuredRow.className = 'featured-games-row';
            featuredContainer.appendChild(featuredRow);

            // Create row for small games
            const smallRow = document.createElement('div');
            smallRow.className = 'small-games-row';
            smallContainer.appendChild(smallRow);

            // Render featured games
            featuredGames.forEach(game => {
                const card = createFeaturedGameCard(game);
                // Only animate if explicitly adding games
                if (isAddingGames) {
                    card.classList.add('game-card-appearing');
                    setTimeout(() => {
                        card.classList.remove('game-card-appearing');
                    }, 1200); // Adjusted to match animation duration
                }
                featuredRow.appendChild(card);
            });

            // Render small games
            smallGames.forEach(game => {
                const card = createSmallGameCard(game);
                // Only animate if explicitly adding games
                if (isAddingGames) {
                    card.classList.add('game-card-appearing');
                    setTimeout(() => {
                        card.classList.remove('game-card-appearing');
                    }, 1200); // Adjusted to match animation duration
                }
                smallRow.appendChild(card);
            });

            // Show/hide "Show more" and "Show less" buttons
            updateButtonVisibility(featuredGames, smallGames);
        }

        // Function to render only new games (for Show More)
        function renderNewGames(currentVisibleGames, previousVisibleGames) {
            // Find games that are newly visible
            const previousIds = previousVisibleGames.map(game => game.id || game.name);

            // Get newly visible featured and small games
            const newFeaturedGames = currentVisibleGames
                .filter(game => game.featured && !previousIds.includes(game.id || game.name));

            const newSmallGames = currentVisibleGames
                .filter(game => !game.featured && !previousIds.includes(game.id || game.name));

            // Use existing rows if they exist, or create new ones
            let featuredRow;
            if (featuredContainer.querySelector('.featured-games-row')) {
                featuredRow = featuredContainer.querySelector('.featured-games-row');
            } else {
                featuredRow = document.createElement('div');
                featuredRow.className = 'featured-games-row';
                featuredContainer.appendChild(featuredRow);
            }

            let smallRow;
            if (smallContainer.querySelector('.small-games-row')) {
                smallRow = smallContainer.querySelector('.small-games-row');
            } else {
                smallRow = document.createElement('div');
                smallRow.className = 'small-games-row';
                smallContainer.appendChild(smallRow);
            }

            // Render only the new games with animation
            newFeaturedGames.forEach((game, index) => {
                const card = createFeaturedGameCard(game);
                card.classList.add('game-card-appearing');

                // Remove class after animation completes
                setTimeout(() => {
                    card.classList.remove('game-card-appearing');
                }, 1200); // Adjusted to match animation duration

                featuredRow.appendChild(card);
            });

            newSmallGames.forEach((game, index) => {
                const card = createSmallGameCard(game);
                card.classList.add('game-card-appearing');

                // Remove class after animation completes
                setTimeout(() => {
                    card.classList.remove('game-card-appearing');
                }, 1200); // Adjusted to match animation duration

                smallRow.appendChild(card);
            });

            // Update button visibility
            updateButtonVisibility(
                currentVisibleGames.filter(game => game.featured),
                currentVisibleGames.filter(game => !game.featured)
            );
        }

        // Update button visibility
        function updateButtonVisibility(visibleFeaturedGames, visibleSmallGames) {
            const filteredGames = getFilteredGames();
            const filteredFeaturedGames = filteredGames.filter(game => game.featured);
            const filteredSmallGames = filteredGames.filter(game => !game.featured);

            // Logic for Show More / Show Less buttons
            if (!currentSearchTerm) {
                // If displaying initial game count and there are more games to show
                if ((displayedFeaturedCount <= initialFeaturedCount &&
                    displayedSmallCount <= initialSmallCount) &&
                    (visibleFeaturedGames.length < filteredFeaturedGames.length ||
                        visibleSmallGames.length < filteredSmallGames.length)) {

                    showMoreButton.style.display = 'flex';
                    showLessButton.style.display = 'none';
                }
                // If all games are shown
                else if (visibleFeaturedGames.length >= filteredFeaturedGames.length &&
                    visibleSmallGames.length >= filteredSmallGames.length) {

                    showMoreButton.style.display = 'none';

                    // Show "Show Less" only if displaying more than initial count
                    if (displayedFeaturedCount > initialFeaturedCount ||
                        displayedSmallCount > initialSmallCount) {
                        showLessButton.style.display = 'flex';
                    } else {
                        showLessButton.style.display = 'none';
                    }
                }
                // If displaying more than initial, but not all
                else if ((displayedFeaturedCount > initialFeaturedCount ||
                    displayedSmallCount > initialSmallCount) &&
                    (visibleFeaturedGames.length < filteredFeaturedGames.length ||
                        visibleSmallGames.length < filteredSmallGames.length)) {

                    showMoreButton.style.display = 'flex';
                    showLessButton.style.display = 'flex';
                }
            } else {
                // Hide both buttons during search
                showMoreButton.style.display = 'none';
                showLessButton.style.display = 'none';
            }
        }

        // Function to add animation styles
        function addAnimationStyles() {
            const styleElement = document.createElement('style');
            styleElement.textContent = `
                /* Base styles for card animation */
                .game-card {
                    transition: all 0.8s cubic-bezier(0.25, 0.1, 0.25, 1);
                    opacity: 1;
                    transform: translateY(0);
                    will-change: opacity, transform;
                    position: relative;
                }

                /* Card appearance animation - smoother without bouncing */
                .game-card-appearing {
                    opacity: 0;
                    transform: translateY(30px);
                    animation: fadeInUp 1s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
                    animation-fill-mode: both;
                    pointer-events: none;
                }

                /* Card disappearance animation */
                .game-card-hiding {
                    opacity: 1;
                    transform: translateY(0);
                    animation: fadeOutDown 0.7s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
                    pointer-events: none;
                }

                /* Delay for cascade animation - smooth sequence */
                .featured-games-row .game-card:nth-child(1) { animation-delay: 0.05s; }
                .featured-games-row .game-card:nth-child(2) { animation-delay: 0.1s; }
                .featured-games-row .game-card:nth-child(3) { animation-delay: 0.15s; }
                .featured-games-row .game-card:nth-child(4) { animation-delay: 0.2s; }
                .featured-games-row .game-card:nth-child(5) { animation-delay: 0.25s; }
                .featured-games-row .game-card:nth-child(6) { animation-delay: 0.3s; }
                .featured-games-row .game-card:nth-child(7) { animation-delay: 0.35s; }
                .featured-games-row .game-card:nth-child(8) { animation-delay: 0.4s; }
                .featured-games-row .game-card:nth-child(9) { animation-delay: 0.45s; }
                .featured-games-row .game-card:nth-child(10) { animation-delay: 0.5s; }

                .small-games-row .game-card:nth-child(1) { animation-delay: 0.1s; }
                .small-games-row .game-card:nth-child(2) { animation-delay: 0.15s; }
                .small-games-row .game-card:nth-child(3) { animation-delay: 0.2s; }
                .small-games-row .game-card:nth-child(4) { animation-delay: 0.25s; }
                .small-games-row .game-card:nth-child(5) { animation-delay: 0.3s; }
                .small-games-row .game-card:nth-child(6) { animation-delay: 0.35s; }
                .small-games-row .game-card:nth-child(7) { animation-delay: 0.4s; }
                .small-games-row .game-card:nth-child(8) { animation-delay: 0.45s; }
                .small-games-row .game-card:nth-child(9) { animation-delay: 0.5s; }
                .small-games-row .game-card:nth-child(10) { animation-delay: 0.55s; }

                /* Keyframes for appearance - smooth, no bounce */
                @keyframes fadeInUp {
                    0% {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                /* Keyframes for disappearance - smooth exit */
                @keyframes fadeOutDown {
                    0% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                    100% {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                }
            `;
            document.head.appendChild(styleElement);
        }

        // Create featured game card
        function createFeaturedGameCard(game) {
            try {
                const card = document.createElement('div');
                card.className = 'game-card featured';
                card.setAttribute('data-game-id', game.id || game.name); // Add unique identifier

                let html = `<div class="game-image">
                    <div class="game-image-background" style="background-image: url('${game.background}');"></div>`;

                if (game.isOnSale) {
                    html += `<div class="game-badge">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="0.75" width="24" height="24" rx="6" fill="#F4BF2A"/>
                                    <path d="M8.878 18C8.63267 17.8293 8.51 17.6 8.51 17.312C8.51 17.1093 8.574 16.912 8.702 16.72L15.422 6.976C15.6033 6.69867 15.854 6.56 16.174 6.56C16.366 6.56 16.558 6.608 16.75 6.704C17.102 6.896 17.278 7.136 17.278 7.424C17.278 7.584 17.2193 7.75467 17.102 7.936L10.318 17.776C10.222 17.904 10.1047 18.0053 9.966 18.08C9.82733 18.1653 9.678 18.208 9.518 18.208C9.30467 18.208 9.09133 18.1387 8.878 18ZM10.142 11.728C9.64067 11.728 9.17667 11.616 8.75 11.392C8.334 11.1573 8.00333 10.8427 7.758 10.448C7.51267 10.0533 7.39 9.62667 7.39 9.168C7.39 8.69867 7.51267 8.272 7.758 7.888C8.00333 7.49333 8.334 7.184 8.75 6.96C9.17667 6.72533 9.64067 6.608 10.142 6.608C10.6433 6.608 11.102 6.72 11.518 6.944C11.934 7.168 12.2647 7.47733 12.51 7.872C12.7553 8.26667 12.878 8.69867 12.878 9.168C12.878 9.63733 12.7553 10.0693 12.51 10.464C12.2647 10.848 11.9287 11.1573 11.502 11.392C11.086 11.616 10.6327 11.728 10.142 11.728ZM10.142 10.192C10.43 10.192 10.654 10.1013 10.814 9.92C10.9847 9.73867 11.07 9.488 11.07 9.168C11.07 8.83733 10.9847 8.58133 10.814 8.4C10.654 8.21867 10.43 8.128 10.142 8.128C9.84333 8.128 9.60867 8.21867 9.438 8.4C9.26733 8.58133 9.182 8.83733 9.182 9.168C9.182 9.488 9.26733 9.73867 9.438 9.92C9.60867 10.1013 9.84333 10.192 10.142 10.192ZM15.614 18.16C15.1127 18.16 14.6487 18.048 14.222 17.824C13.806 17.5893 13.4753 17.2747 13.23 16.88C12.9847 16.4853 12.862 16.0587 12.862 15.6C12.862 15.1307 12.9847 14.704 13.23 14.32C13.4753 13.9253 13.806 13.616 14.222 13.392C14.6487 13.1573 15.1127 13.04 15.614 13.04C16.1153 13.04 16.574 13.152 16.99 13.376C17.406 13.6 17.7367 13.9093 17.982 14.304C18.2273 14.6987 18.35 15.1307 18.35 15.6C18.35 16.0693 18.2273 16.5013 17.982 16.896C17.7367 17.28 17.4007 17.5893 16.974 17.824C16.558 18.048 16.1047 18.16 15.614 18.16ZM15.614 16.624C15.902 16.624 16.126 16.5333 16.286 16.352C16.4567 16.1707 16.542 15.92 16.542 15.6C16.542 15.2693 16.4567 15.0133 16.286 14.832C16.126 14.6507 15.902 14.56 15.614 14.56C15.3153 14.56 15.0807 14.6507 14.91 14.832C14.7393 15.0133 14.654 15.2693 14.654 15.6C14.654 15.92 14.7393 16.1707 14.91 16.352C15.0807 16.5333 15.3153 16.624 15.614 16.624Z" fill="#1D2030"/>
                                </svg>
                            </div>`;
                }

                html += `
                    <div class="game-info">
                        <div class="game-logo-new">
                            <img src="${game.logo}" alt="${game.name}">
                        </div>
                        <div class="game-titles">
                        <span class="game-title">${game.name}</span>`;

                if (game.subtitle) {
                    html += `<span class="game-subtitle">${game.subtitle}</span>`;
                }

                html += `</div>
                    </div>`;

                card.innerHTML = html;

                // Add handler for game page navigation
                card.addEventListener('click', () => {
                    window.location.href = game.url;
                });

                return card;
            } catch (e) {
                return document.createElement('div');
            }
        }

        // Create small game card
        function createSmallGameCard(game) {
            try {
                const card = document.createElement('div');
                card.className = 'game-card small';
                card.setAttribute('data-game-id', game.id || game.name); // Add unique identifier

                const nameLength = game.name?.length || 0;
                const dynamicMaxWidth = nameLength > 20 ? '80%' : '100%';
                const titleStyle = `white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: ${dynamicMaxWidth}; display: block;`;

                let html = `<div class="small-div"><div class="game-icon-container">
                    <div class="game-icon">
                        <img src="${game.icon}" alt="${game.name}">
                    </div>
                </div>
                <span class="game-title" style="${titleStyle}">${game.name}</span></div>`;

                html += `<div>`;
                if (game.isOnSale) {
                    html += `
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="0.75" width="24" height="24" rx="6" fill="#F4BF2A"/>
                            <path d="M8.878 18C8.63267 17.8293 8.51 17.6 8.51 17.312C8.51 17.1093 8.574 16.912 8.702 16.72L15.422 6.976C15.6033 6.69867 15.854 6.56 16.174 6.56C16.366 6.56 16.558 6.608 16.75 6.704C17.102 6.896 17.278 7.136 17.278 7.424C17.278 7.584 17.2193 7.75467 17.102 7.936L10.318 17.776C10.222 17.904 10.1047 18.0053 9.966 18.08C9.82733 18.1653 9.678 18.208 9.518 18.208C9.30467 18.208 9.09133 18.1387 8.878 18ZM10.142 11.728C9.64067 11.728 9.17667 11.616 8.75 11.392C8.334 11.1573 8.00333 10.8427 7.758 10.448C7.51267 10.0533 7.39 9.62667 7.39 9.168C7.39 8.69867 7.51267 8.272 7.758 7.888C8.00333 7.49333 8.334 7.184 8.75 6.96C9.17667 6.72533 9.64067 6.608 10.142 6.608C10.6433 6.608 11.102 6.72 11.518 6.944C11.934 7.168 12.2647 7.47733 12.51 7.872C12.7553 8.26667 12.878 8.69867 12.878 9.168C12.878 9.63733 12.7553 10.0693 12.51 10.464C12.2647 10.848 11.9287 11.1573 11.502 11.392C11.086 11.616 10.6327 11.728 10.142 11.728ZM10.142 10.192C10.43 10.192 10.654 10.1013 10.814 9.92C10.9847 9.73867 11.07 9.488 11.07 9.168C11.07 8.83733 10.9847 8.58133 10.814 8.4C10.654 8.21867 10.43 8.128 10.142 8.128C9.84333 8.128 9.60867 8.21867 9.438 8.4C9.26733 8.58133 9.182 8.83733 9.182 9.168C9.182 9.488 9.26733 9.73867 9.438 9.92C9.60867 10.1013 9.84333 10.192 10.142 10.192ZM15.614 18.16C15.1127 18.16 14.6487 18.048 14.222 17.824C13.806 17.5893 13.4753 17.2747 13.23 16.88C12.9847 16.4853 12.862 16.0587 12.862 15.6C12.862 15.1307 12.9847 14.704 13.23 14.32C13.4753 13.9253 13.806 13.616 14.222 13.392C14.6487 13.1573 15.1127 13.04 15.614 13.04C16.1153 13.04 16.574 13.152 16.99 13.376C17.406 13.6 17.7367 13.9093 17.982 14.304C18.2273 14.6987 18.35 15.1307 18.35 15.6C18.35 16.0693 18.2273 16.5013 17.982 16.896C17.7367 17.28 17.4007 17.5893 16.974 17.824C16.558 18.048 16.1047 18.16 15.614 18.16ZM15.614 16.624C15.902 16.624 16.126 16.5333 16.286 16.352C16.4567 16.1707 16.542 15.92 16.542 15.6C16.542 15.2693 16.4567 15.0133 16.286 14.832C16.126 14.6507 15.902 14.56 15.614 14.56C15.3153 14.56 15.0807 14.6507 14.91 14.832C14.7393 15.0133 14.654 15.2693 14.654 15.6C14.654 15.92 14.7393 16.1707 14.91 16.352C15.0807 16.5333 15.3153 16.624 15.614 16.624Z" fill="#1D2030"/>
                        </svg>`;
                }
                html += `</div>`;

                card.innerHTML = html;

                // Add handler for game page navigation
                card.addEventListener('click', () => {
                    window.location.href = game.url;
                });

                return card;
            } catch (e) {
                return document.createElement('div');
            }
        }

        // Helper function to split array into chunks
        function chunkArray(array, chunkSize) {
            const chunks = [];
            for (let i = 0; i < array.length; i += chunkSize) {
                chunks.push(array.slice(i, i + chunkSize));
            }
            return chunks;
        }

        // Force limit and render on page load
        limitVisibleGames();
        renderGames();

        // Set timer for retry after a second
        setTimeout(() => {
            applyFilters(); // Use applyFilters instead of just renderGames
        }, 1000);

        // Simulate clicking "All Games" button after half a second
        setTimeout(() => {
            // Simulate clicking "All Games" tab - search within this.el
            const allGamesTab = this.el.querySelector('.filter-tab');
            if (allGamesTab) {
                allGamesTab.click();
            }
        }, 500);

        // Search within this.el
        const searchContainer = this.el.querySelector('.search-input-container');
        if (searchContainer) {
            // Create glow element that follows cursor
            const glowElement = document.createElement('div');
            glowElement.className = 'glow-effect';
            searchContainer.appendChild(glowElement);

            // Automatic glow movement when cursor is outside element
            let autoAnimationActive = true;
            let autoX = 0;
            let autoY = 0;
            let autoAngle = 0;
            let containerRect = searchContainer.getBoundingClientRect();

            // Cursor movement handler inside container
            searchContainer.addEventListener('mousemove', function(e) {
                autoAnimationActive = false;
                containerRect = searchContainer.getBoundingClientRect();

                // Cursor position relative to container
                const x = e.clientX - containerRect.left;
                const y = e.clientY - containerRect.top;

                updateGlowPosition(x, y);
            });

            // When cursor leaves container, enable automatic animation
            searchContainer.addEventListener('mouseleave', function() {
                autoAnimationActive = true;
                // Save last position for smooth transition
                autoX = parseFloat(glowElement.style.left) || containerRect.width / 2;
                autoY = parseFloat(glowElement.style.top) || containerRect.height / 2;
            });

            // Function to update glow position
            function updateGlowPosition(x, y) {
                glowElement.style.left = `${x}px`;
                glowElement.style.top = `${y}px`;
            }

            // Animation cycle for automatic glow movement
            function animateGlow() {
                if (autoAnimationActive) {
                    // Get current container dimensions
                    containerRect = searchContainer.getBoundingClientRect();

                    // Smooth circular movement effect
                    autoAngle += 0.01;
                    const radiusX = containerRect.width * 0.3;
                    const radiusY = containerRect.height * 0.3;

                    autoX = containerRect.width / 2 + Math.cos(autoAngle) * radiusX;
                    autoY = containerRect.height / 2 + Math.sin(autoAngle) * radiusY;

                    updateGlowPosition(autoX, autoY);
                }

                requestAnimationFrame(animateGlow);
            }

            // Start animation
            animateGlow();
        }
    }
}
