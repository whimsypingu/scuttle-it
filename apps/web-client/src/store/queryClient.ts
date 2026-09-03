import { get, set, del } from 'idb-keyval';
import { QueryCache, QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

export const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onSuccess: () => {
            window.dispatchEvent(new Event("scuttle:online"));
        },
        onError: (err) => {
            console.log(`[queryClient] onError triggered: ${err}`);

            //ignore auth errors and http errors
            const isAuthError = 
                (err instanceof Response && (err.status === 401 || err.status === 403)) ||
                err.message?.includes("401") ||
                err.message?.includes("403");

            if (isAuthError) {
                return; //do not dispatch offline signal when authentication issue
            }

            //network outage or fetch failure
            const isNetworkError = 
                !navigator.onLine ||
                err.name === "TypeError" ||
                err.message?.toLowerCase().includes("failed to fetch") ||
                err.message?.toLowerCase().includes("networkerror");

            if (isNetworkError) {
                window.dispatchEvent(new Event("scuttle:offline"));
            }
        }
    }),
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, //5 minutes staleness
            refetchOnWindowFocus: true,
            gcTime: 1000 * 60 * 60 * 24, //24 hrs: https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient
        }
    }
});

export const persister = createAsyncStoragePersister({
    storage: {
        getItem: (key) => get(key),
        setItem: (key, value) => set(key, value),
        removeItem: (key) => del(key),
    },
});