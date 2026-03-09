// Parallax effect for grid
document.addEventListener('mousemove', (e) => {
    const grid = document.querySelector('.hero-grid');
    const glow = document.querySelector('.hero-glow');
    
    if (grid && glow) {
        const x = (e.clientX / window.innerWidth - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;
        
        grid.style.transform = `translate(${x}px, ${y}px)`;
        glow.style.transform = `translate(calc(-50% + ${x * 2}px), calc(-50% + ${y * 2}px))`;
    }
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > 10) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
});

// Initialize counter animation on page load
document.addEventListener('DOMContentLoaded', () => {
    initCounterAnimation();
});

// Counter animation
function initCounterAnimation() {
    const statNumbers = document.querySelectorAll('.stat-number');
    let animated = false;

    // Store original values and set initial to 0
    const originalValues = [];
    statNumbers.forEach((stat, index) => {
        originalValues[index] = stat.textContent;
        const text = stat.textContent;
        if (text.includes('K')) {
            stat.textContent = '0K+';
        } else if (text.includes('%')) {
            stat.textContent = '0%';
        } else {
            stat.textContent = '0';
        }
    });

    function animateCounter(element, originalValue) {
        const hasPlus = originalValue.includes('+');
        const hasPercent = originalValue.includes('%');
        const hasK = originalValue.includes('K');
        
        let targetNumber = parseFloat(originalValue.replace(/[^0-9.]/g, ''));
        const duration = 2000;
        const startTime = performance.now();
        
        function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentNumber = targetNumber * easeOutQuart;
            
            let displayValue;
            if (hasK) {
                displayValue = Math.floor(currentNumber) + 'K';
            } else if (hasPercent) {
                displayValue = Math.floor(currentNumber) + '%';
            } else {
                displayValue = Math.floor(currentNumber).toString();
            }
            
            if (hasPlus) {
                displayValue += '+';
            }
            
            element.textContent = displayValue;
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        }
        
        requestAnimationFrame(updateCounter);
    }

    function checkScroll() {
        if (animated) return;
        
        const statsSection = document.querySelector('.hero-stats');
        if (!statsSection) return;
        
        const rect = statsSection.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (isVisible) {
            animated = true;
            statNumbers.forEach((stat, index) => {
                animateCounter(stat, originalValues[index]);
            });
        }
    }

    window.addEventListener('scroll', checkScroll);
    // Check on load in case stats are already visible
    setTimeout(checkScroll, 100);
}