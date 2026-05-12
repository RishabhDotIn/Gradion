import { useEffect } from "react";
import LandingNavbar from "../components/landing/LandingNavbar.jsx";
import HeroSection from "../components/landing/HeroSection.jsx";
import LandingBodySections from "../components/landing/LandingBodySections.jsx";
import LandingFooter from "../components/landing/LandingFooter.jsx";
import "../styles/index.css";

function LandingPage() {
  useEffect(() => {
    const onMouseMove = (e) => {
      const grid = document.querySelector(".hero-grid");
      const glow = document.querySelector(".hero-glow");
      if (grid && glow) {
        const x = (e.clientX / window.innerWidth - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;
        grid.style.transform = `translate(${x}px, ${y}px)`;
        glow.style.transform = `translate(calc(-50% + ${x * 2}px), calc(-50% + ${y * 2}px))`;
      }83
    };

    const onScroll = () => {
      const navbar = document.querySelector(".navbar");
      if (navbar) {
        if (window.scrollY > 10) navbar.classList.add("scrolled");
        else navbar.classList.remove("scrolled");
      }
    };

    document.addEventListener("mousemove", onMouseMove);
    window.addEventListener("scroll", onScroll);

    // Initialize statistics animation with delay to ensure DOM is ready
    const initStatsAnimation = setTimeout(() => {
      const statNumbers = document.querySelectorAll(".stat-number");
      console.log('Found stat elements:', statNumbers.length); // Debug log
      
      if (statNumbers.length === 0) {
        console.log('No stat elements found, retrying...');
        return;
      }
      
      const targetValues = ['10K+', '50K+', '99%'];
      
      // Reset to 0
      statNumbers.forEach((stat) => {
        stat.textContent = stat.textContent.includes('K') ? '0K+' : '0%';
      });
      
      // Animate after a short delay
      setTimeout(() => {
        statNumbers.forEach((stat, index) => {
          const targetValue = targetValues[index];
          const hasPlus = targetValue.includes("+");
          const hasPercent = targetValue.includes("%");
          const hasK = targetValue.includes("K");
          const targetNumber = parseFloat(targetValue.replace(/[^0-9.]/g, ""));
          const duration = 2000;
          const startTime = performance.now();
          
          function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentNumber = targetNumber * easeOutQuart;
            let displayValue;
            if (hasK) displayValue = Math.floor(currentNumber) + "K";
            else if (hasPercent) displayValue = Math.floor(currentNumber) + "%";
            else displayValue = Math.floor(currentNumber).toString();
            if (hasPlus) displayValue += "+";
            stat.textContent = displayValue;
            if (progress < 1) requestAnimationFrame(updateCounter);
          }
          requestAnimationFrame(updateCounter);
        });
      }, 500);
    }, 1000);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      <LandingNavbar />
      <HeroSection />
      <LandingBodySections />
      <LandingFooter />
    </>
  );
}

export default LandingPage;
