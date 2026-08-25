import { get, set, del } from 'idb-keyval';
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

export const queryClient = new QueryClient({
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