
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { OpenAIApi, Configuration } from 'openai';
import { PineconeClient } from "@pinecone-database/pinecone";
type Data = {
  name: string
}

const getVectors = async (inputBatch: RegExpMatchArray | null, openai: { createEmbedding: (arg0: { model: string; input: any; }) => any; } ) => {
  let embeddings: any[] = [];
  return Promise.all((inputBatch ?? []).map(async (input,idx) => {
    const embeddingResult = await openai.createEmbedding({model: 'text-embedding-ada-002',input: input})

    embeddings.push(embeddingResult.data.data.map((entry: { embedding: any; }) => entry.embedding))
  return ({id: `${idx}`,metadata: {text: input}, values: embeddingResult.data.data.map((entry: { embedding: any; }) => entry.embedding)})
  }))

}
const initIndex = async (data : string) => {
    const inputBatch = data.match(new RegExp('.{1,' + 3800 + '}', 'g'));
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);
    const pinecone = new PineconeClient();
    await pinecone.init({
                environment: process.env.PINECONE_ENV as string,
                apiKey: process.env.PINECONE_API_KEY as string,
    });

  
    let embeddings: any[] = [];
    const vectors = await getVectors(inputBatch, openai)
    const index = pinecone.Index("book-index");
    // const vectorBatches = Array.from({length : Math.ceil(vectors.length/25)}, (v, i) => vectors.slice(i*25, i*25+25));
    // console.log(vectorBatches);
    // for(let i = 0; i < vectorBatches.length; i++){
    //   const upsertResponse = await index.upsert({upsertRequest : {vectors:vectorBatches[i], namespace: "example-namespace"}});
    //   console.log("resp", upsertResponse);
    // }
    const upsertResponse = await index.upsert({upsertRequest : {vectors, namespace: "example-namespace"}});
    console.log(upsertResponse)

}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
    initIndex(req.body.data.text)
    .then(() => {
        res.status(200).json({ name: 'John Doe' })
    })
    .catch((err) => console.log(err));
  
}
