import Plugin from 'src/plugin-system/plugin.class';

export default class HeroSectionPlugin extends Plugin {

    init() {
        
        const searchContainer = document.querySelector('.search-input-container');
  
        // Создаем элемент для свечения, который будет следовать за курсором
        const glowElement = document.createElement('div');
        glowElement.className = 'glow-effect';
        searchContainer.appendChild(glowElement);
        
        // Автоматическое движение свечения, когда курсор вне элемента
        let autoAnimationActive = true;
        let autoX = 0;
        let autoY = 0;
        let autoAngle = 0;
        let containerRect = searchContainer.getBoundingClientRect();
        
        // Обработчик движения курсора внутри контейнера
        searchContainer.addEventListener('mousemove', function(e) {
            autoAnimationActive = false;
            containerRect = searchContainer.getBoundingClientRect();
            
            // Позиция курсора относительно контейнера
            const x = e.clientX - containerRect.left;
            const y = e.clientY - containerRect.top;
            
            updateGlowPosition(x, y);
        });
        
        // Когда курсор покидает контейнер, включаем автоматическую анимацию
        searchContainer.addEventListener('mouseleave', function() {
            autoAnimationActive = true;
            // Сохраняем последнюю позицию для плавного перехода
            autoX = parseFloat(glowElement.style.left) || containerRect.width / 2;
            autoY = parseFloat(glowElement.style.top) || containerRect.height / 2;
        });
        
        // Функция обновления позиции свечения
        function updateGlowPosition(x, y) {
            glowElement.style.left = `${x}px`;
            glowElement.style.top = `${y}px`;
        }
        
        // Анимационный цикл для автоматического движения свечения
        function animateGlow() {
            if (autoAnimationActive) {
            // Получаем актуальные размеры контейнера
            containerRect = searchContainer.getBoundingClientRect();
            
            // Эффект плавного кругового движения
            autoAngle += 0.01;
            const radiusX = containerRect.width * 0.3;
            const radiusY = containerRect.height * 0.3;
            
            autoX = containerRect.width / 2 + Math.cos(autoAngle) * radiusX;
            autoY = containerRect.height / 2 + Math.sin(autoAngle) * radiusY;
            
            updateGlowPosition(autoX, autoY);
            }
            
            requestAnimationFrame(animateGlow);
        }
        
        // Запускаем анимацию
        animateGlow();

        // Handle search input submission
        const searchInput = document.querySelector('.search-main-input');
        const searchButton = document.querySelector('.search-button');
        
        if (searchInput && searchButton) {
            // Handle search button click
            searchButton.addEventListener('click', function() {
            const message = searchInput.value.trim();
            if (message !== "") {
                sendToIntercom(message);
            }
            });
            
            // Handle Enter key press in the input field
            searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const message = searchInput.value.trim();
                if (message !== "") {
                sendToIntercom(message);
                }
            }
            });
        }
        
        // Handle suggestion clicks
        const suggestions = document.querySelectorAll('.suggestion');
        
        suggestions.forEach(suggestion => {
            suggestion.addEventListener('click', function() {
            const message = this.textContent.trim();
            sendToIntercom(message);
            
            // Optionally, update the search input with the selected suggestion
            // if (searchInput) {
            //     searchInput.value = message;
            // }
            });
        });
        
        // Function to send messages to Intercom
        function sendToIntercom(message) {
            if (typeof Intercom !== 'undefined') {
            Intercom('trackEvent', 'opened_from_input');
            Intercom('showNewMessage', message);
            } else {
            console.warn('Intercom is not available');
            }
        }

        this.runAnimation();       
    }

    runAnimation() {
        // Function to create the connectors
        function createConnectors() {
            // Get feature container and all feature elements
            const featuresContainer = document.querySelector('.features');
            const features = featuresContainer.querySelectorAll('.feature');
            
            // Remove existing connectors
            document.querySelectorAll('.feature-connector').forEach(conn => conn.remove());
            
            // Skip if less than 2 features
            if (features.length < 2) return;
            
            // Make sure container has relative positioning
            if (window.getComputedStyle(featuresContainer).position === 'static') {
            featuresContainer.style.position = 'relative';
            }
            
            // Create connectors between features
            for (let i = 0; i < features.length - 1; i++) {
            const currentFeature = features[i];
            const nextFeature = features[i + 1];
            
            // Find the SVG and g elements
            const currentSvg = currentFeature.querySelector('svg');
            const nextSvg = nextFeature.querySelector('svg');
            
            // Find the g elements inside SVGs
            const currentG = currentSvg ? currentSvg.querySelector('g') : null;
            const nextG = nextSvg ? nextSvg.querySelector('g') : null;
            
            if (!currentG || !nextG) continue;
            
            // Get bounding rectangles
            const currentRect = currentG.getBoundingClientRect();
            const nextRect = nextG.getBoundingClientRect();
            const containerRect = featuresContainer.getBoundingClientRect();
            
            // Calculate center points of each g element
            const currentCenterX = currentRect.left + (currentRect.width / 0.92);
            const currentCenterY = currentRect.top + (currentRect.height / 2);
            const nextCenterX = nextRect.left + (nextRect.width / 4);
            
            // Calculate the distance between centers
            const width = nextCenterX - currentCenterX;
            
            // Create connector SVG
            const connector = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            connector.setAttribute("class", "feature-connector");
            connector.setAttribute("width", width);
            connector.setAttribute("height", "6");
            connector.setAttribute("viewBox", `0 0 ${width} 6`);
            connector.setAttribute("fill", "none");
            connector.style.position = "absolute";
            connector.style.left = `${currentCenterX - containerRect.left}px`;
            connector.style.top = `${currentCenterY - containerRect.top - 3}px`; // Center vertically
            
            // Create the line path
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("fill-rule", "evenodd");
            path.setAttribute("clip-rule", "evenodd");
            path.setAttribute("d", `M${width-3} 3.5H3V2.5H${width-3}V3.5Z`);
            path.setAttribute("fill", "#3E496D");
            
            // Create circles at both ends
            const circle1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle1.setAttribute("cx", "3");
            circle1.setAttribute("cy", "3");
            circle1.setAttribute("r", "3");
            circle1.setAttribute("fill", "#3E496D");
            
            const circle2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle2.setAttribute("cx", width-3);
            circle2.setAttribute("cy", "3");
            circle2.setAttribute("r", "3");
            circle2.setAttribute("fill", "#3E496D");
            
            // Add elements to SVG
            connector.appendChild(path);
            connector.appendChild(circle1);
            connector.appendChild(circle2);
            
            // Add to document
            featuresContainer.appendChild(connector);
            }
        }

        // Handle initialization
        function init() {
            // Check if the features container exists
            if (!document.querySelector('.features')) return;
            
            // Initial creation
            createConnectors();
            
            // Update when window resizes (with debounce)
            let resizeTimeout;
            window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(createConnectors, 100);
            });
            
            // Also update on load to ensure all assets are loaded
            window.addEventListener('load', createConnectors);
            
            // For good measure, check again after a slight delay
            setTimeout(createConnectors, 500);
        }

        // Run on DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }

}