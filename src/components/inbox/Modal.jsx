import { useState } from 'react';
import { isValidEmail } from '../../utils/isValidEmail.js';
import { useGetUsersQuery } from '../../features/users/usersApi.js';
import Error from '../ui/Error.jsx';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
    conversationsApi,
    useAddConversationMutation,
    useEditConversationMutation,
} from '../../features/conversations/conversationsApi.js';

export default function Modal({ open, control }) {
    const [to, setTo] = useState('');
    const [message, setMessage] = useState('');
    const [userCheck, setUserCheck] = useState(false);
    const { data: participant } = useGetUsersQuery(to, {
        skip: !userCheck,
    });
    const { user: loggedInUser } = useSelector((state) => state.auth) || {};
    const { email: myEmail } = loggedInUser || {};
    const dispatch = useDispatch();
    const [responseError, setResponseError] = useState('');
    const [conversation, setConversation] = useState(undefined);
    const [addConversation, { isSuccess: isAddConversationSuccess }] = useAddConversationMutation();
    const [editConversation, { isSuccess: isEditConversationSuccess }] =
        useEditConversationMutation();

    useEffect(() => {
        if (participant?.length > 0 && participant[0].email !== myEmail) {
            dispatch(
                conversationsApi.endpoints.getConversation.initiate({
                    userEmail: myEmail,
                    participantEmail: to,
                })
            )
                .unwrap()
                .then((data) => {
                    setConversation(data);
                })
                .catch(() => setResponseError('There was a problem'));
        }
    }, [participant, myEmail, to, dispatch]);

    const debounceHandle = (fn, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                fn(...args);
            }, delay);
        };
    };

    const doSearch = (value) => {
        if (isValidEmail(value)) {
            setTo(value);
            setUserCheck(true);
        }
    };

    const handleSearch = debounceHandle(doSearch, 500);

    // listen for from submit response
    useEffect(() => {
        if (isAddConversationSuccess || isEditConversationSuccess) {
            control();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAddConversationSuccess, isEditConversationSuccess]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (conversation?.length > 0) {
            editConversation({
                id: conversation[0].id,
                data: {
                    participants: `${myEmail}-${participant[0].email}`,
                    users: [loggedInUser, participant[0]],
                    message,
                    timestamp: new Date().getTime(),
                },
            });
        } else if (conversation?.length === 0) {
            addConversation({
                participants: `${myEmail}-${participant[0].email}`,
                users: [loggedInUser, participant[0]],
                message,
                timestamp: new Date().getTime(),
            });
        }
    };

    return (
        open && (
            <>
                <div
                    onClick={control}
                    className='fixed w-full h-full inset-0 z-10 bg-black/50 cursor-pointer'
                ></div>
                <div className='rounded w-[400px] lg:w-[600px] space-y-8 bg-white p-10 absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2'>
                    <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
                        Send message
                    </h2>
                    <form
                        onSubmit={handleSubmit}
                        className='mt-8 space-y-6'
                        action='#'
                        method='POST'
                    >
                        <input type='hidden' name='remember' value='true' />
                        <div className='rounded-md shadow-sm -space-y-px'>
                            <div>
                                <label htmlFor='to' className='sr-only'>
                                    To
                                </label>
                                <input
                                    id='to'
                                    name='to'
                                    type='email'
                                    required
                                    className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-violet-500 focus:border-violet-500 focus:z-10 sm:text-sm'
                                    placeholder='Send to'
                                    onChange={(e) => handleSearch(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor='message' className='sr-only'>
                                    Message
                                </label>
                                <textarea
                                    id='message'
                                    name='message'
                                    type='text'
                                    value={message}
                                    required
                                    className='appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-violet-500 focus:border-violet-500 focus:z-10 sm:text-sm'
                                    placeholder='Message'
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type='submit'
                                className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:bg-gray-400'
                                disabled={
                                    conversation === undefined ||
                                    (participant?.length > 0 && participant[0].email === myEmail)
                                }
                            >
                                Send Message
                            </button>
                        </div>

                        {participant?.length === 0 && <Error message="This user doesn't exists" />}
                        {participant?.length > 0 && participant[0].email === myEmail && (
                            <Error message='You can not send message to yourself' />
                        )}
                        {responseError && <Error message={responseError} />}
                    </form>
                </div>
            </>
        )
    );
}
