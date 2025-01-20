import { apiSlice } from '../api/apiSlice.js';

export const messagesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMessages: builder.query({
      query: (id) =>
        `/messages?conversationId=${id}&_sort=timestamp&_order=desc&_page=1&_limit=${
          import.meta.env.VITE_MESSAGES_LIMIT
        }`,
    }),
  }),
});

export const { useGetMessagesQuery } = messagesApi;
