import { apiClient } from './api-client'

export const swrFetcher = <T>(url: string) => apiClient.get<T>(url)

export const SWR_CONFIG = { dedupingInterval: 60000, revalidateOnFocus: false }
