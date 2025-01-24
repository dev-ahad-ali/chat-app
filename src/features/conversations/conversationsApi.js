import { io } from 'socket.io-client';
import { apiSlice } from '../api/apiSlice.js';
import { messagesApi } from '../messages/messagesApi.js';

export const conversationsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getConversations: builder.query({
            query: (email) =>
                `/conversations?participants_like=${email}&_sort=timestamp&_order=desc&_page=1&_limit=${
                    import.meta.env.VITE_PAGINATION_LIMIT
                }`,
            async onCacheEntryAdded(arg, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
                // create socket
                const socket = io(import.meta.env.VITE_API_URL, {
                    reconnectionDelay: 1000,
                    reconnection: true,
                    reconnectionAttemps: 10,
                    transports: ['websocket'],
                    agent: false,
                    upgrade: false,
                    rejectUnauthorized: false,
                });

                try {
                    await cacheDataLoaded;
                    socket.on('conversation', (data) => {
                        updateCachedData((draft) => {
                            const conversation = draft.find((c) => c.id == data?.data?.id);
                            if (conversation?.id) {
                                conversation.message = data.data.message;
                                conversation.timestamp = data.data.timestamp;
                            } else {
                                //TODO: add logic for new conversation
                            }
                        });
                    });
                } catch (error) {
                    console.log(error);
                }

                await cacheEntryRemoved;
                socket.close();
            },
        }),
        getConversation: builder.query({
            query: ({ userEmail, participantEmail }) =>
                `/conversations?participants_like=${userEmail}-${participantEmail}&participants_like=${participantEmail}-${userEmail}`,
        }),
        addConversation: builder.mutation({
            query: ({ sender, data }) => ({
                url: '/conversations',
                method: 'POST',
                body: data,
            }),
            async onQueryStarted(arg, { queryFulfilled, dispatch }) {
                // optimistic cache update start
                const patchResult = dispatch(
                    apiSlice.util.updateQueryData('getConversations', arg.sender, (draft) => {
                        draft.push(arg.data);
                    })
                );
                // optimistic cache update end

                try {
                    const conversation = await queryFulfilled;

                    if (conversation?.data?.id) {
                        const users = arg.data.users;
                        const senderUser = users.find((user) => user?.email === arg.sender);
                        const receiverUser = users.find((user) => user?.email !== arg.sender);

                        dispatch(
                            messagesApi.endpoints.addMessage.initiate({
                                conversationId: conversation.data.id,
                                sender: senderUser,
                                receiver: receiverUser,
                                message: arg.data.message,
                                timestamp: arg.data.timestamp,
                            })
                        );
                    }
                } catch (error) {
                    patchResult.undo();
                }
            },
        }),
        editConversation: builder.mutation({
            query: ({ id, sender, data }) => ({
                url: `/conversations/${id}`,
                method: 'PATCH',
                body: data,
            }),
            async onQueryStarted(arg, { queryFulfilled, dispatch }) {
                // optimistic cache update start
                const patchResult = dispatch(
                    apiSlice.util.updateQueryData('getConversations', arg.sender, (draft) => {
                        const draftConversation = draft.find((c) => c.id == arg.id);
                        draftConversation.message = arg.data.message;
                        draftConversation.timestamp = arg.data.timestamp;
                    })
                );
                // optimistic cache update end

                try {
                    const conversation = await queryFulfilled;

                    if (conversation?.data?.id) {
                        const users = arg.data.users;
                        const senderUser = users.find((user) => user?.email === arg.sender);
                        const receiverUser = users.find((user) => user?.email !== arg.sender);

                        const res = await dispatch(
                            messagesApi.endpoints.addMessage.initiate({
                                conversationId: conversation.data.id,
                                sender: senderUser,
                                receiver: receiverUser,
                                message: arg.data.message,
                                timestamp: arg.data.timestamp,
                            })
                        ).unwrap();

                        // update cache pessimistically start
                        dispatch(
                            apiSlice.util.updateQueryData(
                                'getMessages',
                                res.conversationId.toString(),
                                (draft) => {
                                    draft.push(res);
                                }
                            )
                        );
                        // update cache pessimistically end
                    }
                } catch (err) {
                    patchResult.undo();
                }
            },
        }),
    }),
});

export const {
    useGetConversationsQuery,
    useAddConversationMutation,
    useEditConversationMutation,
    useGetConversationQuery,
} = conversationsApi;
