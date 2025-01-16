import { apiSlice } from '../api/apiSlice.js';

export const conversationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getConversations: builder.query({
      query: (email) =>
        `/conversations?participants_like=${email}&_sort=timestamp&_order=desc&_page=1&_limit=${
          import.meta.env.VITE_PAGINATION_LIMIT
        }`,
    }),
  }),
});

export const { useGetConversationsQuery } = conversationsApi;
