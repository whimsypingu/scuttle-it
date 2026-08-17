document.addEventListener("DOMContentLoaded", () => {
    const carousel = document.querySelector(".carousel-track");
    const cards = document.querySelectorAll(".demo-card");

    let activeCard = null;

    //scrolling with mouse wheel in carousel
    carousel.addEventListener("wheel", (event) => {
        event.preventDefault();
        carousel.scrollBy({
            left: (event.deltaY * 0.8),
            behavior: "auto"
        });
    }, { passive: false });

    //each individual card animation handling
    cards.forEach(card => {
        card.addEventListener("click", () => {
            event.stopPropagation();

            //toggle off if current card is expanded
            if (activeCard === card) {
                card.classList.remove("expanded");
                activeCard = null;
                return;
            }

            //un-expand other currently expanded card
            if (activeCard) {
                activeCard.classList.remove("expanded");
            }

            //expand clicked card
            card.classList.add("expanded");
            activeCard = card;

            //center in carousel
            const cardOffsetLeft = card.offsetLeft;
            const cardWidth = card.offsetWidth;
            const carouselWidth = carousel.offsetWidth;

            const targetScroll = cardOffsetLeft - (carouselWidth / 2) + (cardWidth / 2);

            carousel.scrollTo({
                left: targetScroll,
                behavior: "smooth"
            });
        });
    });

    document.addEventListener("click", (event) => {
        if (activeCard) {
            activeCard.classList.remove("expanded");
            activeCard = null;
        }
    });
});