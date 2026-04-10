import { useEffect, useMemo, useState } from "react";


export const CountUp = ({ 
    value, 
    duration = 2000
}: { 
    value: string; //string for precision (14.00 not being simplified to 14)
    duration?: number; //ms for animation
}) => {
    //detect how many decimals the input has for display
    const precision = useMemo(() => {
        const parts = value.split(".");
        return parts[1] ? parts[1].length : 0;
    }, [value]);

    const numericValue = parseFloat(value);
    const [count, setCount] = useState(0); //rendered number

    useEffect(() => {
        let startTime: number | null = null; //capture the moment the animation begins according to browser clock

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp; //capture first timestamp

            const timePassed = timestamp - startTime;
            const timePassedPercentage = Math.min(timePassed / duration, 1);

            // https://easings.net/#easeOutExpo
            const easeOutExpo = timePassedPercentage === 1 ? 1 : 1 - Math.pow(2, -10 * timePassedPercentage);

            setCount(easeOutExpo * numericValue);

            //continue loop until percentage reaches 1, which also ensure easeOut reaches full value
            if (timePassedPercentage < 1) { 
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate); //start loop
    }, [value, duration]);

    return ( 
        <span>
            {count.toLocaleString(undefined, {
                minimumFractionDigits: precision,
                maximumFractionDigits: precision,
            })}
        </span> 
    );
};