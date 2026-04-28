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
      }
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

    const statNumbers = document.querySelectorAll(".stat-number");
    let animated = false;
    const originalValues = [];
    statNumbers.forEach((stat, index) => {
      originalValues[index] = stat.textContent;
      const text = stat.textContent;
      if (text.includes("K")) stat.textContent = "0K+";
      else if (text.includes("%")) stat.textContent = "0%";
      else stat.textContent = "0";
    });

    function animateCounter(element, originalValue) {
      const hasPlus = originalValue.includes("+");
      const hasPercent = originalValue.includes("%");
      const hasK = originalValue.includes("K");
      const targetNumber = parseFloat(originalValue.replace(/[^0-9.]/g, ""));
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
        element.textContent = displayValue;
        if (progress < 1) requestAnimationFrame(updateCounter);
      }
      requestAnimationFrame(updateCounter);
    }

    function checkScroll() {
      if (animated) return;
      const statsSection = document.querySelector(".hero-stats");
      if (!statsSection) return;
      const rect = statsSection.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      if (isVisible) {
        animated = true;
        statNumbers.forEach((stat, index) => animateCounter(stat, originalValues[index]));
      }
    }
    window.addEventListener("scroll", checkScroll);
    setTimeout(checkScroll, 100);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", checkScroll);
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
