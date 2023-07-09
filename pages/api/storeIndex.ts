
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
    console.log(embeddingResult.data.data)
    embeddings.push(embeddingResult.data.data.map((entry: { embedding: any; }) => entry.embedding))
  return ({id: `${idx}`,metadata: {text: input}, values: embeddingResult.data.data.map((entry: { embedding: any; }) => entry.embedding)})
  }))
  // return inputBatch?.map(async (input, idx) => {
  //   // console.log("input", input)
  //   const embeddingResult = await openai.createEmbedding({model: 'text-embedding-ada-002',input: input})
  //   console.log(embeddingResult.data)
  //   embeddings.push(embeddingResult.data.data.map((entry: { embedding: any; }) => entry.embedding))
  //   return ({id: input,metadata: {name: idx}, values: embeddings[idx]})
  // });

}
const initIndex = async (data : string) => {
    const inputBatch = data.match(new RegExp('.{1,' + 3800 + '}', 'g'));
    const configuration = new Configuration({
      apiKey: "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",
  });
  const openai = new OpenAIApi(configuration);
    const pinecone = new PineconeClient();
    await pinecone.init({
                environment: "northamerica-northeast1-gcp",
                apiKey: "b9fd7835-5655-4a0d-9d53-c4dfec889702",
    });

  
    let embeddings: any[] = [];
    const vectors = await getVectors(inputBatch, openai)
    const index = pinecone.Index("book-index");
    console.log("vecs",vectors);

    const upsertResponse = await index.upsert({upsertRequest : {vectors, namespace: "example-namespace"}})

    console.log("resp", upsertResponse);

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
