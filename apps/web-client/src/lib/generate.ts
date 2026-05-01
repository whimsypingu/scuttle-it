//generates a UUID, even in insecure contexts like over wifi
export const generateUUID = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    //fallback for non-secure contexts
    const timestamp = Date.now().toString(16);
    const randomBits = 'xxxx-4xxx'.replace(/[x]/g, () => 
        ((Math.random() * 16) | 0).toString(16)
    );
    
    return `insecure-${timestamp}-${randomBits}`;
}