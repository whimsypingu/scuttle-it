document.addEventListener("DOMContentLoaded", () => {
    const carousel = document.querySelector(".carousel-track");
    const cards = document.querySelectorAll(".demo-card");
    const dotsContainer = document.querySelector(".carousel-dots");

    let activeCard = null;
    let activeDot = null;
    const dots = [];

    //scrolling with mouse wheel in carousel
    carousel.addEventListener("wheel", (event) => {
        event.preventDefault();
        carousel.scrollBy({
            left: (event.deltaY * 0.8),
            behavior: "auto"
        });
    }, { passive: false });

    //each individual card animation handling
    function selectCard(card, index) {
        const isAlreadyExpanded = (activeCard === card);

        //reset previous active card and dot
        if (activeCard) activeCard.classList.remove("expanded");
        if (activeDot) activeDot.classList.remove("active");

        //toggle off if clicking the active card again
        if (isAlreadyExpanded) {
            activeCard = null;
            activeDot = null;
            return;
        }

        //set active card & dot
        card.classList.add("expanded");
        activeCard = card;

        if (dots[index]) {
            dots[index].classList.add("active");
            activeDot = dots[index];
        }

        //scroll carousel to center the selected card
        const cardOffsetLeft = card.offsetLeft;
        const cardWidth = card.offsetWidth;
        const carouselWidth = carousel.offsetWidth;
        const targetScroll = cardOffsetLeft - (carouselWidth / 2) + (cardWidth / 2);

        carousel.scrollTo({
            left: targetScroll,
            behavior: "smooth"
        });
    }

    cards.forEach((card, index) => {
        const dot = document.createElement("button");
        dot.classList.add("dot");

        dot.addEventListener("click", (event) => {
            event.stopPropagation();
            selectCard(card, index);
        });

        dotsContainer.appendChild(dot);
        dots.push(dot);
        
        card.addEventListener("click", (event) => {
            event.stopPropagation();
            selectCard(card, index);
        });
    });

    document.addEventListener("click", (event) => {
        if (activeCard) {
            activeCard.classList.remove("expanded");
            activeCard = null;
        }
        if (activeDot) {
            activeDot.classList.remove("active");
            activeDot = null;
        }
    });
});