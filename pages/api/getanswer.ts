
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { OpenAIApi, Configuration } from 'openai';
import { PineconeClient } from "@pinecone-database/pinecone";
type Data = {
  ans: string
}

const getAns = async (query : string) => {

    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);
    const pinecone = new PineconeClient();
    await pinecone.init({
                environment: process.env.PINECONE_ENV as string,
                apiKey: process.env.PINECONE_API_KEY as string,
    });
    const embeddingResult = await openai.createEmbedding({model: 'text-embedding-ada-002',input: query});
    const index = pinecone.Index("book-index");
    const queryResponse = await index.query({
        queryRequest: {
          namespace: "example-namespace",
          topK: 1,
          includeMetadata: true,
          vector: embeddingResult.data.data.map((entry: { embedding: any; }) => entry.embedding),
        },
      });
      //@ts-ignore
      const context = queryResponse.matches[0].metadata.text;
      console.log(context);
      // queryResponse.matches?.map(resp => {
      //   //@ts-ignore
      //   context.concat(resp.metadata?.text as string)
      // })
      const prompt = `
      Use only the given Data below to answer the given query if enough information is not provided don't assume things:
      Data
      ---
      ${context}
      ---
      query
      ---
      ${query}
      ---
      `
      const answer = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{role: "user", content: prompt}],
      });
      //@ts-ignore
    return answer.data.choices[0].message?.content as string
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
    console.log(req.body.query);
    getAns(req.body.query).then(resp => {
        res.status(200).json({ans: resp})
    });
//    res.status(200).json({ans: "success"})
  
}
