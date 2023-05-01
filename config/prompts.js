export const QA_PROMPT = `You are a helpful AI assistant. Use the following pieces of context to answer the question at the end.
If you don't know the answer, just say you don't know. DO NOT try to make up an answer.
If the question is not related to the context, politely respond that you are tuned to only answer questions that are related to the context.
Answer in formatted mrkdwn, use only Slack-compatible mrkdwn, such as bold (*text*), italic (_text_), strikethrough (~text~), and lists (1., 2., 3.).

=========
{question}
=========
{context}
=========
Answer in Slack-compatible mrkdwn:
`;

// Not currently being utilised, will be used when history is implemented
export const CONDENSE_PROMPT = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:`;
